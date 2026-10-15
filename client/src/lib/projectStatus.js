import { axiosInstance } from "./axios";

// What a teacher can do next, by current project status. Must match canTeacherChangeStatus on the server.
export const TEACHER_ACTIONS = {
  approved: [{ status: "in_progress", label: "Start work", tone: "blue" }],
  in_progress: [
    {
      status: "completed",
      label: "Mark completed",
      tone: "green",
      confirm: "Mark this project as completed? The student will no longer be able to upload or delete files.",
    },
  ],
  revision_required: [{ status: "in_progress", label: "Resume work", tone: "blue" }],
};

export const changeProjectStatus = (projectId, status) =>
  axiosInstance.put(`/teacher/projects/${projectId}/status`, { status }).then((r) => r.data);