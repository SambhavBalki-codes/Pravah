import multer from "multer";
import path from "path";

const allowedTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  "application/x-rar",
  "application/vnd.rar",
  "application/octet-stream",
  "image/jpeg",
  "image/png",
  "image/gif",
  "text/plain",
  "application/javascript",
  "text/css",
  "text/html",
  "application/json",
];

const allowedExtensions = [
  ".pdf", ".doc", ".docx", ".ppt", ".pptx",
  ".zip", ".rar", ".jpg", ".jpeg", ".png",
  ".gif", ".txt", ".js", ".css", ".html", ".json",
];

const fileFilter = (req, file, cb) => {
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (
    allowedTypes.includes(file.mimetype) &&
    allowedExtensions.includes(fileExtension)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX, ZIP, RAR, JPG, JPEG, PNG, GIF, TXT, JS, CSS, HTML and JSON files are allowed.",
      ),
      false,
    );
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },
});

const handleFileUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size exceeds the limit of 10MB",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "File count exceeds the limit of 10 files",
      });
    }
  }
  if (err && err.message) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next();
};

export { upload, handleFileUploadErrors };