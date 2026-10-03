import express from "express";
import multer from "multer";
import {
  registerUser,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getUser,
} from "../controllers/authController.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";
import { body, param } from "express-validator";
import { validate } from "../middlewares/validation.js";
import {
  forgotPasswordRateLimiter,
  loginRateLimiter,
  registerRateLimiter,
  resetPasswordRateLimiter,
} from "../middlewares/authRateLimiters.js";
const router = express.Router();

const email = body("email").isEmail().withMessage("must be a valid email");
const password = body("password")
  .isString()
  .isLength({ min: 8 })
  .withMessage("must be at least 8 characters");

router.post(
  "/register",
  registerRateLimiter,
  body("name").trim().isLength({ min: 2, max: 50 }).withMessage("must be 2-50 characters"),
  email,
  password,
  validate,
  registerUser,
);
router.post("/login", loginRateLimiter, email, body("password").notEmpty().withMessage("is required"), body("role").isIn(["Student", "Teacher", "Admin"]).withMessage("must be a valid role"), validate, login);
router.get("/logout", isAuthenticated, logout);
router.post("/password/forgot", forgotPasswordRateLimiter, email, validate, forgotPassword);
router.put(
  "/password/reset/:token",
  resetPasswordRateLimiter,
  param("token").trim().notEmpty().withMessage("is required"),
  password,
  body("confirmPassword").custom((value, { req }) => value === req.body.password).withMessage("must match password"),
  validate,
  resetPassword,
);
router.get("/me", isAuthenticated, getUser);

export default router;
