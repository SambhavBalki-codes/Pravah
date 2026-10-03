import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDispatch, useSelector } from "react-redux";
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  RefreshCw,
  Users,
} from "lucide-react";
import { getDashboardStats } from "../../store/slices/adminSlice";

const statusColors = {
  pending: "#f59e0b",
  approved: "#10b981",
  in_progress: "#3b82f6",
  revision_required: "#8b5cf6",
  rejected: "#ef4444",
  completed: "#0f766e",
};

const formatStatus = (status) =>
  status.replace("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const getDepartmentInitials = (department) =>
  department
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const chartMargins = { top: 8, right: 12, left: -12, bottom: 4 };
const axisStyle = { fontSize: 12, fontWeight: 500, fill: "#475569" };

const CountUp = ({ value }) => {
  const target = Number(value) || 0;
  const [count, setCount] = useState(0);

  useEffect(() => {
    let animationFrame;
    const startTime = performance.now();
    const duration = 750;

    const animate = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easedProgress = 1 - (1 - progress) ** 3;
      setCount(Math.round(target * easedProgress));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [target]);

  return <>{count}</>;
};

const TooltipBox = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-lg">
      {label && <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>}
      {payload.map((item) => (
        <div key={item.dataKey} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-slate-600">{item.name || item.dataKey}</span>
          <span className="ml-auto font-semibold text-slate-900">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

const StatCard = ({ label, value, icon, iconClass, helper }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-center">
      <div className={`rounded-lg p-3 ${iconClass}`}>{icon}</div>
      <div className="ml-4">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <p className="text-lg font-semibold text-slate-800"><CountUp value={value} /></p>
        <p className="mt-0.5 text-xs text-slate-400">{helper}</p>
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, subtitle, children, className = "" }) => (
  <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-50" />
    </div>
    <div className="h-60">{children}</div>
  </section>
);

const EmptyChart = ({ message = "No data available yet" }) => (
  <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
    {message}
  </div>
);

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { dashboard, dashboardLoading, dashboardError } = useSelector(
    (state) => state.admin,
  );

  const summary = dashboard?.summary || {};
  const charts = dashboard?.charts || {};
  const deadlines = dashboard?.upcomingDeadlines || [];
  const departmentData = charts.studentsByDepartment || [];
  const workloadData = charts.supervisorWorkload || [];
  const monthlyData = charts.monthlySubmissions || [];
  const completedPendingData = charts.completedVsPending || [];

  const projectPieData = useMemo(
    () =>
      (charts.projectsByStatus || [])
        .filter((item) => item.count > 0)
        .map((item) => ({ ...item, name: formatStatus(item.status) })),
    [charts.projectsByStatus],
  );

  const totalProjectStatusCount = projectPieData.reduce((total, item) => total + item.count, 0);

  if (dashboardLoading && !dashboard) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (dashboardError && !dashboard) {
    return (
      <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <AlertTriangle className="mx-auto mb-3 text-red-500" size={32} />
        <h2 className="font-semibold text-slate-900">Dashboard unavailable</h2>
        <p className="mt-2 text-sm text-slate-500">{dashboardError}</p>
        <button className="btn-primary mt-5 inline-flex items-center gap-2" onClick={() => dispatch(getDashboardStats())}>
          <RefreshCw size={16} /> Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-8">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">A quick overview of students, projects, supervisors, and deadlines.</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => dispatch(getDashboardStats())}
          disabled={dashboardLoading}
        >
          <RefreshCw size={16} className={dashboardLoading ? "animate-spin" : ""} />
          {dashboardLoading ? "Refreshing" : "Refresh data"}
        </button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Students" value={summary.totalStudents || 0} icon={<GraduationCap size={20} />} iconClass="bg-blue-50 text-blue-600" helper="Registered accounts" />
        <StatCard label="Total Teachers" value={summary.totalTeachers || 0} icon={<Users size={20} />} iconClass="bg-emerald-50 text-emerald-600" helper="Academic supervisors" />
        <StatCard label="Total Projects" value={summary.totalProjects || 0} icon={<BookOpen size={20} />} iconClass="bg-violet-50 text-violet-600" helper="Submitted projects" />
        <StatCard label="Upcoming Deadlines" value={deadlines.length} icon={<Clock3 size={20} />} iconClass="bg-amber-50 text-amber-600" helper="Important dates ahead" />
        <StatCard label="Unassigned Students" value={summary.unassignedStudents || 0} icon={<Users size={20} />} iconClass="bg-blue-50 text-blue-600" helper="Awaiting supervisor" />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Project Overview</h2>
            <p className="mt-1 text-sm text-slate-500">See how projects are progressing through each stage.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {summary.totalProjects || 0} total projects
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Pending", summary.pendingProjects, "bg-amber-400"],
            ["Approved", summary.approvedProjects, "bg-emerald-400"],
            ["Rejected", summary.rejectedProjects, "bg-red-400"],
            ["Completed", summary.completedProjects, "bg-teal-400"],
          ].map(([label, value, color]) => (
            <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 p-3.5 transition-colors hover:bg-slate-100">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <span className={`h-2 w-2 rounded-full ${color}`} /> {label}
              </div>
              <p className="mt-1 text-lg font-semibold text-slate-800"><CountUp value={value || 0} /></p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Project status" subtitle="A quick health check of the project portfolio.">
          {projectPieData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={projectPieData} dataKey="count" nameKey="name" cx="50%" cy="46%" innerRadius={70} outerRadius={104} paddingAngle={4} animationDuration={900} labelLine={false}>
                  {projectPieData.map((entry) => <Cell key={entry.status} fill={statusColors[entry.status]} />)}
                </Pie>
                <text x="50%" y="43%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-900 text-2xl font-bold">{totalProjectStatusCount}</text>
                <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-500 text-xs font-medium">Projects</text>
                <Tooltip content={<TooltipBox />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 500, color: "#475569" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Students by department" subtitle="Where the student population is concentrated.">
          {departmentData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} margin={chartMargins} barCategoryGap="28%">
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="department"
                  tickFormatter={getDepartmentInitials}
                  interval={0}
                  tick={axisStyle}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis allowDecimals={false} tick={axisStyle} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "#f8fafc" }} content={<TooltipBox />} />
                <Bar dataKey="count" name="Students" fill="#2563eb" radius={[7, 7, 0, 0]} barSize={30} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Supervisor workload" subtitle="Assigned students compared with active projects.">
          {workloadData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData} layout="vertical" margin={{ top: 8, right: 12, left: 18, bottom: 4 }} barCategoryGap="25%">
                <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={axisStyle} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={92} tick={axisStyle} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "#f8fafc" }} content={<TooltipBox />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 500, color: "#475569" }} />
                <Bar dataKey="assignedStudents" name="Students" fill="#059669" radius={[0, 6, 6, 0]} barSize={16} animationDuration={800} />
                <Bar dataKey="supervisedProjects" name="Projects" fill="#7c3aed" radius={[0, 6, 6, 0]} barSize={16} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Monthly submissions" subtitle="Submission activity over the last six months.">
          {monthlyData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={chartMargins}>
                <defs><linearGradient id="submissionFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={axisStyle} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={axisStyle} tickLine={false} axisLine={false} />
                <Tooltip content={<TooltipBox />} />
                <Area type="monotone" dataKey="count" name="Submissions" stroke="#1d4ed8" strokeWidth={3.5} fill="url(#submissionFill)" activeDot={{ r: 6, strokeWidth: 3, stroke: "#dbeafe" }} animationDuration={1000} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Project Outcomes</h2>
              <p className="mt-1 text-sm text-slate-500">Compare completed work with projects still pending.</p>
            </div>
            <CheckCircle2 size={19} className="text-emerald-600" />
          </div>
          {completedPendingData.length ? (
            <div className="space-y-5 pt-1">
              {completedPendingData.map((item) => {
                const total = completedPendingData.reduce((sum, entry) => sum + entry.count, 0);
                const percentage = total ? Math.round((item.count / total) * 100) : 0;
                const isCompleted = item.status === "Completed";
                return (
                  <div key={item.status}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium text-slate-700">
                        <span className={`h-2.5 w-2.5 rounded-full ${isCompleted ? "bg-teal-600" : "bg-amber-500"}`} />
                        {item.status}
                      </span>
                      <span className="font-semibold text-slate-800">{item.count} <span className="font-normal text-slate-400">({percentage}%)</span></span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isCompleted ? "bg-teal-600" : "bg-amber-500"}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <EmptyChart message="No project outcomes available yet" />}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
            <div><h2 className="text-lg font-semibold text-slate-800">Upcoming Deadlines</h2><p className="mt-1 text-sm text-slate-500">Keep track of the next important dates.</p></div>
            <Clock3 size={19} className="text-amber-500" />
          </div>
          {deadlines.length ? (
            <div className="space-y-2">
              {deadlines.slice(0, 4).map((deadline) => (
                <div key={deadline._id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3 transition-colors hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{deadline.name}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{deadline.project?.title || "General deadline"}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-slate-700">{new Date(deadline.dueDate).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-blue-600"><ArrowUpRight size={12} /> View</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="py-6 text-center text-sm text-slate-400">No upcoming deadlines.</p>}
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
