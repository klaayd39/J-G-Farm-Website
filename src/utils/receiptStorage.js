import { supabase } from '../lib/supabase'

const RECEIPTS_BUCKET = 'receipts'

export function normalizeReceiptPath(value) {
  if (!value) return ''
  if (!value.startsWith('http')) return value

  const markers = [
    '/storage/v1/object/public/receipts/',
    '/storage/v1/object/sign/receipts/',
    '/storage/v1/object/authenticated/receipts/',
  ]

  for (const marker of markers) {
    const index = value.indexOf(marker)
    if (index !== -1) {
      return decodeURIComponent(value.slice(index + marker.length).split('?')[0])
    }
  }

  return value
}

export async function getReceiptSignedUrl(pathOrUrl, expiresIn = 3600) {
  const path = normalizeReceiptPath(pathOrUrl)
  if (!path) return ''
  if (path.startsWith('http')) return path

  const { data, error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrl(path, expiresIn)

  if (error) throw error
  return data.signedUrl
}

export async function deleteReceipt(pathOrUrl) {
  const path = normalizeReceiptPath(pathOrUrl)
  if (!path || path.startsWith('http')) return

  const { error } = await supabase.storage.from(RECEIPTS_BUCKET).remove([path])
  if (error) throw error
}
