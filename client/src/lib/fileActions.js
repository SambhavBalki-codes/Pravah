
import { axiosInstance } from "./axios";

export const openTeacherFile = async ({
  projectId,
  fileId,
  name,
  mode = "view",
}) => {
  const res = await axiosInstance.get(
    `/teacher/projects/${projectId}/files/${fileId}`
  );

  const { fileUrl, originalName } = res.data.data;

  if (!fileUrl) {
    throw new Error("File URL is missing from the server response");
  }

  if (mode === "download") {
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = originalName || name || "download";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } else {
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  }
};
