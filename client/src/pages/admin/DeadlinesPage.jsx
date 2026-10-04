import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  AlertCircle,
  CalendarDays,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Globe2,
  Search,
  AlertTriangle,
  UserRound,
  Trash2,
} from "lucide-react";
import {
  createDeadline,
  deleteDeadline,
  getDeadlines,
  toggleDeadline,
  updateDeadline,
} from "../../store/slices/deadlineSlice";
import { getAllProjects, getAllUsers } from "../../store/slices/adminSlice";

const emptyForm = { name: "", dueDate: "", scope: "global", project: "", student: "" };

const toInputDate = (date) => {
  const value = new Date(date);
  const offset = value.getTimezoneOffset() * 60000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
};

const formatDate = (date) =>
  new Date(date).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const isOverdue = (deadline) => new Date(deadline.dueDate) < new Date();

const DeadlinesPage = () => {
  const dispatch = useDispatch();
  const { deadlines, loading } = useSelector((state) => state.deadline);
  const { projects, users } = useSelector((state) => state.admin);
  const [filter, setFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(true);
  const [scopeSearch, setScopeSearch] = useState("");
  const [scopePickerOpen, setScopePickerOpen] = useState(false);
  const [deadlineToDelete, setDeadlineToDelete] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  useEffect(() => {
    dispatch(getDeadlines("all"));
    if (!projects.length) dispatch(getAllProjects());
    if (!users.length) dispatch(getAllUsers());
  }, [dispatch, projects.length, users.length]);

  const students = useMemo(() => users.filter((user) => user.role === "Student"), [users]);
  const scopeOptions = useMemo(() => {
    const query = scopeSearch.trim().toLowerCase();
    const source = form.scope === "student" ? students : projects;
    return source
      .filter((item) => {
        const text = form.scope === "student"
          ? `${item.name} ${item.email} ${item.department}`
          : `${item.title} ${item.student?.name || ""}`;
        return !query || text.toLowerCase().includes(query);
      })
      .slice(0, 8);
  }, [form.scope, projects, scopeSearch, students]);

  const selectedScope = form.scope === "student"
    ? students.find((student) => student._id === form.student)
    : projects.find((project) => project._id === form.project);
  const selectedDate = form.dueDate ? form.dueDate.slice(0, 10) : "";
  const selectedTime = form.dueDate ? form.dueDate.slice(11, 16) : "09:00";
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const start = new Date(year, month, 1 - firstDay.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [calendarMonth]);
  const updateDateTime = (date, time = selectedTime) => {
    const dateValue = date instanceof Date
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      : date;
    setForm({ ...form, dueDate: `${dateValue}T${time}` });
  };

  const visibleDeadlines = useMemo(() => {
    return deadlines.filter((deadline) => {
      const matchesStatus =
        filter === "active"
          ? deadline.isActive
          : filter === "inactive"
            ? !deadline.isActive
            : filter === "overdue"
              ? deadline.isActive && isOverdue(deadline)
              : true;
      const scope = deadline.student ? "student" : deadline.project ? "project" : "global";
      return matchesStatus && (scopeFilter === "all" || scope === scopeFilter);
    });
  }, [deadlines, filter, scopeFilter]);

  const closeForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setScopeSearch("");
    setShowForm(true);
    setCalendarOpen(false);
    setScopePickerOpen(false);
  };

  const submit = (event) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      dueDate: form.dueDate,
      project: form.scope === "project" ? form.project : null,
      student: form.scope === "student" ? form.student : null,
    };
    const request = editingId
      ? dispatch(updateDeadline({ id: editingId, data: payload }))
      : dispatch(createDeadline(payload));
    request.then((action) => {
      if (action.meta.requestStatus === "fulfilled") closeForm();
    });
  };

  const edit = (deadline) => {
    setEditingId(deadline._id);
    setForm({
      name: deadline.name,
      dueDate: toInputDate(deadline.dueDate),
      scope: deadline.student ? "student" : deadline.project ? "project" : "global",
      project: deadline.project?._id || deadline.project || "",
      student: deadline.student?._id || deadline.student || "",
    });
    setCalendarMonth(new Date(deadline.dueDate));
    setShowForm(true);
  };

  const remove = (deadline) => {
    setDeadlineToDelete(deadline);
  };

  const confirmRemove = () => {
    if (!deadlineToDelete) return;
    dispatch(deleteDeadline(deadlineToDelete._id)).then((action) => {
      if (action.meta.requestStatus === "fulfilled") {
        setDeadlineToDelete(null);
      }
    });
  };

  return (
    <div className="mx-auto max-w-[1450px] space-y-6 pb-8">
      <header className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Academic calendar</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-800">Deadline management</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Create shared milestones or attach a deadline to one project, then keep overdue work visible.
          </p>
        </div>
        <p className="hidden text-sm font-medium text-slate-500 sm:block">Create and manage academic milestones</p>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(390px,0.82fr)_minmax(0,1.18fr)]">
      {showForm && (
        <section className="order-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-4">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{editingId ? "Edit deadline" : "New deadline"}</p><h2 className="mt-1 text-xl font-bold text-slate-800">{editingId ? "Update milestone" : "Set a milestone"}</h2></div>
            {editingId && <button type="button" onClick={closeForm} className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100">Clear</button>}
          </div>
          <form onSubmit={submit} className="mt-4 space-y-3">
            <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Title</span><input required maxLength={100} className="input" placeholder="e.g. Final report submission" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <div className="relative">
              <span className="mb-1 block text-sm font-medium text-slate-700">Due date and time</span>
              <div className="grid grid-cols-[1fr_112px] gap-2">
                <button type="button" onClick={() => setCalendarOpen((open) => !open)} className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-left text-sm hover:border-blue-400"><CalendarDays size={17} className="shrink-0 text-blue-600" /><span className={`truncate ${selectedDate ? "text-slate-700" : "text-slate-400"}`}>{selectedDate ? new Date(`${selectedDate}T12:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "Choose date"}</span></button>
                <input required type="time" className="input" value={selectedTime} onChange={(event) => updateDateTime(selectedDate || new Date().toISOString().slice(0, 10), event.target.value)} />
              </div>
              {calendarOpen && <div className="absolute left-0 top-[76px] z-10 w-full rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                <div className="flex items-center justify-between"><button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><ChevronLeft size={17} /></button><p className="text-sm font-semibold text-slate-700">{calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p><button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><ChevronRight size={17} /></button></div>
                <div className="mt-3 grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <span key={day}>{day}</span>)}</div>
                <div className="mt-1 grid grid-cols-7 gap-1">{calendarDays.map((day) => { const dayValue = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`; const isCurrentMonth = day.getMonth() === calendarMonth.getMonth(); const isSelected = dayValue === selectedDate; const isPast = dayValue < new Date().toISOString().slice(0, 10); return <button key={dayValue} type="button" disabled={isPast} onClick={() => { updateDateTime(day); setCalendarOpen(false); }} className={`rounded-lg py-1.5 text-xs ${isSelected ? "bg-blue-600 font-bold text-white" : isCurrentMonth ? "text-slate-700 hover:bg-blue-50" : "text-slate-300"} disabled:cursor-not-allowed disabled:text-slate-200`}>{day.getDate()}</button>; })}</div>
              </div>}
            </div>
            <fieldset>
              <legend className="mb-1.5 block text-sm font-medium text-slate-700">Send deadline to</legend>
              <div className="grid grid-cols-3 gap-2">{[["global", "Everyone", Globe2], ["student", "Student", UserRound], ["project", "Project", Edit3]].map(([value, label, Icon]) => { const ScopeIcon = Icon; return <button key={value} type="button" onClick={() => { setForm({ ...form, scope: value, project: "", student: "" }); setScopeSearch(""); setScopePickerOpen(value !== "global"); }} className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[11px] font-semibold transition ${form.scope === value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}><ScopeIcon size={16} />{label}</button>; })}</div>
              {selectedScope && form.scope !== "global" && (
                <div className="mt-4 flex min-w-0 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-3 shadow-sm ring-1 ring-emerald-100">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    {form.scope === "student" ? <UserRound size={14} /> : <Edit3 size={14} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-800">{form.scope === "student" ? selectedScope.name : selectedScope.title}</p>
                    <p className="truncate text-[11px] text-slate-500">{form.scope === "student" ? selectedScope.email : selectedScope.student?.name || "Project scope"}</p>
                  </div>
                  <span className="mr-1 shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Selected</span>
                  <button type="button" onClick={() => { setForm({ ...form, project: "", student: "" }); setScopePickerOpen(true); }} className="shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700">Change</button>
                </div>
              )}
            </fieldset>
            <button type="submit" disabled={form.scope !== "global" && !selectedScope} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{editingId ? "Save changes" : "Create deadline"}</button>
          </form>
        </section>
      )}
      <section className="order-2 min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm lg:max-h-[calc(100vh-220px)] lg:overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">All deadlines</h2>
            <p className="mt-1 text-xs text-slate-500">{visibleDeadlines.length} deadline{visibleDeadlines.length === 1 ? "" : "s"} shown</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["all", "All"],
              ["active", "Active"],
              ["overdue", "Overdue"],
              ["inactive", "Inactive"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${filter === value ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
          <span className="mr-1 text-xs font-semibold text-slate-500">View by scope:</span>
          {[
            ["all", "All"],
            ["global", "Global"],
            ["student", "Student"],
            ["project", "Project"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setScopeFilter(value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${scopeFilter === value ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading deadlines...</div>
        ) : visibleDeadlines.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
            <div className="empty-state-icon-3d relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-blue-100 via-indigo-50 to-violet-100 text-blue-600 shadow-inner">
              <div className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shadow-sm">
                <Clock3 size={17} />
              </div>
              <CalendarDays size={46} strokeWidth={1.5} />
              <div className="absolute bottom-4 left-5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <div className="absolute bottom-4 right-5 h-1.5 w-1.5 rounded-full bg-violet-400" />
            </div>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <CalendarClock size={13} />
              Nothing scheduled
            </div>
            <h3 className="mt-3 text-lg font-bold text-slate-800">No deadlines in this view</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Create a milestone from the panel on the left, or choose a different filter to view other deadlines.
            </p>
          </div>
        ) : (
          <div className="max-h-[calc(100vh-245px)] divide-y divide-slate-100 overflow-y-auto">
            {visibleDeadlines.map((deadline) => {
              const overdue = deadline.isActive && isOverdue(deadline);
              const projectTitle = deadline.project?.title;
              const studentName = deadline.student?.name;
              return (
                <article key={deadline._id} className="flex flex-col gap-4 p-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={`mt-0.5 rounded-xl p-2.5 ${overdue ? "bg-rose-50 text-rose-600" : deadline.isActive ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                      {overdue ? <AlertCircle size={18} /> : <Clock3 size={18} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`font-semibold ${deadline.isActive ? "text-slate-800" : "text-slate-500"}`}>{deadline.name}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${overdue ? "bg-rose-50 text-rose-700" : deadline.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {overdue ? "Overdue" : deadline.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1"><CalendarClock size={13} /> {formatDate(deadline.dueDate)}</span>
                        <span className="inline-flex items-center gap-1">{projectTitle ? <><Edit3 size={13} /> {projectTitle}</> : studentName ? <><UserRound size={13} /> {studentName}</> : <><Globe2 size={13} /> Global deadline</>}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 sm:pl-4">
                    <button type="button" onClick={() => dispatch(toggleDeadline(deadline._id))} className={`rounded-lg px-3 py-2 text-xs font-semibold ${deadline.isActive ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}>
                      {deadline.isActive ? "Mark inactive" : "Activate"}
                    </button>
                    <button type="button" aria-label={`Edit ${deadline.name}`} onClick={() => edit(deadline)} className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"><Edit3 size={16} /></button>
                    <button type="button" aria-label={`Delete ${deadline.name}`} onClick={() => remove(deadline)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16} /></button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Legacy modal markup retained below for reference; the inline workspace above is used. {false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
          <form onSubmit={submit} className="flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{editingId ? "Edit deadline" : "New deadline"}</p><h2 className="mt-1 text-xl font-bold text-slate-800">{editingId ? "Update milestone" : "Set a milestone"}</h2></div>
              <button type="button" onClick={closeForm} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="mt-5 min-h-0 space-y-4 overflow-y-auto pr-1">
              <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Title</span><input required maxLength={100} className="input" placeholder="e.g. Final report submission" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
              <div className="relative">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Due date and time</span>
                <div className="grid grid-cols-[1fr_126px] gap-2">
                  <button type="button" onClick={() => setCalendarOpen((open) => !open)} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-left text-sm hover:border-blue-400">
                    <CalendarDays size={18} className="text-blue-600" />
                    <span className={selectedDate ? "text-slate-700" : "text-slate-400"}>{selectedDate ? new Date(`${selectedDate}T12:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "Choose a date"}</span>
                  </button>
                  <input required type="time" className="input" value={selectedTime} onChange={(event) => updateDateTime(selectedDate || new Date().toISOString().slice(0, 10), event.target.value)} />
                </div>
                <p className="mt-1.5 text-xs text-slate-400">Pick a date from the calendar, then set the deadline time.</p>
                {calendarOpen && (
                  <div className="absolute left-0 top-[88px] z-10 w-[min(100%,320px)] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                    <div className="flex items-center justify-between">
                      <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><ChevronLeft size={17} /></button>
                      <p className="text-sm font-semibold text-slate-700">{calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p>
                      <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><ChevronRight size={17} /></button>
                    </div>
                    <div className="mt-3 grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <span key={day}>{day}</span>)}</div>
                    <div className="mt-1 grid grid-cols-7 gap-1">
                      {calendarDays.map((day) => {
                        const dayValue = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
                        const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
                        const isSelected = dayValue === selectedDate;
                        const isPast = dayValue < new Date().toISOString().slice(0, 10);
                        return <button key={dayValue} type="button" disabled={isPast} onClick={() => { updateDateTime(day); setCalendarOpen(false); }} className={`rounded-lg py-1.5 text-xs ${isSelected ? "bg-blue-600 font-bold text-white" : isCurrentMonth ? "text-slate-700 hover:bg-blue-50" : "text-slate-300"} disabled:cursor-not-allowed disabled:text-slate-200`}>{day.getDate()}</button>;
                      })}
                    </div>
                  </div>
                )}
                </div>
              </div>
              <fieldset>
                <legend className="mb-2 block text-sm font-medium text-slate-700">Who should see this deadline?</legend>
                <div className="grid grid-cols-3 gap-2">
                  {[["global", "Everyone", Globe2], ["student", "Student", UserRound], ["project", "Project", Edit3]].map(([value, label, Icon]) => {
                    const ScopeIcon = Icon;
                    return <button key={value} type="button" onClick={() => { setForm({ ...form, scope: value, project: "", student: "" }); setScopeSearch(""); }} className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-xs font-semibold transition ${form.scope === value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}><ScopeIcon size={17} />{label}</button>;
                  })}
                </div>
                {form.scope !== "global" && (
                  <div className="mt-3 h-56 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3">
                    {selectedScope ? (
                      <div className="flex h-full items-center justify-between gap-3 rounded-lg border border-blue-100 bg-white px-3 py-2">
                        <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-700">{form.scope === "student" ? selectedScope.name : selectedScope.title}</p><p className="truncate text-xs text-slate-500">{form.scope === "student" ? selectedScope.email : selectedScope.student?.name || "Project scope"}</p></div>
                        <button type="button" onClick={() => setForm({ ...form, project: "", student: "" })} className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-800">Change</button>
                      </div>
                    ) : (
                      <>
                        <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={15} /><input className="input pl-9" placeholder={`Search ${form.scope === "student" ? "name, email or department" : "project title or student"}`} value={scopeSearch} onChange={(event) => setScopeSearch(event.target.value)} /></div>
                        <div className="mt-2 h-[164px] space-y-1 overflow-y-auto pr-1">
                          {scopeOptions.length ? scopeOptions.map((item) => (
                            <button key={item._id} type="button" onClick={() => { setForm({ ...form, project: form.scope === "project" ? item._id : "", student: form.scope === "student" ? item._id : "" }); setScopeSearch(""); }} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-white">
                              <span className="min-w-0"><span className="block truncate text-sm font-medium text-slate-700">{form.scope === "student" ? item.name : item.title}</span><span className="block truncate text-xs text-slate-500">{form.scope === "student" ? item.email : item.student?.name || "Project"}</span></span><span className="ml-3 shrink-0 text-xs font-semibold text-blue-600">Select</span>
                            </button>
                          )) : <p className="px-2 py-3 text-center text-xs text-slate-500">No matching {form.scope}s found.</p>}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </fieldset>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" onClick={closeForm} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button type="submit" disabled={form.scope !== "global" && !selectedScope} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{editingId ? "Save changes" : "Create deadline"}</button></div>
          </form>
        </div>
      )} */}
        {scopePickerOpen && form.scope !== "global" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
            <div className="flex max-h-[min(620px,calc(100vh-2rem))] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Deadline scope</p><h2 className="mt-1 text-xl font-bold text-slate-800">Select {form.scope}</h2><p className="mt-1 text-sm text-slate-500">Search by {form.scope === "student" ? "name, email, or department" : "project title or student name"}.</p></div>
                <button type="button" onClick={() => setScopePickerOpen(false)} className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100">Close</button>
              </div>
              <div className="border-b border-slate-100 p-4">
                <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={16} /><input autoFocus className="input pl-9" placeholder={`Search ${form.scope}`} value={scopeSearch} onChange={(event) => setScopeSearch(event.target.value)} /></div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {scopeOptions.length ? scopeOptions.map((item) => (
                  <button key={item._id} type="button" onClick={() => { setForm({ ...form, project: form.scope === "project" ? item._id : "", student: form.scope === "student" ? item._id : "" }); setScopePickerOpen(false); setScopeSearch(""); }} className="flex w-full items-center justify-between gap-4 rounded-xl px-4 py-3 text-left hover:bg-blue-50">
                    <span className="min-w-0"><span className="block truncate font-semibold text-slate-700">{form.scope === "student" ? item.name : item.title}</span><span className="mt-1 block truncate text-xs text-slate-500">{form.scope === "student" ? `${item.email} · ${item.department || "No department"}` : item.student?.name || "Project"}</span></span>
                    <span className="shrink-0 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">Select</span>
                  </button>
                )) : <div className="p-10 text-center text-sm text-slate-500">No matching {form.scope}s found.</div>}
              </div>
            </div>
          </div>
        )}
        {deadlineToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-deadline-title">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle size={22} />
              </div>
              <h2 id="delete-deadline-title" className="mt-4 text-lg font-bold text-slate-800">Delete deadline?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                <span className="font-semibold text-slate-700">{deadlineToDelete.name}</span> will be permanently removed. This action cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setDeadlineToDelete(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="button" onClick={confirmRemove} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">Delete deadline</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeadlinesPage;
