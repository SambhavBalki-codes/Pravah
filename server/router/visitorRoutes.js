import express from "express";
import {
  visitorRegister,
  visitorLogin,
  visitorLogout,
  getPublicProjects,
  getPublicProject,
  getChatHistory,
  sendChatMessage,
  streamChatMessage,
  submitProjectForPublic,
} from "../controllers/visitorController.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";
import { body, param } from "express-validator";
import { validate } from "../middlewares/validation.js";
import {
  visitorChatRateLimiter,
  loginRateLimiter,
  registerRateLimiter,
} from "../middlewares/authRateLimiters.js";

const router = express.Router();

router.post(
  "/register",
  registerRateLimiter,
  body("name").trim().isLength({ min: 2, max: 50 }).withMessage("Name must be 2-50 characters"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  validate,
  visitorRegister
);

router.post(
  "/login",
  loginRateLimiter,
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
  visitorLogin
);

router.post("/logout", visitorLogout);

router.get("/projects", isAuthenticated, isAuthorized("Visitor"), getPublicProjects);

router.get(
  "/projects/:id",
  isAuthenticated,
  isAuthorized("Visitor"),
  param("id").isMongoId().withMessage("Invalid project id"),
  validate,
  getPublicProject
);

router.get(
  "/projects/:projectId/chat",
  isAuthenticated,
  isAuthorized("Visitor"),
  param("projectId").isMongoId().withMessage("Invalid project id"),
  validate,
  getChatHistory
);

router.post(
  "/projects/:projectId/chat/stream",
  visitorChatRateLimiter,
  isAuthenticated,
  isAuthorized("Visitor"),
  param("projectId").isMongoId().withMessage("Invalid project id"),
  body("message").trim().isLength({ min: 1, max: 2000 }).withMessage("Message must be 1-2000 characters"),
  validate,
  streamChatMessage,
);

router.post(
  "/projects/:projectId/chat",
  visitorChatRateLimiter,
  isAuthenticated,
  isAuthorized("Visitor"),
  param("projectId").isMongoId().withMessage("Invalid project id"),
  body("message").trim().isLength({ min: 1, max: 2000 }).withMessage("Message must be 1-2000 characters"),
  validate,
  sendChatMessage
);

router.post(
  "/student/submit-public",
  isAuthenticated,
  isAuthorized("Student"),
  body("githubUrl").optional().trim().isURL().withMessage("Must be a valid URL"),
  validate,
  submitProjectForPublic
);

export default router;