import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'

function requireStorage() {
  if (!storage) {
    throw new Error('Firebase Storage is not configured. Check your .env Firebase keys.')
  }
  return storage
}

async function uploadOne(path: string, file: File): Promise<string> {
  const storageRef = ref(requireStorage(), path)
  await uploadBytes(storageRef, file, { contentType: file.type || undefined })
  return getDownloadURL(storageRef)
}

/** Upload complaint photos/voice to Firebase Storage; returns download URLs. */
export async function uploadComplaintMedia(
  villageId: string,
  complaintDocId: string,
  photos: File[],
  voiceFile?: File | null,
): Promise<{ photoUrls: string[]; voiceUrl?: string }> {
  const base = `villages/${villageId}/complaints/${complaintDocId}`
  const photoUrls = await Promise.all(
    photos.map((file, i) => {
      const ext = file.name.split('.').pop() || 'jpg'
      return uploadOne(`${base}/photos/${Date.now()}_${i}.${ext}`, file)
    }),
  )
  let voiceUrl: string | undefined
  if (voiceFile) {
    const ext = voiceFile.name.split('.').pop() || 'webm'
    voiceUrl = await uploadOne(`${base}/voice/${Date.now()}.${ext}`, voiceFile)
  }
  return { photoUrls, voiceUrl }
}
