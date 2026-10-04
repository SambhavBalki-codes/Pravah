import rateLimit from "express-rate-limit";

const createAuthRateLimiter = (max, message) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      message,
    },
  });

export const loginRateLimiter = createAuthRateLimiter(
  100,
  "Too many login attempts. Please try again in 15 minutes.",
);

export const registerRateLimiter = createAuthRateLimiter(
  10,
  "Too many registration attempts. Please try again in 15 minutes.",
);

export const forgotPasswordRateLimiter = createAuthRateLimiter(
  3,
  "Too many password reset requests. Please try again in 15 minutes.",
);

export const resetPasswordRateLimiter = createAuthRateLimiter(
  5,
  "Too many password reset attempts. Please try again in 15 minutes.",
);
