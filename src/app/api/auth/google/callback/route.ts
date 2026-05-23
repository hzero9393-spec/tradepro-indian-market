import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateToken } from '@/lib/auth'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''

// Helper to safely encode error messages for URL
function safeErrorRedirect(baseUrl: string, errorType: string, details?: string): NextResponse {
  const encodedDetails = details ? `&details=${encodeURIComponent(details.substring(0, 200))}` : ''
  console.error(`[Google OAuth] Redirecting with error: ${errorType}`, details || '')
  return NextResponse.redirect(`${baseUrl}/?auth_error=${errorType}${encodedDetails}`)
}

interface GoogleTokenResponse {
  access_token: string
  id_token: string
  token_type: string
  expiresIn: number
}

interface GoogleUserInfo {
  sub: string
  email: string
  email_verified: boolean
  name: string
  picture: string
  given_name?: string
  family_name?: string
}

// Get the base URL for redirects (works on Vercel and locally)
function getBaseUrl(request: NextRequest): string {
  // On Vercel, use the x-forwarded-host header
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000'
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  return `${protocol}://${host}`
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request)

  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    // Handle user denial or error
    if (error) {
      console.error('[Google OAuth] User denied:', error)
      return NextResponse.redirect(`${baseUrl}/?auth_error=google_denied`)
    }

    if (!code) {
      console.error('[Google OAuth] No code in callback')
      return NextResponse.redirect(`${baseUrl}/?auth_error=no_code`)
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return safeErrorRedirect(baseUrl, 'google_not_configured', 
        `CLIENT_ID=${GOOGLE_CLIENT_ID ? 'SET' : 'MISSING'}, CLIENT_SECRET=${GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING'}`)
    }

    // Determine redirect URI (must match the one used in the initial request)
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${baseUrl}/api/auth/google/callback`
    console.log('[Google OAuth] Using redirect URI:', redirectUri)

    // Exchange authorization code for tokens
    console.log('[Google OAuth] Exchanging code for tokens...')
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      return safeErrorRedirect(baseUrl, 'token_exchange_failed', `Status ${tokenResponse.status}: ${errorData.substring(0, 150)}`)
    }

    const tokenData: GoogleTokenResponse = await tokenResponse.json()
    console.log('[Google OAuth] Token exchange successful')

    // Get user info from Google
    console.log('[Google OAuth] Fetching user info...')
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      return safeErrorRedirect(baseUrl, 'user_info_failed', `Status ${userResponse.status}: ${errorText.substring(0, 150)}`)
    }

    const googleUser: GoogleUserInfo = await userResponse.json()
    console.log('[Google OAuth] Got user info for:', googleUser.email)

    // Check if user exists with this Google OAuth ID
    console.log('[Google OAuth] Looking up user in database...')
    let user
    try {
      user = await db.user.findFirst({
        where: {
          oauthProvider: 'google',
          oauthId: googleUser.sub,
        },
      })
    } catch (dbError) {
      const msg = dbError instanceof Error ? dbError.message : String(dbError)
      return safeErrorRedirect(baseUrl, 'db_query_failed', `findFirst: ${msg.substring(0, 150)}`)
    }

    if (user) {
      // Update existing OAuth user's info
      console.log('[Google OAuth] Updating existing user:', user.id)
      user = await db.user.update({
        where: { id: user.id },
        data: {
          name: googleUser.name,
          avatar: googleUser.picture,
          isEmailVerified: googleUser.email_verified,
          lastLoginAt: new Date(),
        },
      })
    } else {
      // Check if user with this email already exists (linked account)
      console.log('[Google OAuth] Checking for existing user by email...')
      user = await db.user.findUnique({
        where: { email: googleUser.email },
      })

      if (user) {
        // Link Google account to existing user
        console.log('[Google OAuth] Linking Google account to existing user:', user.id)
        user = await db.user.update({
          where: { id: user.id },
          data: {
            oauthProvider: 'google',
            oauthId: googleUser.sub,
            avatar: googleUser.picture,
            isEmailVerified: googleUser.email_verified,
            lastLoginAt: new Date(),
          },
        })
      } else {
        // Create new user from Google account
        console.log('[Google OAuth] Creating new user for:', googleUser.email)
        user = await db.user.create({
          data: {
            name: googleUser.name,
            email: googleUser.email,
            avatar: googleUser.picture,
            oauthProvider: 'google',
            oauthId: googleUser.sub,
            passwordHash: null, // No password for OAuth users
            isEmailVerified: googleUser.email_verified,
            virtualBalance: 100000,
            role: 'USER',
            subscription: 'FREE',
          },
        })
        console.log('[Google OAuth] New user created:', user.id)
      }
    }

    // Check if account is active
    if (!user.isActive) {
      return safeErrorRedirect(baseUrl, 'account_deactivated', `User ${user.id} is deactivated`)
    }

    // Generate JWT token
    let token
    try {
      token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      })
    } catch (tokenError) {
      const msg = tokenError instanceof Error ? tokenError.message : String(tokenError)
      return safeErrorRedirect(baseUrl, 'token_generation_failed', `JWT: ${msg.substring(0, 150)}`)
    }

    // Create session
    console.log('[Google OAuth] Creating session...')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    try {
      await db.session.create({
        data: {
          userId: user.id,
          token,
          device: request.headers.get('user-agent')?.substring(0, 255) || 'Google OAuth',
          ipAddress: request.headers.get('x-forwarded-for') || null,
          expiresAt,
        },
      })
    } catch (sessionError) {
      const msg = sessionError instanceof Error ? sessionError.message : String(sessionError)
      return safeErrorRedirect(baseUrl, 'session_create_failed', `Session: ${msg.substring(0, 150)}`)
    }

    console.log('[Google OAuth] Login successful, redirecting to home')

    // Update last login
    try {
      await db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })
    } catch (updateError) {
      // Non-critical, just log
      console.error('[Google OAuth] Failed to update lastLoginAt (non-critical):', updateError)
    }

    // Redirect to home with token
    return NextResponse.redirect(`${baseUrl}/?auth_token=${token}`)
  } catch (error) {
    const errorMsg = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
    const errorStack = error instanceof Error ? error.stack?.substring(0, 300) || '' : ''
    console.error('[Google OAuth] Callback error:', errorMsg)
    console.error('[Google OAuth] Stack:', errorStack)
    return safeErrorRedirect(baseUrl, 'oauth_callback_failed', `${errorMsg} | ${errorStack.substring(0, 100)}`)
  }
}
