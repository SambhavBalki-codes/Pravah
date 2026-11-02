import { useEffect, useState } from "react";
import { Check, ExternalLink, Loader2, RefreshCw, X } from "lucide-react";
import { axiosInstance } from "../../lib/axios";
import appToast from "../../lib/toast";

const PublicationRequests = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const load = async () => {
    try {
      const response = await axiosInstance.get("/admin/projects/publication-requests");
      setProjects(response.data.data.projects || []);
    } catch (error) {
      appToast.error(error.response?.data?.message || "Unable to load publication requests.");
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const decide = async (projectId, status) => {
    let rejectionReason;
    if (status === "rejected") {
      rejectionReason = window.prompt("Reason for rejection:");
      if (!rejectionReason?.trim()) return;
    }
    setBusy(projectId);
    try {
      await axiosInstance.patch(`/admin/projects/${projectId}/publication`, { status, rejectionReason });
      appToast.success(`Publication ${status}`);
      await load();
    } catch (error) { appToast.error(error.response?.data?.message || "Unable to update publication."); } finally { setBusy(""); }
  };
  return <div className="mx-auto max-w-6xl space-y-5"><header className="flex flex-wrap items-end justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Admin review</p><h1 className="mt-2 text-2xl font-black text-slate-800">Publication requests</h1></div><button onClick={() => { setLoading(true); load(); }} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600"><RefreshCw size={16} /> Refresh</button></header>{loading ? <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">Loading requests...</div> : projects.length === 0 ? <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">No pending publication requests.</div> : <div className="space-y-4">{projects.map((project) => <article key={project._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-slate-800">{project.title}</h2><p className="mt-1 text-sm text-slate-500">{project.student?.name} · {project.department || project.student?.department || "Department not set"}</p><p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{project.description}</p></div>{project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600">GitHub <ExternalLink size={14} /></a>}</div><div className="mt-5 flex gap-2"><button disabled={busy === project._id} onClick={() => decide(project._id, "approved")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy === project._id ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Approve and index</button><button disabled={busy === project._id} onClick={() => decide(project._id, "rejected")} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-600 disabled:opacity-50"><X size={16} /> Reject</button></div></article>)}</div>}</div>;
};

export default PublicationRequests;
