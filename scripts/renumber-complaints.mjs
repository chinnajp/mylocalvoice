/**
 * Renumber existing complaints to TP-YYYY-00001, 00002, … by createdAt order.
 * Resets villages/{id}/meta/counters.complaintSeq to the count.
 *
 *   set GOOGLE_APPLICATION_CREDENTIALS=.\serviceAccount.json
 *   node scripts/renumber-complaints.mjs
 */
import { readFileSync } from 'node:fs'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const sa = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccount.json', 'utf8'))
const villageId = process.env.VITE_VILLAGE_ID || 'thiruppair'
const year = new Date().getFullYear()
const code = 'TP'

if (!getApps().length) initializeApp({ credential: cert(sa), projectId: sa.project_id })
const db = getFirestore()

const snap = await db.collection('villages').doc(villageId).collection('complaints').get()
const docs = snap.docs
  .map((d) => ({ ref: d.ref, data: d.data() }))
  .sort((a, b) => {
    const ta = String(a.data.createdAt || '')
    const tb = String(b.data.createdAt || '')
    if (ta !== tb) return ta.localeCompare(tb)
    return a.ref.id.localeCompare(b.ref.id)
  })

console.log(`Renumbering ${docs.length} complaints in ${villageId}…`)

let seq = 0
for (const item of docs) {
  seq += 1
  const complaintId = `${code}-${year}-${String(seq).padStart(5, '0')}`
  const old = item.data.complaintId
  await item.ref.update({ complaintId })
  console.log(`${old || '(none)'} → ${complaintId}`)
}

await db.collection('villages').doc(villageId).collection('meta').doc('counters').set(
  { complaintSeq: seq },
  { merge: true },
)

console.log(`Done. Counter set to ${seq}. Next new complaint will be ${code}-${year}-${String(seq + 1).padStart(5, '0')}`)
