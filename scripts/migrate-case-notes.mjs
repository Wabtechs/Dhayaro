import { Pool } from '@neondatabase/serverless'

const DATABASE_URL = (process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL || '').replace(/^"|"$/g, '')

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in environment')
  process.exit(1)
}

async function migrate() {
  console.log('=== Migration: case_notes ===\n')

  const pool = new Pool({ connectionString: DATABASE_URL })
  const client = await pool.connect()

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS case_notes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        case_id uuid NOT NULL REFERENCES clinical_cases(id) ON DELETE CASCADE,
        author_id uuid REFERENCES users(id),
        content text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `)
    console.log('  Table case_notes créée')

    await client.query('CREATE INDEX IF NOT EXISTS idx_case_notes_case ON case_notes (case_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_case_notes_author ON case_notes (author_id)')
    console.log('  Index créés')

    const { rows } = await client.query('SELECT count(*)::int AS n FROM case_notes')
    console.log(`  ${rows[0].n} notes existantes`)
    console.log('\nMigration terminée avec succès')
  } catch (e) {
    console.error('Erreur:', e.message)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
