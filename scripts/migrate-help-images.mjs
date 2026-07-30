import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL_UNPOOLED
  || process.env.DATABASE_URL
  || process.env.NEON_DATABASE_URL
  || process.env.POSTGRES_PRISMA_URL
  || process.env.POSTGRES_URL

if (!url) {
  console.error('DATABASE_URL not found in environment')
  process.exit(1)
}

const sql = neon(url)

async function main() {
  console.log('Creating help_images table...')
  await sql`
    CREATE TABLE IF NOT EXISTS help_images (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      location TEXT NOT NULL UNIQUE,
      image_data TEXT,
      alt_text TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_by UUID REFERENCES users(id)
    );
  `
  console.log('help_images table created successfully')
}

main().catch((e) => {
  console.error('Migration failed:', e)
  process.exit(1)
})
