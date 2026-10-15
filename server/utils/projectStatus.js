export const projectStatuses = [
  "pending",
  "under_review",
  "approved",
  "in_progress",
  "revision_required",
  "rejected",
  "completed",
];

// A student with a project in any of these statuses cannot submit another proposal
export const ACTIVE_PROJECT_STATUSES = [
  "pending",
  "under_review",
  "approved",
  "in_progress",
  "revision_required",
  "completed",
];

const allowedTransitions = {
  pending: ["under_review", "approved", "rejected"],
  under_review: ["approved", "rejected"],
  approved: ["in_progress"],
  in_progress: ["revision_required", "completed"],
  revision_required: ["in_progress"],
  rejected: [],
  completed: [],
};

export const isValidProjectStatusTransition = (currentStatus, nextStatus) =>
  allowedTransitions[currentStatus]?.includes(nextStatus) ?? false;


const teacherTransitions = {
  approved: ["in_progress"],
  in_progress: ["revision_required", "completed"],
  revision_required: ["in_progress"],
};

export const canTeacherChangeStatus = (currentStatus, nextStatus) =>
  teacherTransitions[currentStatus]?.includes(nextStatus) ?? false;