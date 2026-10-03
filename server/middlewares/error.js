class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorMiddleware = (err, req, res, next) => {
  let error = err;

  if (error.code === 11000) {
    const message = `Duplicate ${Object.keys(error.keyValue)} Entered`;
    error = new ErrorHandler(message, 400);
  } else if (error.name === "JsonWebTokenError") {
    error = new ErrorHandler(
      "JSON Web Token is invalid, Try Again",
      401,
    );
  } else if (error.name === "TokenExpiredError") {
    error = new ErrorHandler(
      "JSON Web Token is Expired, Try Again",
      401,
    );
  } else if (error.name === "CastError") {
    const message = `Resource not found. Invalid: ${error.path}`;
    error = new ErrorHandler(message, 400);
  }

  error.statusCode = error.statusCode || 500;
  error.message = error.message || "Internal Server Error";

  const errorMessage = error.errors
    ? Object.values(error.errors)
        .map((value) => value.message)
        .join(", ")
    : error.message;

  return res.status(error.statusCode).json({
    success: false,
    message: errorMessage,
  });
};

export default ErrorHandler;