import express from "express";
import {
  getStudentProject,
  submitProposal,
  uploadFiles,
  getAvailableSupervisors,
  requestSupervisor,
  getSupervisor,
  getFeedback,
  getDashboardStats,
  downloadFile,
  getProjectFiles,
  getFeedbackHistory,
  markFeedbackRead,
  markAllFeedbackRead,
  getMyRequests,
  cancelSupervisorRequest,
  getMyFiles,
  deleteMyFile,
  replyToFeedback
} from "../controllers/studentController.js";
import {
  isAuthenticated,
  isAuthorized,
} from "../middlewares/authMiddleware.js";
import { upload, handleFileUploadErrors } from "../middlewares/upload.js";
import { body, param } from "express-validator";
import { validate } from "../middlewares/validation.js";
import { submitProjectForPublic } from "../controllers/visitorController.js";

const router = express.Router();

router.get(
  "/project",
  isAuthenticated,
  isAuthorized("Student"),
  getStudentProject,
);
router.post(
  "/publication-request",
  isAuthenticated,
  isAuthorized("Student"),
  body("githubUrl").optional({ checkFalsy: true }).trim().isURL().withMessage("must be a valid URL"),
  validate,
  submitProjectForPublic,
);
router.post(
  "/proposal",
  isAuthenticated,
  isAuthorized("Student"),
  body("title").trim().isLength({ min: 3, max: 200 }).withMessage("must be 3-200 characters"),
  body("description").trim().isLength({ min: 10, max: 2000 }).withMessage("must be 10-2000 characters"),
  validate,
  submitProposal,
);
router.post(
  "/upload/:projectID",
  isAuthenticated,
  isAuthorized("Student"),
  param("projectID").isMongoId().withMessage("must be a valid project id"),
  validate,
  upload.array("files", 10),
  handleFileUploadErrors,
  uploadFiles,
);
router.get(
  "/fetch-supervisors",
  isAuthenticated,
  isAuthorized("Student"),
  getAvailableSupervisors,
);
router.post(
  "/request-supervisor",
  isAuthenticated,
  isAuthorized("Student"),
  body("teacherId").isMongoId().withMessage("must be a valid teacher id"),
  body("message").optional().trim().isLength({ max: 250 }).withMessage("must not exceed 250 characters"),
  validate,
  requestSupervisor,
);

router.get(
  "/getSupervisor",
  isAuthenticated,
  isAuthorized("Student"),
  getSupervisor,
);

router.get(
  "/feedback/:projectId",
  isAuthenticated,
  isAuthorized("Student"),
  param("projectId").isMongoId().withMessage("must be a valid project id"),
  validate,
  getFeedback,
);

router.get(
  "/fetch-dashboard-stats",
  isAuthenticated,
  isAuthorized("Student"),
  getDashboardStats,
);

router.get(
  "/files/:projectId",
  isAuthenticated,
  isAuthorized("Student"),
  param("projectId").isMongoId().withMessage("must be a valid project id"),
  validate,
  getProjectFiles,
);
router.get(
  "/download/:projectId/:fileId",
  isAuthenticated,
  isAuthorized("Student"),
  param("projectId").isMongoId().withMessage("must be a valid project id"),
  param("fileId").isMongoId().withMessage("must be a valid file id"),
  validate,
  downloadFile,
);

router.get(
  "/feedback-history",
  isAuthenticated,
  isAuthorized("Student"),
  getFeedbackHistory,
);
router.put(
  "/feedback/read-all",
  isAuthenticated,
  isAuthorized("Student"),
  markAllFeedbackRead,
);
router.put(
  "/feedback/:feedbackId/read",
  isAuthenticated,
  isAuthorized("Student"),
  param("feedbackId").isMongoId().withMessage("must be a valid feedback id"),
  validate,
  markFeedbackRead,
);

router.get("/my-requests", isAuthenticated, isAuthorized("Student"), getMyRequests);
router.put(
  "/requests/:id/cancel",
  isAuthenticated,
  isAuthorized("Student"),
  param("id").isMongoId().withMessage("must be a valid request id"),
  validate,
  cancelSupervisorRequest,
);

router.get("/my-files", isAuthenticated, isAuthorized("Student"), getMyFiles);
router.delete(
  "/files/:projectId/:fileId",
  isAuthenticated,
  isAuthorized("Student"),
  param("projectId").isMongoId().withMessage("must be a valid project id"),
  param("fileId").isMongoId().withMessage("must be a valid file id"),
  validate,
  deleteMyFile,
);

router.post(
  "/feedback/:feedbackId/reply",
  isAuthenticated,
  isAuthorized("Student"),
  param("feedbackId").isMongoId().withMessage("must be a valid feedback id"),
  body("message").trim().isLength({ min: 1, max: 1000 }).withMessage("must be 1-1000 characters"),
  validate,
  replyToFeedback,
);

export default router;
