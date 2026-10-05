import mongoose from "mongoose";


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
    status: {
      type: String,
      default: "pending",
      enum: [
        "pending",
        "approved",
        "in_progress",
        "revision_required",
        "rejected",
        "completed",
      ],
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxLength: [1000, "Rejection reason cannot exceed 1000 characters"],
      default: null,
    },
    files: [
      {
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
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        fileSize: { type: Number, default: 0 },
        reviewStatus: {
          type: String,
          enum: ["pending", "reviewed", "revision_requested"],
          default: "pending",
        },
        reviewedAt: { type: Date, default: null },
        version: { type: Number, default: 1 },
      },
    ],
    feedbacks: [feedbackSchema],
    deadline: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

projectSchema.index({ student: 1 });
projectSchema.index({ student: 1, createdAt: -1 });
projectSchema.index({ supervisor: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index(
  { student: 1 },
  {
    name: "unique_active_project_per_student",
    unique: true,
    partialFilterExpression: {
      status: {
        $in: [
          "pending",
          "approved",
          "in_progress",
          "revision_required",
          "completed",
        ],
      },
    },
  },
);

export const Project =
  mongoose.models.Project || mongoose.model("Project", projectSchema);
