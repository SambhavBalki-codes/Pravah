import { ChevronLeft, ChevronRight } from "lucide-react";

const btn =
  "inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

const Pagination = ({ page, totalPages, onChange, total, disabled = false }) => {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 pt-1">
      <button type="button" className={btn} disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={16} aria-hidden="true" /> Previous
      </button>
      <span className="text-sm text-slate-500" aria-live="polite">
        Page {page} of {totalPages}
        {total != null && ` · ${total} total`}
      </span>
      <button
        type="button"
        className={btn}
        disabled={disabled || page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
};

export default Pagination;