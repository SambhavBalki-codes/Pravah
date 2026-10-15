import express from "express";
import {
  createStudent,
  updateStudent,
  deleteStudent,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getAllUsers,
  getAllProjects,
  getProjectDetails,
  decideProject,
  assignProjectSupervisor,
  updateProjectStatus,
  getDashboardStats,
  getDeadlines,
  createDeadline,
  updateDeadline,
  toggleDeadline,
  deleteDeadline,
} from "../controllers/adminController.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";
import { body, param } from "express-validator";
import { validate } from "../middlewares/validation.js";
import { projectStatuses } from "../utils/projectStatus.js";

const router = express.Router();

const userFields = [
  body("name").trim().isLength({ min: 2, max: 50 }).withMessage("must be 2-50 characters"),
  body("email").isEmail().withMessage("must be a valid email"),
  body("password").isLength({ min: 8 }).withMessage("must be at least 8 characters"),
  body("department").trim().notEmpty().withMessage("is required"),
];
const userId = param("id").isMongoId().withMessage("must be a valid user id");

router.get(
  "/dashboard",
  isAuthenticated,
  isAuthorized("Admin"),
  getDashboardStats,
);

router.post("/create-student", isAuthenticated, isAuthorized("Admin"), ...userFields, validate, createStudent);

router.put("/update-student/:id", isAuthenticated, isAuthorized("Admin"), userId, validate, updateStudent);

router.delete("/delete-student/:id", isAuthenticated, isAuthorized("Admin"), userId, validate, deleteStudent);

router.post(
  "/create-teacher",
  isAuthenticated,
  isAuthorized("Admin"),
  ...userFields,
  body("maxStudents").isInt({ min: 1 }).withMessage("must be at least 1"),
  body("expertise").custom((value) => Array.isArray(value) || (typeof value === "string" && value.trim().length > 0)).withMessage("must be a non-empty list or string"),
  validate,
  createTeacher,
);

router.put("/update-teacher/:id", isAuthenticated, isAuthorized("Admin"), userId, validate, updateTeacher);

router.delete("/delete-teacher/:id", isAuthenticated, isAuthorized("Admin"), userId, validate, deleteTeacher);

router.get("/users", isAuthenticated, isAuthorized("Admin"), getAllUsers);

router.get("/projects", isAuthenticated, isAuthorized("Admin"), getAllProjects);

router.get(
  "/projects/:projectId",
  isAuthenticated,
  isAuthorized("Admin"),
  param("projectId").isMongoId().withMessage("must be a valid project id"),
  validate,
  getProjectDetails,
);

router.put(
  "/projects/:projectId/decision",
  isAuthenticated,
  isAuthorized("Admin"),
  param("projectId").isMongoId().withMessage("must be a valid project id"),
  body("status").isIn(["approved", "rejected"]).withMessage("must be approved or rejected"),
  body("rejectionReason").optional().trim().isLength({ max: 1000 }).withMessage("must not exceed 1000 characters"),
  validate,
  decideProject,
);

router.get("/deadlines", isAuthenticated, isAuthorized("Admin"), getDeadlines);
router.post(
  "/deadlines",
  isAuthenticated,
  isAuthorized("Admin"),
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("must be 2-100 characters"),
  body("dueDate").isISO8601().withMessage("must be a valid date"),
  body("project").optional({ nullable: true }).isMongoId().withMessage("must be a valid project id"),
  body("student").optional({ nullable: true }).isMongoId().withMessage("must be a valid student id"),
  validate,
  createDeadline,
);
router.put(
  "/deadlines/:deadlineId",
  isAuthenticated,
  isAuthorized("Admin"),
  param("deadlineId").isMongoId().withMessage("must be a valid deadline id"),
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("must be 2-100 characters"),
  body("dueDate").isISO8601().withMessage("must be a valid date"),
  body("project").optional({ nullable: true }).isMongoId().withMessage("must be a valid project id"),
  body("student").optional({ nullable: true }).isMongoId().withMessage("must be a valid student id"),
  validate,
  updateDeadline,
);
router.patch(
  "/deadlines/:deadlineId/toggle",
  isAuthenticated,
  isAuthorized("Admin"),
  param("deadlineId").isMongoId().withMessage("must be a valid deadline id"),
  validate,
  toggleDeadline,
);
router.delete(
  "/deadlines/:deadlineId",
  isAuthenticated,
  isAuthorized("Admin"),
  param("deadlineId").isMongoId().withMessage("must be a valid deadline id"),
  validate,
  deleteDeadline,
);

router.put(
  "/projects/:projectId/supervisor",
  isAuthenticated,
  isAuthorized("Admin"),
  param("projectId").isMongoId().withMessage("must be a valid project id"),
  body("supervisorId").isMongoId().withMessage("must be a valid supervisor id"),
  validate,
  assignProjectSupervisor,
);

router.put(
  "/projects/:projectId/status",
  isAuthenticated,
  isAuthorized("Admin"),
  param("projectId").isMongoId().withMessage("must be a valid project id"),
  body("status").isIn(projectStatuses).withMessage("must be a valid project status"),
  validate,
  updateProjectStatus,
);

export default router;