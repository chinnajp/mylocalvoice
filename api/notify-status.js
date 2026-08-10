const { sendSms, normalizeIndiaMobile } = require('../server/sms')
const { cors, readJson } = require('../server/otp')

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
    const complaintId = String(body.complaintId || '').trim()
    const statusLabel = String(body.statusLabel || body.status || 'updated').trim()

    if (!mobile || mobile.length !== 10 || !complaintId) {
      res.status(400).json({ error: 'INVALID_PAYLOAD' })
      return
    }

    const text = `MyLocalVoice: Complaint ${complaintId} is now "${statusLabel}". Track at https://mylocalvoice.in/track?id=${complaintId}`
    const sms = await sendSms(mobile, text)
    res.status(200).json({ ok: sms.success, provider: sms.provider, error: sms.error })
  } catch (e) {
    console.error('[notify-status]', e)
    res.status(500).json({ error: 'NOTIFY_FAILED' })
  }
}
