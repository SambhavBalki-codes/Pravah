import mongoose from "mongoose";

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
      enum: ["pending", "approved", "rejected", "completed"],
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
      },
    ],
    feedbacks: [
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
          required: [true, "Feedback title is required"],
        },
        message: {
          type: String,
          required: [true, "Feedback message is required"],
          maxLength: [1000, "Feedback message cannot exceed 1000 characters"],
        },
      },
    ],
    deadline: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

projectSchema.index({ student: 1 });
projectSchema.index({ supervisor: 1 });
projectSchema.index({ status: 1 });

export const Project =
  mongoose.models.Project || mongoose.model("Project", projectSchema);
