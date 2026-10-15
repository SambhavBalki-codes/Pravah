import {
  Bell,
  CalendarClock,
  CheckCircle2,
  FileText,
  Info,
  MessageSquare,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { formatDate } from "./format";

export const NOTIFICATION_TYPES = {
  request: { label: "Request", icon: UserPlus, tone: "bg-blue-50 text-blue-600" },
  approval: { label: "Approval", icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600" },
  rejection: { label: "Rejection", icon: XCircle, tone: "bg-rose-50 text-rose-600" },
  feedback: { label: "Feedback", icon: MessageSquare, tone: "bg-violet-50 text-violet-600" },
  deadline: { label: "Deadline", icon: CalendarClock, tone: "bg-amber-50 text-amber-600" },
  project: { label: "Project", icon: FileText, tone: "bg-indigo-50 text-indigo-600" },
  meeting: { label: "Meeting", icon: Users, tone: "bg-cyan-50 text-cyan-600" },
  system: { label: "System", icon: Info, tone: "bg-slate-100 text-slate-600" },
  general: { label: "General", icon: Bell, tone: "bg-slate-100 text-slate-600" },
};

export const typeMeta = (type) => NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.general;

// Old notifications may point to routes that do not exist
export const resolveNotificationLink = (link) => {
  if (!link) return null;
  if (link.startsWith("/student/feedback")) return "/student/feedback";
  if (link === "/teacher/requests") return "/teacher/pending-requests";
  if (/^\/(student|teacher|admin)(\/|$)/.test(link)) return link;
  return null;
};

export const timeAgo = (value) => {
  if (!value) return "";
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(value);
};