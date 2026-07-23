import { Pool } from '@neondatabase/serverless'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const client = await pool.connect()

try {
  // Find patients in the same facility for each user
  const marcelUser = await client.query(`SELECT id FROM users WHERE email = 'patient.marcel@dhayaro.cd'`)
  const solangeUser = await client.query(`SELECT id FROM users WHERE email = 'patient.solange@dhayaro.cd'`)

  // Find unlinked patients in the same facility
  const marcelFacility = marcelUser.rows[0] ? marcelUser.rows[0].facility_id : null
  const solangeFacility = solangeUser.rows[0] ? solangeUser.rows[0].facility_id : null

  if (marcelFacility && marcelUser.rows.length > 0) {
    const marcelPatient = await client.query(
      `SELECT id FROM patients WHERE facility_id = $1 AND user_id IS NULL LIMIT 1`,
      [marcelFacility]
    )
    if (marcelPatient.rows.length > 0) {
      await client.query(`UPDATE patients SET user_id = $1 WHERE id = $2`, [marcelUser.rows[0].id, marcelPatient.rows[0].id])
      console.log(`Linked marcel patient: ${marcelPatient.rows[0].id}`)
    } else {
      console.log('No unlinked patient found for marcel facility')
    }
  }

  if (solangeFacility && solangeUser.rows.length > 0) {
    const solangePatient = await client.query(
      `SELECT id FROM patients WHERE facility_id = $1 AND user_id IS NULL LIMIT 1`,
      [solangeFacility]
    )
    if (solangePatient.rows.length > 0) {
      await client.query(`UPDATE patients SET user_id = $1 WHERE id = $2`, [solangeUser.rows[0].id, solangePatient.rows[0].id])
      console.log(`Linked solange patient: ${solangePatient.rows[0].id}`)
    } else {
      console.log('No unlinked patient found for solange facility')
    }
  }

  // Verify
  const r2 = await client.query(`SELECT id, user_id, firstname, lastname, facility_id, email FROM patients WHERE email LIKE 'patient.%'`)
  console.log('Patients after link:', JSON.stringify(r2.rows, null, 2))

} finally {
  client.release()
  await pool.end()
}