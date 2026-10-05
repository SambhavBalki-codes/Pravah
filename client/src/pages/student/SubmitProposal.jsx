import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  ArrowRight,
  FileText,
  Info,
  Lock,
  LoaderCircle,
  RotateCcw,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { fetchProject, submitProjectProposal } from "../../store/slices/studentSlice";
import { formatDateTime } from "../../lib/format";
import { StatusBadge } from "../../components/shared/Badges";

const TITLE_MIN = 3;
const TITLE_MAX = 200;
const DESC_MIN = 10;
const DESC_MAX = 2000;

const readDraft = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const inputClass =
  "w-full rounded-lg border bg-slate-50 px-3 py-2.5 text-[0.9375rem] text-slate-700 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60";

const SubmitProposal = () => {
  const dispatch = useDispatch();
  const { authUser } = useSelector((state) => state.auth);
  const { project } = useSelector((state) => state.student);

  const draftKey = `pravah:proposal-draft:${authUser?._id || authUser?.id || "me"}`;

  const [form, setForm] = useState(() => {
    const draft = readDraft(draftKey);
    return { title: draft?.title || "", description: draft?.description || "" };
  });
  const [savedAt, setSavedAt] = useState(() => readDraft(draftKey)?.savedAt || null);
  const [restored, setRestored] = useState(() => Boolean(readDraft(draftKey)));
  const [checked, setChecked] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchProject()).finally(() => setChecked(true));
  }, [dispatch]);

  const hasActive = Boolean(project) && project.status !== "rejected";
  const wasRejected = project?.status === "rejected";

  const title = form.title.trim();
  const description = form.description.trim();
  const errors = {
    title:
      title.length < TITLE_MIN
        ? `Title must be at least ${TITLE_MIN} characters.`
        : title.length > TITLE_MAX
          ? `Title cannot exceed ${TITLE_MAX} characters.`
          : "",
    description:
      description.length < DESC_MIN
        ? `Description must be at least ${DESC_MIN} characters.`
        : description.length > DESC_MAX
          ? `Description cannot exceed ${DESC_MAX} characters.`
          : "",
  };

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const saveDraft = () => {
    const now = new Date().toISOString();
    try {
      localStorage.setItem(draftKey, JSON.stringify({ ...form, savedAt: now }));
      setSavedAt(now);
      setRestored(false);
      toast.success("Draft saved on this device");
    } catch {
      toast.error("Could not save the draft in this browser");
    }
  };

  const discardDraft = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // ignore storage errors
    }
    setForm({ title: "", description: "" });
    setSavedAt(null);
    setRestored(false);
    setAttempted(false);
  };

  const reusePrevious = () => {
    setForm({ title: project.title || "", description: project.description || "" });
    setRestored(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAttempted(true);
    if (errors.title || errors.description) return;

    setSubmitting(true);
    try {
      await dispatch(submitProjectProposal({ title, description })).unwrap();
      discardDraft();
    } catch {
      // the thunk already shows the error toast
    } finally {
      setSubmitting(false);
    }
  };

  const locked = hasActive || submitting;
  const isEmpty = !form.title && !form.description;

  return (
    <div className="w-full space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-lg bg-blue-100 p-3">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {wasRejected ? "Resubmit Project Proposal" : "Submit Project Proposal"}
            </h1>
            <p className="mt-1 text-[0.9375rem] text-slate-500">
              Share a clear and detailed project idea for your supervisor to review.
            </p>
          </div>
        </div>
      </div>

      {!checked && !project ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
          Checking your project...
        </div>
      ) : (
        <>
          {hasActive && (
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex min-w-0 gap-3">
                <Lock size={20} className="mt-0.5 shrink-0 text-amber-600" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-amber-800">You already have an active proposal</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-700">
                    <span className="truncate font-semibold">{project.title}</span>
                    <StatusBadge value={project.status} />
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    A new proposal can only be submitted if the current one is rejected.
                  </p>
                </div>
              </div>
              <Link
                to="/student"
                className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline"
              >
                Go to dashboard <ArrowRight size={14} />
              </Link>
            </div>
          )}

          {wasRejected && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex gap-3">
                <AlertTriangle size={20} className="mt-0.5 shrink-0 text-rose-600" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-rose-800">Your previous proposal was rejected</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{project.title}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-rose-700">
                    <strong>Reason:</strong> {project.rejectionReason || "No reason was given."}
                  </p>
                  <button
                    type="button"
                    onClick={reusePrevious}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                  >
                    <RotateCcw size={14} /> Start from my previous proposal
                  </button>
                </div>
              </div>
            </div>
          )}

          {restored && !hasActive && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <span>Your saved draft was restored{savedAt ? ` (saved ${formatDateTime(savedAt)})` : ""}.</span>
              <button type="button" onClick={discardDraft} className="font-semibold underline">
                Discard draft
              </button>
            </div>
          )}

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <form
              onSubmit={handleSubmit}
              noValidate
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5"
            >
              <div className="space-y-5">
                <div>
                  <label htmlFor="title" className="mb-2 block text-[0.9375rem] font-medium text-slate-700">
                    Project Title
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={form.title}
                    onChange={handleChange}
                    disabled={locked}
                    placeholder="Enter your project title"
                    maxLength={TITLE_MAX}
                    className={`${inputClass} ${
                      attempted && errors.title
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                        : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                  />
                  <div className="mt-1 flex justify-between gap-3 text-xs">
                    <span className="text-rose-600">{attempted ? errors.title : ""}</span>
                    <span className="text-slate-400">
                      {form.title.length}/{TITLE_MAX}
                    </span>
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="mb-2 block text-[0.9375rem] font-medium text-slate-700">
                    Project Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    disabled={locked}
                    placeholder="Provide a detailed description of the problem, objectives, proposed approach, expected outcome, and project scope."
                    maxLength={DESC_MAX}
                    rows={8}
                    className={`${inputClass} resize-y ${
                      attempted && errors.description
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                        : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                  />
                  <div className="mt-1 flex justify-between gap-3 text-xs">
                    <span className="text-rose-600">{attempted ? errors.description : ""}</span>
                    <span className="text-slate-400">
                      {form.description.length}/{DESC_MAX}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-400">
                  {savedAt && !restored
                    ? `Draft saved ${formatDateTime(savedAt)} on this device.`
                    : "Drafts are saved in this browser only."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {savedAt && !hasActive && (
                    <button
                      type="button"
                      onClick={discardDraft}
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" /> Discard
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={saveDraft}
                    disabled={locked || isEmpty}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" /> Save draft
                  </button>
                  <button
                    type="submit"
                    disabled={locked}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {submitting ? "Submitting..." : wasRejected ? "Resubmit Proposal" : "Submit Proposal"}
                  </button>
                </div>
              </div>
            </form>

            <aside className="self-start rounded-2xl border border-blue-200 bg-blue-50 p-4 md:p-5">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <h2 className="text-[0.9375rem] font-semibold text-blue-900">Proposal Guidelines</h2>
                  <p className="mt-1 text-[0.9375rem] leading-6 text-blue-800">
                    Keep your proposal clear and concise. Include:
                  </p>
                  <ul className="mt-3 space-y-2 text-[0.9375rem] text-blue-800">
                    {[
                      "The problem your project will address",
                      "Your project objectives",
                      "Your proposed approach",
                      "The expected outcome and project scope",
                      "Key features or major project components",
                      "Relevant technologies or tools you plan to use",
                    ].map((item) => (
                      <li key={item} className="flex gap-2">
                        <span aria-hidden="true">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
};

export default SubmitProposal;