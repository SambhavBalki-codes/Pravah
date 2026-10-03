import { validationResult } from "express-validator";
import ErrorHandler from "./error.js";

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new ErrorHandler(
        errors
          .array()
          .map((error) => `${error.path}: ${error.msg}`)
          .join(", "),
        400,
      ),
    );
  }

  next();
};
