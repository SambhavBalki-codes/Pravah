import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import User from "../models/user.js";
import { Project } from "../models/project.js";
import { supervisorRequest } from "../models/supervisorRequest.js";
import * as assignmentService from "../services/supervisorAssignmentService.js";
import * as notificationService from "../services/notificationService.js";

export const getSupervisorRequests = asyncHandler(async (req, res) => {
  const requests = await supervisorRequest.find({
    supervisor: req.user._id,
    status: "pending",
  })
    .populate("student", "name email department")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    message: "Supervisor requests fetched successfully",
    data: { requests },
  });
});

export const acceptSupervisorRequest = asyncHandler(async (req, res, next) => {
  const request = await supervisorRequest.findOne({
    _id: req.params.requestId,
    supervisor: req.user._id,
    status: "pending",
  }).lean();

  if (!request) return next(new ErrorHandler("Supervisor request not found", 404));

  const project = await Project.findOne({
    student: request.student,
    status: { $in: ["pending", "approved", "in_progress", "revision_required", "completed"] },
  }).sort({ createdAt: -1 }).lean();
  if (!project) return next(new ErrorHandler("Student has no active project", 404));

  const assignedProject = await assignmentService.assignSupervisorToProject({
    projectId: project._id,
    supervisorId: req.user._id,
    requestId: request._id,
  });

  res.status(200).json({
    success: true,
    message: "Supervisor request accepted successfully",
    data: { project: assignedProject },
  });
});

export const rejectSupervisorRequest = asyncHandler(async (req, res, next) => {
  const request = await supervisorRequest.findOneAndUpdate(
    { _id: req.params.requestId, supervisor: req.user._id, status: "pending" },
    { $set: { status: "rejected" } },
    { new: true },
  );
  if (!request) return next(new ErrorHandler("Supervisor request not found", 404));

  await User.findByIdAndUpdate(request.student, {
    $set: { supervisor: null },
  });
  await notificationService.notifyUser(
    request.student,
    "Your supervisor request was declined. You can choose another teacher.",
    "/student/supervisor",
    "medium",
  );
  res.status(200).json({
    success: true,
    message: "Supervisor request rejected successfully",
    data: { request },
  });
});
