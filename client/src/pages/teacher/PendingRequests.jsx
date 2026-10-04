import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Check, Clock3, FileText, Inbox, RefreshCw, X } from "lucide-react";
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
  pending: "bg-amber-50 text-amber-700",
  accepted: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
};

const PendingRequests = () => {
  const dispatch = useDispatch();
  const { list, loading, error } = useSelector((state) => state.request);
  const [filter, setFilter] = useState("pending");
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

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
    <div className="mx-auto max-w-[1200px] space-y-5 pb-8">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Student connections</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-800">Supervisor requests</h1>
            <p className="mt-1 text-sm text-slate-500">Review requests and manage your supervision capacity.</p>
          </div>
          <button type="button" onClick={() => dispatch(getSupervisorRequests(filter))} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {filters.map(([value, label]) => (
            <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${filter === value ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {label}{value !== "all" && filter === value ? ` (${counts[value]})` : ""}
            </button>
          ))}
        </div>
        <span className="text-xs font-medium text-slate-400">{list.length} request{list.length === 1 ? "" : "s"} shown</span>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading requests...</div>
      ) : !list.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <Inbox className="mx-auto mb-3 text-slate-300" size={34} />
          <p className="font-semibold text-slate-700">No {filter === "all" ? "" : filter} requests</p>
          <p className="mt-1 text-sm text-slate-400">Requests will appear here when students contact you.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((request) => (
            <article key={request._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-800">{request.student?.name || "Student"}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[request.status]}`}>{request.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{request.student?.department || "No department"} · {request.student?.email}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Proposed project</p><p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-700"><FileText size={15} className="text-blue-500" />{request.project?.title || "No active proposal"}</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Request date</p><p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-700"><Clock3 size={15} className="text-slate-400" />{formatDate(request.createdAt)}</p></div>
                  </div>
                  <p className="mt-3 rounded-xl border border-slate-100 px-3 py-2.5 text-sm leading-6 text-slate-600">{request.message}</p>
                  {request.rejectionReason && <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700"><strong>Reason:</strong> {request.rejectionReason}</p>}
                </div>
                {request.status === "pending" && (
                  <div className="flex shrink-0 flex-wrap gap-2 lg:w-44 lg:flex-col">
                    <button type="button" onClick={() => accept(request._id)} className="btn-secondary inline-flex items-center justify-center gap-1.5"><Check size={16} /> Accept request</button>
                    <button type="button" onClick={() => { setRejectingId(request._id); setRejectionReason(""); }} className="btn-danger inline-flex items-center justify-center gap-1.5"><X size={16} /> Reject request</button>
                  </div>
                )}
              </div>
              {rejectingId === request._id && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <label className="block text-sm font-semibold text-slate-700" htmlFor={`reason-${request._id}`}>Reason for rejection</label>
                  <textarea id={`reason-${request._id}`} rows="2" maxLength="500" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Briefly explain why you cannot accept this request" className="input mt-2 resize-none" />
                  <div className="mt-2 flex justify-end gap-2"><button type="button" onClick={() => setRejectingId(null)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100">Cancel</button><button type="button" disabled={rejectionReason.trim().length < 2} onClick={() => reject(request._id)} className="btn-danger btn-small disabled:cursor-not-allowed disabled:opacity-50">Confirm rejection</button></div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingRequests;
