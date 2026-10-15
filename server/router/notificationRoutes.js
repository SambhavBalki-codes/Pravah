import express from "express";
import { param } from "express-validator";
import {
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validation.js";

const router = express.Router();
const protect = [isAuthenticated, isAuthorized("Student", "Teacher", "Admin")];
const notificationId = param("id").isMongoId().withMessage("must be a valid notification id");

router.get("/", protect, getNotifications);
router.get("/unread-count", protect, getUnreadCount);
router.put("/read-all", protect, markAllNotificationsRead);
router.put("/:id/read", protect, notificationId, validate, markNotificationRead);
router.delete("/:id", protect, notificationId, validate, deleteNotification);

export default router;