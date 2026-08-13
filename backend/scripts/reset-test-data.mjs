/**
 * PropertyPro — ONE-TIME DEVELOPMENT TEST DATA RESET
 *
 * DELETES:   properties, tenancies, rental_requests, payments, maintenance,
 *            notifications, audit_logs
 * PRESERVES: users, refresh_tokens, password_reset_tokens  <- NEVER TOUCHED
 *
 * Also clears only the `properties` key from .persistent_dev_db.json (user/auth preserved).
 *
 * Usage (from backend/ directory):
 *   node scripts/reset-test-data.mjs
 */

import mongoose from 'mongoose'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
config({ path: path.join(__dirname, '../.env') })

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in backend/.env')
  process.exit(1)
}

const TRANSACTIONAL_COLLECTIONS = [
  'properties',
  'tenancies',
  'rental_requests',
  'payments',
  'maintenance',
  'notifications',
  'audit_logs',
]

const PROTECTED_COLLECTIONS = [
  'users',
  'refresh_tokens',
  'password_reset_tokens',
]

const DB_JSON_PATH = path.join(__dirname, '../.persistent_dev_db.json')

async function main() {
  console.log('\n=== PropertyPro TEST DATA RESET ===\n')

  console.log('Connecting to MongoDB Atlas...')
  await mongoose.connect(MONGODB_URI, { dbName: 'propertypro' })
  console.log('Connected.\n')

  const db = mongoose.connection.db
  const allCollections = await db.listCollections().toArray()
  const existingNames = new Set(allCollections.map((c) => c.name))

  // PRE-RESET counts
  console.log('=== PRE-RESET DOCUMENT COUNTS ===')
  for (const name of [...TRANSACTIONAL_COLLECTIONS, ...PROTECTED_COLLECTIONS]) {
    const count = existingNames.has(name) ? await db.collection(name).countDocuments() : 0
    const tag = PROTECTED_COLLECTIONS.includes(name) ? '[KEEP]' : '[WIPE]'
    console.log(`  ${tag}  ${name.padEnd(26)} -> ${count}`)
  }

  const userCount = existingNames.has('users') ? await db.collection('users').countDocuments() : 0
  console.log(`\nUSER ACCOUNTS FOUND: ${userCount} — will NOT be touched.\n`)

  // DELETE transactional
  console.log('=== DELETING TRANSACTIONAL DATA ===')
  for (const name of TRANSACTIONAL_COLLECTIONS) {
    if (existingNames.has(name)) {
      const result = await db.collection(name).deleteMany({})
      console.log(`  DELETED  ${name.padEnd(26)} -> ${result.deletedCount} documents`)
    } else {
      console.log(`  SKIP     ${name.padEnd(26)} -> collection not found`)
    }
  }
  console.log()

  // Clear property cache from local JSON (preserve users)
  console.log('=== LOCAL JSON CACHE (.persistent_dev_db.json) ===')
  if (fs.existsSync(DB_JSON_PATH)) {
    try {
      const raw = fs.readFileSync(DB_JSON_PATH, 'utf-8')
      const data = JSON.parse(raw)
      const before = (data.properties ?? []).length
      const cleaned = {
        users:               data.users               ?? [],
        usersByEmail:        data.usersByEmail         ?? [],
        refreshTokens:       data.refreshTokens        ?? [],
        refreshTokensByHash: data.refreshTokensByHash  ?? [],
        passwordResetTokens: data.passwordResetTokens  ?? [],
        properties:          [],
      }
      fs.writeFileSync(DB_JSON_PATH, JSON.stringify(cleaned, null, 2), 'utf-8')
      console.log(`  Property cache cleared: ${before} entries removed`)
      console.log(`  Users preserved in local JSON: ${(data.users ?? []).length} accounts`)
    } catch (err) {
      console.warn('  Could not parse local JSON — skipped.', err.message)
    }
  } else {
    console.log('  .persistent_dev_db.json not found — skipped.')
  }
  console.log()

  // POST-RESET verification
  console.log('=== POST-RESET VERIFICATION ===')
  for (const name of TRANSACTIONAL_COLLECTIONS) {
    const count = existingNames.has(name) ? await db.collection(name).countDocuments() : 0
    const status = count === 0 ? 'OK  ' : 'FAIL'
    console.log(`  [${status}]  ${name.padEnd(26)} -> ${count}`)
  }
  console.log()

  console.log('=== PROTECTED (untouched) ===')
  for (const name of PROTECTED_COLLECTIONS) {
    const count = existingNames.has(name) ? await db.collection(name).countDocuments() : 0
    console.log(`  [KEEP]  ${name.padEnd(26)} -> ${count} — PRESERVED`)
  }

  console.log('\n=== RESET COMPLETE ===')
  console.log('  Transactional data deleted from MongoDB Atlas')
  console.log('  Property cache cleared from local JSON')
  console.log('  User accounts / passwords / roles: UNTOUCHED')
  console.log('  Auth tokens: UNTOUCHED\n')

  await mongoose.disconnect()
  process.exit(0)
}

main().catch((err) => {
  console.error('Reset failed:', err)
  process.exit(1)
})

