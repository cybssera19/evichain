const base = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' }

export const ChevronRight = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" {...base} strokeWidth="1.6">
    <path d="M5 3L9 7L5 11" />
  </svg>
)

export const ChevronLeft = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" {...base} strokeWidth="1.6">
    <path d="M10 3.5L5.5 8L10 12.5" />
  </svg>
)

export const Search = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" {...base} strokeWidth="1.6">
    <circle cx="7" cy="7" r="5" />
    <path d="M11 11L14 14" />
  </svg>
)

export const Close = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" {...base} strokeWidth="1.7">
    <path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" />
  </svg>
)

export const Copy = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" {...base} strokeWidth="1.4">
    <rect x="5" y="5" width="8.5" height="8.5" rx="2" />
    <path d="M10.5 3.5V3A1.5 1.5 0 0 0 9 1.5H3A1.5 1.5 0 0 0 1.5 3V9A1.5 1.5 0 0 0 3 10.5H3.5" />
  </svg>
)

export const Lock = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" {...base} strokeWidth="1.4">
    <rect x="2.5" y="6" width="9" height="6.5" rx="1.5" />
    <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" />
  </svg>
)

export const Plus = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" {...base} strokeWidth="1.6">
    <path d="M7 2.5V11.5M2.5 7H11.5" />
  </svg>
)

export const Check = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" {...base} strokeWidth="1.8">
    <path d="M2.5 6.2L5 8.5L9.5 3.5" />
  </svg>
)

export const Upload = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" {...base} strokeWidth="2">
    <path d="M15 20V6M9.5 11.5L15 6L20.5 11.5" />
    <path d="M5 19V23C5 24.1 5.9 25 7 25H23C24.1 25 25 24.1 25 23V19" />
  </svg>
)

export const Info = ({ color = 'currentColor' }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5">
    <circle cx="8" cy="8" r="6.5" />
    <path d="M8 7.2V11" strokeLinecap="round" />
    <circle cx="8" cy="5" r="0.6" fill={color} />
  </svg>
)

export const Logout = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" {...base} strokeWidth="1.5">
    <path d="M6 2.5H3.5A1 1 0 0 0 2.5 3.5V12.5A1 1 0 0 0 3.5 13.5H6M10.5 11L13.5 8L10.5 5M13.5 8H6" />
  </svg>
)

export const Pencil = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" {...base} strokeWidth="1.4">
    <path d="M10.5 2.5L13.5 5.5L5.5 13.5H2.5V10.5Z" />
  </svg>
)

export const Trash = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" {...base} strokeWidth="1.4">
    <path d="M3 4.5H13M6.5 4.5V3H9.5V4.5M4.5 4.5L5.2 13H10.8L11.5 4.5" />
  </svg>
)

export const Database = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" {...base} strokeWidth="1.3">
    <ellipse cx="8" cy="4" rx="5.5" ry="2" />
    <path d="M2.5 4V12C2.5 13.1 5 14 8 14C11 14 13.5 13.1 13.5 12V4M2.5 8C2.5 9.1 5 10 8 10C11 10 13.5 9.1 13.5 8" />
  </svg>
)

export const ChainIcon = ({ color = 'var(--desk)' }) => (
  <svg width="16" height="10" viewBox="0 0 16 10" fill="none" stroke={color} strokeWidth="1.4">
    <rect x="1" y="1.5" width="8" height="7" rx="3.5" />
    <rect x="7" y="1.5" width="8" height="7" rx="3.5" />
  </svg>
)

export const LinkVertical = ({ bg = '#FBF7EC' }) => (
  <svg width="16" height="22" viewBox="0 0 16 22" fill="none" stroke="#8C846F" strokeWidth="1.6">
    <rect width="16" height="22" fill={bg} stroke="none" />
    <rect x="3" y="1" width="10" height="12" rx="5" />
    <rect x="3" y="9" width="10" height="12" rx="5" />
  </svg>
)

export const LinkHorizontal = ({ bg = '#FBF7EC' }) => (
  <svg width="26" height="14" viewBox="0 0 26 14" fill="none" stroke="#8C846F" strokeWidth="1.6">
    <rect width="26" height="14" fill={bg} stroke="none" />
    <rect x="1" y="3" width="14" height="8" rx="4" />
    <rect x="11" y="3" width="14" height="8" rx="4" />
  </svg>
)

export const FileIcon = ({ label }) => (
  <svg width="34" height="40" viewBox="0 0 36 42" fill="none" stroke="#CFC6B0" strokeWidth="1.4">
    <path d="M2 4C2 2.9 2.9 2 4 2H24L34 12V38C34 39.1 33.1 40 32 40H4C2.9 40 2 39.1 2 38Z" fill="#FFFDF7" />
    <path d="M24 2V12H34" fill="#EDE6D4" />
    {label && (
      <text x="8" y="31" fontFamily="monospace" fontSize="8" fill="#6B6455" stroke="none">
        {label}
      </text>
    )}
  </svg>
)

export const Logo = ({ light }) => (
  <svg width="28" height="28" viewBox="0 0 28 28">
    <rect width="28" height="28" rx="8" fill={light ? '#F6F1E4' : '#17191C'} />
    <rect x="5.5" y="9.5" width="10.5" height="9" rx="4.5" stroke={light ? '#0F4A3C' : '#F6F1E4'} strokeWidth="2" fill="none" />
    <rect x="12" y="9.5" width="10.5" height="9" rx="4.5" stroke="#E8452C" strokeWidth="2" fill="none" />
  </svg>
)
