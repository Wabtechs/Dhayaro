import { Pool } from '@neondatabase/serverless'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const client = await pool.connect()

try {
  const r1 = await client.query(`SELECT id, email, role, facility_id FROM users WHERE email LIKE 'patient.%'`)
  console.log('Users:', JSON.stringify(r1.rows, null, 2))

  const r2 = await client.query(`SELECT id, user_id, firstname, lastname, facility_id, email FROM patients WHERE email LIKE 'patient.%'`)
  console.log('Patients:', JSON.stringify(r2.rows, null, 2))
} finally {
  client.release()
  await pool.end()
}