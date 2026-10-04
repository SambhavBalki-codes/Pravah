import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Inbox,
  Mail,
  MessageSquare,
  RefreshCw,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import {
  getSupervisorRequests,
  respondToSupervisorRequest,
} from "../../store/slices/requestSlice";

const filters = [
  ["pending", "Pending"],
  ["accepted", "Accepted"],
  ["rejected", "Rejected"],
  ["all", "All"],
];

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const statusStyles = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  accepted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
};

const projectStatusStyles = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  in_progress: "bg-blue-50 text-blue-700",
  revision_required: "bg-violet-50 text-violet-700",
  completed: "bg-slate-100 text-slate-600",
  rejected: "bg-rose-50 text-rose-700",
};

const formatStatus = (status = "pending") =>
  status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const Detail = ({ icon, label, children }) => {
  const IconComponent = icon;

  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <IconComponent size={15} className="mt-0.5 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
        <p className="mt-0.5 truncate text-sm text-slate-600">{children}</p>
      </div>
    </div>
  );
};

const ProjectPreview = ({ request, onClose }) => {
  const project = request.project;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]" role="presentation" onMouseDown={onClose}>
      <section
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="proposal-preview-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-6 py-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Proposed project</p>
            <h2 id="proposal-preview-title" className="mt-1 break-words text-xl font-bold text-slate-800">
              {project?.title || "Project proposal"}
            </h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <UserRound size={15} /> {request.student?.name || "Student"}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close project preview" className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700">
            <X size={19} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${projectStatusStyles[project?.status] || "bg-slate-100 text-slate-600"}`}>
              {formatStatus(project?.status)}
            </span>
            <span className="text-xs text-slate-400">Submitted with this supervisor request</span>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Project description</p>
            <p className="whitespace-pre-wrap rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
              {project?.description || "No project description was provided."}
            </p>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              <MessageSquare size={14} /> Student message
            </p>
            <p className="whitespace-pre-wrap rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm leading-7 text-slate-600">
              {request.message || "No message was included with this request."}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-400">
            <span>Request date: {formatDate(request.createdAt)}</span>
            <button type="button" onClick={onClose} className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700">
              Close preview
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

const PendingRequests = () => {
  const dispatch = useDispatch();
  const { list, loading, error } = useSelector((state) => state.request);
  const [filter, setFilter] = useState("pending");
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [previewRequest, setPreviewRequest] = useState(null);

  useEffect(() => {
    dispatch(getSupervisorRequests(filter));
  }, [dispatch, filter]);

  const counts = useMemo(
    () => ({
      pending: filter === "pending" ? list.length : 0,
      accepted: filter === "accepted" ? list.length : 0,
      rejected: filter === "rejected" ? list.length : 0,
    }),
    [filter, list.length],
  );

  const accept = (requestId) => {
    dispatch(respondToSupervisorRequest({ requestId, decision: "accept" })).then((action) => {
      if (action.meta.requestStatus === "fulfilled") dispatch(getSupervisorRequests(filter));
    });
  };

  const reject = (requestId) => {
    if (rejectionReason.trim().length < 2) return;
    dispatch(respondToSupervisorRequest({
      requestId,
      decision: "reject",
      rejectionReason: rejectionReason.trim(),
    })).then((action) => {
      if (action.meta.requestStatus === "fulfilled") {
        setRejectingId(null);
        setRejectionReason("");
        dispatch(getSupervisorRequests(filter));
      }
    });
  };

  return (
    <div className="mx-auto max-w-[1280px] space-y-5 pb-10">
      <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-5 bg-gradient-to-r from-blue-50 via-white to-indigo-50 px-6 py-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Student connections</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-800">Supervisor requests</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-500">Review each student and their proposed project before you decide.</p>
          </div>
          <button type="button" onClick={() => dispatch(getSupervisorRequests(filter))} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
        <div className="grid grid-cols-2 divide-x border-t border-slate-100 sm:grid-cols-4">
          {filters.map(([value, label]) => (
            <button key={value} type="button" onClick={() => setFilter(value)} className={`px-4 py-3 text-left transition hover:bg-slate-50 ${filter === value ? "bg-blue-50/70" : ""}`}>
              <span className={`block text-xs font-bold uppercase tracking-wide ${filter === value ? "text-blue-700" : "text-slate-400"}`}>{label}</span>
              <span className={`mt-1 block text-lg font-bold ${filter === value ? "text-blue-700" : "text-slate-700"}`}>{value === "all" ? (filter === "all" ? list.length : 0) : counts[value] || 0}</span>
            </button>
          ))}
        </div>
      </header>

      {error && <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {!loading && list.length > 0 && <p className="px-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{list.length} request{list.length === 1 ? "" : "s"} shown</p>}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">Loading requests...</div>
      ) : !list.length ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-14 text-center shadow-sm">
          <Inbox className="mx-auto mb-3 text-slate-300" size={38} />
          <p className="font-semibold text-slate-700">No {filter === "all" ? "" : filter} requests</p>
          <p className="mt-1 text-sm text-slate-400">New student requests will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((request) => (
            <article key={request._id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md">
              <div className="border-l-4 border-blue-500 px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><UserRound size={19} /></div>
                      <div>
                        <h2 className="font-bold text-slate-800">{request.student?.name || "Student"}</h2>
                        <p className="mt-0.5 text-xs text-slate-500">{request.student?.email || "No email provided"}</p>
                      </div>
                      <span className={`ml-0 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ring-1 ring-inset ${statusStyles[request.status] || "bg-slate-100 text-slate-600 ring-slate-200"}`}>{request.status}</span>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <Detail icon={Building2} label="Department">{request.student?.department || "Not provided"}</Detail>
                      <Detail icon={CalendarDays} label="Requested">{formatDate(request.createdAt)}</Detail>
                      <Detail icon={FileText} label="Proposal">{request.project?.title || "No proposal"}</Detail>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                      <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400"><MessageSquare size={13} /> Student message</p>
                      <p className="text-sm leading-6 text-slate-600">{request.message || "No message included."}</p>
                    </div>
                    {request.rejectionReason && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700"><strong>Rejection reason:</strong> {request.rejectionReason}</p>}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 xl:w-44 xl:flex-col">
                    {request.project && <button type="button" onClick={() => setPreviewRequest(request)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100"><Eye size={16} /> View proposal</button>}
                    {request.status === "pending" && (
                      <>
                        <button type="button" onClick={() => accept(request._id)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"><Check size={16} /> Accept</button>
                        <button type="button" onClick={() => { setRejectingId(request._id); setRejectionReason(""); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50"><X size={16} /> Reject</button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {rejectingId === request._id && (
                <div className="border-t border-rose-100 bg-rose-50/50 px-5 py-4 sm:px-6">
                  <label className="block text-sm font-bold text-slate-700" htmlFor={`reason-${request._id}`}>Reason for rejection</label>
                  <textarea id={`reason-${request._id}`} rows="2" maxLength="500" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Briefly explain why you cannot accept this request" className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100" />
                  <div className="mt-2 flex justify-end gap-2">
                    <button type="button" onClick={() => setRejectingId(null)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-white">Cancel</button>
                    <button type="button" disabled={rejectionReason.trim().length < 2} onClick={() => reject(request._id)} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><XCircle size={14} /> Confirm rejection</button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {previewRequest && <ProjectPreview request={previewRequest} onClose={() => setPreviewRequest(null)} />}
    </div>
  );
};

export default PendingRequests;
