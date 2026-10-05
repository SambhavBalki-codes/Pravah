import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AlertTriangle, CheckCheck, MessageSquare, RefreshCw } from "lucide-react";
import {
  fetchFeedbackHistory,
  markAllFeedbackRead,
  markFeedbackRead,
} from "../../store/slices/studentSlice";
import { studentReply } from "../../lib/feedbackReplies";
import { formatDateTime } from "../../lib/format";
import { FeedbackTypeBadge } from "../../components/shared/Badges";
import ReplyThread from "../../components/shared/ReplyThread";

const FILTERS = [
  ["all", "All"],
  ["unread", "Unread"],
  ["revision", "Needs revision"],
];

const FeedbackPage = () => {
  const dispatch = useDispatch();
  const { authUser } = useSelector((state) => state.auth);
  const { feedbackHistory, feedbackSummary, feedbackLoading, feedbackError } = useSelector(
    (state) => state.student,
  );
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchFeedbackHistory());
  }, [dispatch]);

  const visible = useMemo(
    () =>
      feedbackHistory.filter((f) =>
        filter === "unread" ? !f.isRead : filter === "revision" ? f.requiresRevision : true,
      ),
    [feedbackHistory, filter],
  );

  const cards = [
    ["Total", feedbackSummary.total],
    ["Unread", feedbackSummary.unread],
    ["Needs revision", feedbackSummary.revisionRequired],
  ];

  return (
    <div className="mx-auto max-w-[900px] space-y-5 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-5 rounded-3xl border border-slate-200 bg-gradient-to-r from-blue-50 via-white to-indigo-50 px-6 py-6 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Supervisor</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-800">Feedback</h1>
          <p className="mt-2 text-sm text-slate-500">
            Your complete feedback history, newest first. Reply if something needs clarification.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => dispatch(fetchFeedbackHistory())}
            disabled={feedbackLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60"
          >
            <RefreshCw size={16} className={feedbackLoading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => dispatch(markAllFeedbackRead())}
            disabled={!feedbackSummary.unread}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            <CheckCheck size={16} /> Mark all read
          </button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{value ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
              filter === value
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {feedbackError && (
        <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {feedbackError}
          <button onClick={() => dispatch(fetchFeedbackHistory())} className="font-semibold underline">Retry</button>
        </div>
      )}

      {feedbackLoading && !feedbackHistory.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">Loading feedback...</div>
      ) : !visible.length ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-14 text-center shadow-sm">
          <MessageSquare className="mx-auto mb-3 text-slate-300" size={38} />
          <p className="font-semibold text-slate-700">
            {feedbackHistory.length ? "Nothing matches this filter" : "No feedback yet"}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {feedbackHistory.length ? "Try another filter." : "Your supervisor's comments will appear here."}
          </p>
        </div>
      ) : (
        <div className="relative space-y-4 border-l-2 border-slate-200 pl-6">
          {visible.map((fb) => (
            <article
              key={fb._id}
              className={`relative rounded-3xl border bg-white p-5 shadow-sm ${
                fb.isRead ? "border-slate-200" : "border-blue-300 ring-1 ring-blue-100"
              }`}
            >
              <span
                className={`absolute -left-[31px] top-6 h-3 w-3 rounded-full border-2 border-white ${
                  fb.isRead ? "bg-slate-300" : "bg-blue-600"
                }`}
              />
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-bold text-slate-800">{fb.title}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {fb.teacher?.name || "Supervisor"} · {formatDateTime(fb.createdAt)} · {fb.projectTitle}
                  </p>
                  {fb.fileName && <p className="mt-0.5 text-xs text-slate-400">About file: {fb.fileName}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <FeedbackTypeBadge value={fb.type} />
                  {fb.requiresRevision && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 ring-1 ring-inset ring-violet-200">
                      <AlertTriangle size={12} /> Revision required
                    </span>
                  )}
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{fb.message}</p>
              {!fb.isRead && (
                <button
                  type="button"
                  onClick={() => dispatch(markFeedbackRead(fb._id))}
                  className="mt-3 text-sm font-bold text-blue-600 hover:underline"
                >
                  Mark as read
                </button>
              )}

              <ReplyThread
                replies={fb.replies}
                viewer="Student"
                teacherName={fb.teacher?.name || "Supervisor"}
                studentName={authUser?.name || "You"}
                onSend={(message) => studentReply(fb._id, message)}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;