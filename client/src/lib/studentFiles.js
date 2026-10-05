import { axiosInstance } from "./axios";

// Must match server/middlewares/upload.js
export const ALLOWED_EXTENSIONS = [
  ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".zip", ".rar",
  ".jpg", ".jpeg", ".png", ".gif", ".txt", ".js", ".css", ".html", ".json",
];
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_FILES_PER_UPLOAD = 10;

export const apiError = (err, fallback) => err?.response?.data?.message || fallback;

export const fetchMyFiles = () =>
  axiosInstance.get("/student/my-files").then((r) => r.data.data);

export const uploadMyFiles = (projectId, files, onProgress) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  return axiosInstance
    .post(`/student/upload/${projectId}`, formData, {
      onUploadProgress: (event) => {
        if (event.total) onProgress?.(Math.round((event.loaded * 100) / event.total));
      },
    })
    .then((r) => r.data);
};

export const deleteMyFile = (projectId, fileId) =>
  axiosInstance.delete(`/student/files/${projectId}/${fileId}`).then((r) => r.data);

// mode: "view" opens in a new tab, "download" saves the file
export const openMyFile = async ({ projectId, fileId, name, mode }) => {
  const res = await axiosInstance.get(`/student/download/${projectId}/${fileId}`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(res.data);

  if (mode === "view") {
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return;
  }

  const link = document.createElement("a");
  link.href = url;
  link.download = name || "file";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};