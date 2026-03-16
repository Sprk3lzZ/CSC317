import { cn } from "@/lib/utils";

interface StatusConfig {
  label: string;
  bg: string;
  text: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending:      { label: "Pending",      bg: "rgba(59,130,246,0.15)",  text: "var(--status-submitted)" },
  approved:     { label: "Approved",     bg: "rgba(16,185,129,0.15)",  text: "var(--status-approved)" },
  rejected:     { label: "Rejected",     bg: "rgba(239,68,68,0.15)",   text: "var(--status-rejected)" },
  // legacy statuses kept for mock-data compatibility
  draft:        { label: "Draft",        bg: "rgba(107,114,128,0.15)", text: "var(--status-draft)" },
  submitted:    { label: "Submitted",    bg: "rgba(59,130,246,0.15)",  text: "var(--status-submitted)" },
  under_review: { label: "Under Review", bg: "rgba(245,158,11,0.15)",  text: "var(--status-under-review)" },
  reimbursed:   { label: "Reimbursed",   bg: "rgba(139,92,246,0.15)",  text: "var(--status-reimbursed)" },
};

const FALLBACK: StatusConfig = {
  label: "Unknown",
  bg: "rgba(107,114,128,0.15)",
  text: "var(--status-draft)",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const config = STATUS_CONFIG[status] ?? FALLBACK;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
      style={{ background: config.bg, color: config.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: config.text }} />
      {config.label}
    </span>
  );
}
