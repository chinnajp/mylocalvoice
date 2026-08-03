import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Label,
  PageTitle,
  Select,
  Spinner,
  Textarea,
} from '@/components/ui'
import { StatusTimeline } from '@/components/complaints/StatusTimeline'
import {
  addInternalNote,
  deleteComplaint,
  getComplaintById,
  updateComplaintStatus,
} from '@/services/complaints'
import { CATEGORY_LABELS, ASSIGNABLE_STAFF, STATUS_LABELS, type ComplaintStatus } from '@/constants'
import { useApp } from '@/contexts/AppContext'
import type { Complaint } from '@/types'
import { formatDateTime, getStatusBadgeClass, statusLabel } from '@/utils'
import {
  allowedStatusesForRole,
  canAssignComplaints,
  canDeleteComplaints,
  canEditComplaint,
  canSetStatus,
  roleLabel,
} from '@/utils/roles'

export function AdminComplaintManagePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { admin } = useApp()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<ComplaintStatus>('submitted')
  const [assignedTo, setAssignedTo] = useState('')
  const [note, setNote] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const role = admin?.role
  const canAssign = canAssignComplaints(role)
  const canDelete = canDeleteComplaints(role)
  const allowedStatuses = useMemo(() => allowedStatusesForRole(role), [role])
  const canEdit = canEditComplaint(admin, complaint)

  const load = async () => {
    setLoading(true)
    const c = await getComplaintById(id)
    setComplaint(c)
    if (c) {
      const next =
        canSetStatus(role, c.status) && allowedStatuses.includes(c.status)
          ? c.status
          : allowedStatuses[0] || c.status
      setStatus(next)
      setAssignedTo(c.assignedTo || '')
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, role])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (!complaint) {
    return <EmptyState message="Complaint not found" />
  }

  const actor = admin?.email || 'Admin'

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <PageTitle title={complaint.complaintId} />
        <Link to={`/complaints/${complaint.complaintId}`} className="text-sm text-sky-400 hover:underline">
          Public view →
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Badge className={getStatusBadgeClass(complaint.status)}>{statusLabel(complaint.status)}</Badge>
        <Badge className="bg-sky-500/15 text-sky-300 border-sky-500/30">
          {CATEGORY_LABELS[complaint.category]}
        </Badge>
        <Badge className="bg-violet-500/15 text-violet-300 border-violet-500/30">
          {roleLabel(role)}
        </Badge>
      </div>

      <Card className="mb-4 border-sky-500/20 bg-sky-500/5">
        <p className="text-sm text-vc-muted">
          {canAssign ? (
            <>
              As <strong className="text-white">President</strong> you can Assign (Staff 1–5), Close, and{' '}
              <strong className="text-white">Delete</strong> complaints. You may also set any status.
            </>
          ) : canEdit ? (
            <>
              Assigned to you (<strong className="text-white">{admin?.displayName}</strong>). You can set:{' '}
              <strong className="text-white">Verified → In Progress → Resolved</strong>.
            </>
          ) : (
            <>
              You can only edit complaints assigned to{' '}
              <strong className="text-white">{admin?.displayName}</strong>.
              {complaint.assignedTo
                ? ` This one is assigned to ${complaint.assignedTo}.`
                : ' This complaint is not assigned yet.'}
            </>
          )}
        </p>
      </Card>

      <Card className="mb-4">
        <StatusTimeline current={complaint.status} />
      </Card>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Card className="space-y-3">
          <h2 className="label-caps">Update Status</h2>
          <div>
            <Label>Status</Label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
              disabled={!canEdit}
            >
              {allowedStatuses.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Assign To {canAssign ? '' : '(President only)'}</Label>
            <Select
              value={canAssign ? assignedTo : complaint.assignedTo || ''}
              onChange={(e) => setAssignedTo(e.target.value)}
              disabled={!canAssign}
            >
              <option value="">Select staff</option>
              {ASSIGNABLE_STAFF.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            {!canAssign && complaint.assignedTo ? (
              <p className="text-xs text-vc-muted mt-1">Currently assigned: {complaint.assignedTo}</p>
            ) : null}
          </div>
          <div>
            <Label>Public note</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Visible to villagers"
              disabled={!canEdit}
            />
          </div>
          <Button
            disabled={saving || !canEdit || allowedStatuses.length === 0}
            onClick={async () => {
              setSaving(true)
              setError('')
              setMessage('')
              try {
                if (status === 'assigned' && canAssign && !assignedTo.trim()) {
                  throw new Error('Select a staff member in Assign To before setting Assigned')
                }
                const updated = await updateComplaintStatus(
                  complaint.id,
                  status,
                  actor,
                  note || undefined,
                  canAssign ? assignedTo : undefined,
                  role,
                  admin,
                )
                if (updated) {
                  setComplaint(updated)
                  setNote('')
                  setMessage('Status updated')
                }
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Update failed')
              }
              setSaving(false)
            }}
          >
            Save update
          </Button>
        </Card>

        <Card className="space-y-3">
          <h2 className="label-caps">Internal Notes</h2>
          <Textarea
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            placeholder="Staff-only notes"
            disabled={!canEdit}
          />
          <Button
            variant="secondary"
            disabled={!canEdit || !internalNote.trim() || saving}
            onClick={async () => {
              setSaving(true)
              setError('')
              try {
                const updated = await addInternalNote(complaint.id, internalNote.trim(), actor, admin)
                if (updated) {
                  setComplaint(updated)
                  setInternalNote('')
                  setMessage('Internal note added')
                }
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to add note')
              }
              setSaving(false)
            }}
          >
            Add note
          </Button>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {complaint.adminNotes
              .filter((n) => n.isInternal)
              .map((n) => (
                <div key={n.id} className="text-sm rounded-lg bg-black/30 border border-vc-border p-2">
                  <p>{n.text}</p>
                  <p className="text-[10px] text-vc-muted">
                    {n.createdBy} · {formatDateTime(n.createdAt)}
                  </p>
                </div>
              ))}
          </div>
        </Card>
      </div>

      <Card className="mb-4">
        <h2 className="label-caps mb-2">Description</h2>
        <p className="text-sm text-slate-300 mb-4">{complaint.description}</p>
        <h2 className="label-caps mb-2">Before / After Photos</h2>
        <p className="text-xs text-vc-muted mb-2">
          Upload via Firebase Storage in production. Demo shows existing URLs.
        </p>
        <div className="flex flex-wrap gap-2">
          {[...complaint.beforePhotos, ...complaint.afterPhotos, ...complaint.photos].map((src) => (
            <img key={src} src={src} alt="" className="h-20 w-28 object-cover rounded-lg border border-vc-border" />
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="label-caps mb-3">Timeline</h2>
        <ol className="space-y-2">
          {[...complaint.timeline].reverse().map((ev) => (
            <li key={ev.id} className="text-sm border-l-2 border-vc-teal/40 pl-3">
              <p className="font-medium">{ev.title}</p>
              {ev.description ? <p className="text-vc-muted">{ev.description}</p> : null}
              <p className="text-xs text-vc-muted">{formatDateTime(ev.createdAt)} · {ev.createdBy}</p>
            </li>
          ))}
        </ol>
      </Card>

      {canDelete ? (
        <Card className="mt-4 border-red-500/30 bg-red-500/5">
          <h2 className="label-caps mb-2 text-red-400">Danger zone</h2>
          <p className="text-sm text-vc-muted mb-4">
            Permanently remove <strong className="text-white">{complaint.complaintId}</strong>. This
            cannot be undone.
          </p>
          {!confirmDelete ? (
            <Button variant="danger" onClick={() => setConfirmDelete(true)} disabled={saving}>
              <Trash2 className="h-4 w-4" /> Delete complaint
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-red-300 w-full mb-1">Are you sure? Delete this complaint?</p>
              <Button
                variant="danger"
                disabled={saving}
                onClick={async () => {
                  setSaving(true)
                  setError('')
                  try {
                    const ok = await deleteComplaint(complaint.id, actor, role)
                    if (ok) {
                      navigate('/admin/complaints', { replace: true })
                    } else {
                      setError('Complaint not found')
                    }
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Delete failed')
                    setConfirmDelete(false)
                  }
                  setSaving(false)
                }}
              >
                {saving ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                Yes, delete forever
              </Button>
              <Button variant="secondary" disabled={saving} onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </div>
          )}
        </Card>
      ) : null}

      {message ? <p className="text-vc-teal text-sm mt-3">{message}</p> : null}
      {error ? <p className="text-red-400 text-sm mt-3">{error}</p> : null}
    </div>
  )
}
