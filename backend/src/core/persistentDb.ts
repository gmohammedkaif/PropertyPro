import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_FILE = path.join(__dirname, '../../.persistent_dev_db.json')

interface DbSchema {
  users: [string, any][]
  usersByEmail: [string, string][]
  refreshTokens: [string, any][]
  refreshTokensByHash: [string, string][]
  passwordResetTokens: [string, any][]
  properties: [string, any][]
}

function loadDb(): DbSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (err) {
    // Silent fail
  }
  return {
    users: [],
    usersByEmail: [],
    refreshTokens: [],
    refreshTokensByHash: [],
    passwordResetTokens: [],
    properties: [],
  }
}

function saveDb(data: Partial<DbSchema>) {
  try {
    const current = loadDb()
    const updated = { ...current, ...data }
    fs.writeFileSync(DB_FILE, JSON.stringify(updated, null, 2), 'utf-8')
  } catch (err) {
    // Silent fail
  }
}

export const persistentDb = {
  loadAuth: () => {
    const db = loadDb()
    return {
      users: new Map<string, any>(db.users),
      usersByEmail: new Map<string, string>(db.usersByEmail),
      refreshTokens: new Map<string, any>(db.refreshTokens),
      refreshTokensByHash: new Map<string, string>(db.refreshTokensByHash),
      passwordResetTokens: new Map<string, any>(db.passwordResetTokens),
    }
  },
  saveAuth: (authData: {
    users: Map<string, any>
    usersByEmail: Map<string, string>
    refreshTokens: Map<string, any>
    refreshTokensByHash: Map<string, string>
    passwordResetTokens: Map<string, any>
  }) => {
    saveDb({
      users: Array.from(authData.users.entries()),
      usersByEmail: Array.from(authData.usersByEmail.entries()),
      refreshTokens: Array.from(authData.refreshTokens.entries()),
      refreshTokensByHash: Array.from(authData.refreshTokensByHash.entries()),
      passwordResetTokens: Array.from(authData.passwordResetTokens.entries()),
    })
  },
  loadProperties: () => {
    const db = loadDb()
    // Make sure we convert date strings back to Date objects if needed
    const props = db.properties.map(([id, record]) => {
      if (record.expiresAt) record.expiresAt = new Date(record.expiresAt)
      if (record.revokedAt) record.revokedAt = new Date(record.revokedAt)
      return [id, record] as [string, any]
    })
    return new Map<string, any>(props)
  },
  saveProperties: (properties: Map<string, any>) => {
    saveDb({
      properties: Array.from(properties.entries()),
    })
  },
}
