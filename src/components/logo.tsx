import Link from "next/link";

interface LogoProps {
  href?: string;
  compact?: boolean;
  inverse?: boolean;
}

export function Logo({ href = "/", compact = false, inverse = false }: LogoProps) {
  return (
    <Link href={href} className={`brand-logo ${compact ? "brand-logo-compact" : ""} ${inverse ? "brand-logo-inverse" : ""}`} aria-label="Randinu Jayaratne Smart ICT home">
      <span className="brand-mark" aria-hidden="true">S</span>
      <span className="brand-copy">
        <strong>SMART ICT</strong>
        {!compact && <small>RANDINU JAYARATNE</small>}
      </span>
    </Link>
  );
}
