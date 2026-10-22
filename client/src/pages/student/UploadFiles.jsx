import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Archive,
  Code2,
  Download,
  Eye,
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  Info,
  Loader2,
  Lock,
  Presentation,
  RefreshCw,
  Trash2,
  Upload,
  UploadCloud,
  X,
} from "lucide-react";
import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
  MAX_FILES_PER_UPLOAD,
  apiError,
  deleteMyFile,
  downloadMyFile,
  fetchMyFiles,
  openMyFile,
  uploadMyFiles,
} from "../../lib/studentFiles";
import { fileExt, formatDateTime, formatSize } from "../../lib/format";
import { ReviewBadge, StatusBadge } from "../../components/shared/Badges";

const ICONS = {
  pdf: [FileText, "text-red-500"],
  doc: [FileText, "text-blue-500"],
  docx: [FileText, "text-blue-500"],
  txt: [FileText, "text-slate-500"],
  ppt: [Presentation, "text-orange-500"],
  pptx: [Presentation, "text-orange-500"],
  zip: [Archive, "text-slate-500"],
  rar: [Archive, "text-slate-500"],
  jpg: [ImageIcon, "text-emerald-500"],
  jpeg: [ImageIcon, "text-emerald-500"],
  png: [ImageIcon, "text-emerald-500"],
  gif: [ImageIcon, "text-emerald-500"],
  js: [Code2, "text-violet-500"],
  css: [Code2, "text-violet-500"],
  html: [Code2, "text-violet-500"],
  json: [Code2, "text-violet-500"],
};

const FileTypeIcon = ({ name }) => {
  const [Icon, color] =
    ICONS[name.split(".").pop().toLowerCase()] || [FileIcon, "text-slate-400"];
  return <Icon className={`h-8 w-8 shrink-0 ${color}`} />;
};

const extOf = (name) => `.${name.split(".").pop().toLowerCase()}`;
const sameFile = (a, b) =>
  a.name === b.name &&
  a.size === b.size &&
  a.lastModified === b.lastModified;

const Card = ({ title, action, children }) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
        {title}
      </h2>
      {action}
    </div>
    {children}
  </section>
);

const iconBtn =
  "rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50";

const UploadFiles = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState([]);
  const [pickErrors, setPickErrors] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deletingId, setDeletingId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const load = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    setError("");
    try {
      const result = await fetchMyFiles();
      setData(result);
    } catch (err) {
      setError(apiError(err, "Could not load your files"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);
  }, [load]);

  const project = data?.data?.project || null;
  const locked = Boolean(data?.data?.locked);
  const canUpload = Boolean(project) && !locked && !uploading;
  const allFiles = data?.data?.files || [];
  const summary = data?.data?.summary || {
    total: 0,
    pending: 0,
    reviewed: 0,
    revisionRequested: 0,
  };

  const nextVersion = (name) => {
    const versions = allFiles
      .filter((f) => f.name === name)
      .map((f) => f.version || 1);
    return versions.length ? Math.max(...versions) + 1 : 1;
  };

  const hasVersions = useMemo(() => {
    const names = allFiles.map((f) => f.name);
    return new Set(names).size !== names.length;
  }, [allFiles]);

  const visibleFiles = useMemo(() => {
    if (showHistory) return allFiles;
    const latest = new Map();
    allFiles.forEach((f) => {
      const current = latest.get(f.name);
      if (!current || f.version > current.version) latest.set(f.name, f);
    });
    return allFiles.filter((f) => latest.get(f.name)._id === f._id);
  }, [allFiles, showHistory]);

  const addFiles = (list) => {
    const problems = [];
    const accepted = [];
    const room = MAX_FILES_PER_UPLOAD - selected.length;

    Array.from(list).forEach((file) => {
      if (!ALLOWED_EXTENSIONS.includes(extOf(file.name))) {
        problems.push(`${file.name}: this file type is not allowed`);
      } else if (file.size === 0) {
        problems.push(`${file.name}: the file is empty`);
      } else if (file.size > MAX_FILE_SIZE) {
        problems.push(
          `${file.name}: larger than 10 MB (${formatSize(file.size)})`,
        );
      } else if (
        selected.some((s) => sameFile(s, file)) ||
        accepted.some((s) => sameFile(s, file))
      ) {
        problems.push(`${file.name}: already selected`);
      } else if (accepted.length >= room) {
        problems.push(
          `${file.name}: you can upload at most ${MAX_FILES_PER_UPLOAD} files at a time`,
        );
      } else {
        accepted.push(file);
      }
    });

    setPickErrors(problems);
    if (accepted.length) setSelected((prev) => [...prev, ...accepted]);
  };

  const handlePick = (e) => {
    addFiles(e.target.files || []);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (canUpload) addFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (!canUpload || !selected.length) return;
    setUploading(true);
    setProgress(0);
    try {
      await uploadMyFiles(project._id, selected, setProgress);
      toast.success(
        `${selected.length} file${selected.length === 1 ? "" : "s"} uploaded`,
      );
      setSelected([]);
      setPickErrors([]);
      await load();
    } catch (err) {
      toast.error(apiError(err, "Upload failed. Please try again."));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

 const handleOpen = async (file, mode) => {
  try {
    if (!file.fileUrl) {
      toast.error("Could not open the file. It may be missing on the server.");
      return;
    }
    if (mode === "download") {
      const a = document.createElement("a");
      a.href = file.fileUrl;
      a.download = file.name;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.open(file.fileUrl, "_blank");
    }
  } catch {
    toast.error("Could not open the file. It may be missing on the server.");
  }
};

  const handleDelete = async (file) => {
    if (
      !window.confirm(
        `Delete "${file.name}" (v${file.version})? This cannot be undone.`,
      )
    )
      return;
    setDeletingId(file._id);
    try {
      await deleteMyFile(project._id, file._id);
      toast.success("File deleted");
      await load();
    } catch (err) {
      toast.error(apiError(err, "Could not delete the file"));
    } finally {
      setDeletingId(null);
    }
  };

  const cards = [
    ["Total files", summary.total],
    ["Awaiting review", summary.pending],
    ["Reviewed", summary.reviewed],
    ["Revision requested", summary.revisionRequested],
  ];

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
        Loading your files...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
        {error}
        <button onClick={() => load(true)} className="font-semibold underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] space-y-5 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-5 rounded-3xl border border-slate-200 bg-gradient-to-r from-blue-50 via-white to-indigo-50 px-6 py-6 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Submission
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-800">
            Project files
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Upload your report, presentation and source code for supervisor
            review.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      {!project && (
        <div className="rounded-3xl border border-slate-200 bg-white p-14 text-center shadow-sm">
          <FileText className="mx-auto mb-3 text-slate-300" size={38} />
          <p className="font-semibold text-slate-700">No project yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Submit a project proposal before uploading files.
          </p>
          <Link
            to="/student/submit-proposal"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
          >
            Submit proposal
          </Link>
        </div>
      )}

      {project && (
        <>
          {locked && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <Lock size={20} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800">
                This project is <strong>{project.status}</strong>, so files can
                no longer be added or deleted. You can still view and download
                them.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {cards.map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  {label}
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-800">
                  {value ?? 0}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <Card title="Add files">
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (canUpload) setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`flex min-h-44 flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 text-center transition ${
                    !canUpload
                      ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                      : dragOver
                        ? "cursor-pointer border-blue-500 bg-blue-50"
                        : "cursor-pointer border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  <UploadCloud className="mb-2 h-9 w-9 text-blue-600" />
                  <span className="text-base font-semibold text-slate-700">
                    {dragOver ? "Drop to add files" : "Drag and drop files here"}
                  </span>
                  <span className="mt-1 text-sm text-slate-500">
                    or click to browse your device
                  </span>
                  <span className="mt-3 text-xs text-slate-400">
                    Up to {MAX_FILES_PER_UPLOAD} files, 10 MB each
                  </span>
                  <input
                    type="file"
                    multiple
                    accept={ALLOWED_EXTENSIONS.join(",")}
                    onChange={handlePick}
                    disabled={!canUpload}
                    className="hidden"
                  />
                </label>

                {pickErrors.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    <p className="font-bold">Some files were not added:</p>
                    <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs">
                      {pickErrors.map((msg) => (
                        <li key={msg}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selected.length > 0 && (
                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800">
                        Ready to upload
                      </h3>
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                        {selected.length} selected
                      </span>
                    </div>
                    {selected.map((file, index) => {
                      const version = nextVersion(file.name);
                      return (
                        <div
                          key={`${file.name}-${file.lastModified}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <FileTypeIcon name={file.name} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-700">
                                {file.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {formatSize(file.size)}
                                {version > 1 && (
                                  <span className="ml-2 font-semibold text-violet-600">
                                    Will be saved as v{version}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={uploading}
                            aria-label={`Remove ${file.name}`}
                            onClick={() =>
                              setSelected((prev) =>
                                prev.filter((_, i) => i !== index),
                              )
                            }
                            className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {uploading && (
                  <div className="mt-5">
                    <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500">
                      <span>
                        {progress < 100 ? "Uploading..." : "Finishing up..."}
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-5 flex justify-end border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={!canUpload || selected.length === 0}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploading ? "Uploading..." : "Upload selected files"}
                  </button>
                </div>
              </Card>

              <Card
                title={`Uploaded files (${visibleFiles.length})`}
                action={
                  hasVersions && (
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <input
                        type="checkbox"
                        checked={showHistory}
                        onChange={(e) => setShowHistory(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Show version history
                    </label>
                  )
                }
              >
                {!visibleFiles.length ? (
                  <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-slate-400">
                    <FileIcon size={26} className="text-slate-300" />
                    No files uploaded yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {visibleFiles.map((file) => (
                      <div
                        key={file._id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <FileTypeIcon name={file.name} />
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                              <span className="truncate">{file.name}</span>
                              <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-bold text-violet-700 ring-1 ring-inset ring-violet-200">
                                v{file.version}
                              </span>
                            </p>
                            <p className="text-xs text-slate-400">
                              {fileExt(file.name)} ·{" "}
                              {formatSize(file.fileSize)} ·{" "}
                              {formatDateTime(file.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ReviewBadge value={file.reviewStatus} />
                          <button
                            onClick={() => handleOpen(file, "view")}
                            title="View"
                            className={iconBtn}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleOpen(file, "download")}
                            title="Download"
                            className={iconBtn}
                          >
                            <Download size={15} />
                          </button>
                          {file.reviewStatus === "pending" && !locked ? (
                            <button
                              onClick={() => handleDelete(file)}
                              disabled={deletingId === file._id}
                              title="Delete (only before review)"
                              className={`${iconBtn} hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600`}
                            >
                              {deletingId === file._id ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <Trash2 size={15} />
                              )}
                            </button>
                          ) : (
                            <span
                              title="Files cannot be deleted after review"
                              className="p-2 text-slate-300"
                            >
                              <Lock size={15} />
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <aside className="space-y-5 self-start">
              <Card title="Current project">
                <p className="break-words text-sm font-semibold leading-6 text-slate-800">
                  {project.title}
                </p>
                <div className="mt-2">
                  <StatusBadge value={project.status} />
                </div>
              </Card>

              <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <div>
                    <h2 className="text-[0.9375rem] font-semibold text-blue-900">
                      File guidelines
                    </h2>
                    <ul className="mt-3 space-y-2 text-sm text-blue-800">
                      <li>Report: PDF, DOC, DOCX</li>
                      <li>Presentation: PPT, PPTX</li>
                      <li>Source code: ZIP, RAR</li>
                      <li>
                        Also allowed: JPG, PNG, GIF, TXT, JS, CSS, HTML, JSON
                      </li>
                      <li>Maximum 10 MB per file, 10 files at a time</li>
                      <li>
                        Uploading a file with the same name saves it as a new
                        version, for example after a revision request.
                      </li>
                      <li>
                        You can delete a file only until your supervisor reviews
                        it.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
};

export default UploadFiles;