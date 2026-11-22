export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#0c1222" />
      <circle cx="16" cy="8.2" r="2.5" fill="#ff5a4f" />
      <circle cx="16" cy="16" r="2.5" fill="#f5c451" />
      <circle cx="16" cy="23.8" r="2.5" fill="#2fbe78" />
    </svg>
  );
}
