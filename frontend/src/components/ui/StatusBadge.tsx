import { cn } from "@/lib/utils";

interface StatusConfig {
  label: string;
  className: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending:      { label: "Pending",      className: "bg-blue-50 text-blue-700 border-blue-100" },
  approved:     { label: "Approved",     className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  rejected:     { label: "Rejected",     className: "bg-red-50 text-red-600 border-red-100" },
  draft:        { label: "Draft",        className: "bg-zinc-100 text-zinc-500 border-zinc-200" },
  submitted:    { label: "Submitted",    className: "bg-blue-50 text-blue-700 border-blue-100" },
  under_review: { label: "Under Review", className: "bg-amber-50 text-amber-700 border-amber-100" },
  reimbursed:   { label: "Reimbursed",   className: "bg-violet-50 text-violet-700 border-violet-100" },
};

const FALLBACK: StatusConfig = {
  label: "Unknown",
  className: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = STATUS_CONFIG[status] ?? FALLBACK;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
