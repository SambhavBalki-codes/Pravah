import crypto from "crypto";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import User from "../models/user.js";
import sendEmail from "../services/emailService.js";
import { generateForgotPasswordEmailTemplate } from "../utils/emailTemplates.js";
import { generateToken } from "../utils/generateToken.js";
import { sendSuccess } from "../utils/response.js";

export const registerUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  let user = await User.findOne({ email });
  if (user) {
    return next(new ErrorHandler("User already exists", 400));
  }

  user = new User({ name, email, password, role });
  await user.save();
  generateToken(user, 201, "User registered successfully", res);
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  if (user.role !== role) {
    return next(
      new ErrorHandler(
        "Selected role does not match this account. Please select the correct role.",
        403,
      ),
    );
  }

  generateToken(user, 200, "User logged in successfully", res);
});

export const logout = asyncHandler(async (req, res) => {
  res
    .cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });
  sendSuccess(res, 200, "Logged out successfully");
});

export const getUser = asyncHandler(async (req, res, next) => {
  const user = req.user;
  sendSuccess(res, 200, "User fetched successfully", { user });
});

export const forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

  const message = generateForgotPasswordEmailTemplate(resetPasswordUrl);

  try {
    await sendEmail({
      to: user.email,
      subject: "Pravah - 🔒 Password Reset Request",
      text: message,
      html: message,
    });
    sendSuccess(
      res,
      200,
      `Email sent to ${user.email} successfully`,
    );
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(error.message, 500));
  }
});

export const resetPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler("Invalid or expired password reset token", 400),
    );
  }

  if (!req.body.password || !req.body.confirmPassword) {
    return next(
      new ErrorHandler(
        "Please provide both password and confirm password",
        400,
      ),
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new ErrorHandler("Password and confirm password do not match", 400),
    );
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  generateToken(user, 200, "Password reset successful", res);
});
