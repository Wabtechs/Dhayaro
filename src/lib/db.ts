import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

function getNeonUrl(): string {
  const raw = process.env.DATABASE_URL || process.env.POSTGRES_URL || ''
  return raw.replace(/[&?]channel_binding=require/g, '').replace(/[&?]sslmode=[^&]*/g, '&sslmode=require')
}

export function getDb() {
  if (!_db) {
    const url = getNeonUrl()
    if (!url) throw new Error('DATABASE_URL is not set')
    _db = drizzle(neon(url), { schema })
  }
  return _db
}
