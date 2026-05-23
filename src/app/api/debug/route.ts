import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const diagnostics: Record<string, unknown> = {}

  // Check environment variables (mask sensitive values)
  diagnostics.env = {
    DATABASE_URL: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 40)}...` : 'MISSING',
    DIRECT_URL: process.env.DIRECT_URL ? `${process.env.DIRECT_URL.substring(0, 40)}...` : 'MISSING',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING',
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'MISSING',
    JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
  }

  // Test database connection
  try {
    const userCount = await db.user.count()
    diagnostics.db = { status: 'CONNECTED', userCount }
  } catch (dbError) {
    const msg = dbError instanceof Error ? dbError.message : String(dbError)
    diagnostics.db = { status: 'FAILED', error: msg.substring(0, 300) }
  }

  // Test Session model
  try {
    const sessionCount = await db.session.count()
    diagnostics.dbSession = { status: 'CONNECTED', sessionCount }
  } catch (dbError) {
    const msg = dbError instanceof Error ? dbError.message : String(dbError)
    diagnostics.dbSession = { status: 'FAILED', error: msg.substring(0, 300) }
  }

  return NextResponse.json(diagnostics, { status: 200 })
}
