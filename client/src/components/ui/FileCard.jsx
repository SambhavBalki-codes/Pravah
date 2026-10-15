import { FileText } from "lucide-react";
import { fileExt, formatDateTime, formatSize } from "../../lib/format";
import { ReviewBadge } from "../shared/Badges";

// file: { name, fileSize, version, uploadedAt, reviewStatus }. actions: buttons shown on the right.
const FileCard = ({ file, actions, meta }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 py-3">
    <div className="flex min-w-0 items-center gap-3">
      <FileText className="h-8 w-8 shrink-0 text-slate-400" aria-hidden="true" />
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <span className="truncate">{file.name}</span>
          {file.version > 0 && (
            <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-bold text-violet-700 ring-1 ring-inset ring-violet-200">
              v{file.version}
            </span>
          )}
        </p>
        <p className="text-xs text-slate-400">
          {fileExt(file.name)} · {formatSize(file.fileSize)} · {formatDateTime(file.uploadedAt)}
        </p>
        {meta && <p className="text-xs text-slate-500">{meta}</p>}
      </div>
    </div>
    <div className="flex items-center gap-2">
      {file.reviewStatus && <ReviewBadge value={file.reviewStatus} />}
      {actions}
    </div>
  </div>
);

export default FileCard;