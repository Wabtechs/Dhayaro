import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL_UNPOOLED);
const main = async () => {
  try {
    const r = await sql`
      INSERT INTO queue (id, facility_id, patient_id, ticket_number, priority, status, queue_position, estimated_wait_minutes, arrived_at, created_at, updated_at)
      VALUES (gen_random_uuid(), 'e7d48de7-7abc-4bed-821e-07cf10fff68d', '18fe0ed6-aded-454b-9c99-73addf7fc161', 'Q-TEST-001', 'HIGH', 'WAITING', 1, 15, NOW(), NOW(), NOW())
      RETURNING id, ticket_number
    `;
    console.log('Queue insert OK:', JSON.stringify(r[0]));
    
    // Clean up
    await sql`DELETE FROM queue WHERE ticket_number = 'Q-TEST-001'`;
    console.log('Cleaned up');
  } catch(e) {
    console.error('Queue insert FAILED:', e.message);
  }
};
main();
