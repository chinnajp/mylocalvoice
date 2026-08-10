import { httpsCallable } from 'firebase/functions'
import { functions, useCloudFunctions, useMockData, useOtpApi } from '@/lib/firebase'
import { sendNotification } from '@/services/notifications'
import type { CitizenUser } from '@/types'

const OTP_STORAGE_KEY = 'vc-citizen-otp'
const PROFILES_KEY = 'vc-citizen-profiles'
const OTP_TTL_MS = 5 * 60 * 1000
const OTP_LENGTH = 6

export interface CitizenProfile {
  fullName: string
  mobile: string
  areaId?: string
  areaName?: string
  createdAt: string
  updatedAt: string
}

interface PendingOtp {
  mobile: string
  code: string
  expiresAt: number
  attempts: number
  /** Cloud Functions path */
  cloud?: boolean
  /** Vercel /api path — HMAC proof from server */
  api?: boolean
  proof?: string
}

function normalizeMobile(mobile: string): string {
  return mobile.replace(/\D/g, '').slice(-10)
}

function isValidMobile(mobile: string): boolean {
  return /^[6-9]\d{9}$/.test(normalizeMobile(mobile))
}

function readProfiles(): Record<string, CitizenProfile> {
  try {
    const raw = localStorage.getItem(PROFILES_KEY)
    return raw ? (JSON.parse(raw) as Record<string, CitizenProfile>) : {}
  } catch {
    return {}
  }
}

function writeProfiles(profiles: Record<string, CitizenProfile>) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
}

export function getCitizenProfile(mobile: string): CitizenProfile | null {
  const key = normalizeMobile(mobile)
  if (!key) return null
  return readProfiles()[key] ?? null
}

export function hasCitizenProfile(mobile: string): boolean {
  const profile = getCitizenProfile(mobile)
  return Boolean(profile?.fullName?.trim())
}

export function saveCitizenProfile(input: {
  fullName: string
  mobile: string
  areaId?: string
  areaName?: string
}): CitizenProfile {
  const mobile = normalizeMobile(input.mobile)
  const now = new Date().toISOString()
  const existing = getCitizenProfile(mobile)
  const profile: CitizenProfile = {
    fullName: input.fullName.trim(),
    mobile,
    areaId: input.areaId || existing?.areaId,
    areaName: input.areaName || existing?.areaName,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  }
  const profiles = readProfiles()
  profiles[mobile] = profile
  writeProfiles(profiles)
  return profile
}

function readPendingOtp(): PendingOtp | null {
  try {
    const raw = sessionStorage.getItem(OTP_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PendingOtp) : null
  } catch {
    return null
  }
}

function writePendingOtp(pending: PendingOtp | null) {
  if (!pending) {
    sessionStorage.removeItem(OTP_STORAGE_KEY)
    return
  }
  sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(pending))
}

function generateOtp(): string {
  const n = Math.floor(Math.random() * 10 ** OTP_LENGTH)
  return String(n).padStart(OTP_LENGTH, '0')
}

export interface SendOtpResult {
  mobile: string
  expiresInSec: number
  /** Only set in demo/console mode — hidden when real SMS is live */
  demoCode?: string
  live: boolean
}

function mapApiError(errorCode: string | undefined): Error {
  const detail = errorCode || 'OTP_SEND_FAILED'
  if (detail.includes('INVALID_MOBILE')) return new Error('INVALID_MOBILE')
  if (detail.includes('OTP_EXPIRED')) return new Error('OTP_EXPIRED')
  if (detail.includes('OTP_TOO_MANY')) return new Error('OTP_TOO_MANY')
  if (detail.includes('OTP_NOT_FOUND')) return new Error('OTP_NOT_FOUND')
  if (detail.includes('OTP_INVALID')) return new Error('OTP_INVALID')
  return new Error('OTP_SEND_FAILED')
}

function mapCallableError(e: unknown): Error {
  const code =
    e && typeof e === 'object' && 'code' in e
      ? String((e as { code?: string }).code || '')
      : ''
  const message =
    e && typeof e === 'object' && 'message' in e
      ? String((e as { message?: string }).message || '')
      : ''
  const detail = message.includes('/') ? message.split('/').pop() || message : message
  if (detail.includes('INVALID_MOBILE') || code.includes('invalid-argument')) {
    return new Error('INVALID_MOBILE')
  }
  if (detail.includes('OTP_EXPIRED') || code.includes('deadline-exceeded')) {
    return new Error('OTP_EXPIRED')
  }
  if (detail.includes('OTP_TOO_MANY') || code.includes('resource-exhausted')) {
    return new Error('OTP_TOO_MANY')
  }
  if (detail.includes('OTP_NOT_FOUND') || code.includes('not-found')) {
    return new Error('OTP_NOT_FOUND')
  }
  if (detail.includes('OTP_INVALID') || code.includes('permission-denied')) {
    return new Error('OTP_INVALID')
  }
  return new Error('OTP_SEND_FAILED')
}

async function sendOtpViaApi(mobile: string): Promise<SendOtpResult> {
  const res = await fetch('/api/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile }),
  })
  const data = (await res.json().catch(() => ({}))) as {
    error?: string
    mobile?: string
    expiresAt?: number
    expiresInSec?: number
    proof?: string
    live?: boolean
    demoCode?: string
  }
  if (!res.ok) throw mapApiError(data.error)

  writePendingOtp({
    mobile: data.mobile || mobile,
    code: '',
    expiresAt: Number(data.expiresAt) || Date.now() + OTP_TTL_MS,
    attempts: 0,
    api: true,
    proof: data.proof,
  })

  return {
    mobile: data.mobile || mobile,
    expiresInSec: data.expiresInSec || Math.floor(OTP_TTL_MS / 1000),
    live: Boolean(data.live),
    demoCode: data.demoCode,
  }
}

async function sendOtpViaCloud(mobile: string): Promise<SendOtpResult> {
  if (!functions) throw new Error('OTP_SEND_FAILED')
  const callable = httpsCallable(functions, 'sendCitizenOtp')
  try {
    const res = await callable({ mobile })
    const data = res.data as {
      mobile: string
      expiresInSec: number
      live?: boolean
      demoCode?: string
    }
    writePendingOtp({
      mobile: data.mobile,
      code: '',
      expiresAt: Date.now() + (data.expiresInSec || 300) * 1000,
      attempts: 0,
      cloud: true,
    })
    return {
      mobile: data.mobile,
      expiresInSec: data.expiresInSec,
      live: Boolean(data.live),
      demoCode: data.demoCode,
    }
  } catch (e) {
    throw mapCallableError(e)
  }
}

async function sendOtpLocalDemo(mobile: string): Promise<SendOtpResult> {
  const code = generateOtp()
  const expiresAt = Date.now() + OTP_TTL_MS
  writePendingOtp({ mobile, code, expiresAt, attempts: 0 })

  const body = `MyLocalVoice OTP: ${code}. Valid for 5 minutes. Do not share.`
  await Promise.all([
    sendNotification({ channel: 'sms', to: mobile, body }),
    sendNotification({ channel: 'whatsapp', to: mobile, body }),
  ])

  return {
    mobile,
    expiresInSec: Math.floor(OTP_TTL_MS / 1000),
    demoCode: code,
    live: false,
  }
}

export async function sendCitizenOtp(mobileInput: string): Promise<SendOtpResult> {
  const mobile = normalizeMobile(mobileInput)
  if (!isValidMobile(mobile)) {
    throw new Error('INVALID_MOBILE')
  }

  if (!useMockData && useOtpApi) {
    return sendOtpViaApi(mobile)
  }
  if (!useMockData && useCloudFunctions && functions) {
    return sendOtpViaCloud(mobile)
  }
  return sendOtpLocalDemo(mobile)
}

export interface VerifyOtpResult {
  mobile: string
  isNewUser: boolean
  profile: CitizenProfile | null
}

async function verifyOtpViaApi(mobile: string, code: string, pending: PendingOtp): Promise<VerifyOtpResult> {
  if (pending.attempts >= 5) {
    writePendingOtp(null)
    throw new Error('OTP_TOO_MANY')
  }
  const res = await fetch('/api/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mobile,
      otp: code,
      expiresAt: pending.expiresAt,
      proof: pending.proof,
    }),
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) {
    if (data.error === 'OTP_INVALID') {
      writePendingOtp({ ...pending, attempts: pending.attempts + 1 })
    }
    throw mapApiError(data.error)
  }
  writePendingOtp(null)
  const profile = getCitizenProfile(mobile)
  return {
    mobile,
    isNewUser: !profile?.fullName?.trim() || !profile?.areaId,
    profile,
  }
}

async function verifyOtpViaCloud(mobile: string, code: string): Promise<VerifyOtpResult> {
  if (!functions) throw new Error('OTP_NOT_FOUND')
  const callable = httpsCallable(functions, 'verifyCitizenOtp')
  try {
    await callable({ mobile, otp: code })
  } catch (e) {
    throw mapCallableError(e)
  }
  writePendingOtp(null)
  const profile = getCitizenProfile(mobile)
  return {
    mobile,
    isNewUser: !profile?.fullName?.trim() || !profile?.areaId,
    profile,
  }
}

export async function verifyCitizenOtp(
  mobileInput: string,
  otpInput: string,
): Promise<VerifyOtpResult> {
  const mobile = normalizeMobile(mobileInput)
  const code = otpInput.replace(/\D/g, '').slice(0, OTP_LENGTH)
  const pending = readPendingOtp()

  if (pending?.api) {
    return verifyOtpViaApi(mobile, code, pending)
  }
  if (pending?.cloud || (!useMockData && useCloudFunctions && functions)) {
    return verifyOtpViaCloud(mobile, code)
  }

  if (!pending || pending.mobile !== mobile) {
    throw new Error('OTP_NOT_FOUND')
  }
  if (Date.now() > pending.expiresAt) {
    writePendingOtp(null)
    throw new Error('OTP_EXPIRED')
  }
  if (pending.attempts >= 5) {
    writePendingOtp(null)
    throw new Error('OTP_TOO_MANY')
  }
  if (pending.code !== code) {
    writePendingOtp({ ...pending, attempts: pending.attempts + 1 })
    throw new Error('OTP_INVALID')
  }

  writePendingOtp(null)
  const profile = getCitizenProfile(mobile)
  return {
    mobile,
    isNewUser: !profile?.fullName?.trim() || !profile?.areaId,
    profile,
  }
}

export function clearCitizenOtp() {
  writePendingOtp(null)
}

export function profileToCitizenUser(profile: CitizenProfile): CitizenUser {
  return {
    fullName: profile.fullName,
    mobile: profile.mobile,
    areaId: profile.areaId,
    areaName: profile.areaName,
    loggedInAt: new Date().toISOString(),
  }
}

export { normalizeMobile, isValidMobile }
