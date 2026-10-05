import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowRight, Inbox, MessageSquare, RefreshCw, Search } from "lucide-react";
import { addTeacherFeedback, fetchAssignedStudents } from "../../store/slices/teacherSlice";
import { formatDate } from "../../lib/format";
import { ProgressBadge, StatusBadge } from "../../components/shared/Badges";
import FeedbackModal from "../../components/modal/FeedbackModal";

const Field = ({ label, children }) => (
  <div className="min-w-0">
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
    <div className="mt-1 text-sm text-slate-600">{children}</div>
  </div>
);

const AssignedStudents = () => {
  const dispatch = useDispatch();
  const { students, studentsLoading, studentsError } = useSelector((state) => state.teacher);
  const [search, setSearch] = useState("");
  const [progress, setProgress] = useState("all");
  const [target, setTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchAssignedStudents());
  }, [dispatch]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((row) => {
      const matchesSearch =
        !q ||
        row.student.name?.toLowerCase().includes(q) ||
        row.student.email?.toLowerCase().includes(q) ||
        row.project?.title?.toLowerCase().includes(q);
      return matchesSearch && (progress === "all" || row.progressState === progress);
    });
  }, [students, search, progress]);

  const sendFeedback = async (values) => {
    await dispatch(addTeacherFeedback({ projectId: target.project._id, ...values })).unwrap();
    toast.success("Feedback sent");
    setTarget(null);
    dispatch(fetchAssignedStudents());
  };

  return (
    <div className="mx-auto max-w-[1280px] space-y-5 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-5 rounded-3xl border border-slate-200 bg-gradient-to-r from-blue-50 via-white to-indigo-50 px-6 py-6 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Supervision</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-800">Assigned students</h1>
          <p className="mt-2 text-sm text-slate-500">
            {students.length} student{students.length === 1 ? "" : "s"} under your supervision
          </p>
        </div>
        <button
          type="button"
          onClick={() => dispatch(fetchAssignedStudents())}
          disabled={studentsLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60"
        >
          <RefreshCw size={16} className={studentsLoading ? "animate-spin" : ""} /> Refresh
        </button>
      </header>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or project"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <select
          value={progress}
          onChange={(e) => setProgress(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-300"
        >
          <option value="all">All progress states</option>
          <option value="awaiting_approval">Awaiting approval</option>
          <option value="awaiting_files">Awaiting files</option>
          <option value="needs_review">Needs review</option>
          <option value="in_progress">On track</option>
          <option value="revision_required">Revising</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {studentsError && (
        <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {studentsError}
          <button onClick={() => dispatch(fetchAssignedStudents())} className="font-semibold underline">Retry</button>
        </div>
      )}

      {studentsLoading && !students.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">Loading students...</div>
      ) : !filtered.length ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-14 text-center shadow-sm">
          <Inbox className="mx-auto mb-3 text-slate-300" size={38} />
          <p className="font-semibold text-slate-700">
            {students.length ? "No students match your filters" : "No assigned students yet"}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {students.length ? "Try a different search or filter." : "Accepted supervisor requests will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((row) => (
            <article key={row.student._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-800">{row.student.name}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {row.student.email} · {row.student.department || "No department"}
                  </p>
                </div>
                <ProgressBadge value={row.progressState} />
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Project">
                  {row.project ? (
                    <div className="space-y-1.5">
                      <p className="line-clamp-2 font-medium text-slate-700">{row.project.title}</p>
                      <StatusBadge value={row.project.status} />
                    </div>
                  ) : (
                    "No project yet"
                  )}
                </Field>
                <Field label="Last upload">
                  {row.lastUpload ? (
                    <>
                      <p className="truncate">{row.lastUpload.name}</p>
                      <p className="text-xs text-slate-400">{formatDate(row.lastUpload.uploadedAt)}</p>
                    </>
                  ) : (
                    "—"
                  )}
                </Field>
                <Field label="Last feedback">{formatDate(row.lastFeedbackAt)}</Field>
                <Field label="Next deadline">
                  {row.nextDeadline ? (
                    <>
                      <p className="truncate">{row.nextDeadline.name}</p>
                      <p className="text-xs text-slate-400">{formatDate(row.nextDeadline.dueDate)}</p>
                    </>
                  ) : (
                    "—"
                  )}
                </Field>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500">
                  {row.fileCount} file{row.fileCount === 1 ? "" : "s"} · {row.pendingReviewCount} awaiting review
                </p>
                <div className="flex gap-2">
                  {row.project && (
                    <button
                      type="button"
                      onClick={() => setTarget(row)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                    >
                      <MessageSquare size={15} /> Feedback
                    </button>
                  )}
                  <Link
                    to={`/teacher/assigned-students/${row.student._id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    View details <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {target && (
        <FeedbackModal
          heading="Give feedback"
          subheading={`${target.student.name} — ${target.project.title}`}
          onClose={() => setTarget(null)}
          onSubmit={sendFeedback}
        />
      )}
    </div>
  );
};

export default AssignedStudents;