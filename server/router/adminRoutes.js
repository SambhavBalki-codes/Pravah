import express from "express";
import multer from "multer";
import {
  createStudent,
  updateStudent,
  deleteStudent,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getAllUsers,
  getAllProjects,
} from "../controllers/adminController.js";
import { isAuthenticated ,isAuthorized} from "../middlewares/authMiddleware.js";
import { body, param } from "express-validator";
import { validate } from "../middlewares/validation.js";

const router = express.Router();


const userFields = [
  body("name").trim().isLength({ min: 2, max: 50 }).withMessage("must be 2-50 characters"),
  body("email").isEmail().withMessage("must be a valid email"),
  body("password").isLength({ min: 8 }).withMessage("must be at least 8 characters"),
  body("department").trim().notEmpty().withMessage("is required"),
];
const userId = param("id").isMongoId().withMessage("must be a valid user id");

router.post("/create-student", isAuthenticated, isAuthorized("Admin"), ...userFields, validate, createStudent);

router.put("/update-student/:id", isAuthenticated,isAuthorized("Admin"), userId, validate, updateStudent);

router.delete("/delete-student/:id", isAuthenticated,isAuthorized("Admin"), userId, validate, deleteStudent);


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

router.put("/update-teacher/:id", isAuthenticated,isAuthorized("Admin"), userId, validate, updateTeacher);

router.delete("/delete-teacher/:id", isAuthenticated,isAuthorized("Admin"), userId, validate, deleteTeacher);

router.get("/users" ,
  isAuthenticated,
  isAuthorized("Admin"),
  getAllUsers
);

router.get(
  "/projects",
  isAuthenticated,
  isAuthorized("Admin"),
  getAllProjects,
);


export default router;