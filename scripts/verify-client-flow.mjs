/**
 * Client-SDK style check: create complaint via Firestore REST to emulator
 * (same rules path as the browser app).
 */
const projectId = 'demo-mylocalvoice'
const base = `http://127.0.0.1:8080/v1/projects/${projectId}/databases/(default)/documents`
const villageId = 'thiruppair'
const now = new Date().toISOString()
const complaintId = `TP-CLIENT-${Date.now()}`
const docId = `c_${Date.now()}`

const body = {
  fields: {
    id: { stringValue: docId },
    complaintId: { stringValue: complaintId },
    villageId: { stringValue: villageId },
    fullName: { stringValue: 'Public Citizen' },
    mobile: { stringValue: '9876543210' },
    category: { stringValue: 'drainage' },
    description: { stringValue: 'Client verify: public complaint should list for admin' },
    photos: { arrayValue: { values: [] } },
    location: {
      mapValue: {
        fields: {
          lat: { doubleValue: 13.2094057 },
          lng: { doubleValue: 79.8342263 },
          address: { stringValue: 'Thiruppair' },
          areaId: { stringValue: 'thiruppair' },
        },
      },
    },
    status: { stringValue: 'submitted' },
    supporters: { integerValue: '1' },
    supporterIds: { arrayValue: { values: [{ stringValue: 'self' }] } },
    comments: { arrayValue: { values: [] } },
    timeline: {
      arrayValue: {
        values: [
          {
            mapValue: {
              fields: {
                id: { stringValue: `t_${Date.now()}` },
                status: { stringValue: 'submitted' },
                title: { stringValue: 'Complaint submitted' },
                createdAt: { stringValue: now },
                createdBy: { stringValue: 'Public Citizen' },
              },
            },
          },
        ],
      },
    },
    adminNotes: { arrayValue: { values: [] } },
    beforePhotos: { arrayValue: { values: [] } },
    afterPhotos: { arrayValue: { values: [] } },
    createdAt: { stringValue: now },
    updatedAt: { stringValue: now },
  },
}

const createUrl = `${base}/villages/${villageId}/complaints?documentId=${docId}`
const createRes = await fetch(createUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

if (!createRes.ok) {
  console.error('CREATE FAIL', createRes.status, await createRes.text())
  process.exit(1)
}

const listUrl = `${base}/villages/${villageId}/complaints`
const listRes = await fetch(listUrl)
if (!listRes.ok) {
  console.error('LIST FAIL', listRes.status, await listRes.text())
  process.exit(1)
}

const list = await listRes.json()
const docs = list.documents || []
const match = docs.find((d) => d.fields?.complaintId?.stringValue === complaintId)

if (!match) {
  console.error('FAIL: created complaint not in admin list query')
  console.error(`listed ${docs.length} docs`)
  process.exit(1)
}

console.log('OK: public create visible in complaints list (admin path)')
console.log(`  complaintId=${complaintId}`)
console.log(`  totalInVillage=${docs.length}`)
process.exit(0)
