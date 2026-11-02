import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, CalendarDays, Github, Search, Sparkles } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPublicProjects } from "../../store/slices/visitorSlice";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";

const VisitorGallery = () => {
  const dispatch = useDispatch();
  const { projects, pagination, loading, error } = useSelector((state) => state.visitor);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => dispatch(fetchPublicProjects({ search, page, limit: 12 })), 250);
    return () => clearTimeout(timer);
  }, [dispatch, search, page]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <header className="mx-auto max-w-7xl rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-700 to-cyan-600 p-8 text-white shadow-xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Pravah public gallery</p><h1 className="mt-2 text-3xl font-black">Discover student innovation</h1><p className="mt-2 max-w-2xl text-sm text-blue-100">Explore completed projects, browse their final files, and ask an AI assistant grounded in each project.</p></div>
          <Link to="/login" className="rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold backdrop-blur hover:bg-white/25">Standard sign in</Link>
        </div>
        <label className="relative mt-7 block max-w-xl"><Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search completed projects..." className="w-full rounded-xl border-0 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none ring-2 ring-white/20" /></label>
      </header>
      <main className="mx-auto mt-7 max-w-7xl">
        {loading ? <LoadingState label="Loading project gallery..." /> : error ? <ErrorState error={error} onRetry={() => dispatch(fetchPublicProjects({ search, page, limit: 12 }))} /> : projects.length === 0 ? <EmptyState icon={Sparkles} title="No public projects yet" description="Completed projects will appear here after publication approval." /> : (
          <>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{projects.map((project) => <Link key={project._id} to={`/visitor/projects/${project._id}`} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"><div className="flex items-start justify-between gap-3"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Completed</span><Bot className={`h-5 w-5 ${project.ragStatus === "indexed" ? "text-indigo-600" : "text-slate-300"}`} /></div><h2 className="mt-4 text-xl font-bold text-slate-800 group-hover:text-indigo-700">{project.title}</h2><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{project.description}</p><div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-500"><span>{project.department || "General"}</span><span className="inline-flex items-center gap-1"><CalendarDays size={13} />{project.completedAt ? new Date(project.completedAt).toLocaleDateString() : "Completed"}</span>{project.githubUrl && <Github size={14} />}</div></Link>)}</div>
            {pagination?.pages > 1 && <div className="mt-7 flex justify-center gap-2">{Array.from({ length: pagination.pages }, (_, index) => index + 1).map((value) => <button key={value} onClick={() => setPage(value)} className={`rounded-lg px-3 py-2 text-sm font-bold ${page === value ? "bg-indigo-600 text-white" : "bg-white text-slate-600"}`}>{value}</button>)}</div>}
          </>
        )}
      </main>
    </div>
  );
};

export default VisitorGallery;
