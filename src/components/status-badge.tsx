interface StatusBadgeProps {
  children: React.ReactNode;
  tone?: "success" | "warning" | "danger" | "neutral" | "brand";
}

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return <span className={`status-badge status-${tone}`}>{children}</span>;
}
