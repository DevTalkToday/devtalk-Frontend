import type { SVGProps } from "react";

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 1.8,
  viewBox: "0 0 24 24",
};

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6.5 9.5V20h11V9.5" />
      <path d="M10 20v-5.5h4V20" />
    </svg>
  );
}

export function PenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20h4l10-10-4-4L4 16v4Z" />
      <path d="m12.5 7.5 4 4" />
    </svg>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export function CommentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M5 17.5 4 20l3.6-1.4A10 10 0 1 0 4 12c0 1.9.5 3.6 1.4 5" />
    </svg>
  );
}

export function HeartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20s-6.8-4.4-8.5-8.3C2 8.5 4.1 5 7.8 5c2.1 0 3.3 1.1 4.2 2.3C12.9 6.1 14.1 5 16.2 5 19.9 5 22 8.5 20.5 11.7 18.8 15.6 12 20 12 20Z" />
    </svg>
  );
}

export function BookmarkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M6.5 20V5.5h11V20L12 16.5 6.5 20Z" />
    </svg>
  );
}

export function EyeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

export function ArrowLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 7.5h15" />
      <path d="M9.5 7.5V5h5v2.5" />
      <path d="M7.5 7.5 8.3 20h7.4l.8-12.5" />
      <path d="M10 10.5v6" />
      <path d="M14 10.5v6" />
    </svg>
  );
}

export function FlagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M5.5 20V5" />
      <path d="M5.5 5h10.2l-1.4 3.5 1.4 3.5H5.5" />
    </svg>
  );
}

export function EllipsisIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function SparkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
    </svg>
  );
}

export function ListFormatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="5.5" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="5.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="5.5" cy="17" r="1" fill="currentColor" stroke="none" />
      <path d="M9 7h10" />
      <path d="M9 12h10" />
      <path d="M9 17h10" />
    </svg>
  );
}

export function CodeBracketsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="m9 7-4 5 4 5" />
      <path d="m15 7 4 5-4 5" />
    </svg>
  );
}

export function ChainLinkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M10.5 13.5 13.5 10.5" />
      <path d="M8.5 8.5H7a3.5 3.5 0 1 0 0 7h1.5" />
      <path d="M15.5 8.5H17a3.5 3.5 0 1 1 0 7h-1.5" />
    </svg>
  );
}

export function QuoteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M8.5 8.5h-2v3.5h3v3h-3.5a1 1 0 0 1-1-1v-3.5a2 2 0 0 1 2-2h1.5Z" />
      <path d="M17.5 8.5h-2v3.5h3v3H15a1 1 0 0 1-1-1v-3.5a2 2 0 0 1 2-2h1.5Z" />
    </svg>
  );
}
