import { toast } from "react-toastify";

const MIN_TOAST_DURATION = 2500;
const MAX_TOAST_DURATION = 8000;
const TOAST_READING_TIME = 45;

const getToastDuration = (message) => {
  const messageLength = String(message ?? "").length;
  const duration = 1000 + messageLength * TOAST_READING_TIME;

  return Math.min(MAX_TOAST_DURATION, Math.max(MIN_TOAST_DURATION, duration));
};

const appToast = {
  success: (message, options = {}) =>
    toast.success(message, {
      ...options,
      autoClose: getToastDuration(message),
    }),
  error: (message, options = {}) =>
    toast.error(message, {
      ...options,
      autoClose: getToastDuration(message),
    }),
};

export default appToast;
