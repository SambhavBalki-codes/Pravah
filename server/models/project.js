import mongoose from "mongoose";
import ErrorHandler from "../middlewares/error.js";
import {
  ACTIVE_PROJECT_STATUSES,
  isValidProjectStatusTransition,
  projectStatuses,
} from "../utils/projectStatus.js";

const replySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["Student", "Teacher"], required: true },
    message: {
      type: String,
      trim: true,
      required: [true, "Reply message is required"],
      maxLength: [1000, "Reply cannot exceed 1000 characters"],
    },
  },
  { timestamps: true },
);

const feedbackSchema = new mongoose.Schema(
  {
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Supervisor ID is required"],
    },
    type: {
      type: String,
      enum: ["general", "positive", "negative"],
      default: "general",
    },
    title: {
      type: String,
      trim: true,
      required: [true, "Feedback title is required"],
    },
    message: {
      type: String,
      required: [true, "Feedback message is required"],
      maxLength: [1000, "Feedback message cannot exceed 1000 characters"],
    },
    requiresRevision: { type: Boolean, default: false },
    fileId: { type: mongoose.Schema.Types.ObjectId, default: null },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    replies: { type: [replySchema], default: [] },
  },
  { timestamps: true },
);

const fileSchema = new mongoose.Schema({
  fileType: {
    type: String,
    required: [true, "File type is required"],
  },
  fileUrl: {
    type: String,
    required: [true, "File URL is required"],
  },
  originalName: {
    type: String,
    required: [true, "Original file name is required"],
  },
  storedName: { type: String, default: "" },
  fileSize: { type: Number, default: 0 },
  version: { type: Number, default: 1 },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  uploadedAt: { type: Date, default: Date.now },
  reviewStatus: {
    type: String,
    enum: ["pending", "reviewed", "revision_requested"],
    default: "pending",
  },
  reviewedAt: { type: Date, default: null },
});

const projectSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student is required"],
    },
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    title: {
      type: String,
      trim: true,
      required: [true, "Title is required"],
      maxLength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxLength: [2000, "Description cannot exceed 2000 characters"],
    },
    department: { type: String, trim: true, default: null },
    status: {
      type: String,
      default: "pending",
      enum: projectStatuses,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxLength: [1000, "Rejection reason cannot exceed 1000 characters"],
      default: null,
    },
    revisionReason: {
      type: String,
      trim: true,
      maxLength: [1000, "Revision reason cannot exceed 1000 characters"],
      default: null,
    },
    submittedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    lastActivityAt: { type: Date, default: null },
    githubUrl: {
      type: String,
      trim: true,
      default: null,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    publicationStatus: {
      type: String,
      enum: ["private", "requested", "approved", "rejected"],
      default: "private",
    },
    publicationRequestedAt: {
      type: Date,
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    publicationRejectedReason: {
      type: String,
      trim: true,
      maxLength: [1000, "Publication rejection reason cannot exceed 1000 characters"],
      default: null,
    },
    ragIndexed: {
      type: Boolean,
      default: false,
    },
    ragStatus: {
      type: String,
      enum: ["not_started", "queued", "processing", "indexed", "failed"],
      default: "not_started",
    },
    ragError: {
      type: String,
      trim: true,
      default: null,
    },
    ragIndexedAt: {
      type: Date,
      default: null,
    },
    files: { type: [fileSchema], default: [] },
    feedbacks: { type: [feedbackSchema], default: [] },
    deadline: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Remember the status the document was loaded with, so a save can be checked against it
projectSchema.post("init", function () {
  this.$locals.previousStatus = this.status;
});

projectSchema.pre("save", function () {
  const now = new Date();

  if (this.isNew) {
    this.submittedAt = this.submittedAt || now;
  } else if (this.isModified("status")) {
    const previous = this.$locals.previousStatus;
    if (previous && !isValidProjectStatusTransition(previous, this.status)) {
      throw new ErrorHandler(
        `Invalid project status transition from "${previous}" to "${this.status}"`,
        400,
      );
    }
  }

  if (this.isModified("status")) {
    if (this.status === "approved" && !this.approvedAt) this.approvedAt = now;
    if (this.status === "completed") this.completedAt = now;
    if (this.status === "in_progress") this.revisionReason = null;
  }

  this.lastActivityAt = now;
});

projectSchema.post("save", function () {
  this.$locals.previousStatus = this.status;
});

projectSchema.index({ student: 1 });
projectSchema.index({ student: 1, createdAt: -1 });
projectSchema.index({ supervisor: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ isPublic: 1, status: 1 });
projectSchema.index({ publicationStatus: 1, isPublic: 1, completedAt: -1 });
projectSchema.index(
  { student: 1 },
  {
    name: "unique_active_project_per_student",
    unique: true,
    partialFilterExpression: {
      status: { $in: ACTIVE_PROJECT_STATUSES },
    },
  },
);

export const Project =
  mongoose.models.Project || mongoose.model("Project", projectSchema);