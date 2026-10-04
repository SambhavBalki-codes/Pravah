import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CheckCircle2, ChevronLeft, ChevronRight, Eye, FileText, Search, UserRound, X } from "lucide-react";
import {
  assignProjectSupervisor,
  decideProject,
  getAllProjects,
  getProjectDetails,
  updateProjectStatus,
} from "../../store/slices/adminSlice";

const statuses = ["pending", "approved", "in_progress", "revision_required", "rejected", "completed"];
const statusClass = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  in_progress: "bg-blue-50 text-blue-700",
  revision_required: "bg-violet-50 text-violet-700",
  rejected: "bg-red-50 text-red-700",
  completed: "bg-teal-50 text-teal-700",
};
const nextStatuses = {
  approved: ["in_progress"],
  in_progress: ["revision_required", "completed"],
  revision_required: ["in_progress"],
};
const formatStatus = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const ProjectsPage = () => {
  const dispatch = useDispatch();
  const { projects, users, projectsLoading, selectedProject } = useSelector((state) => state.admin);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [department, setDepartment] = useState("all");
  const [supervisor, setSupervisor] = useState("all");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [assigning, setAssigning] = useState("");
  const pageSize = 10;

  const teachers = useMemo(() => users.filter((user) => user.role === "Teacher"), [users]);
  const students = useMemo(() => users.filter((user) => user.role === "Student"), [users]);
  const departments = useMemo(
    () => [...new Set(students.map((user) => user.department).filter(Boolean))],
    [students],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(getAllProjects({
        search: search.trim() || undefined,
        status: status === "all" ? undefined : status,
        department: department === "all" ? undefined : department,
        supervisor: supervisor === "all" ? undefined : supervisor,
      }));
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [dispatch, search, status, department, supervisor]);

  const findStudent = (project) =>
    project?.student && typeof project.student === "object"
      ? project.student
      : students.find((user) => String(user._id) === String(project?.student));
  const findSupervisor = (project) =>
    project?.supervisor && typeof project.supervisor === "object"
      ? project.supervisor
      : teachers.find((user) => String(user._id) === String(project?.supervisor));

  const openDetails = (projectId) => {
    setDetailId(projectId);
    setRejecting(false);
    setRejectionReason("");
    setAssigning("");
    dispatch(getProjectDetails(projectId));
  };
  const closeDetails = () => {
    setDetailId(null);
    setRejecting(false);
    setRejectionReason("");
    setAssigning("");
  };
  const approve = () => dispatch(decideProject({ projectId: detailId, status: "approved" }));
  const reject = () => {
    if (!rejectionReason.trim()) return;
    dispatch(decideProject({ projectId: detailId, status: "rejected", rejectionReason: rejectionReason.trim() }))
      .unwrap()
      .then(() => closeDetails());
  };
  const assignSupervisor = () => {
    if (assigning) dispatch(assignProjectSupervisor({ projectId: detailId, supervisorId: assigning }));
  };
  const changeStatus = (nextStatus) =>
    dispatch(updateProjectStatus({ projectId: detailId, status: nextStatus }));

  const totalPages = Math.max(1, Math.ceil(projects.length / pageSize));
  const visibleProjects = projects.slice((page - 1) * pageSize, page * pageSize);
  const detailStudent = findStudent(selectedProject);
  const detailSupervisor = findSupervisor(selectedProject);
  const canReject = selectedProject && !["rejected", "completed"].includes(selectedProject.status);

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-8">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800">Project Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review proposals, files, feedback, supervisors, and project progress.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="relative md:col-span-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400" placeholder="Search by project title" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All statuses</option>
            {statuses.map((value) => <option key={value} value={value}>{formatStatus(value)}</option>)}
          </select>
          <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={department} onChange={(event) => setDepartment(event.target.value)}>
            <option value="all">All departments</option>
            {departments.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={supervisor} onChange={(event) => setSupervisor(event.target.value)}>
            <option value="all">All supervisors</option>
            {teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.name}</option>)}
          </select>
          <span className="text-sm text-slate-500">{projects.length} project{projects.length === 1 ? "" : "s"} found</span>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {projectsLoading ? <div className="p-10 text-center text-sm text-slate-500">Loading projects...</div> : visibleProjects.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No projects match these filters.</div> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Project</th><th className="px-5 py-4">Student</th><th className="px-5 py-4">Department</th><th className="px-5 py-4">Supervisor</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {visibleProjects.map((project) => {
                  const student = findStudent(project);
                  const projectSupervisor = findSupervisor(project);
                  return <tr key={project._id} className="hover:bg-slate-50"><td className="px-5 py-4 font-medium text-slate-800">{project.title}</td><td className="px-5 py-4 text-slate-600">{student?.name || "Unknown"}</td><td className="px-5 py-4 text-slate-600">{student?.department || "Unassigned"}</td><td className="px-5 py-4 text-slate-600">{projectSupervisor?.name || "Unassigned"}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass[project.status] || "bg-slate-100 text-slate-600"}`}>{formatStatus(project.status)}</span></td><td className="px-5 py-4 text-right"><button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700" onClick={() => openDetails(project._id)}><Eye size={14} /> View details</button></td></tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-500"><span>Page {page} of {totalPages}</span><div className="flex gap-2"><button className="rounded-lg border p-2 disabled:opacity-40" disabled={page === 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={16} /></button><button className="rounded-lg border p-2 disabled:opacity-40" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}><ChevronRight size={16} /></button></div></div>
      </section>

      {detailId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {!selectedProject ? <div className="py-16 text-center text-sm text-slate-500">Loading project details...</div> : <>
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-7 py-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Project details</p><h2 className="mt-1 text-2xl font-bold text-slate-800">{selectedProject.title}</h2><p className="mt-1 text-sm text-slate-500">{detailStudent?.name || "Unknown student"} · {detailStudent?.email || "No email"} · {detailStudent?.department || "No department"}</p></div><button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={closeDetails}><X /></button></div>
              <div className="min-h-0 flex-1 overflow-y-auto px-7 py-5">
                <section className="mb-5 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</span>
                    <button className="btn-secondary inline-flex items-center gap-2 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50" disabled={selectedProject.status !== "pending"} onClick={approve}><CheckCircle2 size={15} /> Approve</button>
                    <button className="btn-danger px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50" disabled={!canReject} onClick={() => setRejecting((value) => !value)}>{rejecting ? "Cancel rejection" : "Reject"}</button>
                    {!detailSupervisor && <div className="flex items-center gap-2 border-l border-slate-200 pl-2"><UserRound size={16} className="text-slate-400" /><select className="max-w-[180px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm" value={assigning} onChange={(event) => setAssigning(event.target.value)}><option value="">Assign supervisor</option>{teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.name}</option>)}</select><button className="btn-primary px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50" disabled={!assigning} onClick={assignSupervisor}>Assign</button></div>}
                    {nextStatuses[selectedProject.status]?.map((nextStatus) => <button key={nextStatus} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700" onClick={() => changeStatus(nextStatus)}>{formatStatus(nextStatus)}</button>)}
                  </div>
                  {rejecting && canReject && <div className="mt-2 flex max-w-2xl gap-2"><input className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Reason for rejection" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} /><button className="btn-danger px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50" disabled={!rejectionReason.trim()} onClick={reject}>Confirm</button></div>}
                </section>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Student</p>{detailStudent ? <div className="mt-2 flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 font-semibold text-violet-700">{detailStudent.name?.charAt(0)?.toUpperCase()}</div><div className="min-w-0"><p className="truncate font-semibold text-slate-800">{detailStudent.name}</p><p className="truncate text-sm text-slate-500">{detailStudent.email || "No email"}</p><p className="mt-1 truncate text-xs font-medium text-violet-700">{detailStudent.department || "No branch assigned"}</p></div></div> : <p className="mt-2 text-sm text-slate-500">Student details unavailable.</p>}</div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 md:col-span-2"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Assigned supervisor</p>{detailSupervisor ? <div className="mt-2 flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">{detailSupervisor.name?.charAt(0)?.toUpperCase()}</div><div className="min-w-0"><p className="font-semibold text-slate-800">{detailSupervisor.name}</p><p className="truncate text-sm text-slate-500">{detailSupervisor.email || "No email"}{detailSupervisor.department ? ` · ${detailSupervisor.department}` : ""}</p></div></div> : <p className="mt-2 text-sm text-slate-500">No supervisor assigned yet.</p>}</div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 md:col-span-2"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Description</p><p className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-slate-700">{selectedProject.description}</p></div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current status</p><span className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${statusClass[selectedProject.status]}`}>{formatStatus(selectedProject.status)}</span>{selectedProject.rejectionReason && <p className="mt-4 max-h-20 overflow-y-auto text-sm leading-5 text-red-700"><b>Rejection reason:</b> {selectedProject.rejectionReason}</p>}</div>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <section className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><h3 className="font-semibold text-slate-800">Uploaded files</h3><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">{selectedProject.files?.length || 0}</span></div><div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">{selectedProject.files?.length ? selectedProject.files.map((file) => <a className="flex items-center gap-2 rounded-lg border p-3 text-sm text-blue-700 hover:bg-blue-50" href={file.fileUrl} target="_blank" rel="noreferrer" key={file._id}><FileText size={16} /> <span className="truncate">{file.originalName}</span></a>) : <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No files uploaded.</p>}</div></section>
                  <section className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><h3 className="font-semibold text-slate-800">Feedback history</h3><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">{selectedProject.feedbacks?.length || 0}</span></div><div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">{selectedProject.feedbacks?.length ? selectedProject.feedbacks.map((feedback) => <div className="rounded-lg border p-3" key={feedback._id}><p className="text-sm font-medium text-slate-800">{feedback.title}</p><p className="mt-1 text-sm leading-5 text-slate-600">{feedback.message}</p></div>) : <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No feedback yet.</p>}</div></section>
                </div>
              </div>
            </>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
