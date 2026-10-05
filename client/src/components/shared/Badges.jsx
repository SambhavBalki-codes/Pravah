import { formatStatus } from "../../lib/format";

const base = "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset";
const NEUTRAL = "bg-slate-100 text-slate-600 ring-slate-200";

const make = (map, labels = {}) =>
  function Badge({ value }) {
    return (
      <span className={`${base} ${map[value] || NEUTRAL}`}>
        {labels[value] || formatStatus(value || "unknown")}
      </span>
    );
  };

export const StatusBadge = make({
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  in_progress: "bg-blue-50 text-blue-700 ring-blue-200",
  revision_required: "bg-violet-50 text-violet-700 ring-violet-200",
  completed: NEUTRAL,
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
});

export const ProgressBadge = make(
  {
    awaiting_approval: "bg-amber-50 text-amber-700 ring-amber-200",
    awaiting_files: NEUTRAL,
    needs_review: "bg-blue-50 text-blue-700 ring-blue-200",
    in_progress: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    revision_required: "bg-violet-50 text-violet-700 ring-violet-200",
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    rejected: "bg-rose-50 text-rose-700 ring-rose-200",
    no_project: NEUTRAL,
  },
  { in_progress: "On track", revision_required: "Revising" },
);

export const ReviewBadge = make(
  {
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    reviewed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    revision_requested: "bg-violet-50 text-violet-700 ring-violet-200",
  },
  { pending: "Awaiting review" },
);

export const FeedbackTypeBadge = make({
  general: NEUTRAL,
  positive: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  negative: "bg-rose-50 text-rose-700 ring-rose-200",
});