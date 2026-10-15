import { RotateCcw } from "lucide-react";

const FilterPanel = ({ children, activeCount = 0, onReset, className = "" }) => (
  <section
    aria-label="Filters"
    className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
  >
    <div className="flex flex-wrap items-end gap-3">{children}</div>
    {activeCount > 0 && onReset && (
      <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
        {activeCount} filter{activeCount === 1 ? "" : "s"} applied
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
        >
          <RotateCcw size={12} aria-hidden="true" /> Reset
        </button>
      </div>
    )}
  </section>
);

export default FilterPanel;