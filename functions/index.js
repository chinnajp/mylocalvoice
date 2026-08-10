const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { onDocumentUpdated } = require('firebase-functions/v2/firestore')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { createHash, randomInt } = require('node:crypto')
const { sendSms, normalizeIndiaMobile } = require('./sms')

initializeApp()
const db = getFirestore()

const OTP_TTL_MS = 5 * 60 * 1000
const OTP_LENGTH = 6
const MAX_ATTEMPTS = 5

function hashOtp(mobile, code) {
  return createHash('sha256').update(`${mobile}:${code}`).digest('hex')
}

function isValidMobile(mobile) {
  return /^[6-9]\d{9}$/.test(mobile)
}

function generateOtp() {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0')
}

/** Callable: send citizen OTP SMS */
exports.sendCitizenOtp = onCall({ cors: true }, async (request) => {
  const mobile = normalizeIndiaMobile(request.data?.mobile || '')
  if (!isValidMobile(mobile)) {
    throw new HttpsError('invalid-argument', 'INVALID_MOBILE')
  }

  const code = generateOtp()
  const expiresAt = Date.now() + OTP_TTL_MS
  await db.collection('otps').doc(mobile).set({
    hash: hashOtp(mobile, code),
    expiresAt,
    attempts: 0,
    createdAt: FieldValue.serverTimestamp(),
  })

  const body = `MyLocalVoice OTP: ${code}. Valid for 5 minutes. Do not share.`
  const sms = await sendSms(mobile, body, { otpCode: code })
  if (!sms.success) {
    throw new HttpsError('unavailable', sms.error || 'OTP_SEND_FAILED')
  }

  return {
    mobile,
    expiresInSec: Math.floor(OTP_TTL_MS / 1000),
    live: !sms.demo,
    /** Only returned in console/demo mode — never when real SMS is configured */
    demoCode: sms.demo ? code : undefined,
    provider: sms.provider,
  }
})

/** Callable: verify citizen OTP */
exports.verifyCitizenOtp = onCall({ cors: true }, async (request) => {
  const mobile = normalizeIndiaMobile(request.data?.mobile || '')
  const code = String(request.data?.otp || '')
    .replace(/\D/g, '')
    .slice(0, OTP_LENGTH)

  if (!isValidMobile(mobile) || code.length !== OTP_LENGTH) {
    throw new HttpsError('invalid-argument', 'OTP_INVALID')
  }

  const ref = db.collection('otps').doc(mobile)
  const snap = await ref.get()
  if (!snap.exists) throw new HttpsError('not-found', 'OTP_NOT_FOUND')

  const data = snap.data()
  if (Date.now() > Number(data.expiresAt || 0)) {
    await ref.delete()
    throw new HttpsError('deadline-exceeded', 'OTP_EXPIRED')
  }
  if (Number(data.attempts || 0) >= MAX_ATTEMPTS) {
    await ref.delete()
    throw new HttpsError('resource-exhausted', 'OTP_TOO_MANY')
  }
  if (data.hash !== hashOtp(mobile, code)) {
    await ref.update({ attempts: FieldValue.increment(1) })
    throw new HttpsError('permission-denied', 'OTP_INVALID')
  }

  await ref.delete()
  return { mobile, ok: true }
})

/**
 * Firestore trigger: SMS when complaint status changes.
 * Path: villages/{villageId}/complaints/{complaintId}
 */
exports.onComplaintStatusChange = onDocumentUpdated(
  'villages/{villageId}/complaints/{complaintId}',
  async (event) => {
    const before = event.data.before.data()
    const after = event.data.after.data()
    if (!before || !after) return
    if (before.status === after.status) return

    const mobile = after.mobile
    if (!mobile) return

    const complaintId = after.complaintId || event.params.complaintId
    const status = after.status || 'updated'
    const body = `MyLocalVoice: Complaint ${complaintId} is now "${status}". Track at https://mylocalvoice.in/track?id=${complaintId}`
    const result = await sendSms(mobile, body)
    console.info('[status-sms]', complaintId, status, result)
  },
)
