import mongoose from "mongoose";

const ragJobSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
    },
    attempts: {
      type: Number,
      default: 0,
    },
    nextAttemptAt: {
      type: Date,
      default: Date.now,
    },
    lockedAt: {
      type: Date,
      default: null,
    },
    lastError: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true },
);

ragJobSchema.index({ status: 1, nextAttemptAt: 1 });

export const RagJob =
  mongoose.models.RagJob || mongoose.model("RagJob", ragJobSchema);
