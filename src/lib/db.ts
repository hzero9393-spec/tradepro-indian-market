import { readFileSync } from 'fs'
import { join } from 'path'
import { PrismaClient } from '@prisma/client'

// Force DATABASE_URL to PostgreSQL by reading .env directly.
// The system env may have a stale SQLite URL that overrides the .env file.
// Next.js caches env vars at startup, so dotenv override doesn't work at runtime.
function getPostgresUrl(): string {
  // 1. Check if DATABASE_URL is already a PostgreSQL URL
  if (process.env.DATABASE_URL?.startsWith('postgresql://')) {
    return process.env.DATABASE_URL
  }

  // 2. Check APP_DATABASE_URL (loaded by Next.js from .env)
  if (process.env.APP_DATABASE_URL?.startsWith('postgresql://')) {
    return process.env.APP_DATABASE_URL
  }

  // 3. Fallback: parse .env file directly
  try {
    const envPath = join(process.cwd(), '.env')
    const envContent = readFileSync(envPath, 'utf-8')
    for (const line of envContent.split('\n')) {
      const match = line.match(/^APP_DATABASE_URL\s*=\s*"?([^"]+)"?/)
      if (match && match[1].startsWith('postgresql://')) {
        return match[1]
      }
    }
    for (const line of envContent.split('\n')) {
      const match = line.match(/^DATABASE_URL\s*=\s*"?([^"]+)"?/)
      if (match && match[1].startsWith('postgresql://')) {
        return match[1]
      }
    }
  } catch {
    // .env file not readable
  }

  // This should never happen in production
  throw new Error('No PostgreSQL DATABASE_URL found. Check .env file.')
}

const datasourceUrl = getPostgresUrl()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Always create fresh client in development to avoid stale cache issues
if (globalForPrisma.prisma && process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasourceUrl,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
