import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { CheckCircle2, Download, Eye, FileText, Loader2, MessageSquare, RefreshCw, RotateCcw, Search } from "lucide-react";
import {
  addTeacherFeedback,
  fetchTeacherFiles,
  reviewTeacherFile,
} from "../../store/slices/teacherSlice";
import { openTeacherFile } from "../../lib/fileActions";
import { fileExt, formatDateTime, formatSize } from "../../lib/format";
import { ReviewBadge } from "../../components/shared/Badges";
import FeedbackModal from "../../components/modal/FeedbackModal";

const FILTERS = [
  ["all", "All"],
  ["pending", "Awaiting review"],
  ["reviewed", "Reviewed"],
  ["revision_requested", "Revision requested"],
];

const actionBtn =
  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition disabled:opacity-50";

const TeacherFiles = () => {
  const dispatch = useDispatch();
  const { files, filesSummary, filesLoading, filesError } = useSelector((state) => state.teacher);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [modal, setModal] = useState(null); // { mode: "feedback" | "revision", file }

  useEffect(() => {
    dispatch(fetchTeacherFiles());
  }, [dispatch]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return files.filter((f) => {
      const matchesFilter = filter === "all" || f.reviewStatus === filter;
      const matchesSearch =
        !q ||
        f.name?.toLowerCase().includes(q) ||
        f.projectTitle?.toLowerCase().includes(q) ||
        f.student?.name?.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [files, filter, search]);

  const openFile = async (file, mode) => {
    try {
      await openTeacherFile({ projectId: file.projectId, fileId: file._id, name: file.name, mode });
    } catch {
      toast.error("Could not open the file. It may be missing on the server.");
    }
  };

  const markReviewed = async (file) => {
    setBusyId(file._id);
    try {
      await dispatch(
        reviewTeacherFile({ projectId: file.projectId, fileId: file._id, action: "reviewed" }),
      ).unwrap();
      toast.success("Marked as reviewed");
      dispatch(fetchTeacherFiles());
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Could not update file");
    } finally {
      setBusyId(null);
    }
  };

  const submitModal = async (values) => {
    const { mode, file } = modal;
    if (mode === "revision") {
      await dispatch(
        reviewTeacherFile({
          projectId: file.projectId,
          fileId: file._id,
          action: "revision_requested",
          message: values.message,
        }),
      ).unwrap();
      toast.success("Revision requested");
    } else {
      await dispatch(
        addTeacherFeedback({ projectId: file.projectId, ...values, fileId: file._id }),
      ).unwrap();
      toast.success("Feedback sent");
    }
    setModal(null);
    dispatch(fetchTeacherFiles());
  };

  const cards = [
    ["Total files", filesSummary.total],
    ["Awaiting review", filesSummary.pending],
    ["Reviewed", filesSummary.reviewed],
    ["Revision requested", filesSummary.revisionRequested],
  ];

  return (
    <div className="mx-auto max-w-[1280px] space-y-5 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-5 rounded-3xl border border-slate-200 bg-gradient-to-r from-blue-50 via-white to-indigo-50 px-6 py-6 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Review</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-800">Student files</h1>
          <p className="mt-2 text-sm text-slate-500">View, review and respond to submitted work.</p>
        </div>
        <button
          type="button"
          onClick={() => dispatch(fetchTeacherFiles())}
          disabled={filesLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60"
        >
          <RefreshCw size={16} className={filesLoading ? "animate-spin" : ""} /> Refresh
        </button>
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
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search file, student or project"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {filesError && (
        <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {filesError}
          <button onClick={() => dispatch(fetchTeacherFiles())} className="font-semibold underline">Retry</button>
        </div>
      )}

      {filesLoading && !files.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">Loading files...</div>
      ) : !visible.length ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-14 text-center shadow-sm">
          <FileText className="mx-auto mb-3 text-slate-300" size={38} />
          <p className="font-semibold text-slate-700">
            {files.length ? "No files match your filters" : "No files uploaded yet"}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {files.length ? "Try a different filter." : "Files from your students will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((file) => (
            <article key={`${file.projectId}-${file._id}`} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-800">{file.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {file.student?.name || "Student"} · {file.projectTitle}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {fileExt(file.name)} · {formatSize(file.fileSize)} · Uploaded {formatDateTime(file.uploadedAt)}
                  </p>
                </div>
                <ReviewBadge value={file.reviewStatus} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <button onClick={() => openFile(file, "view")} className={`${actionBtn} border border-slate-200 text-slate-600 hover:bg-slate-50`}>
                  <Eye size={15} /> View
                </button>
                <button onClick={() => openFile(file, "download")} className={`${actionBtn} border border-slate-200 text-slate-600 hover:bg-slate-50`}>
                  <Download size={15} /> Download
                </button>
                <button onClick={() => setModal({ mode: "feedback", file })} className={`${actionBtn} border border-slate-200 text-slate-600 hover:bg-slate-50`}>
                  <MessageSquare size={15} /> Feedback
                </button>
                <button
                  disabled={busyId === file._id || file.reviewStatus === "reviewed"}
                  onClick={() => markReviewed(file)}
                  className={`${actionBtn} bg-emerald-600 text-white hover:bg-emerald-700`}
                >
                  {busyId === file._id ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  Mark reviewed
                </button>
                <button
                  onClick={() => setModal({ mode: "revision", file })}
                  className={`${actionBtn} bg-violet-600 text-white hover:bg-violet-700`}
                >
                  <RotateCcw size={15} /> Request revision
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {modal && (
        <FeedbackModal
          mode={modal.mode}
          heading={modal.mode === "revision" ? "Request revision" : "Feedback on file"}
          subheading={`${modal.file.name} — ${modal.file.student?.name || ""}`}
          onClose={() => setModal(null)}
          onSubmit={submitModal}
        />
      )}
    </div>
  );
};

export default TeacherFiles;