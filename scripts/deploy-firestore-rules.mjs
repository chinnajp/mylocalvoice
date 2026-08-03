/**
 * Deploy firestore.rules via Firebase Rules API (bypasses firebase CLI Service Usage checks).
 */
import { readFileSync } from 'node:fs'
import { GoogleAuth } from 'google-auth-library'

const sa = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccount.json', 'utf8'))
const projectId = sa.project_id
const rulesContent = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8')

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
  if (!res.ok) {
    throw new Error(`${method} ${url} → ${res.status} ${JSON.stringify(json)}`)
  }
  return json
}

const create = await api('POST', `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`, {
  source: {
    files: [{ name: 'firestore.rules', content: rulesContent }],
  },
})
console.log('Ruleset created:', create.name)

const release = await api(
  'PATCH',
  `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore?updateMask=rulesetName`,
  {
    release: {
      name: `projects/${projectId}/releases/cloud.firestore`,
      rulesetName: create.name,
    },
  },
)
console.log('Firestore rules released:', release.name)
console.log('Done.')
