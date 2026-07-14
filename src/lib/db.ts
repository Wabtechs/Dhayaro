import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

function getNeonUrl(): string {
  const raw = process.env.NEON_DATABASE_URL
    || process.env.DATABASE_URL
    || process.env.POSTGRES_PRISMA_URL
    || process.env.POSTGRES_URL
    || ''
  let url = raw
    .replace(/[&?]channel_binding=require/g, '')
    .replace(/[?&]sslmode=[^&]*/g, '')
  if (url.includes('ep-') && !url.includes('-pooler.')) {
    url = url.replace(/(ep-[^.]+)/, '$1-pooler')
  }
  const separator = url.includes('?') ? '&' : '?'
  url += `${separator}sslmode=require`
  return url
}

export function getDb() {
  if (!_db) {
    const url = getNeonUrl()
    if (!url) throw new Error('DATABASE_URL is not set')
    _db = drizzle(neon(url), { schema })
  }
  return _db
}
