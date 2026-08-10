/**
 * Server-side SMS providers. Secrets stay in Functions env — never VITE_*.
 *
 * Set with:
 *   firebase functions:config:set sms.provider="fast2sms" sms.api_key="..."
 * or environment variables when using params / .env in functions:
 *   SMS_PROVIDER=fast2sms|msg91|twilio|console
 *   SMS_API_KEY=...
 *   SMS_SENDER_ID=MYLOCL   (MSG91 / DLT)
 *   SMS_TEMPLATE_ID=...    (MSG91 OTP template)
 *   TWILIO_ACCOUNT_SID=...
 *   TWILIO_AUTH_TOKEN=...
 *   TWILIO_FROM=+1...
 */

function env(name, fallback = '') {
  return (process.env[name] || fallback).trim()
}

function normalizeIndiaMobile(to) {
  const digits = String(to).replace(/\D/g, '')
  if (digits.length === 10) return digits
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  return digits.slice(-10)
}

async function sendFast2Sms(to, body, otpCode) {
  const key = env('SMS_API_KEY')
  if (!key) throw new Error('SMS_API_KEY missing for Fast2SMS')
  const mobile = normalizeIndiaMobile(to)
  const params = new URLSearchParams()
  // OTP route when we have a 6-digit code; else quick SMS
  if (otpCode && /^\d{4,8}$/.test(otpCode)) {
    params.set('route', 'otp')
    params.set('variables_values', otpCode)
    params.set('numbers', mobile)
  } else {
    params.set('route', 'q')
    params.set('message', body.slice(0, 200))
    params.set('numbers', mobile)
  }
  const res = await fetch(`https://www.fast2sms.com/dev/bulkV2?${params}`, {
    method: 'GET',
    headers: { authorization: key },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.return === false) {
    throw new Error(data.message || `Fast2SMS failed (${res.status})`)
  }
  return { id: String(data.request_id || `f2s_${Date.now()}`) }
}

async function sendMsg91(to, body, otpCode) {
  const key = env('SMS_API_KEY')
  const templateId = env('SMS_TEMPLATE_ID')
  if (!key) throw new Error('SMS_API_KEY missing for MSG91')
  const mobile = `91${normalizeIndiaMobile(to)}`
  if (otpCode && templateId) {
    const url = new URL('https://control.msg91.com/api/v5/otp')
    url.searchParams.set('template_id', templateId)
    url.searchParams.set('mobile', mobile)
    url.searchParams.set('authkey', key)
    url.searchParams.set('otp', otpCode)
    const res = await fetch(url, { method: 'GET' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || `MSG91 OTP failed (${res.status})`)
    return { id: String(data.request_id || `msg91_${Date.now()}`) }
  }
  const res = await fetch('https://control.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: {
      authkey: key,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      template_id: templateId || undefined,
      short_url: '0',
      recipients: [{ mobiles: mobile, message: body }],
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || `MSG91 failed (${res.status})`)
  return { id: String(data.request_id || `msg91_${Date.now()}`) }
}

async function sendTwilio(to, body) {
  const sid = env('TWILIO_ACCOUNT_SID')
  const token = env('TWILIO_AUTH_TOKEN')
  const from = env('TWILIO_FROM')
  if (!sid || !token || !from) throw new Error('Twilio env incomplete')
  const mobile = `+91${normalizeIndiaMobile(to)}`
  const auth = Buffer.from(`${sid}:${token}`).toString('base64')
  const params = new URLSearchParams({ To: mobile, From: from, Body: body })
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || `Twilio failed (${res.status})`)
  return { id: String(data.sid || `tw_${Date.now()}`) }
}

/** @returns {{ success: boolean, id?: string, provider: string, error?: string, demo?: boolean }} */
async function sendSms(to, body, { otpCode } = {}) {
  const provider = (env('SMS_PROVIDER', 'console') || 'console').toLowerCase()
  try {
    if (provider === 'fast2sms') {
      const r = await sendFast2Sms(to, body, otpCode)
      return { success: true, id: r.id, provider }
    }
    if (provider === 'msg91') {
      const r = await sendMsg91(to, body, otpCode)
      return { success: true, id: r.id, provider }
    }
    if (provider === 'twilio') {
      const r = await sendTwilio(to, body)
      return { success: true, id: r.id, provider }
    }
    // console / unset — local & CI safe
    console.info('[SMS:console]', to, body)
    return { success: true, id: `console_${Date.now()}`, provider: 'console', demo: true }
  } catch (e) {
    console.error('[SMS]', provider, e)
    return { success: false, provider, error: e instanceof Error ? e.message : String(e) }
  }
}

module.exports = { sendSms, normalizeIndiaMobile }
