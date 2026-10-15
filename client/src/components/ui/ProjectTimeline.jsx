import { Check } from "lucide-react";

// steps: [{ key, label, state: "done" | "current" | "upcoming" }]
const ProjectTimeline = ({ steps, percent, rejected = false }) => (
  <div>
    {percent != null && (
      <div
        className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Project progress"
      >
        <div
          className={`h-full rounded-full transition-all ${rejected ? "bg-rose-400" : "bg-blue-600"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    )}
    <ol className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {steps.map((step, i) => (
        <li
          key={step.key}
          className="flex items-center gap-2.5"
          aria-current={step.state === "current" ? "step" : undefined}
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
              step.state === "done"
                ? "border-blue-600 bg-blue-600 text-white"
                : step.state === "current"
                  ? "border-blue-600 bg-blue-50 text-blue-600 ring-4 ring-blue-100"
                  : "border-slate-200 bg-white text-slate-400"
            }`}
          >
            {step.state === "done" ? <Check size={14} aria-hidden="true" /> : i + 1}
          </span>
          <span
            className={`text-xs font-semibold leading-4 ${
              step.state === "upcoming" ? "text-slate-400" : "text-slate-700"
            }`}
          >
            {step.label}
            <span className="sr-only">
              {step.state === "done" ? " (completed)" : step.state === "current" ? " (current step)" : ""}
            </span>
          </span>
        </li>
      ))}
    </ol>
  </div>
);

export default ProjectTimeline;