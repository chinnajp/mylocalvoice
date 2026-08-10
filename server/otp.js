const { createHmac, randomInt, timingSafeEqual } = require('node:crypto')

const OTP_TTL_MS = 5 * 60 * 1000
const OTP_LENGTH = 6

function otpSecret() {
  const s = (process.env.OTP_SECRET || '').trim()
  if (s) return s
  // Dev/console fallback — set OTP_SECRET on Vercel for production
  return 'mylocalvoice-dev-otp-secret-change-me'
}

function generateOtp() {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0')
}

function makeProof(mobile, code, expiresAt) {
  return createHmac('sha256', otpSecret())
    .update(`${mobile}.${code}.${expiresAt}`)
    .digest('hex')
}

function safeEqualHex(a, b) {
  try {
    const ba = Buffer.from(String(a), 'hex')
    const bb = Buffer.from(String(b), 'hex')
    if (ba.length !== bb.length || ba.length === 0) return false
    return timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}

function verifyProof(mobile, code, expiresAt, proof) {
  if (!mobile || !code || !expiresAt || !proof) return false
  if (Date.now() > Number(expiresAt)) return false
  const expected = makeProof(mobile, code, Number(expiresAt))
  return safeEqualHex(expected, proof)
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') {
      resolve(req.body)
      return
    }
    let raw = ''
    req.on('data', (c) => {
      raw += c
      if (raw.length > 1e5) reject(new Error('BODY_TOO_LARGE'))
    })
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        reject(new Error('INVALID_JSON'))
      }
    })
    req.on('error', reject)
  })
}

module.exports = {
  OTP_TTL_MS,
  OTP_LENGTH,
  generateOtp,
  makeProof,
  verifyProof,
  cors,
  readJson,
}
