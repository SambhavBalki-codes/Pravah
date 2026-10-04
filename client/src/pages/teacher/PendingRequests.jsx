import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Check, Clock3, X } from "lucide-react";
import {
  getSupervisorRequests,
  respondToSupervisorRequest,
} from "../../store/slices/requestSlice";

const PendingRequests = () => {
  const dispatch = useDispatch();
  const { list, loading, error } = useSelector((state) => state.request);

  useEffect(() => {
    dispatch(getSupervisorRequests());
  }, [dispatch]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800">Supervisor Requests</h1>
        <p className="mt-1 text-sm text-slate-500">Review student requests. Accepting a request assigns you to the student&apos;s active project.</p>
      </header>
      {loading && <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-500">Loading requests...</div>}
      {error && <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {!loading && !error && list.length === 0 && <div className="rounded-xl bg-white p-10 text-center text-sm text-slate-500">No pending supervisor requests.</div>}
      <div className="space-y-3">
        {list.map((request) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={request._id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-800">{request.student?.name}</p>
                <p className="text-sm text-slate-500">{request.student?.email} · {request.student?.department || "No department"}</p>
                <p className="mt-3 text-sm text-slate-700">{request.message}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-400"><Clock3 size={13} /> {new Date(request.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary inline-flex items-center gap-1.5" onClick={() => dispatch(respondToSupervisorRequest({ requestId: request._id, decision: "accept" }))}><Check size={16} /> Accept</button>
                <button className="btn-danger inline-flex items-center gap-1.5" onClick={() => dispatch(respondToSupervisorRequest({ requestId: request._id, decision: "reject" }))}><X size={16} /> Decline</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default PendingRequests;
