import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  UserRound,
  X,
} from "lucide-react";
import {
  cancelSupervisorRequest,
  fetchAllSupervisors,
  fetchMyRequests,
  fetchProject,
  getSupervisor,
  requestSupervisor,
} from "../../store/slices/studentSlice";
import { formatDate, formatDateTime, formatStatus } from "../../lib/format";
import { StatusBadge } from "../../components/shared/Badges";

const DEFAULT_MESSAGE =
  "Hello Sir/Ma'am, I would like to request you to be my project supervisor. Please consider my request. Thank you.";

const REQUEST_STYLES = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  accepted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  cancelled: "bg-slate-100 text-slate-500 ring-slate-200",
};

const RequestBadge = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${
      REQUEST_STYLES[status] || REQUEST_STYLES.cancelled
    }`}
  >
    {formatStatus(status)}
  </span>
);

const Card = ({ title, subtitle, action, children }) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const SupervisorPage = () => {
  const dispatch = useDispatch();
  const { supervisor, supervisors, project, myRequests, requestsLoading, requestsError } =
    useSelector((state) => state.student);

  const [search, setSearch] = useState("");
  const [target, setTarget] = useState(null);
  const [message, setMessage] = useState("");
  const [useDefault, setUseDefault] = useState(false);
  const [sending, setSending] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const reload = useCallback(() => {
    dispatch(getSupervisor());
    dispatch(fetchAllSupervisors());
    dispatch(fetchProject());
    dispatch(fetchMyRequests());
  }, [dispatch]);

  useEffect(() => {
    reload();
  }, [reload]);

  const hasSupervisor = Boolean(supervisor?._id);
  const hasActiveProject = Boolean(project) && project.status !== "rejected";
  const hasPending = myRequests.some((r) => r.status === "pending");

  // Latest non-cancelled request per teacher: a teacher can only be asked once
  const requestByTeacher = useMemo(() => {
    const map = new Map();
    myRequests.forEach((r) => {
      const id = r.supervisor?._id;
      if (id && r.status !== "cancelled" && !map.has(id)) map.set(id, r);
    });
    return map;
  }, [myRequests]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return supervisors.filter(
      (t) =>
        !q ||
        t.name?.toLowerCase().includes(q) ||
        t.department?.toLowerCase().includes(q) ||
        t.expertise?.some((e) => e.toLowerCase().includes(q)),
    );
  }, [supervisors, search]);

  const getAction = (teacher) => {
    const existing = requestByTeacher.get(teacher._id);
    if (hasSupervisor) return { label: "Supervisor assigned", disabled: true };
    if (!hasActiveProject) return { label: "Submit a proposal first", disabled: true };
    if (existing?.status === "pending") return { label: "Request pending", disabled: true };
    if (existing?.status === "accepted") return { label: "Accepted", disabled: true };
    if (existing?.status === "rejected") return { label: "Already requested", disabled: true };
    if (hasPending) return { label: "Another request pending", disabled: true };
    if ((teacher.assignedCount || 0) >= (teacher.maxStudents || 0)) {
      return { label: "Currently full", disabled: true };
    }
    return { label: "Send request", disabled: false };
  };

  const closeModal = () => {
    setTarget(null);
    setMessage("");
    setUseDefault(false);
  };

  const submitRequest = async () => {
    setSending(true);
    try {
      await dispatch(
        requestSupervisor({
          teacherId: target._id,
          message: useDefault ? DEFAULT_MESSAGE : message.trim() || DEFAULT_MESSAGE,
        }),
      ).unwrap();
      closeModal();
    } catch {
      // the thunk already shows the error toast, so the dialog stays open
    } finally {
      setSending(false);
    }
  };

  const cancelRequest = async (request) => {
    if (!window.confirm(`Cancel your request to ${request.supervisor?.name || "this supervisor"}?`)) return;
    setCancellingId(request._id);
    try {
      await dispatch(cancelSupervisorRequest(request._id)).unwrap();
    } catch {
      // the thunk already shows the error toast
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] space-y-5 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-5 rounded-3xl border border-slate-200 bg-gradient-to-r from-blue-50 via-white to-indigo-50 px-6 py-6 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Supervision</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-800">Supervisor</h1>
          <p className="mt-2 text-sm text-slate-500">
            Find a supervisor whose expertise matches your project and send one request at a time.
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          disabled={requestsLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60"
        >
          <RefreshCw size={16} className={requestsLoading ? "animate-spin" : ""} /> Refresh
        </button>
      </header>

      {requestsError && (
        <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {requestsError}
          <button onClick={() => dispatch(fetchMyRequests())} className="font-semibold underline">
            Retry
          </button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* LEFT COLUMN */}
        <div className="space-y-5 lg:col-span-2">
          <Card
            title="Assigned supervisor"
            action={
              hasSupervisor && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  <CheckCircle2 size={13} /> Assigned
                </span>
              )
            }
          >
            {hasSupervisor ? (
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <UserRound size={20} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800">{supervisor.name}</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                      <Mail size={14} className="text-slate-400" /> {supervisor.email}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                      <Building2 size={14} className="text-slate-400" />{" "}
                      {supervisor.department || "No department"}
                    </p>
                  </div>
                </div>
                {supervisor.expertise?.length > 0 && (
                  <div className="flex max-w-xs flex-wrap justify-end gap-1.5">
                    {supervisor.expertise.map((e) => (
                      <span key={e} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {e}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50 px-4 py-6 text-center">
                <Clock3 className="mx-auto text-blue-500" size={24} />
                <p className="mt-2 text-sm font-semibold text-blue-900">No supervisor assigned yet</p>
                <p className="mt-1 text-sm text-blue-700">
                  {hasActiveProject
                    ? "Choose a supervisor below to send a request."
                    : "Submit a project proposal first, then request a supervisor."}
                </p>
              </div>
            )}
          </Card>

          <Card title="Available supervisors" subtitle="Select a supervisor whose expertise matches your project.">
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, department or expertise"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {!filtered.length ? (
              <p className="py-6 text-center text-sm text-slate-400">
                {supervisors.length ? "No supervisors match your search." : "No supervisors are available right now."}
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filtered.map((t) => {
                  const action = getAction(t);
                  const count = t.assignedCount || 0;
                  const max = t.maxStudents || 0;
                  const pct = max ? Math.min(100, Math.round((count / max) * 100)) : 100;
                  const existing = requestByTeacher.get(t._id);
                  return (
                    <div key={t._id} className="flex flex-col rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200 hover:shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-800">{t.name}</p>
                          <p className="text-xs text-slate-500">{t.department || "No department"}</p>
                        </div>
                        {existing && <RequestBadge status={existing.status} />}
                      </div>
                      <p className="mt-3 flex items-center gap-2 truncate text-sm text-slate-500">
                        <Mail size={14} className="shrink-0" /> {t.email}
                      </p>
                      {t.expertise?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {t.expertise.map((e) => (
                            <span key={e} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                              {e}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-4">
                        <div className="mb-1 flex justify-between text-xs text-slate-500">
                          <span>Capacity</span>
                          <span className="font-semibold">
                            {count}/{max} students
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${pct >= 100 ? "bg-rose-400" : "bg-emerald-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={action.disabled}
                        onClick={() => setTarget(t)}
                        className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                      >
                        {!action.disabled && <Send size={15} />} {action.label}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <aside className="space-y-5 self-start">
          <Card title="Project">
            {project ? (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Title</p>
                  <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-800">{project.title}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Status</p>
                  <div className="mt-1">
                    <StatusBadge value={project.status} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Submitted</p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                    <CalendarDays size={14} className="text-slate-400" /> {formatDate(project.createdAt)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-6 text-slate-500">
                Submit a project proposal before requesting a supervisor.
              </p>
            )}
          </Card>

          <Card title={`My requests (${myRequests.length})`} subtitle="Every request you have sent, newest first.">
            {requestsLoading && !myRequests.length ? (
              <p className="py-6 text-center text-sm text-slate-500">Loading requests...</p>
            ) : !myRequests.length ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-slate-400">
                <Inbox size={26} className="text-slate-300" />
                You have not sent any requests yet.
              </div>
            ) : (
              <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                {myRequests.map((r) => (
                  <div key={r._id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-800">{r.supervisor?.name || "Supervisor"}</p>
                        <p className="text-xs text-slate-500">{r.supervisor?.department || "No department"}</p>
                        <p className="text-xs text-slate-400">Sent {formatDateTime(r.createdAt)}</p>
                      </div>
                      <RequestBadge status={r.status} />
                    </div>
                    <p className="mt-3 flex gap-2 text-sm text-slate-600">
                      <MessageSquare size={15} className="mt-0.5 shrink-0 text-slate-400" />
                      <span className="whitespace-pre-wrap break-words">{r.message}</span>
                    </p>
                    {r.status === "rejected" && (
                      <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">
                        <strong>Reason:</strong> {r.rejectionReason || "No reason was given."}
                      </p>
                    )}
                    {r.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => cancelRequest(r)}
                        disabled={cancellingId === r._id}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                      >
                        {cancellingId === r._id ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                        Cancel request
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </aside>
      </div>

      {/* REQUEST DIALOG */}
      {target && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
          onMouseDown={sending ? undefined : closeModal}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-6 py-5">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-800">Request supervisor</h2>
                <p className="mt-1 truncate text-sm text-slate-500">
                  To {target.name}
                  {target.department ? ` (${target.department})` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={sending}
                aria-label="Close"
                className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-3 p-6">
              <label htmlFor="requestMessage" className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Message
              </label>
              <textarea
                id="requestMessage"
                rows={4}
                maxLength={250}
                disabled={useDefault}
                value={useDefault ? DEFAULT_MESSAGE : message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a short message (optional)"
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:bg-blue-50 disabled:text-blue-700"
              />
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={useDefault}
                    onChange={(e) => setUseDefault(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Use the default message
                </label>
                <span className="text-xs text-slate-400">
                  {(useDefault ? DEFAULT_MESSAGE : message).length}/250
                </span>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={sending}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitRequest}
                  disabled={sending}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  Send request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorPage;