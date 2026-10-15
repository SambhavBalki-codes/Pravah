import mongoose from "mongoose";
import { Deadline } from "../models/deadline.js";
import { Project } from "../models/project.js";
import User from "../models/user.js";
import * as notificationService from "../services/notificationService.js";

const HOUR = 60 * 60 * 1000;
const CHECK_EVERY_MS = HOUR;
const FIRST_RUN_DELAY_MS = 15 * 1000;
const REMINDER_WINDOW_HOURS = 48;
const OVERDUE_LOOKBACK_DAYS = 7;

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const STUDENT_FIELDS = "name supervisor";

const getStudents = async (deadline) => {
  if (deadline.project) {
    const project = await Project.findById(deadline.project).select("student").lean();
    if (!project) return [];
    const student = await User.findOne({ _id: project.student, role: "Student" })
      .select(STUDENT_FIELDS)
      .lean();
    return student ? [student] : [];
  }
  if (deadline.student) {
    const student = await User.findOne({ _id: deadline.student, role: "Student" })
      .select(STUDENT_FIELDS)
      .lean();
    return student ? [student] : [];
  }
  return User.find({ role: "Student" }).select(STUDENT_FIELDS).lean();
};

const claim = (id, field) =>
  Deadline.findOneAndUpdate(
    { _id: id, [field]: null, isActive: { $ne: false } },
    { $set: { [field]: new Date() } },
  );

const release = (id, field) => Deadline.updateOne({ _id: id }, { $set: { [field]: null } });

const sendReminders = async (now) => {
  const upcoming = await Deadline.find({
    isActive: { $ne: false },
    reminderSentAt: null,
    dueDate: { $gt: now, $lte: new Date(now.getTime() + REMINDER_WINDOW_HOURS * HOUR) },
  }).lean();

  for (const deadline of upcoming) {
    if (!(await claim(deadline._id, "reminderSentAt"))) continue;
    try {
      const students = await getStudents(deadline);
      await notificationService.notifyUsers(
        students.map((s) => s._id),
        `Deadline "${deadline.name}" is due on ${formatDate(deadline.dueDate)}.`,
        "deadline",
        "/student",
        "medium",
      );
    } catch (error) {
      await release(deadline._id, "reminderSentAt");
      console.error("Deadline reminder failed:", error.message);
    }
  }
};

const nameList = (names) =>
  names.length <= 3
    ? names.join(", ")
    : `${names.slice(0, 3).join(", ")} and ${names.length - 3} more`;

const sendOverdueNotices = async (now) => {
  const overdue = await Deadline.find({
    isActive: { $ne: false },
    overdueNotifiedAt: null,
    dueDate: { $lt: now, $gte: new Date(now.getTime() - OVERDUE_LOOKBACK_DAYS * 24 * HOUR) },
  }).lean();

  for (const deadline of overdue) {
    if (!(await claim(deadline._id, "overdueNotifiedAt"))) continue;
    try {
      const students = await getStudents(deadline);

      await notificationService.notifyUsers(
        students.map((s) => s._id),
        `Deadline "${deadline.name}" was due on ${formatDate(deadline.dueDate)} and is now overdue.`,
        "deadline",
        "/student",
        "high",
      );

      const bySupervisor = new Map();
      students.forEach((s) => {
        if (!s.supervisor) return;
        const key = String(s.supervisor);
        bySupervisor.set(key, [...(bySupervisor.get(key) || []), s.name]);
      });
      for (const [supervisorId, names] of bySupervisor) {
        await notificationService.notifyUser(
          supervisorId,
          `Deadline "${deadline.name}" is now overdue for ${nameList(names)}.`,
          "deadline",
          "/teacher/assigned-students",
          "medium",
        );
      }
    } catch (error) {
      await release(deadline._id, "overdueNotifiedAt");
      console.error("Overdue notice failed:", error.message);
    }
  }
};

let running = false;

export const runDeadlineChecks = async () => {
  if (running || mongoose.connection.readyState !== 1) return;
  running = true;
  try {
    const now = new Date();
    await sendReminders(now);
    await sendOverdueNotices(now);
  } catch (error) {
    console.error("Deadline check failed:", error.message);
  } finally {
    running = false;
  }
};

export const startDeadlineReminders = () => {
  setTimeout(runDeadlineChecks, FIRST_RUN_DELAY_MS);
  setInterval(runDeadlineChecks, CHECK_EVERY_MS);
};