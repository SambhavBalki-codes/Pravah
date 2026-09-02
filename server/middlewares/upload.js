import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureDirExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  desination: (req, file, cb) => {
    let uploadPath;
    if (req.route.path.includes("/upload/:projectID")) {
      uploadPath = path.join(
        __dirname,
        "../uploads/projects",
        req.params.projectID,
      );
    } else if (req.route.path.includes("/upload/:userID")) {
      uploadPath = path.join(__dirname, "../uploads/users", req.params.userID);
    } else {
      uploadPath = path.join(__dirname, "../uploads/temp");
    }

    ensureDirExists(uploadPath);
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
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
    ".pdf",
    ".doc",
    ".docx",
    ".ppt",
    ".pptx",
    ".zip",
    ".rar",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".txt",
    ".js",
    ".css",
    ".html",
    ".json",
  ];

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
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
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
  if (err.message || err.message.includes("Invalid file type")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next();
};

export { upload, handleFileUploadErrors };
