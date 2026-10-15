import { AlertTriangle } from "lucide-react";
import Button from "./Button";
import Modal from "./Modal";

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) => (
  <Modal
    open={open}
    title={title}
    size="sm"
    dismissible={!loading}
    onClose={onCancel}
    footer={
      <>
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </>
    }
  >
    <div className="flex gap-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          tone === "danger" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
        }`}
      >
        <AlertTriangle size={20} aria-hidden="true" />
      </div>
      <div className="text-sm leading-6 text-slate-600">{message}</div>
    </div>
  </Modal>
);

export default ConfirmDialog;