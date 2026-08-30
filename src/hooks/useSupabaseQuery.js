import { useState, useEffect, useCallback } from 'react'
import { supabase, isJwtAuthError } from '../lib/supabase'

/**
 * Generic hook for Supabase queries with loading/error states.
 * 
 * @param {string} table - The table name
 * @param {object} options - Query options
 * @param {string} options.select - Columns to select (default '*')
 * @param {string} options.orderBy - Column to order by (default 'created_at')
 * @param {boolean} options.ascending - Order direction (default false = DESC)
 * @param {Array} options.filters - Array of filter objects: { column, operator, value }
 * @param {Array} deps - Dependency array to re-fetch
 */
export function useSupabaseQuery(table, options = {}, deps = []) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const {
    select = '*',
    orderBy = 'created_at',
    ascending = false,
    filters = [],
  } = options

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from(table)
        .select(select)
        .order(orderBy, { ascending })

      for (const filter of filters) {
        if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
          query = query.filter(filter.column, filter.operator, filter.value)
        }
      }

      const { data: result, error: fetchError } = await query

      if (fetchError) {
        if (isJwtAuthError(fetchError)) {
          await supabase.auth.signOut()
          throw new Error('Your session expired. Please sign in again.')
        }
        throw fetchError
      }
      setData(result || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch data')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [table, select, orderBy, ascending, JSON.stringify(filters)])

  useEffect(() => {
    fetchData()
  }, [fetchData, ...deps])

  return { data, loading, error, refetch: fetchData }
}
