export function PageActions({ children }) {
  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end lg:w-auto lg:shrink-0">
      {children}
    </div>
  )
}
