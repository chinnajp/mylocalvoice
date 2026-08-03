import {
  CATEGORY_LABELS,
  DEFAULT_VILLAGE,
  type ComplaintCategory,
  type ComplaintStatus,
  STATUS_LABELS,
} from '@/constants'
import type {
  ActivityLogEntry,
  Announcement,
  Complaint,
  DashboardStats,
  ReportIssueForm,
} from '@/types'
import {
  DEMO_ADMINS,
  mockActivityLog,
  mockAnnouncements,
  mockComplaints,
} from '@/data/mockData'
import { avgResolutionDays, generateComplaintId, isPendingStatus } from '@/utils'
import { canAssignComplaints, canDeleteComplaints, canEditComplaint, canSetStatus } from '@/utils/roles'
import { useMockData } from '@/lib/firebase'
import { notifyComplaintStatus } from '@/services/notifications'
import type { AdminUser } from '@/types'

/** In-memory store for mock mode (mutates safely for demo) */
let complaintsStore: Complaint[] = structuredClone(mockComplaints)
let activityStore: ActivityLogEntry[] = structuredClone(mockActivityLog)
let sequence = complaintsStore.length + 1

function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function getComplaints(villageId = DEFAULT_VILLAGE.id): Promise<Complaint[]> {
  await delay()
  if (useMockData) {
    return complaintsStore
      .filter((c) => c.villageId === villageId)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  }
  // Firebase: collection(db, 'villages', villageId, 'complaints')
  return []
}

export async function getComplaintById(complaintId: string): Promise<Complaint | null> {
  await delay()
  return (
    complaintsStore.find(
      (c) => c.complaintId.toLowerCase() === complaintId.toLowerCase() || c.id === complaintId,
    ) ?? null
  )
}

export async function searchComplaints(params: {
  complaintId?: string
  mobile?: string
  category?: ComplaintCategory | ''
  status?: ComplaintStatus | ''
  query?: string
}): Promise<Complaint[]> {
  await delay()
  let list = [...complaintsStore]
  if (params.complaintId) {
    const q = params.complaintId.toLowerCase()
    list = list.filter((c) => c.complaintId.toLowerCase().includes(q))
  }
  if (params.mobile) {
    list = list.filter((c) => c.mobile?.includes(params.mobile!))
  }
  if (params.category) {
    list = list.filter((c) => c.category === params.category)
  }
  if (params.status) {
    list = list.filter((c) => c.status === params.status)
  }
  if (params.query) {
    const q = params.query.toLowerCase()
    list = list.filter(
      (c) =>
        c.description.toLowerCase().includes(q) ||
        c.complaintId.toLowerCase().includes(q) ||
        c.location.address?.toLowerCase().includes(q) ||
        CATEGORY_LABELS[c.category].toLowerCase().includes(q),
    )
  }
  return list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
}

export async function createComplaint(form: ReportIssueForm, villageId = DEFAULT_VILLAGE.id) {
  await delay(400)
  const now = new Date().toISOString()
  const complaintId = generateComplaintId(DEFAULT_VILLAGE.code, sequence++)
  const photoUrls = form.photos.map((f) => URL.createObjectURL(f))
  const voiceUrl = form.voiceFile ? URL.createObjectURL(form.voiceFile) : undefined

  const complaint: Complaint = {
    id: `c_${Date.now()}`,
    complaintId,
    villageId,
    fullName: form.fullName,
    mobile: form.mobile,
    category: form.category,
    description: form.description,
    photos: photoUrls,
    voiceUrl,
    location: form.location,
    status: 'submitted',
    supporters: 1,
    supporterIds: ['self'],
    comments: [],
    timeline: [
      {
        id: `t_${Date.now()}`,
        status: 'submitted',
        title: 'Complaint submitted',
        createdAt: now,
        createdBy: form.fullName || 'Citizen',
      },
    ],
    adminNotes: [],
    beforePhotos: [],
    afterPhotos: [],
    createdAt: now,
    updatedAt: now,
  }

  complaintsStore = [complaint, ...complaintsStore]
  activityStore = [
    {
      id: `al_${Date.now()}`,
      action: 'create',
      details: `${complaintId} created (${CATEGORY_LABELS[form.category]})`,
      actor: form.fullName || 'Citizen',
      createdAt: now,
      complaintId,
    },
    ...activityStore,
  ]

  if (form.mobile) {
    await notifyComplaintStatus(form.mobile, undefined, complaintId, STATUS_LABELS.submitted)
  }

  return complaint
}

export async function upvoteComplaint(id: string, voterKey: string) {
  await delay()
  const c = complaintsStore.find((x) => x.id === id || x.complaintId === id)
  if (!c) return null
  if (c.supporterIds.includes(voterKey)) return c
  c.supporterIds.push(voterKey)
  c.supporters += 1
  c.updatedAt = new Date().toISOString()
  return { ...c }
}

export async function addComment(id: string, authorName: string, text: string) {
  await delay()
  const c = complaintsStore.find((x) => x.id === id || x.complaintId === id)
  if (!c) return null
  c.comments.push({
    id: `cm_${Date.now()}`,
    authorName,
    text,
    createdAt: new Date().toISOString(),
  })
  c.updatedAt = new Date().toISOString()
  return { ...c }
}

export async function updateComplaintStatus(
  id: string,
  status: ComplaintStatus,
  actor: string,
  note?: string,
  assignedTo?: string,
  role?: AdminUser['role'],
  editor?: Pick<AdminUser, 'role' | 'displayName'> | null,
) {
  await delay()
  if (role && !canSetStatus(role, status)) {
    throw new Error(`Your role cannot set status to "${STATUS_LABELS[status]}"`)
  }
  if (assignedTo !== undefined && assignedTo !== '' && role && !canAssignComplaints(role)) {
    throw new Error('Only the Village President can assign complaints')
  }
  const c = complaintsStore.find((x) => x.id === id || x.complaintId === id)
  if (!c) return null
  if (editor && !canEditComplaint(editor, c)) {
    throw new Error(
      c.assignedTo
        ? `Only ${c.assignedTo} (or the President) can edit this complaint`
        : 'This complaint is not assigned to you',
    )
  }
  const now = new Date().toISOString()
  c.status = status
  c.updatedAt = now
  if (canAssignComplaints(role) && assignedTo !== undefined) {
    c.assignedTo = assignedTo || undefined
  }
  if (status === 'resolved') c.resolvedAt = now
  c.timeline.push({
    id: `t_${Date.now()}`,
    status,
    title: `Status updated to ${STATUS_LABELS[status]}`,
    description: note,
    createdAt: now,
    createdBy: actor,
  })
  if (note) {
    c.adminNotes.push({
      id: `n_${Date.now()}`,
      text: note,
      createdAt: now,
      createdBy: actor,
      isInternal: false,
    })
  }
  activityStore = [
    {
      id: `al_${Date.now()}`,
      action: 'status_update',
      details: `${c.complaintId} → ${STATUS_LABELS[status]}`,
      actor,
      createdAt: now,
      complaintId: c.complaintId,
    },
    ...activityStore,
  ]
  await notifyComplaintStatus(c.mobile, undefined, c.complaintId, STATUS_LABELS[status])
  return { ...c }
}

export async function deleteComplaint(
  id: string,
  actor: string,
  role?: AdminUser['role'],
) {
  await delay()
  if (!canDeleteComplaints(role)) {
    throw new Error('Only the Village President can delete complaints')
  }
  const index = complaintsStore.findIndex((x) => x.id === id || x.complaintId === id)
  if (index < 0) return false
  const removed = complaintsStore[index]
  complaintsStore = complaintsStore.filter((_, i) => i !== index)
  activityStore = [
    {
      id: `al_${Date.now()}`,
      action: 'delete',
      details: `${removed.complaintId} permanently deleted`,
      actor,
      createdAt: new Date().toISOString(),
      complaintId: removed.complaintId,
    },
    ...activityStore,
  ]
  return true
}

export async function addInternalNote(
  id: string,
  text: string,
  actor: string,
  editor?: Pick<AdminUser, 'role' | 'displayName'> | null,
) {
  await delay()
  const c = complaintsStore.find((x) => x.id === id || x.complaintId === id)
  if (!c) return null
  if (editor && !canEditComplaint(editor, c)) {
    throw new Error(
      c.assignedTo
        ? `Only ${c.assignedTo} (or the President) can add notes`
        : 'This complaint is not assigned to you',
    )
  }
  c.adminNotes.push({
    id: `n_${Date.now()}`,
    text,
    createdAt: new Date().toISOString(),
    createdBy: actor,
    isInternal: true,
  })
  return { ...c }
}

export async function getAnnouncements(): Promise<Announcement[]> {
  await delay()
  return mockAnnouncements
}

export async function getActivityLog(): Promise<ActivityLogEntry[]> {
  await delay()
  return activityStore
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await delay()
  const list = complaintsStore
  const today = new Date().toDateString()
  const pending = list.filter((c) => isPendingStatus(c.status)).length
  const inProgress = list.filter((c) => c.status === 'in_progress').length
  const resolved = list.filter((c) => c.status === 'resolved').length
  const closed = list.filter((c) => c.status === 'closed').length

  const byCat = new Map<string, number>()
  list.forEach((c) => byCat.set(c.category, (byCat.get(c.category) || 0) + 1))
  let mostReportedCategory: ComplaintCategory | null = null
  let max = 0
  byCat.forEach((count, cat) => {
    if (count > max) {
      max = count
      mostReportedCategory = cat as ComplaintCategory
    }
  })

  const trendMap = new Map<string, number>()
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    trendMap.set(d.toISOString().slice(0, 10), 0)
  }
  list.forEach((c) => {
    const key = c.createdAt.slice(0, 10)
    if (trendMap.has(key)) trendMap.set(key, (trendMap.get(key) || 0) + 1)
  })

  return {
    total: list.length,
    today: list.filter((c) => new Date(c.createdAt).toDateString() === today).length,
    pending,
    inProgress,
    resolved,
    closed,
    avgResolutionDays: avgResolutionDays(list),
    mostReportedCategory,
    trend: [...trendMap.entries()].map(([date, count]) => ({ date, count })),
    byCategory: [...byCat.entries()].map(([category, count]) => ({
      category: CATEGORY_LABELS[category as ComplaintCategory] || category,
      count,
    })),
    byStatus: Object.entries(
      list.reduce<Record<string, number>>((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1
        return acc
      }, {}),
    ).map(([status, count]) => ({
      status: STATUS_LABELS[status as ComplaintStatus] || status,
      count,
    })),
  }
}

export async function loginAdmin(email: string, password: string) {
  await delay(300)
  if (useMockData) {
    const match = DEMO_ADMINS.find((a) => a.email === email && a.password === password)
    if (match) {
      return {
        uid: `demo-${match.email}`,
        email: match.email,
        displayName: match.displayName,
        role: match.role,
        villageId: DEFAULT_VILLAGE.id,
      }
    }
    throw new Error('Invalid email or password')
  }
  // Firebase Auth signInWithEmailAndPassword
  throw new Error('Configure Firebase to enable live auth')
}
