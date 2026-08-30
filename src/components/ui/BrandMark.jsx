export function BrandMark({ size = 40, className = '' }) {
  return (
    <img
      src="/logo.png"
      alt=""
      width={size}
      height={size}
      aria-hidden="true"
      className={`shrink-0 rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
