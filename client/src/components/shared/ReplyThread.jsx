import { useState } from "react";
import { CornerDownRight, Loader2, MessageCircle, Send } from "lucide-react";
import { formatDateTime } from "../../lib/format";

// viewer: "Student" or "Teacher". onSend(message) must return the saved reply.
const ReplyThread = ({
  replies = [],
  viewer,
  teacherName = "Supervisor",
  studentName = "Student",
  onSend,
}) => {
  const [added, setAdded] = useState([]);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const all = [...replies, ...added.filter((a) => !replies.some((r) => r._id === a._id))];

  const nameFor = (r) =>
    r.role === viewer ? "You" : r.role === "Teacher" ? teacherName : studentName;

  const send = async () => {
    const message = text.trim();
    if (!message) return setError("Please write a message.");
    setSending(true);
    setError("");
    try {
      const reply = await onSend(message);
      setAdded((prev) => [...prev, reply]);
      setText("");
      setOpen(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not send the reply. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      {all.length > 0 && (
        <div className="mb-3 space-y-2">
          {all.map((r) => {
            const mine = r.role === viewer;
            return (
              <div
                key={r._id}
                className={`flex gap-2 rounded-2xl p-3 text-sm ${
                  mine ? "bg-blue-50/70" : "bg-slate-50"
                }`}
              >
                <CornerDownRight size={15} className="mt-0.5 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">
                    <span className="font-bold text-slate-700">{nameFor(r)}</span> ·{" "}
                    {formatDateTime(r.createdAt)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-slate-600">{r.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline"
        >
          <MessageCircle size={15} />
          {viewer === "Student" ? "Reply or ask a question" : "Reply"}
        </button>
      ) : (
        <div className="space-y-2">
          <textarea
            rows={3}
            maxLength={1000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending}
            placeholder={
              viewer === "Student"
                ? "Ask for clarification or reply to your supervisor"
                : "Reply to the student"
            }
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-slate-400">{text.length}/1000</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setError("");
                }}
                disabled={sending}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={send}
                disabled={sending}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Send reply
              </button>
            </div>
          </div>
          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
        </div>
      )}
    </div>
  );
};

export default ReplyThread;