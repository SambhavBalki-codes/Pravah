export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : "—";

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "—";

export const formatSize = (bytes) => {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i ? 1 : 0)} ${units[i]}`;
};

export const fileExt = (name = "") =>
  name.includes(".") ? name.split(".").pop().toUpperCase() : "FILE";

export const formatStatus = (status = "") =>
  status.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const errorText = (err, fallback = "Something went wrong") =>
  typeof err === "string" ? err : err?.message || fallback;