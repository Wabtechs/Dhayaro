import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env')
    const content = readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      let val = trimmed.slice(eqIdx + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = val
    }
  } catch {}
}
loadEnv()

const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || '')

try {
  await sql`CREATE TABLE IF NOT EXISTS audit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  note TEXT,
  changed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`

  await sql`CREATE INDEX IF NOT EXISTS idx_audit_history_item ON audit_history(item_id)`

  await sql`CREATE INDEX IF NOT EXISTS idx_audit_history_created ON audit_history(created_at DESC)`
  console.log('✓ audit_history table created')
} catch (err) {
  console.error('Migration failed:', err)
  process.exit(1)
}
