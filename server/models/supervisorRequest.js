import mongoose from "mongoose";

const supervisorRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student ID is required"],
    },
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Supervisor ID is required"],
    },
    message: {
      type: String,
      trim: true,
      required: [true, "Message is required"],
      maxLength: [250, "Message cannot exceed 250 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

supervisorRequestSchema.index({ student: 1 });
supervisorRequestSchema.index({ supervisor: 1 });
supervisorRequestSchema.index({ status: 1 });
supervisorRequestSchema.index(
  { student: 1, supervisor: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
  },
);

export const supervisorRequest =
  mongoose.models.SupervisorRequest ||
  mongoose.model("SupervisorRequest", supervisorRequestSchema);
