import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Mic, Square, Upload, ImagePlus } from 'lucide-react'
import { Button, Card, Input, Label, PageTitle, Select, Textarea, Spinner } from '@/components/ui'
import { VillageMap } from '@/components/map/VillageMap'
import {
  CATEGORY_LABELS,
  CATEGORY_LABELS_TA,
  COMPLAINT_CATEGORIES,
  VILLAGE_AREAS,
  type ComplaintCategory,
} from '@/constants'
import { createComplaint, getComplaints, upvoteComplaint } from '@/services/complaints'
import { findDuplicateCandidates } from '@/utils'
import type { Complaint, GeoLocation } from '@/types'
import { useApp } from '@/contexts/AppContext'

interface FormValues {
  fullName: string
  mobile: string
  category: ComplaintCategory
  description: string
  areaId: string
}

export function ReportPage() {
  const { t, i18n } = useTranslation()
  const { voterKey, citizen, village } = useApp()
  const navigate = useNavigate()
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      category: 'street_light',
      areaId: VILLAGE_AREAS[0].id,
      fullName: citizen?.fullName || '',
      mobile: citizen?.mobile || '',
      description: '',
    },
  })

  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [voiceFile, setVoiceFile] = useState<File | null>(null)
  const [recording, setRecording] = useState(false)
  const [location, setLocation] = useState<GeoLocation>({
    lat: VILLAGE_AREAS[0].lat,
    lng: VILLAGE_AREAS[0].lng,
    address: VILLAGE_AREAS[0].name,
    areaId: VILLAGE_AREAS[0].id,
  })
  const [duplicates, setDuplicates] = useState<Complaint[]>([])
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([])
  const [error, setError] = useState('')
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])

  const category = watch('category')
  const areaId = watch('areaId')
  const ta = i18n.language === 'ta'

  useEffect(() => {
    void getComplaints().then(setAllComplaints)
  }, [])

  useEffect(() => {
    const area = VILLAGE_AREAS.find((a) => a.id === areaId)
    if (area) {
      setLocation({
        lat: area.lat,
        lng: area.lng,
        address: ta ? area.nameTa : area.name,
        areaId: area.id,
      })
    }
  }, [areaId, ta])

  useEffect(() => {
    setDuplicates(findDuplicateCandidates(allComplaints, category, location.lat, location.lng))
  }, [allComplaints, category, location.lat, location.lng])

  const onPhotos = (files: FileList | null) => {
    if (!files) return
    const list = [...photos, ...Array.from(files)].slice(0, 6)
    setPhotos(list)
    setPhotoPreviews(list.map((f) => URL.createObjectURL(f)))
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      chunks.current = []
      rec.ondataavailable = (e) => chunks.current.push(e.data)
      rec.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        setVoiceFile(new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' }))
        stream.getTracks().forEach((tr) => tr.stop())
      }
      mediaRecorder.current = rec
      rec.start()
      setRecording(true)
    } catch {
      setError('Microphone access denied. You can upload an audio file instead.')
    }
  }

  const stopRecording = () => {
    mediaRecorder.current?.stop()
    setRecording(false)
  }

  const onSubmit = async (data: FormValues) => {
    setError('')
    if (isSubmitting) return
    if (!data.description.trim()) {
      setError('Please enter a description')
      return
    }
    try {
      const complaint = await createComplaint(
        {
          fullName: data.fullName || undefined,
          mobile: data.mobile || undefined,
          category: data.category,
          description: data.description,
          areaId: data.areaId,
          location,
          photos,
          voiceFile,
        },
        village.id,
      )
      navigate(`/complaints/${complaint.complaintId}`, { state: { justSubmitted: true } })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <PageTitle title={t('report.title')} />
      <p className="text-vc-muted mb-2 -mt-4">{t('report.subtitle')}</p>
      <p className="text-xs sm:text-sm text-vc-teal mb-8">
        {ta
          ? `${village.panchayatTa || village.nameTa} · ${village.blockTa || ''}`.trim()
          : `${village.panchayat || village.name} · ${village.block || ''}`.trim()}
      </p>

      {duplicates.length > 0 ? (
        <Card className="mb-6 border-vc-accent/40 bg-vc-accent/5">
          <p className="font-semibold text-vc-accent mb-2">{t('report.duplicateHint')}</p>
          <ul className="space-y-2">
            {duplicates.slice(0, 3).map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <Link to={`/complaints/${d.complaintId}`} className="text-sky-400 hover:underline">
                  {d.complaintId} — {d.description.slice(0, 60)}…
                </Link>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await upvoteComplaint(d.id, voterKey)
                    navigate(`/complaints/${d.complaintId}`)
                  }}
                >
                  {t('report.supportExisting')} ({d.supporters})
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Card className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>{t('report.fullName')}</Label>
              <Input {...register('fullName')} placeholder="Optional" />
            </div>
            <div>
              <Label>{t('report.mobile')}</Label>
              <Input {...register('mobile', { pattern: /^[0-9+\-\s]{10,15}$/ })} placeholder="10-digit mobile" />
              {errors.mobile ? <p className="text-xs text-red-400 mt-1">Enter a valid mobile</p> : null}
            </div>
          </div>

          <div>
            <Label>{t('report.category')}</Label>
            <Select {...register('category', { required: true })}>
              {COMPLAINT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {ta ? CATEGORY_LABELS_TA[c] : CATEGORY_LABELS[c]}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>{t('report.description')}</Label>
            <Textarea
              {...register('description', { required: true, minLength: 10 })}
              placeholder="Describe the issue clearly…"
            />
            {errors.description ? (
              <p className="text-xs text-red-400 mt-1">Please provide at least 10 characters</p>
            ) : null}
          </div>

          <div>
            <Label>{t('report.photos')}</Label>
            <label className="flex flex-col items-center justify-center gap-2 border border-dashed dark:border-vc-border border-light-border rounded-xl p-6 cursor-pointer hover:border-sky-400/50 transition">
              <ImagePlus className="h-6 w-6 text-vc-muted" />
              <span className="text-sm text-vc-muted">Upload up to 6 photos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onPhotos(e.target.files)}
              />
            </label>
            {photoPreviews.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-3">
                {photoPreviews.map((src) => (
                  <img key={src} src={src} alt="" className="h-20 w-20 object-cover rounded-lg border border-vc-border" />
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <Label>{t('report.voice')}</Label>
            <div className="flex flex-wrap gap-2">
              {!recording ? (
                <Button type="button" variant="secondary" onClick={() => void startRecording()}>
                  <Mic className="h-4 w-4" /> {t('report.record')}
                </Button>
              ) : (
                <Button type="button" variant="danger" onClick={stopRecording}>
                  <Square className="h-4 w-4" /> {t('report.stop')}
                </Button>
              )}
              <label className="inline-flex">
                <Button type="button" variant="secondary" as-child={undefined} onClick={() => document.getElementById('voice-upload')?.click()}>
                  <Upload className="h-4 w-4" /> {t('report.uploadVoice')}
                </Button>
                <input
                  id="voice-upload"
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => setVoiceFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            {voiceFile ? <p className="text-xs text-vc-teal mt-2">Attached: {voiceFile.name}</p> : null}
          </div>

          <div>
            <Label>{t('report.area')} *</Label>
            <p className="text-xs text-vc-muted mb-1.5">{t('report.areaHint')}</p>
            <Select
              {...register('areaId', { required: true })}
              onChange={(e) => {
                setValue('areaId', e.target.value)
              }}
            >
              {VILLAGE_AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  {ta ? a.nameTa : a.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>{t('report.location')}</Label>
            <p className="text-xs text-vc-muted mb-2">
              Pin: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              {location.address ? ` · ${location.address}` : ''}
            </p>
            <VillageMap
              complaints={[]}
              height="280px"
              center={{ lat: location.lat, lng: location.lng }}
              pickMode
              onPickLocation={(lat, lng) =>
                setLocation((prev) => ({ ...prev, lat, lng, address: prev.address || 'Custom pin' }))
              }
            />
          </div>
        </Card>

        {error ? <p className="text-red-400 text-sm">{error}</p> : null}

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? <Spinner className="h-5 w-5" /> : null}
          {t('report.submit')}
        </Button>
      </form>
    </div>
  )
}
