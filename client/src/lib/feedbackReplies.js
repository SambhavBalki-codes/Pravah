import { axiosInstance } from "./axios";

export const studentReply = (feedbackId, message) =>
  axiosInstance
    .post(`/student/feedback/${feedbackId}/reply`, { message })
    .then((r) => r.data.data.reply);

export const teacherReply = (projectId, feedbackId, message) =>
  axiosInstance
    .post(`/teacher/projects/${projectId}/feedback/${feedbackId}/reply`, { message })
    .then((r) => r.data.data.reply);