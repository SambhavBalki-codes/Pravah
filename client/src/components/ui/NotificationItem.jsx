import { CheckCheck, Loader2, Trash2 } from "lucide-react";
import { formatDateTime } from "../../lib/format";
import { resolveNotificationLink, timeAgo, typeMeta } from "../../lib/notifications";

const NotificationItem = ({ notification: n, onOpen, onMarkRead, onDelete, deleting = false }) => {
  const meta = typeMeta(n.type);
  const Icon = meta.icon;
  const hasLink = Boolean(resolveNotificationLink(n.link));

  return (
    <li
      className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
        n.isRead ? "border-slate-200 bg-white" : "border-blue-200 bg-blue-50/40"
      }`}
    >
      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.tone}`}>
        <Icon size={17} aria-hidden="true" />
      </div>

      <button
        type="button"
        onClick={() => onOpen?.(n)}
        className={`min-w-0 flex-1 text-left ${hasLink ? "cursor-pointer" : "cursor-default"}`}
      >
        <p
          className={`whitespace-pre-wrap break-words text-sm leading-6 ${
            n.isRead ? "text-slate-600" : "font-semibold text-slate-800"
          }`}
        >
          {n.message}
        </p>
        <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
            {meta.label}
          </span>
          {n.priority === "high" && (
            <span className="rounded-full bg-rose-50 px-2 py-0.5 font-bold text-rose-700 ring-1 ring-inset ring-rose-200">
              High priority
            </span>
          )}
          <time dateTime={n.createdAt} title={formatDateTime(n.createdAt)}>
            {timeAgo(n.createdAt)}
          </time>
          {hasLink && <span className="font-semibold text-blue-600">Open</span>}
          {!n.isRead && <span className="sr-only">Unread</span>}
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        {!n.isRead && (
          <>
            <span className="mr-1 h-2.5 w-2.5 rounded-full bg-blue-600" aria-hidden="true" />
            <button
              type="button"
              onClick={() => onMarkRead?.(n)}
              aria-label="Mark as read"
              title="Mark as read"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
            >
              <CheckCheck size={16} aria-hidden="true" />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => onDelete?.(n)}
          disabled={deleting}
          aria-label="Delete notification"
          title="Delete"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
        >
          {deleting ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 size={16} aria-hidden="true" />
          )}
        </button>
      </div>
    </li>
  );
};

export default NotificationItem;