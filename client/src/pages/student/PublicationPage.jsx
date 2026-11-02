import { useEffect, useState } from "react";
import { Github, Loader2, Send } from "lucide-react";
import { axiosInstance } from "../../lib/axios";
import appToast from "../../lib/toast";

const PublicationPage = () => {
  const [project, setProject] = useState(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const response = await axiosInstance.get("/student/project");
      const value = response.data.data?.project || null;
      setProject(value);
      setGithubUrl(value?.githubUrl || "");
    } catch (error) {
      appToast.error(error.response?.data?.message || "Unable to load project.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await axiosInstance.post("/student/publication-request", { githubUrl });
      appToast.success(response.data.message);
      await load();
    } catch (error) {
      appToast.error(error.response?.data?.message || "Unable to submit publication request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">Loading publication settings...</div>;
  if (!project) return <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">Complete a project before requesting publication.</div>;

  const status = project.publicationStatus || "private";
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Public showcase</p><h1 className="mt-2 text-2xl font-black text-slate-800">{project.title}</h1><p className="mt-2 text-sm text-slate-500">Share your completed project with visitors and make its documents available to the project AI assistant.</p></header>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-bold text-slate-800">Publication status</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-600">{status}</span></div><p className="mt-3 text-sm text-slate-500">{status === "requested" ? "Your request is waiting for admin approval." : status === "approved" ? `Your project is public. RAG status: ${project.ragStatus || "queued"}.` : "Add your repository and submit the project for approval."}</p>{status !== "approved" && <form onSubmit={submit} className="mt-5 space-y-4"><label className="block text-sm font-semibold text-slate-700">GitHub repository URL<div className="relative mt-2"><Github className="absolute left-3 top-3 h-5 w-5 text-slate-400" /><input required type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/you/project" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-indigo-400" /></div></label><button disabled={submitting || status === "requested" || project.status !== "completed"} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{submitting ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />} Request publication</button>{project.status !== "completed" && <p className="text-xs text-amber-600">Publication is available after the project is marked completed.</p>}</form>}</section>
    </div>
  );
};

export default PublicationPage;
