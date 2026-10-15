import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import { Notification } from "../models/notifications.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";

const TYPES = [
  "request",
  "approval",
  "rejection",
  "feedback",
  "deadline",
  "general",
  "meeting",
  "system",
  "project",
];

export const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const own = { user: req.user._id };

  const query = { ...own };
  if (TYPES.includes(req.query.type)) query.type = req.query.type;
  if (req.query.status === "unread") query.isRead = false;
  if (req.query.status === "read") query.isRead = true;

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [notifications, total, all, unread, highPriority, thisWeek] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(query),
    Notification.countDocuments(own),
    Notification.countDocuments({ ...own, isRead: false }),
    Notification.countDocuments({ ...own, priority: "high" }),
    Notification.countDocuments({ ...own, createdAt: { $gte: weekAgo } }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      notifications,
      pagination: getPaginationMeta(page, limit, total),
      summary: { total: all, unread, read: all - unread, highPriority, thisWeek },
    },
    message: "Notifications fetched successfully",
  });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
  res.status(200).json({
    success: true,
    message: "Unread count fetched successfully",
    data: { count },
  });
});

export const markNotificationRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: { isRead: true } },
  );
  if (!notification) return next(new ErrorHandler("Notification not found", 404));

  res.status(200).json({ success: true, message: "Notification marked as read", data: {} });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { $set: { isRead: true } });
  res.status(200).json({ success: true, message: "All notifications marked as read", data: {} });
});

export const deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!notification) return next(new ErrorHandler("Notification not found", 404));

  res.status(200).json({ success: true, message: "Notification deleted", data: {} });
});