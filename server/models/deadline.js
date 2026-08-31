import mongoose from "mongoose";

const deadlineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Deadline name/title is required"],
      maxLength: [100, "Feedback messagcannot exceed 100 characters"],
    },
    dueDate: {
      type: Date,
      required: [true, "Deadline due date is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "CreatedBy is required"],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    }, 
  },
  { timestamps: true },
);

// Indexing for better query performance
deadlineSchema.index({ dueDate: 1 }); 
deadlineSchema.index({ project: 1 }); 
deadlineSchema.index({ createdBy: 1 }); 

export const Notification = mongoose.models.Project || mongoose.model("Project", deadlineSchema);