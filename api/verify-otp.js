const { normalizeIndiaMobile } = require('../server/sms')
const { OTP_LENGTH, verifyProof, cors, readJson } = require('../server/otp')

function isValidMobile(mobile) {
  return /^[6-9]\d{9}$/.test(mobile)
}

module.exports = async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
    return
  }

  try {
    const body = await readJson(req)
    const mobile = normalizeIndiaMobile(body.mobile || '')
    const code = String(body.otp || '')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH)
    const expiresAt = Number(body.expiresAt || 0)
    const proof = String(body.proof || '')

    if (!isValidMobile(mobile) || code.length !== OTP_LENGTH) {
      res.status(400).json({ error: 'OTP_INVALID' })
      return
    }
    if (!expiresAt || Date.now() > expiresAt) {
      res.status(410).json({ error: 'OTP_EXPIRED' })
      return
    }
    if (!verifyProof(mobile, code, expiresAt, proof)) {
      res.status(401).json({ error: 'OTP_INVALID' })
      return
    }

    res.status(200).json({ mobile, ok: true })
  } catch (e) {
    console.error('[verify-otp]', e)
    res.status(500).json({ error: 'OTP_INVALID' })
  }
}
