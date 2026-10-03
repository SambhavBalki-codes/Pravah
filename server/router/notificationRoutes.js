import express from "express";
import { getNotifications } from "../controllers/notificationController.js";
import {
  isAuthenticated,
  isAuthorized,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/",
  isAuthenticated,
  isAuthorized("Student", "Teacher", "Admin"),
  getNotifications,
);

export default router;
