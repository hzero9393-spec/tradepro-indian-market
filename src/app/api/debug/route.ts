import { NextResponse } from 'next/server'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || '(not set)'
  const vercel = !!process.env.VERCEL

  // Test database connection
  let dbStatus = 'unknown'
  let dbError = ''
  try {
    const { db } = await import('@/lib/db')
    await db.$queryRaw`SELECT 1`
    dbStatus = 'connected'
  } catch (err: unknown) {
    dbStatus = 'error'
    dbError = err instanceof Error ? err.message : String(err)
  }

  return NextResponse.json({
    env: {
      DATABASE_URL_prefix: dbUrl.substring(0, 40) + '...',
      VERCEL: vercel,
      NODE_ENV: process.env.NODE_ENV,
    },
    db: {
      status: dbStatus,
      error: dbError,
    }
  })
}
