
import { axiosInstance } from "./axios";

export const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".zip",
  ".rar",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".txt",
  ".js",
  ".css",
  ".html",
  ".json",
];

export const MAX_FILES_PER_UPLOAD = 10;
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const apiError = (
  err,
  fallback = "Something went wrong"
) =>
  err?.response?.data?.message ||
  err?.message ||
  fallback;

export const fetchMyFiles = () =>
  axiosInstance
    .get("/student/my-files")
    .then((r) => r.data);

export const uploadMyFiles = (
  projectId,
  files,
  onProgress
) => {
  const form = new FormData();

  files.forEach((f) => form.append("files", f));

  return axiosInstance
    .post(`/student/upload/${projectId}`, form, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(
            Math.round((e.loaded / e.total) * 100)
          );
        }
      },
    })
    .then((r) => r.data);
};

export const deleteMyFile = (projectId, fileId) =>
  axiosInstance
    .delete(`/student/files/${projectId}/${fileId}`)
    .then((r) => r.data);

export const openMyFile = async (
  projectId,
  fileId
) => {
  const res = await axiosInstance.get(
    `/student/download/${projectId}/${fileId}`
  );

  window.open(res.data.data.fileUrl, "_blank");
};

export const downloadMyFile = async (
  projectId,
  fileId
) => {
  const res = await axiosInstance.get(
    `/student/download/${projectId}/${fileId}`
  );

  const { fileUrl, originalName } = res.data.data;

  const a = document.createElement("a");
  a.href = fileUrl;
  a.download = originalName;
  a.target = "_blank";

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
