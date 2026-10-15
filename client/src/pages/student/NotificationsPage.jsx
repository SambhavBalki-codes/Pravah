import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../store/slices/notificationSlice";
import {
  NOTIFICATION_TYPES,
  resolveNotificationLink,
  timeAgo,
  typeMeta,
} from "../../lib/notifications";
import { formatDateTime } from "../../lib/format";

const STATUS_FILTERS = [
  ["all", "All"],
  ["unread", "Unread"],
  ["read", "Read"],
];

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, pagination, summary, loading, error } = useSelector((state) => state.notification);

  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    dispatch(fetchNotifications({ page, type, status }));
  }, [dispatch, page, type, status]);

  const reload = () => dispatch(fetchNotifications({ page, type, status }));

  const changeStatus = (value) => {
    setStatus(value);
    setPage(1);
  };

  const changeType = (value) => {
    setType(value);
    setPage(1);
  };

  const openNotification = (n) => {
    if (!n.isRead) dispatch(markNotificationRead(n._id));
    const to = resolveNotificationLink(n.link);
    if (to) navigate(to);
  };

  const remove = async (n) => {
    setDeletingId(n._id);
    try {
      await dispatch(deleteNotification(n._id)).unwrap();
      if (list.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch {
      // the thunk already shows the error toast
    } finally {
      setDeletingId(null);
    }
  };

  const cards = [
    ["Total", summary.total],
    ["Unread", summary.unread],
    ["High priority", summary.highPriority],
    ["This week", summary.thisWeek],
  ];

  return (
    <div className="mx-auto max-w-[900px] space-y-5 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-5 rounded-3xl border border-slate-200 bg-gradient-to-r from-blue-50 via-white to-indigo-50 px-6 py-6 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Updates</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-800">Notifications</h1>
          <p className="mt-2 text-sm text-slate-500">
            Click a notification to open the related page.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={reload}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => dispatch(markAllNotificationsRead())}
            disabled={!summary.unread}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            <CheckCheck size={16} /> Mark all read
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{value ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => changeStatus(value)}
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                status === value
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={type}
          onChange={(e) => changeType(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300"
        >
          <option value="all">All types</option>
          {Object.entries(NOTIFICATION_TYPES).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button onClick={reload} className="font-semibold underline">Retry</button>
        </div>
      )}

      {loading && !list.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
          Loading notifications...
        </div>
      ) : !list.length ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-14 text-center shadow-sm">
          <Bell className="mx-auto mb-3 text-slate-300" size={38} />
          <p className="font-semibold text-slate-700">
            {status === "all" && type === "all" ? "No notifications yet" : "Nothing matches these filters"}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {status === "all" && type === "all"
              ? "Updates about your project will appear here."
              : "Try a different filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((n) => {
            const meta = typeMeta(n.type);
            const Icon = meta.icon;
            const hasLink = Boolean(resolveNotificationLink(n.link));
            return (
              <div
                key={n._id}
                className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                  n.isRead ? "border-slate-200 bg-white" : "border-blue-200 bg-blue-50/40"
                }`}
              >
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.tone}`}>
                  <Icon size={17} />
                </div>

                <button
                  type="button"
                  onClick={() => openNotification(n)}
                  className={`min-w-0 flex-1 text-left ${hasLink ? "cursor-pointer" : "cursor-default"}`}
                >
                  <p
                    className={`whitespace-pre-wrap break-words text-sm leading-6 ${
                      n.isRead ? "text-slate-600" : "font-semibold text-slate-800"
                    }`}
                  >
                    {n.message}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                      {meta.label}
                    </span>
                    {n.priority === "high" && (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 font-bold text-rose-700 ring-1 ring-inset ring-rose-200">
                        High priority
                      </span>
                    )}
                    <span title={formatDateTime(n.createdAt)}>{timeAgo(n.createdAt)}</span>
                    {hasLink && <span className="font-semibold text-blue-600">Open</span>}
                  </div>
                </button>

                <div className="flex shrink-0 items-center gap-1">
                  {!n.isRead && (
                    <>
                      <span className="mr-1 h-2.5 w-2.5 rounded-full bg-blue-600" title="Unread" />
                      <button
                        type="button"
                        onClick={() => dispatch(markNotificationRead(n._id))}
                        title="Mark as read"
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                      >
                        <CheckCheck size={16} />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(n)}
                    disabled={deletingId === n._id}
                    title="Delete"
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                  >
                    {deletingId === n._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPreviousPage || loading}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.hasNextPage || loading}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;