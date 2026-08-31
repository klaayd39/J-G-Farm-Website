import { PageActions } from './PageActions'

export function PageToolbar({ filter, actions }) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-3 xl:flex-row xl:items-start xl:justify-end">
      {filter && <div className="min-w-0 w-full xl:flex-1">{filter}</div>}
      {actions && <PageActions>{actions}</PageActions>}
    </div>
  )
}
