import express from "express";
import {
  getStudentProject,
  submitProposal,
  uploadFiles,
  getAvailableSupervisors,
  requestSupervisor,
  getSupervisor,
} from "../controllers/studentController.js";
import {
  isAuthenticated,
  isAuthorized,
} from "../middlewares/authMiddleware.js";
import { upload, handleFileUploadErrors } from "../middlewares/upload.js";

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
  submitProposal,
);
router.post(
  "/upload/:projectID",
  isAuthenticated,
  isAuthorized("Student"),
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
  requestSupervisor,
);

router.get(
  "/getSupervisor",
  isAuthenticated,
  isAuthorized("Student"),
  getSupervisor,
);

export default router;
