import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const googleClientId = process.env.GOOGLE_CLIENT_ID || ''
    const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI || ''

    if (!googleClientId) {
      // Redirect back to home with a clear error message
      const redirectUrl = new URL('/', request.url)
      redirectUrl.searchParams.set('auth_error', 'google_not_configured')
      return NextResponse.redirect(redirectUrl)
    }

    // Build Google OAuth URL
    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: googleRedirectUri || `${new URL(request.url).origin}/api/auth/google/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    })

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

    return NextResponse.redirect(googleAuthUrl)
  } catch (error) {
    console.error('Google OAuth init error:', error)
    return NextResponse.redirect(new URL('/?auth_error=google_oauth_failed', request.url))
  }
}
