import Link from "next/link";

export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="36" height="36" rx="9" fill="#123C35" />
      <path
        d="M8.5 23.5 L14.5 16.5 L18.5 19.5 L25.5 10.5"
        stroke="#F6F4ED"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.2 10.2 L25.8 10.1 L25.7 15.7"
        stroke="#C47A52"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8.5" cy="23.5" r="1.7" fill="#C47A52" />
    </svg>
  );
}

export default function Logo({
  size = 34,
  wordmarkClassName = "text-[19px]",
}: {
  size?: number;
  wordmarkClassName?: string;
}) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="TopFit home">
      <span className="transition-transform duration-200 group-hover:-translate-y-px">
        <LogoMark size={size} />
      </span>
      <span className={`font-bold tracking-tight text-ink ${wordmarkClassName}`}>
        Top<span className="text-forest-700">Fit</span>
      </span>
    </Link>
  );
}
