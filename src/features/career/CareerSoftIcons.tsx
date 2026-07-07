type SoftIconProps = Readonly<{
  size?: number;
  className?: string;
}>;

function iconProps(size: number, className?: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    className,
    "aria-hidden": true,
    focusable: false
  } as const;
}

export function SoftChevronIcon({ size = 18, className }: SoftIconProps) {
  return (
    <svg {...iconProps(size, className)} fill="none">
      <path d="m14.5 6.5-5 5.5 5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SoftBackIcon({ size = 18, className }: SoftIconProps) {
  return (
    <svg {...iconProps(size, className)} fill="none">
      <path d="M9.5 5.5 16 12l-6.5 6.5M16 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SoftSearchIcon({ size = 22, className }: SoftIconProps) {
  return (
    <svg {...iconProps(size, className)} fill="none">
      <circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" strokeWidth="2" />
      <path d="m15 15 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SoftCloseIcon({ size = 20, className }: SoftIconProps) {
  return (
    <svg {...iconProps(size, className)} fill="none">
      <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SoftEssentialIcon({ size = 12, className }: SoftIconProps) {
  return (
    <svg {...iconProps(size, className)} fill="currentColor">
      <rect x="9" y="3" width="6" height="18" rx="3" />
      <rect x="3" y="9" width="18" height="6" rx="3" />
    </svg>
  );
}

export function PathsTabIcon({ size = 22, className }: SoftIconProps) {
  return (
    <svg {...iconProps(size, className)} fill="none">
      <path d="M6 6.5h5a3 3 0 0 1 3 3v5a3 3 0 0 0 3 3h1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="5.5" cy="6.5" r="3" fill="currentColor" />
      <circle cx="18.5" cy="17.5" r="3" fill="currentColor" />
    </svg>
  );
}

export function CompareTabIcon({ size = 22, className }: SoftIconProps) {
  return (
    <svg {...iconProps(size, className)} fill="currentColor">
      <rect x="3" y="5" width="7" height="14" rx="3.5" opacity=".55" />
      <rect x="14" y="5" width="7" height="14" rx="3.5" />
      <rect x="9" y="9.5" width="6" height="2" rx="1" />
      <rect x="9" y="13" width="6" height="2" rx="1" />
    </svg>
  );
}

export function SavedTabIcon({ size = 22, className }: SoftIconProps) {
  return (
    <svg {...iconProps(size, className)} fill="currentColor">
      <path d="M12 20c-1.2-1-7.5-5.1-7.5-10.1A4.4 4.4 0 0 1 12 6.7a4.4 4.4 0 0 1 7.5 3.2C19.5 14.9 13.2 19 12 20Z" />
    </svg>
  );
}

export function GuideTabIcon({ size = 22, className }: SoftIconProps) {
  return (
    <svg {...iconProps(size, className)} fill="none">
      <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v17H8.5A3.5 3.5 0 0 0 5 22Z" fill="currentColor" opacity=".55" />
      <path d="M19 5.5A3.5 3.5 0 0 0 15.5 2H12v17h3.5A3.5 3.5 0 0 1 19 22Z" fill="currentColor" />
      <path d="M8 7h2M14 7h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
