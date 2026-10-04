export const projectStatuses = [
  "pending",
  "approved",
  "in_progress",
  "revision_required",
  "rejected",
  "completed",
];

const allowedTransitions = {
  pending: ["approved", "rejected"],
  approved: ["in_progress", "rejected"],
  in_progress: ["revision_required", "completed", "rejected"],
  revision_required: ["in_progress", "rejected"],
  in_progress: ["revision_required", "completed"],
  revision_required: ["in_progress"],
  rejected: [],
  completed: [],
};

export const isValidProjectStatusTransition = (currentStatus, nextStatus) =>
  allowedTransitions[currentStatus]?.includes(nextStatus) ?? false;
