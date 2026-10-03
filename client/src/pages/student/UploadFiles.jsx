import { createElement, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  Code2,
  Download,
  File,
  FileText,
  Info,
  Presentation,
  Upload,
  X,
} from "lucide-react";
import {
  fetchProject,
  uploadFiles,
  downloadFile,
} from "../../store/slices/studentSlice";
const UploadFiles = () => {
  const dispatch = useDispatch();

  const { project, files, loading } = useSelector((state) => state.student);

  const [selectedFiles, setSelectedFiles] = useState([]);

  const reportRef = useRef(null);
  const presRef = useRef(null);
  const codeRef = useRef(null);

  useEffect(() => {
    if (!project) {
      dispatch(fetchProject());
    }
  }, [dispatch, project]);

  const handleFilePick = (e) => {
    const list = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...list]);
    e.target.value = null;
  };

  const handleUpload = async () => {
    const activeProject = project;
    // if (!activeProject) {
    //   const action  = dispatch(fetchProject());
    //   if(fetchProject.fulfilled.match(action)){
    //     activeProject = action.payload?.project || action.payload;
    //   }
    // }
    if (!activeProject?._id) {
      toast.error("Project details are still loading.");
      return;
    }
    if (selectedFiles.length === 0) {
      toast.error("Select at least one file to upload.");
      return;
    }
    dispatch(
      uploadFiles({ projectId: activeProject._id, files: selectedFiles }),
    );
    setSelectedFiles([]);
  };

  const removeSelected = (name) => {
    setSelectedFiles((prev) => prev.filter((file) => file.name !== name));
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();
    const Icon = ({ className }) => <File className={className} />;
    const color =
      extension === "pdf"
        ? "text-red-500"
        : extension === "docx"
          ? "text-blue-500"
          : extension === "pptx"
            ? "text-orange-500"
            : extension === "zip"
              ? "text-gray-500"
              : "text-gray-400";
    return <Icon className={`w-8 h-8 ${color}`} />;
  };

  const fileInputs = [
    {
      label: "Report",
      formats: "(PDF, DOC, DOCX)",
      icon: FileText,
      ref: reportRef,
      accept: ".pdf,.doc,.docx",
    },
    {
      label: "Presentation",
      formats: "(PPT, PPTX)",
      icon: Presentation,
      ref: presRef,
      accept: ".ppt,.pptx",
    },
    {
      label: "Source code",
      formats: "(ZIP, RAR, 7Z)",
      icon: Code2,
      ref: codeRef,
      accept: ".zip,.rar,.7z",
    },
  ];

  const handleDownloadFile = async (file) => {
    if (!project?._id || !file?._id) {
      return;
    }
    const result = await dispatch(
      downloadFile({ projectId: project._id, fileId: file._id }),
    );

    if (!downloadFile.fulfilled.match(result)) {
      return;
    }

    const url = URL.createObjectURL(result.payload.blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: file.originalName || file.name || "downloaded_file",
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-lg bg-blue-100 p-3">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Upload Project Files
            </h1>
            <p className="mt-1 text-[0.9375rem] text-slate-500">
              Upload your report, presentation, and source code for supervisor
              review.
            </p>
          </div>
          <div className="ml-auto hidden rounded-lg bg-slate-50 px-4 py-2 text-right sm:block">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Current project
            </p>
            <p className="mt-1 max-w-56 truncate text-sm font-semibold text-slate-700">
              {project?.title || "Project not available"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-800">Add files</h2>
            <p className="mt-1 text-base text-slate-500">
              Choose one or more files from your device.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {fileInputs.map(({ label, formats, icon: Icon, ref, accept }) => (
              <label
                key={label}
                className="group flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-3 text-center transition hover:border-blue-400 hover:bg-blue-50"
              >
                {createElement(Icon, {
                  className: "mb-2 h-7 w-7 text-blue-600",
                })}
                <span className="text-base font-medium text-slate-700">
                  {label}
                </span>
                <span className="mt-1 text-sm text-slate-400">{formats}</span>
                <span className="mt-3 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition group-hover:bg-blue-700">
                  Choose file
                </span>
                <input
                  ref={ref}
                  type="file"
                  accept={accept}
                  multiple
                  onChange={handleFilePick}
                  className="hidden"
                />
              </label>
            ))}
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">Selected files</h2>
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                  {selectedFiles.length} selected
                </span>
              </div>
              <div className="space-y-2">
                {selectedFiles.map((file) => (
                  <div
                    key={`${file.name}-${file.lastModified}`}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {getFileIcon(file.name)}
                      <span className="truncate text-sm text-slate-700">
                        {file.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => removeSelected(file.name)}
                      className="ml-3 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                      <span>Remove</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={handleUpload}
              disabled={!project || selectedFiles.length === 0 || loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <Upload className="h-4 w-4" />
              {loading ? "Uploading..." : "Upload selected files"}
            </button>
          </div>

          {files.length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <h2 className="mb-3 font-semibold text-slate-800">
                Uploaded files
              </h2>
              <div className="space-y-2">
                {files.map((file, index) => {
                  const fileName =
                    typeof file === "string"
                      ? file.split("/").pop()
                      : file.originalName || file.name || "Uploaded file";
                  return (
                    <div
                      key={`${fileName}-${index}`}
                      className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
                    >
                      {getFileIcon(fileName)}
                      <span className="min-w-0 flex-1 truncate">
                        {fileName}
                      </span>
                      {typeof file !== "string" && file._id && (
                        <button
                          type="button"
                          aria-label={`Download ${fileName}`}
                          title={`Download ${fileName}`}
                          onClick={() => handleDownloadFile(file)}
                          className="ml-2 rounded-md p-1.5 text-slate-500 transition hover:bg-blue-100 hover:text-blue-600"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <aside className="self-start rounded-2xl border border-blue-200 bg-blue-50 p-4 md:p-5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div>
              <h2 className="text-[0.9375rem] font-semibold text-blue-900">
                File Guidelines
              </h2>
              <p className="mt-1 text-[0.9375rem] leading-6 text-blue-800">
                Keep your project files organized and ready for review.
              </p>
              <ul className="mt-3 space-y-2 text-sm text-blue-800">
                <li>Report: (PDF, DOC, DOCX)</li>
                <li>Presentation: (PPT, PPTX)</li>
                <li>Source code: (ZIP, RAR, 7Z)</li>
              </ul>
            </div>
          </div>
          {files.length === 0 && (
            <div className="mt-5 border-t border-blue-200 pt-5 text-center">
              <File className="mx-auto h-6 w-6 text-blue-400" />
              <p className="mt-2 text-sm font-medium text-blue-900">
                No files uploaded yet
              </p>
              <p className="mt-1 text-xs text-blue-700">
                Your uploaded files will appear here.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default UploadFiles;
