export function BrandMark({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="11" fill="url(#jg-mark-bg)" />
      <circle cx="20" cy="22" r="10" fill="#ecfccb" />
      <circle cx="20" cy="22" r="7.2" fill="#84cc16" opacity="0.35" />
      <path
        d="M20 12.5c1.8-3.2 5.6-4.2 8.2-3.4-1.2 2.8-3.8 4.6-8.2 4.8-4.4-.2-7-2-8.2-4.8 2.6-.8 6.4.2 8.2 3.4Z"
        fill="#166534"
      />
      <path d="M20 12.2v4.6" stroke="#14532d" strokeWidth="1.6" strokeLinecap="round" />
      <defs>
        <linearGradient id="jg-mark-bg" x1="6" y1="2" x2="36" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4ade80" />
          <stop offset="1" stopColor="#166534" />
        </linearGradient>
      </defs>
    </svg>
  )
}
