/**
 * Seed Firebase Auth + admins/{uid} for MyLocalVoice.
 *
 * Emulator (default):
 *   1. npm run emulators
 *   2. npm run seed:admin
 *
 * Cloud:
 *   set GOOGLE_APPLICATION_CREDENTIALS=path\to\serviceAccount.json
 *   set SEED_TARGET=cloud
 *   set FIREBASE_PROJECT_ID=your_project_id
 *   npm run seed:admin
 */
import { readFileSync } from 'node:fs'
import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const projectId =
  process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'demo-mylocalvoice'
const useCloud = process.env.SEED_TARGET === 'cloud'

if (!useCloud) {
  process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080'
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099'
}

if (!getApps().length) {
  if (useCloud) {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    if (credPath) {
      const serviceAccount = JSON.parse(readFileSync(credPath, 'utf8'))
      initializeApp({ credential: cert(serviceAccount), projectId })
    } else {
      initializeApp({ credential: applicationDefault(), projectId })
    }
  } else {
    initializeApp({ projectId })
  }
}

const auth = getAuth()
const db = getFirestore()

const ADMINS = [
  {
    email: 'admin@mylocalvoice.in',
    password: 'admin123',
    displayName: 'Village President',
    role: 'president',
    villageId: 'thiruppair',
  },
  {
    email: 'staff1@mylocalvoice.in',
    password: 'staff123',
    displayName: 'Staff 1',
    role: 'staff',
    villageId: 'thiruppair',
  },
  {
    email: 'staff2@mylocalvoice.in',
    password: 'staff123',
    displayName: 'Staff 2',
    role: 'staff',
    villageId: 'thiruppair',
  },
  {
    email: 'staff3@mylocalvoice.in',
    password: 'staff123',
    displayName: 'Staff 3',
    role: 'staff',
    villageId: 'thiruppair',
  },
  {
    email: 'staff4@mylocalvoice.in',
    password: 'staff123',
    displayName: 'Staff 4',
    role: 'staff',
    villageId: 'thiruppair',
  },
  {
    email: 'staff5@mylocalvoice.in',
    password: 'staff123',
    displayName: 'Staff 5',
    role: 'staff',
    villageId: 'thiruppair',
  },
]

async function upsertAdmin(entry) {
  let user
  try {
    user = await auth.getUserByEmail(entry.email)
    await auth.updateUser(user.uid, {
      password: entry.password,
      displayName: entry.displayName,
    })
  } catch {
    user = await auth.createUser({
      email: entry.email,
      password: entry.password,
      displayName: entry.displayName,
      emailVerified: true,
    })
  }

  await db.collection('admins').doc(user.uid).set(
    {
      email: entry.email,
      displayName: entry.displayName,
      role: entry.role,
      villageId: entry.villageId,
    },
    { merge: true },
  )

  console.log(`✓ ${entry.role.padEnd(10)} ${entry.email}  uid=${user.uid}`)
}

console.log(`Seeding admins → project=${projectId} target=${useCloud ? 'cloud' : 'emulator'}`)
for (const entry of ADMINS) {
  await upsertAdmin(entry)
}

await db.collection('villages').doc('thiruppair').set(
  {
    id: 'thiruppair',
    name: 'Thiruppair',
    updatedAt: new Date().toISOString(),
  },
  { merge: true },
)

console.log('Done. Login: admin@mylocalvoice.in / admin123')
process.exit(0)
