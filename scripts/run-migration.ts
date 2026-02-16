import { neon } from "@neondatabase/serverless"

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error("DATABASE_URL is not set. Add it to your .env file.")
    process.exit(1)
  }

  const sql = neon(url)

  console.log("Running migration: add bubble_shape column...")
  await sql`ALTER TABLE widget_configs ADD COLUMN IF NOT EXISTS bubble_shape TEXT NOT NULL DEFAULT 'rounded'`
  console.log("Migration complete.")
}

main().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
