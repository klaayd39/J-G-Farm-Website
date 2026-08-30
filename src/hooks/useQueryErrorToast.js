import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

export function useQueryErrorToast(error) {
  const lastError = useRef(null)

  useEffect(() => {
    if (error && error !== lastError.current) {
      lastError.current = error
      toast.error(error)
    }
    if (!error) {
      lastError.current = null
    }
  }, [error])
}
