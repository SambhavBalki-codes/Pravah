import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  MessageSquare,
  Send,
  ContactRound,
  UserPlus,
  UserRound,
} from "lucide-react";
import {
  getSupervisor,
  fetchAllSupervisors,
  fetchProject,
  requestSupervisor,
} from "../../store/slices/studentSlice";

const SupervisorPage = () => {
  const dispatch = useDispatch();
  // const { authUser } = useSelector((state) => state.auth);
  const { supervisor, supervisors, project } = useSelector(
    (state) => state.student,
  );

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);

  const [requestMessage, setRequestMessage] = useState("");
  const [useDefaultMessage, setUseDefaultMessage] = useState(false);

  useEffect(() => {
    dispatch(getSupervisor());
    dispatch(fetchAllSupervisors());
    dispatch(fetchProject());
  }, [dispatch]);

  const hasSupervisor = useMemo(() => {
    return !!(supervisor && supervisor._id);
  }, [supervisor]);

  const formatDeadline = (dateString) => {
    if (!dateString) return "No deadline";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "No deadline";
    const day = date.getDate();
    const j = day % 10,
      k = day % 100;
    const suffix =
      j === 1 && k !== 11
        ? "st"
        : j === 2 && k !== 12
          ? "nd"
          : j === 3 && k !== 13
            ? "rd"
            : "th";
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();
    return `${day}${suffix} ${month} ${year}`;
  };

  const handleOpenRequest = (supervisor) => {
    setSelectedSupervisor(supervisor);
    setShowRequestModal(true);
  };

  const handleCloseRequest = () => {
    setSelectedSupervisor(null);
    setRequestMessage("");
    setUseDefaultMessage(false);
    setShowRequestModal(false);
  };

  const submitRequest = () => {
    if (!selectedSupervisor) return;
    const defaultMessage =
      "Hello Sir/Ma'am, I would like to request you to be my project supervisor. Please consider my request. Thank you.";
    const message = useDefaultMessage
      ? defaultMessage
      : requestMessage.trim() || defaultMessage;
    dispatch(
      requestSupervisor({
        teacherId: selectedSupervisor._id,
        message: message,
      }),
    );
    handleCloseRequest();
  };

  return (
    <div className="w-full space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ContactRound className="h-6 w-6 text-blue-500" />
                  <h2 className="text-lg font-semibold text-slate-800">
                    Assigned Supervisor
                  </h2>
                </div>
                <p className="mt-1 text-[0.9375rem] text-slate-500">
                  Your current supervision details.
                </p>
              </div>
              {hasSupervisor && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Assigned
                </span>
              )}
            </div>

            {hasSupervisor ? (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-800">
                    {supervisor.name || "Supervisor"}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                    <Mail className="h-4 w-4" />
                    {supervisor.email || "Email not available"}
                  </p>
                  {supervisor.department && (
                    <p className="mt-1 text-sm text-slate-500">
                      Department: {supervisor.department}
                    </p>
                  )}
                </div>
                {supervisor.expertise?.length > 0 && (
                  <div className="sm:max-w-xs sm:text-right">
                    <p className="text-xs font-medium text-slate-400">
                      Expertise
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {supervisor.expertise.join(", ")}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-blue-200 bg-blue-50 px-4 py-5 text-center">
                <Clock3 className="mx-auto h-6 w-6 text-blue-500" />
                <p className="mt-2 text-[0.9375rem] font-medium text-blue-900">
                  No supervisor assigned yet
                </p>
                <p className="mt-1 text-[0.9375rem] text-blue-700">
                  Choose a supervisor below to send a request.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-semibold text-slate-800">
                Available Supervisors
              </h2>
              <p className="mt-1 text-[0.9375rem] font-medium text-blue-700">
                Select a supervisor whose expertise matches your project.
              </p>
            </div>

            {supervisors.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {supervisors.map((availableSupervisor) => {
                  const isFull =
                    availableSupervisor.assignedStudents?.length >=
                    availableSupervisor.maxStudents;

                  return (
                    <div
                      key={availableSupervisor._id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-800">
                            {availableSupervisor.name}
                            {availableSupervisor.department && (
                              <span className="ml-1 font-normal text-slate-500">
                                ({availableSupervisor.department})
                              </span>
                            )}
                          </p>
                        </div>
                        <UserPlus className="h-6 w-6 text-blue-500" />
                      </div>
                      <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                        <Mail className="h-4 w-4" />
                        {availableSupervisor.email}
                      </p>
                      {availableSupervisor.expertise?.length > 0 && (
                        <p className="mt-3 text-sm text-slate-600">
                          {availableSupervisor.expertise.join(", ")}
                        </p>
                      )}
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-medium text-emerald-700">
                          Students:{" "}
                          {availableSupervisor.assignedStudents?.length || 0}/
                          {availableSupervisor.maxStudents || 0}
                        </p>
                        <button
                          type="button"
                          disabled={hasSupervisor || isFull}
                          onClick={() => handleOpenRequest(availableSupervisor)}
                          className="inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          <Send className="h-4 w-4" />
                          {hasSupervisor
                            ? "Supervisor Assigned"
                            : isFull
                              ? "Currently Full"
                              : "Send Request"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-6 text-center text-[0.9375rem] text-blue-700">
                No supervisors are available right now.
              </p>
            )}
          </div>
        </section>

        <aside className="self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <h2 className="text-lg font-semibold text-slate-800">Project</h2>
          {project ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-400">TITLE</p>
                <p className="mt-1 break-words font-serif text-base font-medium leading-6 text-slate-800">
                  {project.title || "Untitled project"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">STATUS</p>
                <span
                  className={`badge ${project.status === "approved" ? "badge-approved" : "badge-rejected"} mt-1 capitalize`}
                >
                  {project.status || "Pending"}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">DEADLINE</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  {formatDeadline(project.deadline)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">CREATED</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  {project.createdAt ? formatDeadline(project.createdAt) : "-"}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-5 text-slate-500">
              Submit a project proposal before requesting a supervisor.
            </p>
          )}
        </aside>
      </div>

      {showRequestModal && selectedSupervisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Request Supervisor
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Send a request to{" "}
                  <span className="font-semibold text-blue-700">
                    {selectedSupervisor.name}
                  </span>
                  {selectedSupervisor.department && (
                    <span className="text-blue-600">
                      {" "}
                      ({selectedSupervisor.department})
                    </span>
                  )}
                  .
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseRequest}
                className="text-2xl leading-none text-slate-400 transition hover:text-red-600"
                aria-label="Close request dialog"
              >
                &times;
              </button>
            </div>
            <label
              htmlFor="requestMessage"
              className="mt-5 block text-sm font-medium text-slate-700"
            >
              Message
            </label>
            <div className="relative mt-2">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <textarea
                id="requestMessage"
                value={
                  useDefaultMessage
                    ? "Hello Sir/Ma'am, I would like to request you to be my project supervisor. Please consider my request. Thank you."
                    : requestMessage
                }
                onChange={(event) => setRequestMessage(event.target.value)}
                placeholder="Add a short message (optional)"
                maxLength={250}
                rows={4}
                disabled={useDefaultMessage}
                className={`w-full resize-none rounded-lg border py-2.5 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed ${
                  useDefaultMessage
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-300 bg-slate-50 text-slate-700 focus:border-blue-500 focus:bg-white"
                }`}
              />
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={useDefaultMessage}
                onChange={(event) => setUseDefaultMessage(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Use the default message
            </label>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCloseRequest}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRequest}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
              >
                <Send className="h-4 w-4" />
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorPage;
