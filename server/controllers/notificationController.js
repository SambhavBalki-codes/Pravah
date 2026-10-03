import { asyncHandler } from "../middlewares/asyncHandler.js";
import { Notification } from "../models/notifications.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const query = { user: req.user._id };
  const [notifications, total] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      notifications,
      pagination: getPaginationMeta(page, limit, total),
    },
    message: "Notifications fetched successfully",
  });
});
