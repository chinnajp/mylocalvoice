const { sendSms, normalizeIndiaMobile } = require('../server/sms')
const { OTP_TTL_MS, OTP_LENGTH, generateOtp, makeProof, cors, readJson } = require('../server/otp')

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
    if (!isValidMobile(mobile)) {
      res.status(400).json({ error: 'INVALID_MOBILE' })
      return
    }

    const code = generateOtp()
    const expiresAt = Date.now() + OTP_TTL_MS
    const proof = makeProof(mobile, code, expiresAt)
    const smsBody = `MyLocalVoice OTP: ${code}. Valid for 5 minutes. Do not share.`
    const sms = await sendSms(mobile, smsBody, { otpCode: code })
    if (!sms.success) {
      res.status(503).json({ error: 'OTP_SEND_FAILED', detail: sms.error })
      return
    }

    res.status(200).json({
      mobile,
      expiresAt,
      expiresInSec: Math.floor(OTP_TTL_MS / 1000),
      proof,
      live: !sms.demo,
      demoCode: sms.demo ? code : undefined,
      provider: sms.provider,
      otpLength: OTP_LENGTH,
    })
  } catch (e) {
    console.error('[send-otp]', e)
    res.status(500).json({ error: 'OTP_SEND_FAILED' })
  }
}
