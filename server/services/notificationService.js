import { Notification } from "../models/notifications.js";
import User from "../models/user.js";

export const createNotification = async (notificationData) => {
  const newNotification = new Notification(notificationData);
  return await newNotification.save();
};

export const notifyUser = async (
  userId,
  message,
  type = "general",
  link = null,
  priority = "low",
) => {
  return await createNotification({
    user: userId,
    message,
    type,
    link,
    priority,
  });
};

// Same message to several people. Duplicate ids are removed.
export const notifyUsers = async (
  userIds,
  message,
  type = "general",
  link = null,
  priority = "low",
) => {
  const ids = [...new Set(userIds.filter(Boolean).map(String))];
  if (!ids.length) return [];
  return await Notification.insertMany(
    ids.map((user) => ({ user, message, type, link, priority })),
  );
};

export const notifyAdmins = async (message, type = "general", link = null, priority = "low") => {
  const admins = await User.find({ role: "Admin" }).select("_id").lean();
  return await notifyUsers(
    admins.map((admin) => admin._id),
    message,
    type,
    link,
    priority,
  );
};

// A failed notification must never break the action that triggered it
export const safeNotify = async (send) => {
  try {
    await send();
  } catch (error) {
    console.error("Notification failed:", error.message);
  }
};