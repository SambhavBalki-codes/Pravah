import jwt from "jsonwebtoken";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import User from "../models/user.js";

export const isAuthenticated = asyncHandler(async (req, res, next) => {
  const cookieToken = req.cookies?.token;
  const authorization = req.headers.authorization;
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;
  const token = bearerToken || cookieToken;

  if (!token) {
    return next(new ErrorHandler("Please login to access this resource", 401));
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new ErrorHandler("Your session has expired. Please log in again.", 401));
    }

    if (error.name === "JsonWebTokenError") {
      return next(new ErrorHandler("Invalid authentication token", 401));
    }

    throw error;
  }

  req.user = await User.findById(decoded.id).select(
    "-resetPasswordToken -resetPasswordExpire",
  );

  if (!req.user) {
    return next(new ErrorHandler("User not found", 404));
  }
  next();
});

export const isAuthorized = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role (${req.user.role}) is not allowed to access this resource`,
          403,
        ),
      );
    }
    next();
  };
};
