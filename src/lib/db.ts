import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null
let _sql: ReturnType<typeof neon> | null = null

function getNeonUrl(): string {
  const raw = process.env.DATABASE_URL_UNPOOLED
    || process.env.DATABASE_URL
    || process.env.NEON_DATABASE_URL
    || process.env.POSTGRES_PRISMA_URL
    || process.env.POSTGRES_URL
    || ''
  if (!raw) throw new Error('DATABASE_URL is not set')
  return raw
}

export function getDb() {
  if (!_db) {
    const url = getNeonUrl()
    _db = drizzle(neon(url), { schema })
  }
  return _db
}

export function getSql() {
  if (!_sql) {
    const url = getNeonUrl()
    _sql = neon(url)
  }
  return _sql
}
