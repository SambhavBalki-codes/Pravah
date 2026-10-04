import express from "express";
import { body, param } from "express-validator";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validation.js";
import {
  acceptSupervisorRequest,
  getSupervisorRequests,
  rejectSupervisorRequest,
} from "../controllers/teacherController.js";

const router = express.Router();
const requestId = param("requestId").isMongoId().withMessage("must be a valid request id");

router.get("/requests", isAuthenticated, isAuthorized("Teacher"), getSupervisorRequests);
router.put("/requests/:requestId/accept", isAuthenticated, isAuthorized("Teacher"), requestId, validate, acceptSupervisorRequest);
router.put("/requests/:requestId/reject", isAuthenticated, isAuthorized("Teacher"), requestId, validate, rejectSupervisorRequest);

export default router;
