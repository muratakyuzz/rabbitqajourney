import type { SVGProps } from "react";

export function ExcelIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="3" y="2" width="18" height="20" rx="3" fill="#107C41" />
      <rect x="7" y="6" width="12" height="2" fill="#185C37" />
      <path
        d="M10.1 9.8H12.1L13.4 12L14.7 9.8H16.7L14.6 13L16.8 16.2H14.8L13.4 13.9L12 16.2H10L12.1 13L10.1 9.8Z"
        fill="white"
      />
      <rect x="3" y="2" width="7" height="20" rx="3" fill="#185C37" />
      <path d="M5 9.2H6.7L7.8 11.1L8.9 9.2H10.6L8.8 12L10.7 14.8H9L7.8 12.8L6.6 14.8H4.9L6.8 12L5 9.2Z" fill="white" />
    </svg>
  );
}
