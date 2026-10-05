import { axiosInstance } from "./axios";

// mode: "view" opens in a new tab, "download" saves the file
export const openTeacherFile = async ({ projectId, fileId, name, mode }) => {
  const res = await axiosInstance.get(`/teacher/projects/${projectId}/files/${fileId}`, {
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