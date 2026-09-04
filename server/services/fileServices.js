import fs from "fs";
import ErrorHandler from "../middlewares/error.js";

export const streamDownload = (filePath, res, originalName, next) => {
  if (!fs.existsSync(filePath)) {
    return next(new ErrorHandler("File not found", 404));
  }

  res.download(filePath, originalName, (error) => {
    if (error && !res.headersSent) {
      next(new ErrorHandler("Error downloading file", 500));
    }
  });
};
