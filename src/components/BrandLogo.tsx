interface BrandLogoProps {
  size?: number;
  className?: string;
}

export function BrandLogo({ size = 36, className = '' }: BrandLogoProps) {
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
      <rect width="40" height="40" rx="11" fill="#536DFE" />
      <path
        d="M12 9.5C12 8.67157 12.6716 8 13.5 8H22.8787C23.2765 8 23.658 8.15804 23.9393 8.43934L29.5607 14.0607C29.842 14.342 30 14.7235 30 15.1213V30.5C30 31.3284 29.3284 32 28.5 32H13.5C12.6716 32 12 31.3284 12 30.5V9.5Z"
        fill="#FFFFFF"
      />
      <path d="M23 8V13.5C23 14.3284 23.6716 15 24.5 15H30L23 8Z" fill="#C7D2FE" />
      <rect x="9.5" y="20" width="18" height="9" rx="3" fill="#E52535" />
      <text
        x="18.5"
        y="26.5"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="Plus Jakarta Sans, sans-serif"
        fontWeight="800"
        fontSize="6.6"
        letterSpacing="0.4"
      >
        PDF
      </text>
    </svg>
  );
}
