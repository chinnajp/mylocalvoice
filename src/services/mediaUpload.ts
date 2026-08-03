import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'

function requireStorage() {
  if (!storage) {
    throw new Error('Firebase Storage is not configured. Check your .env Firebase keys.')
  }
  return storage
}

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

async function uploadOne(path: string, file: File, kind: 'image' | 'audio'): Promise<string> {
  const contentType = guessContentType(file, kind)
  const storageRef = ref(requireStorage(), path)
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

/** Compress image for Firestore fallback (keeps docs under size limits). */
async function imageToCompressedDataUrl(file: File, maxEdge = 1280, quality = 0.72): Promise<string> {
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
  if (!ctx) return readAsDataUrl(file)
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', quality)
}

async function fallbackLocalMedia(
  photos: File[],
  voiceFile?: File | null,
): Promise<{ photoUrls: string[]; voiceUrl?: string }> {
  // Firestore doc size limit ~1MB — keep fallback media small
  const limitedPhotos = photos.slice(0, 3)
  const photoUrls = await Promise.all(
    limitedPhotos.map((f) => imageToCompressedDataUrl(f, 1024, 0.65)),
  )
  let voiceUrl: string | undefined
  if (voiceFile && voiceFile.size <= 400_000) {
    voiceUrl = await readAsDataUrl(voiceFile)
  }
  return { photoUrls, voiceUrl }
}

/** Upload complaint photos/voice to Firebase Storage; falls back to data URLs if Storage is blocked. */
export async function uploadComplaintMedia(
  villageId: string,
  complaintDocId: string,
  photos: File[],
  voiceFile?: File | null,
): Promise<{ photoUrls: string[]; voiceUrl?: string }> {
  if ((!photos || photos.length === 0) && !voiceFile) {
    return { photoUrls: [] }
  }

  if (!storage) {
    return fallbackLocalMedia(photos, voiceFile)
  }

  const base = `villages/${villageId}/complaints/${complaintDocId}`

  try {
    const photoUrls = await Promise.all(
      photos.map((file, i) => {
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
  } catch {
    // Storage rules / bucket not ready — still allow complaint submit with embedded media
    return fallbackLocalMedia(photos, voiceFile)
  }
}
