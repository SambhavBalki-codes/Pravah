import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  FileText,
  Inbox,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { fetchDashboardStats } from "../../store/slices/studentSlice";
import { fileExt, formatDate, formatDateTime, formatSize } from "../../lib/format";
import { FeedbackTypeBadge, ReviewBadge, StatusBadge } from "../../components/shared/Badges";

const Card = ({ title, action, children }) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

const LinkAction = ({ to, children }) => (
  <Link to={to} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
    {children} <ArrowRight size={13} />
  </Link>
);

const Stat = ({ label, children }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
    <div className="mt-1.5 text-sm font-semibold text-slate-800">{children}</div>
  </div>
);

const Empty = ({ icon, text }) => {
  const Icon = icon;
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-slate-400">
      <Icon size={26} className="text-slate-300" />
      {text}
    </div>
  );
};

const daysLeft = (date) => {
  const days = Math.ceil((new Date(date) - new Date()) / 86400000);
  if (days <= 0) return "Due today";
  return days === 1 ? "1 day left" : `${days} days left`;
};

// Old notifications may point to /student/feedback/:id, which has no route
const notificationLink = (link) => (link?.startsWith("/student/feedback") ? "/student/feedback" : link);

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const { authUser } = useSelector((state) => state.auth);
  const { dashboardStats, loading, error } = useSelector((state) => state.student);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  const data = dashboardStats?.progress ? dashboardStats : null;
  const reload = () => dispatch(fetchDashboardStats());

  if (!data) {
    return error && !loading ? (
      <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
        {error}
        <button onClick={reload} className="font-semibold underline">Retry</button>
      </div>
    ) : (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
        Loading your dashboard...
      </div>
    );
  }

  const { project, progress, files, feedback, revision, notifications, upcomingDeadlines, topNotifications } = data;
  const currentStep = progress.steps.find((s) => s.state === "current");

  return (
    <div className="mx-auto max-w-[1280px] space-y-5 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-5 rounded-3xl border border-slate-200 bg-gradient-to-r from-blue-50 via-white to-indigo-50 px-6 py-6 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Student workspace</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-800">
            Welcome back{authUser?.name ? `, ${authUser.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {project
              ? currentStep
                ? `Next step: ${currentStep.label}`
                : progress.rejected
                  ? "Your proposal was not approved."
                  : "Your project is complete."
              : "Submit a proposal to get started."}
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Project status">
          {project ? <StatusBadge value={project.status} /> : "No project"}
        </Stat>
        <Stat label="Supervisor">{project?.supervisor?.name || "Not assigned"}</Stat>
        <Stat label="Submitted">{project ? formatDate(project.createdAt) : "—"}</Stat>
        <Stat label="Unread feedback">{feedback.unread}</Stat>
      </div>

      {revision.pending && (
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <div className="flex min-w-0 gap-3">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-violet-600" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-violet-800">Revision required</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{revision.feedback.title}</p>
              <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-slate-600">{revision.feedback.message}</p>
            </div>
          </div>
          <Link
            to="/student/upload-files"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-violet-700"
          >
            Upload revised files <ArrowRight size={15} />
          </Link>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card title="Current project">
            {!project ? (
              <div className="py-4 text-center">
                <p className="text-sm text-slate-500">You have not submitted a proposal yet.</p>
                <Link
                  to="/student/submit-proposal"
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                >
                  Submit proposal <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-800">{project.title}</h3>
                  <StatusBadge value={project.status} />
                </div>
                <p className="line-clamp-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{project.description}</p>
                {project.status === "rejected" && (
                  <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
                    <strong>Rejection reason:</strong> {project.rejectionReason || "No reason was given."}
                    <div className="mt-2">
                      <LinkAction to="/student/submit-proposal">Submit a new proposal</LinkAction>
                    </div>
                  </div>
                )}
                {project.status !== "rejected" && !project.supervisor && (
                  <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">
                    You do not have a supervisor yet.
                    <div className="mt-2">
                      <LinkAction to="/student/supervisor">Request a supervisor</LinkAction>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card title={`Progress · ${progress.percent}%`}>
            <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${progress.rejected ? "bg-rose-400" : "bg-blue-600"}`}
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <ol className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {progress.steps.map((step, i) => (
                <li key={step.key} className="flex items-center gap-2.5">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                      step.state === "done"
                        ? "border-blue-600 bg-blue-600 text-white"
                        : step.state === "current"
                          ? "border-blue-600 bg-blue-50 text-blue-600 ring-4 ring-blue-100"
                          : "border-slate-200 bg-white text-slate-400"
                    }`}
                  >
                    {step.state === "done" ? <Check size={14} /> : i + 1}
                  </span>
                  <span
                    className={`text-xs font-semibold leading-4 ${
                      step.state === "upcoming" ? "text-slate-400" : "text-slate-700"
                    }`}
                  >
                    {step.label}
                  </span>
                </li>
              ))}
            </ol>
          </Card>

          <Card title="Latest feedback" action={<LinkAction to="/student/feedback">View all</LinkAction>}>
            {!feedback.latest.length ? (
              <Empty icon={MessageSquare} text="No feedback yet. Your supervisor's comments will appear here." />
            ) : (
              <div className="space-y-3">
                {feedback.latest.map((fb) => (
                  <div
                    key={fb._id}
                    className={`rounded-2xl border p-4 ${fb.isRead ? "border-slate-100 bg-slate-50/80" : "border-blue-200 bg-blue-50/40"}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-800">{fb.title}</p>
                      <div className="flex items-center gap-2">
                        <FeedbackTypeBadge value={fb.type} />
                        {fb.requiresRevision && (
                          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 ring-1 ring-inset ring-violet-200">
                            Revision required
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm text-slate-600">{fb.message}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      {fb.teacher?.name || "Supervisor"} · {formatDateTime(fb.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title={`Uploaded files (${files.total})`} action={<LinkAction to="/student/upload-files">Manage files</LinkAction>}>
            {!files.recent.length ? (
              <Empty icon={FileText} text="No files uploaded yet." />
            ) : (
              <div className="divide-y divide-slate-100">
                {files.recent.map((file) => (
                  <div key={file._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-700">{file.name}</p>
                      <p className="text-xs text-slate-400">
                        {fileExt(file.name)} · {formatSize(file.fileSize)} · {formatDateTime(file.uploadedAt)}
                      </p>
                    </div>
                    <ReviewBadge value={file.reviewStatus} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Upcoming deadlines">
            {!upcomingDeadlines.length ? (
              <Empty icon={CalendarDays} text="No upcoming deadlines." />
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((d) => (
                  <div key={d._id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                    <p className="truncate text-sm font-bold text-slate-800">{d.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(d.dueDate)}</p>
                    <p className="mt-1 text-xs font-semibold text-blue-600">{daysLeft(d.dueDate)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card
            title={`Notifications${notifications.unread ? ` · ${notifications.unread} new` : ""}`}
            action={<LinkAction to="/student/notifications">View all</LinkAction>}
          >
            {!topNotifications.length ? (
              <Empty icon={Bell} text="You're all caught up." />
            ) : (
              <div className="space-y-2">
                {topNotifications.map((n) => {
                  const body = (
                    <>
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? "bg-slate-300" : "bg-blue-600"}`}
                      />
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm text-slate-700">{n.message}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
                      </div>
                    </>
                  );
                  const to = notificationLink(n.link);
                  return to ? (
                    <Link key={n._id} to={to} className="flex gap-2.5 rounded-xl p-2 transition hover:bg-slate-50">
                      {body}
                    </Link>
                  ) : (
                    <div key={n._id} className="flex gap-2.5 rounded-xl p-2">{body}</div>
                  );
                })}
              </div>
            )}
          </Card>

          {files.total === 0 && project && !progress.rejected && (
            <div className="flex items-start gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
              <Inbox size={18} className="mt-0.5 shrink-0 text-slate-300" />
              Upload your first project file so your supervisor can start reviewing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;