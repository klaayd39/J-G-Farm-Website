import { PageActions } from './PageActions'

export function PageToolbar({ filter, actions }) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-end lg:gap-4">
      {filter && <div className="min-w-0 w-full lg:min-w-[14rem] lg:flex-1">{filter}</div>}
      {actions && <PageActions>{actions}</PageActions>}
    </div>
  )
}
