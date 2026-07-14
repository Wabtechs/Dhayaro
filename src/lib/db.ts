import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null
let _sql: ReturnType<typeof neon> | null = null

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
    ensureDefaults().catch(console.error)
  }
  return _db
}

let _defaultsEnsured = false
async function ensureDefaults() {
  if (_defaultsEnsured) return
  _defaultsEnsured = true
  const sql = getSql()
  await sql`ALTER TABLE facilities ALTER COLUMN is_active SET DEFAULT true`
  await sql`ALTER TABLE facilities ALTER COLUMN created_at SET DEFAULT now()`
  await sql`ALTER TABLE facilities ALTER COLUMN updated_at SET DEFAULT now()`
  await sql`ALTER TABLE users ALTER COLUMN is_active SET DEFAULT true`
  await sql`ALTER TABLE users ALTER COLUMN created_at SET DEFAULT now()`
  await sql`ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT now()`
  await sql`ALTER TABLE patients ALTER COLUMN is_active SET DEFAULT true`
  await sql`ALTER TABLE patients ALTER COLUMN created_at SET DEFAULT now()`
  await sql`ALTER TABLE patients ALTER COLUMN updated_at SET DEFAULT now()`
  await sql`ALTER TABLE clinical_cases ALTER COLUMN created_at SET DEFAULT now()`
  await sql`ALTER TABLE clinical_cases ALTER COLUMN updated_at SET DEFAULT now()`
  await sql`ALTER TABLE facilities ALTER COLUMN bed_count SET DEFAULT 0`
  await sql`ALTER TABLE facilities ALTER COLUMN department_count SET DEFAULT 0`
  await sql`ALTER TABLE facilities ALTER COLUMN staff_count SET DEFAULT 0`
  await sql`ALTER TABLE clinical_cases ALTER COLUMN is_synced SET DEFAULT false`
  console.log('Database defaults ensured')
}

export function getSql() {
  if (!_sql) {
    const url = getNeonUrl()
    if (!url) throw new Error('DATABASE_URL is not set')
    _sql = neon(url)
  }
  return _sql
}
