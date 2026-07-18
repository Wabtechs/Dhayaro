import { neon } from '@neondatabase/serverless'

const sql = neon('postgresql://neondb_owner:npg_2ysp9wjBfVrO@ep-bitter-brook-a4m7nafi.us-east-1.aws.neon.tech/Dhayaro?sslmode=require')

const checks = [
  'SELECT count(*) AS total_consults FROM consultations',
  'SELECT count(*) AS same_facility FROM consultations c JOIN patients p ON c.patient_id=p.id WHERE c.facility_id=p.facility_id',
  'SELECT count(*) AS diag_with_consult FROM diagnostics d JOIN consultations c ON d.consultation_id=c.id',
  'SELECT count(*) AS presc_with_treat FROM prescriptions pr JOIN treatments t ON pr.treatment_id=t.id',
  'SELECT count(*) AS lab_with_consult FROM lab_exams l JOIN consultations c ON l.consultation_id=c.id',
  'SELECT count(*) AS queue_with_consult FROM queue q JOIN consultations c ON q.consultation_id=c.id',
  'SELECT count(*) AS docs_with_consult FROM documents d JOIN consultations c ON d.consultation_id=c.id',
]

const results = {}
for (const c of checks) {
  const key = c.split('AS ')[1].split(' ')[0]
  const r = await sql.query(c)
  results[key] = Number(r[0][key])
}

console.log('=== Relational Integrity Check ===')
console.log(JSON.stringify(results, null, 2))

console.log('\n=== Orphan Check ===')
const orphanChecks = [
  'SELECT count(*) AS orphan_consults FROM consultations c LEFT JOIN patients p ON c.patient_id=p.id WHERE p.id IS NULL',
  'SELECT count(*) AS orphan_diag FROM diagnostics d LEFT JOIN consultations c ON d.consultation_id=c.id WHERE c.id IS NULL',
  'SELECT count(*) AS orphan_presc FROM prescriptions pr LEFT JOIN treatments t ON pr.treatment_id=t.id WHERE t.id IS NULL',
]
for (const c of orphanChecks) {
  const key = c.split('AS ')[1].split(' ')[0]
  const r = await sql.query(c)
  results[key] = Number(r[0][key])
}
console.log(JSON.stringify({
  orphan_consults: results.orphan_consults,
  orphan_diag: results.orphan_diag,
  orphan_presc: results.orphan_presc,
}, null, 2))
