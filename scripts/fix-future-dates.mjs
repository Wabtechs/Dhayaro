import { Pool } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in environment')
  process.exit(1)
}

async function clampColumn(client, table, column) {
  const { rowCount } = await client.query(
    `UPDATE ${table} SET ${column} = now() WHERE ${column} IS NOT NULL AND ${column} > now()`
  )
  return rowCount
}

async function fix() {
  console.log('=== Correction des dates futures dans les données seed ===\n')

  const pool = new Pool({ connectionString: DATABASE_URL })
  const client = await pool.connect()

  try {
    const { rows: tables } = await client.query(`
      SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name IN ('created_at', 'updated_at', 'ended_at')
      ORDER BY table_name
    `)

    let totalFixed = 0
    const details = []
    for (const t of tables) {
      const fixed = await clampColumn(client, t.table_name, t.column_name)
      if (fixed > 0) {
        totalFixed += fixed
        details.push(`${t.table_name}.${t.column_name}: ${fixed}`)
      }
    }

    for (const line of details) console.log(`  ${line}`)
    console.log(`\nTotal: ${totalFixed} lignes corrigées (ramenées à maintenant())`)
  } catch (e) {
    console.error('Erreur:', e.message)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

fix()
