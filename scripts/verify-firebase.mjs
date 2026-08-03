/**
 * Verify Firestore complaint create → list (emulator or cloud via Admin SDK).
 * Run with emulators up: npm run verify:firebase
 */
import { initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const projectId = process.env.FIREBASE_PROJECT_ID || 'demo-mylocalvoice'
process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080'

if (!getApps().length) {
  initializeApp({ projectId })
}

const db = getFirestore()
const villageId = 'thiruppair'
const now = new Date().toISOString()
const complaintId = `TP-VERIFY-${Date.now()}`
const docRef = db.collection('villages').doc(villageId).collection('complaints').doc()

const complaint = {
  id: docRef.id,
  complaintId,
  villageId,
  fullName: 'Verify Citizen',
  mobile: '9000000001',
  category: 'street_light',
  description: 'Automated Firebase verify complaint',
  photos: [],
  location: { lat: 13.2094057, lng: 79.8342263, address: 'Thiruppair', areaId: 'thiruppair' },
  status: 'submitted',
  supporters: 1,
  supporterIds: ['verify'],
  comments: [],
  timeline: [
    {
      id: `t_${Date.now()}`,
      status: 'submitted',
      title: 'Complaint submitted',
      createdAt: now,
      createdBy: 'Verify Citizen',
    },
  ],
  adminNotes: [],
  beforePhotos: [],
  afterPhotos: [],
  createdAt: now,
  updatedAt: now,
}

await docRef.set(complaint)

const snap = await db
  .collection('villages')
  .doc(villageId)
  .collection('complaints')
  .where('complaintId', '==', complaintId)
  .limit(1)
  .get()

if (snap.empty) {
  console.error('FAIL: complaint not found after create')
  process.exit(1)
}

const found = snap.docs[0].data()
console.log('OK: complaint persisted and readable')
console.log(`  id=${found.id}`)
console.log(`  complaintId=${found.complaintId}`)
console.log(`  status=${found.status}`)
process.exit(0)
