import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bot, ExternalLink, FileText, Github, Send, UserRound } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  addMessage,
  appendAssistantMessage,
  fetchChatHistory,
  fetchPublicProject,
  setChatLoading,
} from "../../store/slices/visitorSlice";
import { axiosInstance } from "../../lib/axios";
import { LoadingState, ErrorState } from "../../components/ui/States";

const renderMessageContent = (content) =>
  content.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    const lines = part.split("\n");
    const rendered = lines.map((line, lineIndex) => (
      <span key={`${index}-${lineIndex}`}>
        {part.startsWith("**") && part.endsWith("**") ? (
          <strong>{line.slice(2, -2)}</strong>
        ) : (
          line
        )}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    ));
    return rendered;
  });

const VisitorProjectDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedProject, messages, projectLoading, error, chatLoading } = useSelector((state) => state.visitor);
  const { authUser } = useSelector((state) => state.auth);
  const ragStatus = selectedProject?.ragStatus;
  const [question, setQuestion] = useState("");
  const messagesEnd = useRef(null);

  useEffect(() => {
    dispatch(fetchPublicProject(id));
    if (authUser?.role === "Visitor") dispatch(fetchChatHistory(id));
  }, [dispatch, id, authUser]);

  useEffect(() => {
    if (!["queued", "processing"].includes(ragStatus)) {
      return undefined;
    }

    const timer = setInterval(() => {
      dispatch(fetchPublicProject(id));
    }, 5000);

    return () => clearInterval(timer);
  }, [dispatch, id, ragStatus]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const ask = async (event) => {
    event.preventDefault();
    if (!question.trim()) return;
    if (authUser?.role !== "Visitor") {
      navigate("/visitor/login", { state: { from: `/visitor/projects/${id}` } });
      return;
    }
    const text = question.trim();
    setQuestion("");
    dispatch(addMessage({ role: "user", content: text }));
    dispatch(addMessage({ role: "assistant", content: "" }));
    dispatch(setChatLoading(true));
    let reader;
    try {
      const response = await fetch(`${axiosInstance.defaults.baseURL}/visitor/projects/${id}/chat/stream`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Unable to get an AI response.");
      }
      if (!response.body) {
        throw new Error("The AI response stream was unavailable.");
      }
      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamError = null;
      const handleEvent = (event) => {
        const dataLine = event
          .split("\n")
          .find((line) => line.startsWith("data: "));
        if (!dataLine) return;

        let data;
        try {
          data = JSON.parse(dataLine.slice(6));
        } catch {
          return;
        }

        const eventType =
          event.split("\n").find((line) => line.startsWith("event: "))?.slice(7) ||
          "message";
        if (eventType === "error") {
          streamError = new Error(data?.message || "The AI assistant failed.");
        } else if (eventType === "message" && typeof data === "string") {
          dispatch(appendAssistantMessage(data));
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        events.forEach(handleEvent);
      }
      buffer += decoder.decode();
      if (buffer.trim()) handleEvent(buffer);
      if (streamError) throw streamError;
    } catch (streamError) {
      if (reader) await reader.cancel().catch(() => {});
      dispatch(
        appendAssistantMessage(
          `Sorry, ${streamError.message || "The AI assistant failed."}`,
        ),
      );
    } finally {
      dispatch(setChatLoading(false));
    }
  };

  if (projectLoading && !selectedProject) return <div className="min-h-screen bg-slate-50 p-8"><LoadingState label="Loading project..." /></div>;
  if (error && !selectedProject) return <div className="min-h-screen bg-slate-50 p-8"><ErrorState error={error} onRetry={() => dispatch(fetchPublicProject(id))} /></div>;
  if (!selectedProject) return null;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-8">
      <main className="mx-auto max-w-[1500px]">
        <Link to="/visitor/projects" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-600"><ArrowLeft size={16} /> Back to gallery</Link>
        <div className="grid gap-6 lg:grid-cols-[minmax(300px,0.75fr)_minmax(560px,1.25fr)]">
          <section className="space-y-4">
            <header className="rounded-3xl bg-white p-7 shadow-sm"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Completed project</span>{selectedProject.department && <span className="text-sm text-slate-500">{selectedProject.department}</span>}</div><h1 className="mt-4 text-3xl font-black text-slate-800">{selectedProject.title}</h1><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{selectedProject.description}</p><div className="mt-6 flex flex-wrap gap-3">{selectedProject.githubUrl && <a href={selectedProject.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"><Github size={16} /> GitHub repository <ExternalLink size={14} /></a>}<span className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-700"><UserRound size={16} /> {selectedProject.student?.name || "Student project"}</span></div></header>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-bold text-slate-800"><FileText className="text-indigo-600" size={20} /> Project files</h2><div className="mt-4 space-y-2">{selectedProject.files?.length ? selectedProject.files.map((file) => <a key={file._id} href={file.fileUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-sm hover:bg-slate-50"><span className="font-semibold text-slate-700">{file.originalName}</span><ExternalLink size={15} className="text-indigo-600" /></a>) : <p className="text-sm text-slate-500">No public files available.</p>}</div></section>
          </section>
          <section className="flex min-h-[620px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:min-h-0"><header className="flex shrink-0 items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-blue-50 p-6"><div className="rounded-xl bg-indigo-600 p-2 text-white"><Bot size={20} /></div><div><h2 className="font-bold text-slate-800">Project AI assistant</h2><p className="text-xs text-slate-500">{selectedProject.ragStatus === "indexed" ? "Grounded in this project's documents" : "Indexing is still in progress"}</p></div></header><div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">{messages.length === 0 && <div className="mt-24 text-center text-sm text-slate-400"><Bot className="mx-auto mb-3 text-indigo-300" size={34} /><p>Ask about the purpose, architecture, implementation, or technologies.</p></div>}{messages.map((message, index) => <div key={`${message.createdAt || index}-${index}`} className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "ml-auto bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}>{message.role === "assistant" ? renderMessageContent(message.content) : message.content}{message.sources?.length > 0 && <p className="mt-2 border-t border-slate-200 pt-2 text-xs text-slate-500">Sources: {message.sources.map((source) => source.fileName || source.title).filter(Boolean).join(", ")}</p>}</div>)}{chatLoading && <div className="w-fit rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500">Thinking...</div>}<div ref={messagesEnd} /></div><form onSubmit={ask} className="shrink-0 border-t border-slate-100 p-5"><div className="flex gap-2"><input value={question} onChange={(e) => setQuestion(e.target.value)} disabled={chatLoading || selectedProject.ragStatus !== "indexed"} placeholder={selectedProject.ragStatus === "indexed" ? "Ask a question..." : "AI assistant is indexing..."} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-400" /><button disabled={chatLoading || !question.trim() || selectedProject.ragStatus !== "indexed"} className="rounded-xl bg-indigo-600 px-4 text-white disabled:opacity-40"><Send size={17} /></button></div>{authUser?.role !== "Visitor" && <p className="mt-2 text-center text-xs text-slate-400">Sign in as a visitor to use the AI assistant.</p>}</form></section>
        </div>
      </main>
    </div>
  );
};

export default VisitorProjectDetail;
