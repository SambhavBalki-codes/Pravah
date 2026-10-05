import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { errorText } from "../../lib/format";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100";
const labelClass = "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400";

// mode "feedback": full form. mode "revision": message only.
const FeedbackModal = ({ mode = "feedback", heading, subheading, onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("general");
  const [message, setMessage] = useState("");
  const [requiresRevision, setRequiresRevision] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isRevision = mode === "revision";

  const submit = async (event) => {
    event.preventDefault();
    if (!isRevision && title.trim().length < 2) return setError("Title must be at least 2 characters.");
    if (message.trim().length < 2) return setError("Message must be at least 2 characters.");

    setSaving(true);
    setError("");
    try {
      await onSubmit({
        title: title.trim(),
        type,
        message: message.trim(),
        requiresRevision,
      });
    } catch (err) {
      setError(errorText(err, "Could not send. Please try again."));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]" onMouseDown={onClose}>
      <form
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-800">{heading}</h2>
            {subheading && <p className="mt-1 truncate text-sm text-slate-500">{subheading}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700">
            <X size={19} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {!isRevision && (
            <>
              <div>
                <label className={labelClass}>Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="e.g. Chapter 2 review" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
                  <option value="general">General</option>
                  <option value="positive">Positive</option>
                  <option value="negative">Needs improvement</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className={labelClass}>{isRevision ? "What needs to be revised?" : "Message"}</label>
            <textarea
              rows={5}
              maxLength={1000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isRevision ? "Describe the changes the student should make" : "Write your feedback"}
              className={inputClass}
            />
            <p className="mt-1 text-right text-xs text-slate-400">{message.length}/1000</p>
          </div>

          {!isRevision && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={requiresRevision}
                onChange={(e) => setRequiresRevision(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              The student must revise their work
            </label>
          )}

          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {isRevision ? "Request revision" : "Send feedback"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FeedbackModal;