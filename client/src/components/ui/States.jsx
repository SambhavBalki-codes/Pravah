import { Link } from "react-router-dom";
import { AlertTriangle, Inbox, Loader2, Lock, RefreshCw, ServerCrash, WifiOff } from "lucide-react";
import Button from "./Button";

export const LoadingState = ({ label = "Loading..." }) => (
  <div
    role="status"
    className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-12 text-sm text-slate-500 shadow-sm"
  >
    <Loader2 size={18} className="animate-spin" aria-hidden="true" />
    {label}
  </div>
);

export const EmptyState = ({ icon: Icon = Inbox, title, description, action }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-14 text-center shadow-sm">
    <Icon className="mx-auto mb-3 text-slate-300" size={38} aria-hidden="true" />
    <p className="font-semibold text-slate-700">{title}</p>
    {description && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

const VARIANTS = {
  401: { icon: Lock, title: "Your session has expired", text: "Please sign in again to continue." },
  403: { icon: Lock, title: "You do not have access", text: "Your account is not allowed to view this page." },
  404: { icon: AlertTriangle, title: "Not found", text: "We could not find what you were looking for." },
  500: { icon: ServerCrash, title: "Something went wrong", text: "The server had a problem. Please try again in a moment." },
  network: { icon: WifiOff, title: "Cannot reach the server", text: "Check your connection and try again." },
  default: { icon: AlertTriangle, title: "Could not load this page", text: "Something went wrong. Please try again." },
};

// error can be a string or { status, message }. status can also be passed directly.
export const ErrorState = ({ error, status, onRetry, compact = false }) => {
  const code = status ?? error?.status;
  const message = typeof error === "string" ? error : error?.message;
  const key =
    code === 401 || code === 403 || code === 404
      ? code
      : code >= 500
        ? 500
        : code === 0
          ? "network"
          : "default";
  const { icon: Icon, title, text } = VARIANTS[key];

  return (
    <div
      role="alert"
      className={`rounded-3xl border border-red-100 bg-white text-center shadow-sm ${compact ? "p-6" : "p-12"}`}
    >
      <Icon className="mx-auto mb-3 text-red-400" size={compact ? 28 : 36} aria-hidden="true" />
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{message || text}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {key === 401 && (
          <Link
            to="/login"
            className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Sign in
          </Link>
        )}
        {key !== 403 && key !== 404 && onRetry && (
          <Button variant={key === 401 ? "outline" : "primary"} icon={RefreshCw} onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    </div>
  );
};