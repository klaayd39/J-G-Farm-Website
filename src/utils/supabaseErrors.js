/** PostgREST / Supabase errors when a column is not in the DB or schema cache. */
export function isMissingColumnError(error) {
  const message = (error?.message || '').toLowerCase()
  if (!message.includes('column')) return false
  return (
    message.includes('does not exist') ||
    message.includes('schema cache') ||
    message.includes('could not find')
  )
}

export function omitKeys(object, keys) {
  const next = { ...object }
  keys.forEach((key) => delete next[key])
  return next
}
