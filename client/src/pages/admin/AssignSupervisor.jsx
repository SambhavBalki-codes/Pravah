import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CheckCircle2,
  ClipboardCheck,
  Search,
  UserRound,
  Users,
} from "lucide-react";
import {
  assignProjectSupervisor,
  getAllProjects,
  getAllUsers,
} from "../../store/slices/adminSlice";

const formatStatus = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const statusClass = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  in_progress: "bg-blue-50 text-blue-700",
  revision_required: "bg-violet-50 text-violet-700",
  completed: "bg-teal-50 text-teal-700",
};

const AssignSupervisor = () => {
  const dispatch = useDispatch();
  const { projects, users, projectsLoading } = useSelector((state) => state.admin);
  const [search, setSearch] = useState("");
  const [selectedTeachers, setSelectedTeachers] = useState({});
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  useEffect(() => {
    dispatch(getAllProjects());
    dispatch(getAllUsers());
  }, [dispatch]);

  const teachers = useMemo(
    () => users.filter((user) => user.role === "Teacher"),
    [users],
  );
  const students = useMemo(
    () => users.filter((user) => user.role === "Student"),
    [users],
  );
  const projectsByStudent = useMemo(
    () =>
      projects.reduce((result, project) => {
        const studentId =
          typeof project.student === "object" ? project.student?._id : project.student;
        result[String(studentId)] = project;
        return result;
      }, {}),
    [projects],
  );
  const getStudent = (project) =>
    typeof project.student === "object"
      ? project.student
      : students.find((student) => String(student._id) === String(project.student));
  const getAssignedStudent = (studentReference) => {
    const studentId =
      typeof studentReference === "object" ? studentReference?._id : studentReference;
    return students.find((student) => String(student._id) === String(studentId));
  };
  const unassignedProjects = projects.filter((project) => {
    const student = getStudent(project);
    const searchValue = search.toLowerCase();
    return (
      !project.supervisor &&
      (project.title?.toLowerCase().includes(searchValue) ||
        student?.name?.toLowerCase().includes(searchValue) ||
        student?.email?.toLowerCase().includes(searchValue))
    );
  });
  const selectedTeacher = teachers.find(
    (teacher) => String(teacher._id) === String(selectedTeacherId),
  );

  const assign = (projectId) => {
    const supervisorId = selectedTeachers[projectId];
    if (!supervisorId) return;
    dispatch(assignProjectSupervisor({ projectId, supervisorId })).then((action) => {
      if (action.meta.requestStatus === "fulfilled") {
        setSelectedTeachers((current) => {
          const next = { ...current };
          delete next[projectId];
          return next;
        });
        dispatch(getAllProjects());
        dispatch(getAllUsers());
      }
    });
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-8">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <section className="min-w-0 space-y-4">
          <header className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Admin assignment
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-800">
                Assign Supervisors
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Assign available teachers to unassigned projects.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3">
              <div className="rounded-lg bg-white p-2 text-blue-600 shadow-sm">
                <ClipboardCheck size={19} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{unassignedProjects.length}</p>
                <p className="text-xs font-medium text-slate-500">Awaiting assignment</p>
              </div>
            </div>
          </header>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-800">Unassigned projects</h2>
                <p className="mt-1 text-xs text-slate-500">{unassignedProjects.length} project{unassignedProjects.length === 1 ? "" : "s"} awaiting assignment</p>
              </div>
              <div className="relative w-64 max-w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400" placeholder="Search project or student" value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
            </div>
          </div>

          {projectsLoading ? (
            <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">Loading unassigned projects...</div>
          ) : unassignedProjects.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
              <div className="empty-state-icon-3d relative mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-emerald-100 via-teal-50 to-blue-100 text-emerald-600 shadow-inner">
                <div className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 shadow-sm">
                  <Users size={17} />
                </div>
                <ClipboardCheck size={45} strokeWidth={1.5} />
                <div className="absolute bottom-4 left-5 h-1.5 w-1.5 rounded-full bg-amber-400" />
                <div className="absolute bottom-4 right-5 h-1.5 w-1.5 rounded-full bg-blue-400" />
              </div>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                <CheckCircle2 size={13} />
                Assignment queue is clear
              </div>
              <h3 className="mt-3 text-lg font-bold text-slate-800">All projects are assigned</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                There are no student projects waiting for a supervisor right now. New projects will appear here when they need assignment.
              </p>
            </div>
          ) : (
            unassignedProjects.map((project) => {
              const student = getStudent(project);
              return (
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={project._id}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-800">{project.title}</h3>
                      <p className="mt-1 truncate text-sm text-slate-600">{student?.name || "Unknown student"} · {student?.email || "No email"}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500"><span>{student?.department || "No department"}</span><span className={`rounded-full px-2 py-1 font-medium ${statusClass[project.status] || "bg-slate-100 text-slate-600"}`}>{formatStatus(project.status)}</span></div>
                    </div>
                    <div className="flex w-full gap-2 lg:max-w-md">
                      <UserRound className="mt-2 shrink-0 text-slate-400" size={18} />
                      <select className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" value={selectedTeachers[project._id] || ""} onChange={(event) => setSelectedTeachers((current) => ({ ...current, [project._id]: event.target.value }))}>
                        <option value="">Select supervisor</option>
                        {teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.name} ({teacher.assignedStudents?.length || 0}/{teacher.maxStudents || "∞"})</option>)}
                      </select>
                      <button className="btn-primary whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50" disabled={!selectedTeachers[project._id]} onClick={() => assign(project._id)}>Assign</button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-6">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600"><Users size={20} /></div>
              <div><h2 className="font-semibold text-slate-800">Supervisor workload</h2><p className="mt-1 text-sm text-slate-500">View every teacher and their assigned students.</p></div>
            </div>
            <select className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={selectedTeacherId} onChange={(event) => setSelectedTeacherId(event.target.value)}>
              <option value="">Select a supervisor</option>
              {teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.name}</option>)}
            </select>
          </div>
          {selectedTeacher ? (
            <div className="p-5">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <div><p className="font-semibold text-slate-800">{selectedTeacher.name}</p><p className="mt-1 text-xs text-slate-500">{selectedTeacher.email} · {selectedTeacher.department || "No department"}</p></div>
                <div className="text-right"><p className="text-xl font-bold text-slate-800">{selectedTeacher.assignedStudents?.length || 0}<span className="text-sm font-normal text-slate-400">/{selectedTeacher.maxStudents || "∞"}</span></p><p className="text-xs text-slate-500">students</p></div>
              </div>
              <div className="mt-4 space-y-3">{selectedTeacher.assignedStudents?.length ? selectedTeacher.assignedStudents.map((reference) => { const student = getAssignedStudent(reference); const project = projectsByStudent[String(typeof reference === "object" ? reference?._id : reference)]; return <div className="rounded-xl border border-slate-200 p-3" key={String(typeof reference === "object" ? reference?._id : reference)}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{student?.name || "Student"}</p><p className="truncate text-xs text-slate-500">{student?.email || "No email"}</p><p className="mt-1 text-xs text-slate-500">{student?.department || "No department"}</p></div><CheckCircle2 size={17} className="shrink-0 text-emerald-500" /></div>{project && <p className="mt-3 truncate rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-slate-600">{project.title}</p>}</div>; }) : <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">No students assigned yet.</div>}</div>
            </div>
          ) : <div className="p-8 text-center text-sm text-slate-500">No supervisors available.</div>}
        </aside>
      </div>
    </div>
  );
};

export default AssignSupervisor;
