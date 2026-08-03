import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'

const STORAGE_TIMEOUT_MS = 8000
const MAX_EMBED_CHARS = 700_000

function guessContentType(file: File, kind: 'image' | 'audio'): string {
  if (file.type && file.type !== 'application/octet-stream') return file.type
  const name = file.name.toLowerCase()
  if (kind === 'image') {
    if (name.endsWith('.png')) return 'image/png'
    if (name.endsWith('.webp')) return 'image/webp'
    if (name.endsWith('.gif')) return 'image/gif'
    return 'image/jpeg'
  }
  if (name.endsWith('.mp3')) return 'audio/mpeg'
  if (name.endsWith('.wav')) return 'audio/wav'
  if (name.endsWith('.m4a')) return 'audio/mp4'
  return 'audio/webm'
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms)
    promise.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e) => {
        clearTimeout(timer)
        reject(e)
      },
    )
  })
}

async function uploadOne(path: string, file: File, kind: 'image' | 'audio'): Promise<string> {
  if (!storage) throw new Error('Storage unavailable')
  const contentType = guessContentType(file, kind)
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file, { contentType })
  return getDownloadURL(storageRef)
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

async function imageToCompressedDataUrl(file: File, maxEdge = 960, quality = 0.55): Promise<string> {
  try {
    if (typeof createImageBitmap === 'undefined') {
      return readAsDataUrl(file)
    }
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return readAsDataUrl(file)
    }
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()
    return canvas.toDataURL('image/jpeg', quality)
  } catch {
    try {
      return await readAsDataUrl(file)
    } catch {
      return ''
    }
  }
}

async function embedLocalMedia(
  photos: File[],
  voiceFile?: File | null,
): Promise<{ photoUrls: string[]; voiceUrl?: string }> {
  const photoUrls: string[] = []
  for (const file of photos.slice(0, 2)) {
    const url = await imageToCompressedDataUrl(file)
    if (!url) continue
    const nextSize = photoUrls.join('').length + url.length
    if (nextSize > MAX_EMBED_CHARS) break
    photoUrls.push(url)
  }

  let voiceUrl: string | undefined
  if (voiceFile && voiceFile.size <= 250_000) {
    try {
      const data = await readAsDataUrl(voiceFile)
      if (photoUrls.join('').length + data.length <= MAX_EMBED_CHARS) {
        voiceUrl = data
      }
    } catch {
      // skip voice
    }
  }

  return { photoUrls, voiceUrl }
}

async function tryFirebaseStorage(
  villageId: string,
  complaintDocId: string,
  photos: File[],
  voiceFile?: File | null,
): Promise<{ photoUrls: string[]; voiceUrl?: string }> {
  if (!storage) throw new Error('no storage')
  const base = `villages/${villageId}/complaints/${complaintDocId}`

  const photoUrls = await Promise.all(
    photos.slice(0, 6).map((file, i) => {
      const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg'
      return uploadOne(`${base}/photos/${Date.now()}_${i}.${ext}`, file, 'image')
    }),
  )

  let voiceUrl: string | undefined
  if (voiceFile) {
    const ext = voiceFile.name.includes('.') ? voiceFile.name.split('.').pop() : 'webm'
    voiceUrl = await uploadOne(`${base}/voice/${Date.now()}.${ext}`, voiceFile, 'audio')
  }

  return { photoUrls, voiceUrl }
}

/**
 * Attach photos/voice for a complaint.
 * Never throws — if Storage is down, embeds small compressed media (or skips media).
 */
export async function uploadComplaintMedia(
  villageId: string,
  complaintDocId: string,
  photos: File[],
  voiceFile?: File | null,
): Promise<{ photoUrls: string[]; voiceUrl?: string; mediaWarning?: string }> {
  if ((!photos || photos.length === 0) && !voiceFile) {
    return { photoUrls: [] }
  }

  // Storage is optional until bucket/rules are enabled on Firebase.
  // Default: embed compressed media so submit never hangs on Storage.
  const useStorage = import.meta.env.VITE_USE_FIREBASE_STORAGE === 'true'

  if (useStorage && storage) {
    try {
      return await withTimeout(
        tryFirebaseStorage(villageId, complaintDocId, photos, voiceFile),
        STORAGE_TIMEOUT_MS,
        'Storage upload',
      )
    } catch {
      // fall through to embed / skip
    }
  }

  try {
    const embedded = await embedLocalMedia(photos, voiceFile)
    if (embedded.photoUrls.length > 0 || embedded.voiceUrl) {
      return {
        ...embedded,
        mediaWarning: 'Saved with compressed photos (cloud Storage not ready).',
      }
    }
  } catch {
    // ignore
  }

  return {
    photoUrls: [],
    mediaWarning: 'Could not attach media — complaint was still submitted.',
  }
}
