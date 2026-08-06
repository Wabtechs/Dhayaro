import { Pool } from '@neondatabase/serverless'

const DATABASE_URL = (process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL || '').replace(/^"|"$/g, '')

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in environment')
  process.exit(1)
}

async function migrate() {
  console.log('=== Migration: dossier_number sur patients ===\n')

  const pool = new Pool({ connectionString: DATABASE_URL })
  const client = await pool.connect()

  try {
    await client.query('ALTER TABLE patients ADD COLUMN IF NOT EXISTS dossier_number text')
    console.log('  Colonne dossier_number ajoutée (si absente)')

    const { rows: backfilled } = await client.query(`
      UPDATE patients p
      SET dossier_number = sub.n
      FROM (
        SELECT id, 'DOS-' || lpad((row_number() OVER (ORDER BY created_at, id))::text, 6, '0') AS n
        FROM patients
      ) sub
      WHERE p.id = sub.id
        AND (p.dossier_number IS NULL OR p.dossier_number = '')
      RETURNING p.id
    `)
    console.log(`  ${backfilled.length} patients remis à jour avec un numéro de dossier séquentiel`)

    await client.query(`
      ALTER TABLE patients
      ALTER COLUMN dossier_number SET NOT NULL,
      ALTER COLUMN dossier_number SET DEFAULT 'DOS-000000'
    `)
    console.log('  Colonne passée en NOT NULL avec défaut')

    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_dossier_number ON patients (dossier_number)')
    console.log('  Index unique créé')

    const { rows: sample } = await client.query(
      'SELECT dossier_number, firstname, lastname FROM patients ORDER BY created_at, id LIMIT 5'
    )
    for (const s of sample) console.log(`  ${s.dossier_number} — ${s.firstname} ${s.lastname}`)
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
