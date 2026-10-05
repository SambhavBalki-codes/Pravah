import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { AlertTriangle, ArrowLeft, Download, Eye, MessageSquare } from "lucide-react";
import { addTeacherFeedback, fetchAssignedStudentDetail } from "../../store/slices/teacherSlice";
import { openTeacherFile } from "../../lib/fileActions";
import { fileExt, formatDate, formatDateTime, formatSize } from "../../lib/format";
import { FeedbackTypeBadge, ProgressBadge, ReviewBadge, StatusBadge } from "../../components/shared/Badges";
import FeedbackModal from "../../components/modal/FeedbackModal";
import { teacherReply } from "../../lib/feedbackReplies";
import ReplyThread from "../../components/shared/ReplyThread";

const Card = ({ title, children }) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{title}</h2>
    {children}
  </section>
);

const StudentDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { studentDetail: data, detailLoading, detailError } = useSelector((state) => state.teacher);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    dispatch(fetchAssignedStudentDetail(id));
  }, [dispatch, id]);

  const back = (
    <Link to="/teacher/assigned-students" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline">
      <ArrowLeft size={15} /> Back to assigned students
    </Link>
  );

  if (detailLoading || (!data && !detailError)) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">Loading student...</div>;
  }

  if (detailError) {
    return (
      <div className="space-y-4">
        {back}
        <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {detailError}
          <button onClick={() => dispatch(fetchAssignedStudentDetail(id))} className="font-semibold underline">Retry</button>
        </div>
      </div>
    );
  }

  const { student, project, progressState, nextDeadline } = data;

  const handleFile = async (file, mode) => {
    try {
      await openTeacherFile({ projectId: project._id, fileId: file._id, name: file.name, mode });
    } catch {
      toast.error("Could not open the file. It may be missing on the server.");
    }
  };

  const sendFeedback = async (values) => {
    await dispatch(addTeacherFeedback({ projectId: project._id, ...values })).unwrap();
    toast.success("Feedback sent");
    setShowModal(false);
    dispatch(fetchAssignedStudentDetail(id));
  };

  return (
    <div className="mx-auto max-w-[1000px] space-y-5 pb-10">
      {back}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">{student.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {student.email} · {student.department || "No department"}
            </p>
          </div>
          <ProgressBadge value={progressState} />
        </div>

        {project ? (
          <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800">{project.title}</h2>
              <StatusBadge value={project.status} />
            </div>
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">{project.description}</p>
            <div className="flex flex-wrap gap-6 text-sm text-slate-500">
              <span>Submitted: {formatDate(project.createdAt)}</span>
              <span>
                Next deadline: {nextDeadline ? `${nextDeadline.name} (${formatDate(nextDeadline.dueDate)})` : "—"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              <MessageSquare size={15} /> Give feedback
            </button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">This student has no active project.</p>
        )}
      </section>

      {project && (
        <>
          <Card title={`Files (${project.files.length})`}>
            {project.files.length === 0 ? (
              <p className="text-sm text-slate-500">No files uploaded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {project.files.map((file) => (
                  <div key={file._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-700">{file.name}</p>
                      <p className="text-xs text-slate-400">
                        {fileExt(file.name)} · {formatSize(file.fileSize)} · {formatDateTime(file.uploadedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ReviewBadge value={file.reviewStatus} />
                      <button onClick={() => handleFile(file, "view")} title="View" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><Eye size={15} /></button>
                      <button onClick={() => handleFile(file, "download")} title="Download" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><Download size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title={`Feedback history (${project.feedbacks.length})`}>
            {project.feedbacks.length === 0 ? (
              <p className="text-sm text-slate-500">You have not given feedback yet.</p>
            ) : (
              <div className="space-y-3">
                {project.feedbacks.map((fb) => (
                  <div key={fb._id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-800">{fb.title}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <FeedbackTypeBadge value={fb.type} />
                        {fb.requiresRevision && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 ring-1 ring-inset ring-violet-200">
                            <AlertTriangle size={12} /> Revision required
                          </span>
                        )}
                        <span className="text-xs text-slate-400">{fb.isRead ? "Read by student" : "Unread"}</span>
                      </div>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{fb.message}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      {fb.teacher?.name || "You"} · {formatDateTime(fb.createdAt)}
                    </p>
                    <ReplyThread
                      replies={fb.replies}
                      viewer="Teacher"
                      teacherName={fb.teacher?.name || "You"}
                      studentName={student.name}
                      onSend={(message) => teacherReply(project._id, fb._id, message)}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {showModal && (
        <FeedbackModal
          heading="Give feedback"
          subheading={`${student.name} — ${project.title}`}
          onClose={() => setShowModal(false)}
          onSubmit={sendFeedback}
        />
      )}
    </div>
  );
};

export default StudentDetail;