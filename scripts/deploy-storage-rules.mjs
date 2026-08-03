/**
 * Deploy storage.rules via Firebase Rules API.
 *
 *   set GOOGLE_APPLICATION_CREDENTIALS=.\serviceAccount.json
 *   node scripts/deploy-storage-rules.mjs
 */
import { readFileSync } from 'node:fs'
import { GoogleAuth } from 'google-auth-library'

const sa = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccount.json', 'utf8'))
const projectId = sa.project_id
const bucket =
  process.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`
const rulesContent = readFileSync(new URL('../storage.rules', import.meta.url), 'utf8')

const auth = new GoogleAuth({
  credentials: sa,
  scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase'],
})
const client = await auth.getClient()
const { token } = await client.getAccessToken()

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = { raw: text }
  }
  if (!res.ok) throw new Error(`${method} ${url} → ${res.status} ${JSON.stringify(json)}`)
  return json
}

const create = await api('POST', `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`, {
  source: {
    files: [{ name: 'storage.rules', content: rulesContent }],
  },
})
console.log('Ruleset:', create.name)

const releaseName = `projects/${projectId}/releases/firebase.storage/${bucket}`
try {
  const release = await api('POST', `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases`, {
    name: releaseName,
    rulesetName: create.name,
  })
  console.log('Storage rules released:', release.name)
} catch {
  const release = await api(
    'PATCH',
    `https://firebaserules.googleapis.com/v1/${releaseName}?updateMask=rulesetName`,
    {
      release: {
        name: releaseName,
        rulesetName: create.name,
      },
    },
  )
  console.log('Storage rules updated:', release.name)
}
