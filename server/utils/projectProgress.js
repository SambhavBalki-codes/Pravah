const toPlain = (doc) => (doc && typeof doc.toObject === "function" ? doc.toObject() : doc);

// fileUrl is a server path, so it is never sent to the browser
export const serializeFile = (file) => {
  const f = toPlain(file);
  return {
    _id: f._id,
    name: f.originalName,
    fileType: f.fileType,
    fileSize: f.fileSize || 0,
    version: f.version || 1,
    uploadedAt: f.uploadedAt || null,
    reviewStatus: f.reviewStatus || "pending",
    reviewedAt: f.reviewedAt || null,
  };
};

export const serializeFeedback = (fb) => ({
  _id: fb._id,
  title: fb.title,
  message: fb.message,
  type: fb.type || "general",
  requiresRevision: Boolean(fb.requiresRevision),
  isRead: Boolean(fb.isRead),
  fileId: fb.fileId || null,
  replies: (fb.replies || []).map((r) => ({
    _id: r._id,
    role: r.role,
    message: r.message,
    createdAt: r.createdAt || null,
  })),
  createdAt: fb.createdAt || null,
  teacher: fb.supervisorId?.name ? fb.supervisorId : null,
});

export const getLastFile = (files = []) =>
  files.reduce(
    (latest, f) =>
      !latest || new Date(f.uploadedAt || 0) > new Date(latest.uploadedAt || 0) ? f : latest,
    null,
  );

export const getLastFeedbackDate = (feedbacks = []) =>
  feedbacks.reduce((latest, f) => {
    if (!f.createdAt) return latest;
    const d = new Date(f.createdAt);
    return !latest || d > latest ? d : latest;
  }, null);

export const countPendingFiles = (files = []) =>
  files.filter((f) => !f.reviewStatus || f.reviewStatus === "pending").length;

export const getProgressState = (project) => {
  if (!project) return "no_project";
  if (project.status === "completed") return "completed";
  if (project.status === "rejected") return "rejected";
  if (project.status === "revision_required") return "revision_required";
  if (["pending", "under_review"].includes(project.status)) return "awaiting_approval";
  const files = project.files || [];
  if (files.length === 0) return "awaiting_files";
  if (countPendingFiles(files) > 0) return "needs_review";
  return "in_progress";
};

const STUDENT_STEPS = [
  ["submitted", "Proposal submitted"],
  ["supervisor", "Supervisor assigned"],
  ["approved", "Project approved"],
  ["working", "Work in progress"],
  ["files", "Files submitted"],
  ["feedback", "Feedback received"],
  ["revision", "Final revision"],
  ["completed", "Completed"],
];

export const getStudentProgress = (project) => {
  if (!project) {
    return {
      steps: STUDENT_STEPS.map(([key, label]) => ({ key, label, state: "upcoming" })),
      percent: 0,
      rejected: false,
    };
  }

  const status = project.status;
  const files = project.files || [];
  const feedbacks = project.feedbacks || [];
  const rejected = status === "rejected";
  const approved = ["approved", "in_progress", "revision_required", "completed"].includes(status);
  const completed = status === "completed";
  const working =
    ["in_progress", "revision_required", "completed"].includes(status) ||
    (approved && files.length > 0);

  const done = rejected
    ? [true, false, false, false, false, false, false, false]
    : [
        true,
        Boolean(project.supervisor),
        approved,
        working,
        files.length > 0,
        feedbacks.length > 0,
        completed,
        completed,
      ];

  const current = rejected ? -1 : done.findIndex((d) => !d);

  return {
    steps: STUDENT_STEPS.map(([key, label], i) => ({
      key,
      label,
      state: done[i] ? "done" : i === current ? "current" : "upcoming",
    })),
    percent: Math.round((done.filter(Boolean).length / STUDENT_STEPS.length) * 100),
    rejected,
  };
};