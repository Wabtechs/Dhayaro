import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '';
if (!url) { console.error('No DATABASE_URL set'); process.exit(1); }
const sql = neon(url);

async function test() {
  try {
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
    console.log('Tables:', JSON.stringify(tables.map(t => t.table_name)));

    const cols = await sql`SELECT table_name, column_name FROM information_schema.columns WHERE table_name IN ('consultations','patients','users') ORDER BY table_name, ordinal_position`;
    const grouped = {};
    for (const c of cols) { (grouped[c.table_name] ??= []).push(c.column_name); }
    console.log('Columns:', JSON.stringify(grouped, null, 2));

    const counts = await sql`SELECT (SELECT count(*) FROM consultations) as consultations, (SELECT count(*) FROM users) as users, (SELECT count(*) FROM patients) as patients`;
    console.log('Counts:', JSON.stringify(counts[0]));
  } catch (e) {
    console.error('ERROR:', e.message);
  }
}
test();
