import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ComplaintStatus } from '@/constants'
import { MAP_MARKER_COLORS, STATUS_LABELS } from '@/constants'
import type { Complaint } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateComplaintId(villageCode: string, sequence: number, year = new Date().getFullYear()) {
  return `${villageCode.toUpperCase()}-${year}-${String(sequence).padStart(5, '0')}`
}

/** Extract numeric sequence from IDs like TP-2026-00004 → 4 */
export function parseComplaintSequence(complaintId: string): number {
  const m = complaintId.trim().match(/-(\d{1,})$/)
  return m ? Number.parseInt(m[1], 10) : 0
}

/** Sort by complaint number ascending (TP-2026-00001, 00002, …) */
export function compareComplaintIdAsc(a: string, b: string) {
  const sa = parseComplaintSequence(a)
  const sb = parseComplaintSequence(b)
  if (sa !== sb) return sa - sb
  return a.localeCompare(b)
}

/** Sort by complaint number descending (newest first: …00005, 00004, 00003) */
export function compareComplaintIdDesc(a: string, b: string) {
  return compareComplaintIdAsc(b, a)
}

export function formatDate(iso: string, locale = 'en-IN') {
  return new Date(iso).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(iso: string, locale = 'en-IN') {
  return new Date(iso).toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function isPendingStatus(status: ComplaintStatus) {
  return status === 'submitted' || status === 'verified' || status === 'assigned'
}

export function getMapMarkerColor(status: ComplaintStatus) {
  if (status === 'resolved' || status === 'closed') return MAP_MARKER_COLORS.resolved
  if (status === 'in_progress' || status === 'assigned') return MAP_MARKER_COLORS.in_progress
  return MAP_MARKER_COLORS.pending
}

export function getStatusBadgeClass(status: ComplaintStatus) {
  const map: Record<ComplaintStatus, string> = {
    submitted: 'bg-red-500/15 text-red-400 border-red-500/30',
    verified: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    assigned: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    in_progress: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    resolved: 'bg-green-500/15 text-green-400 border-green-500/30',
    closed: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  }
  return map[status]
}

export function statusLabel(status: ComplaintStatus) {
  return STATUS_LABELS[status]
}

/** Detect similar complaints nearby (same category, ~200m, open) */
export function findDuplicateCandidates(
  complaints: Complaint[],
  category: string,
  lat: number,
  lng: number,
  radiusMeters = 200,
) {
  const openStatuses: ComplaintStatus[] = ['submitted', 'verified', 'assigned', 'in_progress']
  return complaints.filter((c) => {
    if (c.category !== category) return false
    if (!openStatuses.includes(c.status)) return false
    const dist = haversineMeters(lat, lng, c.location.lat, c.location.lng)
    return dist <= radiusMeters
  })
}

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export function avgResolutionDays(complaints: Complaint[]) {
  const resolved = complaints.filter((c) => c.resolvedAt)
  if (!resolved.length) return 0
  const total = resolved.reduce((sum, c) => {
    const start = new Date(c.createdAt).getTime()
    const end = new Date(c.resolvedAt!).getTime()
    return sum + (end - start) / (1000 * 60 * 60 * 24)
  }, 0)
  return Math.round((total / resolved.length) * 10) / 10
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
