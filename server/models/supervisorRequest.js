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
      maxLength: [250, "Message cannot exceed 250 characters"]
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

// Indexing for better query performance
supervisorRequestSchema.index({ student: 1 }); 
supervisorRequestSchema.index({ supervisor: 1 }); 
supervisorRequestSchema.index({ status: 1 }); 

export const supervisorRequest = mongoose.models.Project || mongoose.model("Project", supervisorRequestSchema);