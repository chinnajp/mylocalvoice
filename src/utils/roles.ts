import type { ComplaintStatus } from '@/constants'
import type { AdminUser, Complaint } from '@/types'

export type AdminRole = AdminUser['role']

/** Statuses each role may set */
export const ROLE_ALLOWED_STATUSES: Record<AdminRole, ComplaintStatus[]> = {
  staff: ['verified', 'in_progress', 'resolved'],
  president: ['submitted', 'verified', 'assigned', 'in_progress', 'resolved', 'closed'],
  super_admin: ['submitted', 'verified', 'assigned', 'in_progress', 'resolved', 'closed'],
}

export function isLeadership(role: AdminRole | undefined) {
  return role === 'president' || role === 'super_admin'
}

export function canAssignComplaints(role: AdminRole | undefined) {
  return isLeadership(role)
}

export function canCloseComplaints(role: AdminRole | undefined) {
  return isLeadership(role)
}

/** Only Admin (super_admin) may permanently delete complaints */
export function canDeleteComplaints(role: AdminRole | undefined) {
  return role === 'super_admin'
}

export function allowedStatusesForRole(role: AdminRole | undefined): ComplaintStatus[] {
  if (!role) return []
  return ROLE_ALLOWED_STATUSES[role]
}

export function canSetStatus(role: AdminRole | undefined, status: ComplaintStatus) {
  return allowedStatusesForRole(role).includes(status)
}

/** President: all complaints. Staff: only complaints assigned to their displayName (Staff 1…4). */
export function canEditComplaint(
  admin: Pick<AdminUser, 'role' | 'displayName'> | null | undefined,
  complaint: Pick<Complaint, 'assignedTo'> | null | undefined,
) {
  if (!admin || !complaint) return false
  if (isLeadership(admin.role)) return true
  if (admin.role === 'staff') {
    return Boolean(complaint.assignedTo && complaint.assignedTo === admin.displayName)
  }
  return false
}

export function roleLabel(role: AdminRole | undefined) {
  if (role === 'president') return 'Village President'
  if (role === 'staff') return 'Panchayat Staff'
  if (role === 'super_admin') return 'Admin'
  return 'Admin'
}
