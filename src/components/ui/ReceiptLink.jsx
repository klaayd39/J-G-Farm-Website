import { useEffect, useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import { getReceiptSignedUrl } from '../../utils/receiptStorage'

export function ReceiptLink({ receiptPath, className = '' }) {
  const [href, setHref] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadUrl() {
      if (!receiptPath) {
        if (active) {
          setHref('')
          setLoading(false)
        }
        return
      }

      setLoading(true)
      try {
        const signedUrl = await getReceiptSignedUrl(receiptPath)
        if (active) setHref(signedUrl)
      } catch {
        if (active) setHref('')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadUrl()
    return () => {
      active = false
    }
  }, [receiptPath])

  if (!receiptPath) {
    return <span className="text-xs text-slate-600">—</span>
  }

  if (loading || !href) {
    return <span className="text-xs text-slate-500">Loading…</span>
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={
        className ||
        'inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20'
      }
    >
      <ImageIcon size={13} />
      Photo
    </a>
  )
}
