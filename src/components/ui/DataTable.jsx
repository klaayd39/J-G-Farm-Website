import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Search, X } from 'lucide-react'

export function DataTable({
  columns,
  data = [],
  pageSize = 10,
  searchPlaceholder = 'Search records...',
  searchKeys = [],
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' })

  const filteredData = useMemo(() => {
    if (!searchTerm.trim() || searchKeys.length === 0) return data
    const lower = searchTerm.toLowerCase()
    return data.filter((item) =>
      searchKeys.some((key) => {
        const val = item[key]
        return val && String(val).toLowerCase().includes(lower)
      })
    )
  }, [data, searchTerm, searchKeys])

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredData, sortConfig])

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage, pageSize])

  function handleSort(key) {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  return (
    <div className="space-y-3.5">
      {searchKeys.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="field-input w-full pl-10 pr-9 text-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 self-end sm:self-auto">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>
              {sortedData.length} {sortedData.length === 1 ? 'record found' : 'records found'}
            </span>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#0d1714]/80 shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="border-b border-white/8 bg-black/30 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={`whitespace-nowrap px-4 py-3.5 ${col.sortable ? 'cursor-pointer select-none transition-colors hover:text-emerald-300' : ''} ${col.className || ''}`}
                    onClick={() => col.sortable && handleSort(col.accessorKey)}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.header}
                      {col.sortable && (
                        sortConfig.key === col.accessorKey ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUp size={13} className="text-emerald-400" />
                          ) : (
                            <ArrowDown size={13} className="text-emerald-400" />
                          )
                        ) : (
                          <ArrowUpDown size={12} className="text-slate-500 opacity-60" />
                        )
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-slate-500">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIdx) => (
                  <tr key={row.id || rowIdx} className="transition-colors hover:bg-white/[0.035]">
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className={`px-4 py-3.5 ${col.className || ''}`}>
                        {col.cell ? col.cell(row) : row[col.accessorKey]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 text-xs text-slate-400">
          <span>
            Showing <strong className="font-semibold text-slate-200">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="font-semibold text-slate-200">{Math.min(currentPage * pageSize, sortedData.length)}</strong> of{' '}
            <strong className="font-semibold text-slate-200">{sortedData.length}</strong>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-14 text-center font-medium text-slate-300">
              {currentPage} <span className="text-slate-600">/</span> {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
