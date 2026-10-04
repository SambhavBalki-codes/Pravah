import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  ArrowDownToLine,
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  FileText,
  FolderKanban,
  Inbox,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import { getTeacherDashboard } from "../../store/slices/teacherSlice";
import { axiosInstance } from "../../lib/axios";

const formatDate = (date) => new Date(date).toLocaleDateString(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const formatStatus = (status) => status.replace("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const statusClass = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  in_progress: "bg-blue-50 text-blue-700",
  revision_required: "bg-violet-50 text-violet-700",
  completed: "bg-slate-100 text-slate-600",
  rejected: "bg-rose-50 text-rose-700",
};

const chartColors = {
  pending: "#f59e0b",
  approved: "#10b981",
  in_progress: "#3b82f6",
  revision_required: "#8b5cf6",
  completed: "#0f766e",
  rejected: "#ef4444",
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">{label && <p className="mb-1 text-xs text-slate-500">{label}</p>}<p className="text-sm font-semibold text-slate-800">{payload[0].value}</p></div>;
};

const StatCard = ({ label, value, helper, icon, iconClass }) => (
  <div className="group relative min-h-[142px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-400 to-transparent opacity-70" />
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <p className="mt-3 text-3xl font-bold leading-none tracking-tight text-slate-800">{value}</p>
      </div>
      <div className={`rounded-xl p-3 ring-4 ring-white shadow-sm ${iconClass}`}>{icon}</div>
    </div>
    <p className="mt-4 truncate text-xs font-medium text-slate-400">{helper}</p>
  </div>
);

const Panel = ({ title, subtitle, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 border-b border-slate-100 pb-4"><h2 className="text-lg font-semibold text-slate-800">{title}</h2>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div>
    {children}
  </section>
);

const EmptyState = ({ message }) => <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">{message}</div>;

const TeacherDashboard = () => {
  const dispatch = useDispatch();
  const { dashboard, dashboardLoading, dashboardError } = useSelector((state) => state.teacher);

  useEffect(() => { dispatch(getTeacherDashboard()); }, [dispatch]);

  if (dashboardLoading && !dashboard) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" /></div>;
  if (dashboardError && !dashboard) return <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm"><AlertCircle className="mx-auto mb-3 text-red-500" size={32} /><h2 className="font-semibold text-slate-900">Dashboard unavailable</h2><p className="mt-2 text-sm text-slate-500">{dashboardError}</p><button type="button" className="btn-primary mt-5 inline-flex items-center gap-2" onClick={() => dispatch(getTeacherDashboard())}><RefreshCw size={16} /> Try again</button></div>;

  const summary = dashboard?.summary || {};
  const deadlines = dashboard?.upcomingDeadlines || [];
  const projects = dashboard?.projects || [];
  const recentFiles = dashboard?.recentFiles || [];
  const proposals = dashboard?.recentProposals || [];
  const projectStatusData = ["pending", "approved", "in_progress", "revision_required", "completed", "rejected"].map((status) => ({ status, label: formatStatus(status), count: projects.filter((project) => project.status === status).length })).filter((item) => item.count > 0);
  const assignedStudents = summary.assignedStudentCount || 0;
  const maxStudents = summary.maxStudents || 0;
  const capacityData = [{ name: "Assigned", value: assignedStudents }, { name: "Available", value: Math.max(maxStudents - assignedStudents, 0) }];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-8">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)]">
        <div className="min-w-0 space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Academic workspace</p><h1 className="mt-1 text-2xl font-bold text-slate-800">Teacher Dashboard</h1><p className="mt-1 text-sm text-slate-500">Track your students, supervise projects, and stay ahead of important academic work.</p></div><button type="button" onClick={() => dispatch(getTeacherDashboard())} disabled={dashboardLoading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60"><RefreshCw size={16} className={dashboardLoading ? "animate-spin" : ""} /> {dashboardLoading ? "Refreshing" : "Refresh data"}</button></div></header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Students assigned" value={assignedStudents} helper={`${assignedStudents} of ${maxStudents} capacity`} icon={<UsersRound size={20} strokeWidth={2.2} />} iconClass="bg-blue-50 text-blue-600" />
        <StatCard label="Requests to review" value={summary.pendingRequestCount || 0} helper="Awaiting action" icon={<Inbox size={20} strokeWidth={2.2} />} iconClass="bg-amber-50 text-amber-600" />
        <StatCard label="Active projects" value={summary.activeProjectCount || 0} helper="In progress" icon={<FolderKanban size={20} strokeWidth={2.2} />} iconClass="bg-emerald-50 text-emerald-600" />
        <StatCard label="Projects needing review" value={summary.projectsRequiringReview || 0} helper="Needs attention" icon={<ClipboardCheck size={20} strokeWidth={2.2} />} iconClass="bg-violet-50 text-violet-600" />
        <StatCard label="Upcoming deadlines" value={deadlines.length} helper="Dates ahead" icon={<CalendarClock size={20} strokeWidth={2.2} />} iconClass="bg-rose-50 text-rose-600" />
      </div>

          <Panel title="Supervised projects" subtitle="Your latest assigned projects and their current status.">{projects.length ? <div className="divide-y divide-slate-100">{projects.map((project) => <div key={project._id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><div className="min-w-0"><p className="truncate font-semibold text-slate-800">{project.title}</p><p className="mt-1 text-xs text-slate-500">{project.student?.name || "Student"} · Updated {formatDate(project.updatedAt)}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[project.status] || "bg-slate-100 text-slate-600"}`}>{formatStatus(project.status)}</span></div>)}</div> : <EmptyState message="No supervised projects yet." />}</Panel>
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Recently uploaded files" subtitle="Latest files submitted by your students.">{recentFiles.length ? <div className="space-y-3">{recentFiles.map((file) => <div key={`${file.projectId}-${file._id}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"><div className="flex min-w-0 items-center gap-3"><div className="rounded-lg bg-blue-50 p-2 text-blue-600"><FileText size={17} /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-700">{file.originalName}</p><p className="truncate text-xs text-slate-500">{file.student?.name || "Student"} · {file.projectTitle} · {formatDate(file.uploadedAt)}</p></div></div><a href={`${axiosInstance.defaults.baseURL}/teacher/projects/${file.projectId}/files/${file._id}`} className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600" aria-label={`Download ${file.originalName}`}><ArrowDownToLine size={17} /></a></div>)}</div> : <EmptyState message="No files have been uploaded yet." />}</Panel>
            <Panel title="Recently submitted proposals" subtitle="Latest project submissions from your students.">{proposals.length ? <div className="space-y-3">{proposals.map((project) => <div key={project._id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3"><div className="rounded-lg bg-violet-50 p-2 text-violet-600"><BookOpen size={17} /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-700">{project.title}</p><p className="mt-1 truncate text-xs text-slate-500">{project.student?.name || "Student"} · Submitted {formatDate(project.createdAt)}</p></div><span className={`ml-auto shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${statusClass[project.status] || "bg-slate-100 text-slate-600"}`}>{formatStatus(project.status)}</span></div>)}</div> : <EmptyState message="No submitted proposals yet." />}</Panel>
          </div>
        </div>
        <div className="space-y-6">
          <Panel title="Upcoming deadlines" subtitle="Important dates for your assigned projects.">{deadlines.length ? <div className="space-y-3">{deadlines.map((deadline) => <div key={deadline._id} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3"><div className="rounded-lg bg-amber-100 p-2 text-amber-700"><Clock3 size={16} /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-700">{deadline.name}</p><p className="mt-1 text-xs text-slate-500">{deadline.project?.title || "Global deadline"} · {formatDate(deadline.dueDate)}</p></div></div>)}</div> : <EmptyState message="No upcoming deadlines." />}</Panel>
          <Panel title="Project status distribution" subtitle="Your supervised projects.">{projectStatusData.length ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={projectStatusData} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}><XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} interval={0} angle={-25} textAnchor="end" height={62} /><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} /><Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} /><Bar dataKey="count" name="Projects" radius={[6, 6, 0, 0]}>{projectStatusData.map((item) => <Cell key={item.status} fill={chartColors[item.status]} />)}</Bar></BarChart></ResponsiveContainer></div> : <EmptyState message="No project status data yet." />}</Panel>
          <Panel title="Student capacity" subtitle="Assigned versus maximum capacity.">{maxStudents > 0 ? <div className="flex min-h-64 flex-col items-center justify-center gap-4"><div className="h-44 w-44"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={capacityData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={76} paddingAngle={3} startAngle={90} endAngle={-270}><Cell fill="#3b82f6" /><Cell fill="#e2e8f0" /></Pie><Tooltip content={<ChartTooltip />} /></PieChart></ResponsiveContainer></div><div className="space-y-2 text-center"><div><p className="text-2xl font-bold text-slate-800">{assignedStudents}/{maxStudents}</p><p className="text-xs text-slate-500">students assigned</p></div><div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-slate-500"><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-500" />Assigned: {assignedStudents}</span><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-slate-200" />Available: {Math.max(maxStudents - assignedStudents, 0)}</span></div></div></div> : <EmptyState message="Capacity information is not available." />}</Panel>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
