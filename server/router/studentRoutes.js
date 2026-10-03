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
} from "../controllers/studentController.js";
import {
  isAuthenticated,
  isAuthorized,
} from "../middlewares/authMiddleware.js";
import { upload, handleFileUploadErrors } from "../middlewares/upload.js";
import { body, param } from "express-validator";
import { validate } from "../middlewares/validation.js";

const router = express.Router();

router.get(
  "/project",
  isAuthenticated,
  isAuthorized("Student"),
  getStudentProject,
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

export default router;
