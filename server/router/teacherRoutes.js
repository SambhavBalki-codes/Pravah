import express from "express";
import { body, param } from "express-validator";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validation.js";
import ErrorHandler from "../middlewares/error.js";
import {
  acceptSupervisorRequest,
  getSupervisorRequests,
  rejectSupervisorRequest,
  getTeacherDashboard,
  getAssignedStudents,
  getAssignedStudent,
  getTeacherProjects,
  getTeacherProject,
  getTeacherProjectFiles,
  downloadTeacherProjectFile,
  addProjectFeedback,
  updateTeacherProjectStatus,
  getTeacherDeadlines,
} from "../controllers/teacherController.js";

const router = express.Router();
const requestId = param("id").isMongoId().withMessage("must be a valid request id");
const projectId = param("id").isMongoId().withMessage("must be a valid project id");
const fileProjectId = param("projectId").isMongoId().withMessage("must be a valid project id");
const fileId = param("fileId").isMongoId().withMessage("must be a valid file id");

router.get("/dashboard", isAuthenticated, isAuthorized("Teacher"), getTeacherDashboard);
router.get(
  "/requests",
  isAuthenticated,
  isAuthorized("Teacher"),
  (req, res, next) => {
    if (req.query.status && !["pending", "accepted", "rejected", "all"].includes(req.query.status)) {
      return next(new ErrorHandler("Invalid request status filter", 400));
    }
    next();
  },
  getSupervisorRequests,
);
router.put("/requests/:id/accept", isAuthenticated, isAuthorized("Teacher"), requestId, validate, acceptSupervisorRequest);
router.put(
  "/requests/:id/reject",
  isAuthenticated,
  isAuthorized("Teacher"),
  requestId,
  body("rejectionReason").trim().isLength({ min: 2, max: 500 }).withMessage("must be 2-500 characters"),
  validate,
  rejectSupervisorRequest,
);
router.get("/students", isAuthenticated, isAuthorized("Teacher"), getAssignedStudents);
router.get("/students/:id", isAuthenticated, isAuthorized("Teacher"), projectId, validate, getAssignedStudent);
router.get("/projects", isAuthenticated, isAuthorized("Teacher"), getTeacherProjects);
router.get("/projects/:id", isAuthenticated, isAuthorized("Teacher"), projectId, validate, getTeacherProject);
router.get("/projects/:id/files", isAuthenticated, isAuthorized("Teacher"), projectId, validate, getTeacherProjectFiles);
router.get(
  "/projects/:projectId/files/:fileId",
  isAuthenticated,
  isAuthorized("Teacher"),
  fileProjectId,
  fileId,
  validate,
  downloadTeacherProjectFile,
);
router.post(
  "/projects/:id/feedback",
  isAuthenticated,
  isAuthorized("Teacher"),
  projectId,
  body("type").optional().isIn(["general", "positive", "negative"]).withMessage("must be a valid feedback type"),
  body("title").trim().isLength({ min: 2, max: 100 }).withMessage("must be 2-100 characters"),
  body("message").trim().isLength({ min: 1, max: 1000 }).withMessage("must be 1-1000 characters"),
  validate,
  addProjectFeedback,
);
router.put(
  "/projects/:id/status",
  isAuthenticated,
  isAuthorized("Teacher"),
  projectId,
  body("status").isIn(["pending", "approved", "in_progress", "revision_required", "rejected", "completed"]).withMessage("must be a valid project status"),
  body("rejectionReason").optional().trim().isLength({ max: 1000 }).withMessage("must not exceed 1000 characters"),
  validate,
  updateTeacherProjectStatus,
);
router.get("/deadlines", isAuthenticated, isAuthorized("Teacher"), getTeacherDeadlines);

export default router;
