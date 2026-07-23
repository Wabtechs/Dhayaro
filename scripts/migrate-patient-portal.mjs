import { Pool } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in environment')
  process.exit(1)
}

async function migrate() {
  console.log('=== Migration Patient Portal ===\n')

  const pool = new Pool({ connectionString: DATABASE_URL })
  const client = await pool.connect()

  try {
    console.log('1. Adding PATIENT to user_role enum...')
    await client.query(`
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'PATIENT';
    `)
    console.log('   OK')

    console.log('2. Adding user_id column to patients...')
    await client.query(`
      ALTER TABLE patients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
    `)
    console.log('   OK')

    console.log('3. Creating test patient accounts...')
    const passwordHash = await bcrypt.hash('patient123', 12)

    const patientAccounts = [
      { email: 'patient.marcel@dhayaro.cd', fn: 'Marcel', ln: 'Tshibola', facilityId: null, sex: 'M', dob: '1990-01-10' },
      { email: 'patient.solange@dhayaro.cd', fn: 'Solange', ln: 'Mbayo', facilityId: null, sex: 'F', dob: '1990-01-11' },
      { email: 'patient.prosper@dhayaro.cd', fn: 'Prosper', ln: 'Kalume', facilityId: null, sex: 'M', dob: '1990-01-12' },
    ]

    const { rows: facilities } = await client.query(`SELECT id FROM facilities ORDER BY name LIMIT 3`)
    for (let i = 0; i < patientAccounts.length; i++) {
      const acc = patientAccounts[i]
      acc.facilityId = facilities[i]?.id || null
    }

    for (let pi = 0; pi < patientAccounts.length; pi++) {
      const acc = patientAccounts[pi]
      const existingUser = await client.query(`SELECT id FROM users WHERE email = $1`, [acc.email])
      if (existingUser.rows.length > 0) {
        console.log(`   User ${acc.email} already exists, skipping`)
        continue
      }

      const userId = randomUUID()
      const patientId = randomUUID()

      await client.query(`
        INSERT INTO users (id, email, password_hash, role, firstname, lastname, facility_id, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, 'PATIENT', $4, $5, $6, true, NOW(), NOW())
      `, [userId, acc.email, passwordHash, acc.fn, acc.ln, acc.facilityId])

      const existingPatient = await client.query(`SELECT id FROM patients WHERE email = $1`, [acc.email])
      if (existingPatient.rows.length > 0) {
        await client.query(`UPDATE patients SET user_id = $1 WHERE id = $2`, [userId, existingPatient.rows[0].id])
        console.log(`   Linked existing patient ${acc.email}`)
      } else {
        await client.query(`
          INSERT INTO patients (id, patient_uuid, facility_id, user_id, firstname, lastname, sex, date_of_birth, age, blood_group, phone, email, address, city, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 36, 'O+', $9, $10, $11, $12, true, NOW(), NOW())
        `, [
          patientId, randomUUID(), acc.facilityId, userId,
          acc.fn, acc.ln, acc.sex, acc.dob,
          `+243 800 000 00${pi + 1}`,
          acc.email,
          `Avenue de la Santé, Kinshasa`,
          'Kinshasa',
        ])
        console.log(`   Created patient account ${acc.email}`)
      }
    }

    console.log('\n✓ Migration completed successfully!')
    console.log('\nTest accounts:')
    console.log('  patient.marcel@dhayaro.cd / patient123')
    console.log('  patient.solange@dhayaro.cd / patient123')
    console.log('  patient.prosper@dhayaro.cd / patient123')

  } catch (err) {
    console.error('Migration failed:', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
