import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import User from "../models/user.js";
import * as projectService from "../services/projectService.js";
import * as requestService from "../services/requestService.js";
import * as notificationService from "../services/notificationService.js";
import { Project } from "../models/project.js";
import { Notification } from "../models/notifications.js";
import { Deadline } from "../models/deadline.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";
import { ACTIVE_PROJECT_STATUSES } from "../utils/projectStatus.js";
import {
  serializeFeedback,
  serializeFile,
  getLastFile,
  getStudentProgress,
} from "../utils/projectProgress.js";
import { supervisorRequest } from "../models/supervisorRequest.js";
import { deleteFromCloudinary } from "../utils/cloudinaryHelpers.js";

export const getStudentProject = asyncHandler(async (req, res, next) => {
  const studentID = req.user.id;

  const project = await projectService.getProjectByStudentId(studentID);

  if (!project) {
    return res.status(200).json({
      success: true,
      data: { project: null },
      message: "No project found for this student",
    });
  }

  res.status(200).json({
    success: true,
    data: { project },
    message: "Project fetched successfully",
  });
});

export const submitProposal = asyncHandler(async (req, res, next) => {
  const studentID = req.user._id;
  const { title, description } = req.body;

  const existingProject =
    await projectService.getActiveProjectByStudentId(studentID);

  if (existingProject) {
    return next(
      new ErrorHandler(
        "You have an active project. You can only submit a new proposal if the previous project is rejected.",
        400,
      ),
    );
  }

  const projectData = {
    student: studentID,
    title,
    description,
  };

  const newProject = await projectService.createProject(projectData);

  await User.findByIdAndUpdate(studentID, { project: newProject._id });
  await notificationService.safeNotify(() =>
    notificationService.notifyAdmins(
      `${req.user.name} submitted a project proposal: "${newProject.title}".`,
      "request",
      "/admin/projects",
      "medium",
    ),
  );

  res.status(201).json({
    success: true,
    data: { project: newProject },
    message: "Proposal submitted successfully",
  });
});

export const uploadFiles = asyncHandler(async (req, res, next) => {
  const { projectID } = req.params;
  const studentId = req.user._id;

  const project = await projectService.getProjectByStudentIdAndProjectId(
    studentId,
    projectID,
  );

  if (!project) {
    return next(
      new ErrorHandler(
        "Project not found or you are not authorized to upload files for this project",
        404,
      ),
    );
  }

  if (["rejected", "completed"].includes(project.status)) {
    return next(
      new ErrorHandler(
        `Files cannot be uploaded to a ${project.status} project`,
        400,
      ),
    );
  }

  if (!req.files || req.files.length === 0) {
    return next(new ErrorHandler("No files uploaded", 400));
  }

  const updatedProject = await projectService.addFilesToProject(
    projectID,
    req.files,
    studentId,
  );

  if (project.supervisor?._id) {
    try {
      await notificationService.notifyUser(
        project.supervisor._id,
        `${req.user.name} uploaded ${req.files.length} file${req.files.length === 1 ? "" : "s"} to "${project.title}".`,
        "general",
        "/teacher/files",
        "low",
      );
    } catch {
      // the upload already succeeded, so a notification failure is not fatal
    }
  }

  res.status(200).json({
    success: true,
    data: { files: updatedProject.files.map(serializeFile) },
    message: "Files uploaded successfully",
  });
});

export const getProjectFiles = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  const studentId = req.user._id;
  const project = await projectService.getProjectByStudentIdAndProjectId(
    studentId,
    projectId,
  );

  if (!project) {
    return next(
      new ErrorHandler(
        "Project not found or you are not authorized to view its files",
        404,
      ),
    );
  }

  const { page, limit, skip } = getPagination(req.query);
  const files = project.files.slice(skip, skip + limit);

  res.status(200).json({
    success: true,
    data: {
      files,
      pagination: getPaginationMeta(page, limit, project.files.length),
    },
    message: "Project files fetched successfully",
  });
});

export const getAvailableSupervisors = asyncHandler(async (req, res) => {
  const teachers = await User.find({ role: "Teacher" })
    .select("name email department expertise maxStudents assignedStudents")
    .sort({ name: 1 })
    .lean();

  const supervisors = teachers.map(({ assignedStudents = [], ...teacher }) => ({
    ...teacher,
    assignedCount: assignedStudents.length,
  }));

  res.status(200).json({
    success: true,
    data: { supervisors },
    message: "Available supervisors fetched successfully",
  });
});

export const requestSupervisor = asyncHandler(async (req, res, next) => {
  const { teacherId, message } = req.body;
  const studentId = req.user._id;

  const student = await User.findById(studentId);
  if (!student) return next(new ErrorHandler("Student not found", 404));
  if (student.supervisor) {
    return next(
      new ErrorHandler("You already have a supervisor assigned", 400),
    );
  }

  const activeProject = await Project.findOne({
    student: studentId,
    status: { $in: ACTIVE_PROJECT_STATUSES },
  }).select("supervisor");
  if (!activeProject) {
    return next(
      new ErrorHandler(
        "Submit a project proposal before requesting a supervisor",
        400,
      ),
    );
  }
  if (activeProject.supervisor) {
    return next(
      new ErrorHandler(
        "Your project already has a supervisor assigned",
        400,
      ),
    );
  }

  const supervisor = await User.findById(teacherId);
  if (!supervisor || supervisor.role !== "Teacher") {
    return next(new ErrorHandler("Teacher not found", 404));
  }
  if (supervisor.assignedStudents.length >= supervisor.maxStudents) {
    return next(
      new ErrorHandler(
        "This supervisor has reached the maximum number of students",
        400,
      ),
    );
  }

  const earlier = await supervisorRequest.findOne({
    student: studentId,
    supervisor: teacherId,
    status: { $ne: "cancelled" },
  });
  if (earlier) {
    return next(
      new ErrorHandler(
        "You have already sent a request to this supervisor",
        400,
      ),
    );
  }

  const request = await requestService.createRequest({
    student: studentId,
    supervisor: teacherId,
    message: message || "Requesting to be my supervisor",
  });

  await notificationService.notifyUser(
    teacherId,
    `New supervisor request from ${student.name}`,
    "request",
    "/teacher/pending-requests",
    "medium",
  );

  res.status(201).json({
    success: true,
    data: { request },
    message: "Supervisor request sent successfully",
  });
});

export const getMyRequests = asyncHandler(async (req, res) => {
  const requests = await supervisorRequest
    .find({ student: req.user._id })
    .populate("supervisor", "name email department")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    message: "Supervisor requests fetched successfully",
    data: { requests },
  });
});

export const cancelSupervisorRequest = asyncHandler(async (req, res, next) => {
  const request = await supervisorRequest.findOneAndUpdate(
    { _id: req.params.id, student: req.user._id, status: "pending" },
    { $set: { status: "cancelled" } },
    { new: true },
  );
  if (!request) return next(new ErrorHandler("Pending request not found", 404));

  await notificationService.notifyUser(
    request.supervisor,
    `${req.user.name} cancelled their supervisor request.`,
    "request",
    "/teacher/pending-requests",
    "low",
  );

  res.status(200).json({
    success: true,
    message: "Request cancelled",
    data: { request },
  });
});

export const getSupervisor = asyncHandler(async (req, res, next) => {
  const studentId = req.user._id;
  const student = await User.findById(studentId)
    .populate("supervisor", "name email department expertise maxStudents")
    .lean();

  if (!student) {
    return next(new ErrorHandler("Student not found", 404));
  }
  if (!student.supervisor) {
    return res.status(200).json({
      success: true,
      data: { supervisor: null },
      message: "No supervisor assigned yet",
    });
  }

  res.status(200).json({
    success: true,
    data: { supervisor: student.supervisor },
    message: "Supervisor fetched successfully",
  });
});

export const getDashboardStats = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const project = await Project.findOne({ student: studentId })
    .sort({ createdAt: -1 })
    .populate("supervisor", "name email department")
    .populate("feedbacks.supervisorId", "name email")
    .lean();

  const deadlineScope = [
    { project: null, student: null },
    { student: studentId },
  ];
  if (project?._id) deadlineScope.push({ project: project._id });

  const [upcomingDeadlines, topNotifications, unreadNotifications] =
    await Promise.all([
      Deadline.find({
        isActive: { $ne: false },
        dueDate: { $gte: new Date() },
        $or: deadlineScope,
      })
        .select("name dueDate project student")
        .populate("project", "title")
        .sort({ dueDate: 1 })
        .limit(4)
        .lean(),
      Notification.find({ user: studentId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Notification.countDocuments({ user: studentId, isRead: false }),
    ]);

  const files = (project?.files || [])
    .map(serializeFile)
    .sort(
      (a, b) =>
        new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0),
    );

  const allFeedback = (project?.feedbacks || [])
    .map(serializeFeedback)
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    );

  const lastRevision =
    allFeedback.find((f) => f.requiresRevision) || null;
  const lastFile = getLastFile(project?.files || []);
  const revisionPending =
    Boolean(lastRevision) &&
    !["completed", "rejected"].includes(project?.status) &&
    (project?.status === "revision_required" ||
      !lastFile ||
      new Date(lastFile.uploadedAt || 0) <
        new Date(lastRevision.createdAt || 0));

  res.status(200).json({
    success: true,
    message: "Dashboard stats fetched successfully",
    data: {
      project: project
        ? {
            _id: project._id,
            title: project.title,
            description: project.description,
            status: project.status,
            rejectionReason: project.rejectionReason || null,
            createdAt: project.createdAt,
            supervisor: project.supervisor || null,
          }
        : null,
      supervisorName: project?.supervisor?.name || "N/A",
      progress: getStudentProgress(project),
      files: {
        total: files.length,
        pending: files.filter((f) => f.reviewStatus === "pending").length,
        reviewed: files.filter((f) => f.reviewStatus === "reviewed")
          .length,
        revisionRequested: files.filter(
          (f) => f.reviewStatus === "revision_requested",
        ).length,
        recent: files.slice(0, 4),
      },
      feedback: {
        total: allFeedback.length,
        unread: allFeedback.filter((f) => !f.isRead).length,
        latest: allFeedback.slice(0, 3),
      },
      revision: {
        pending: revisionPending,
        feedback: revisionPending ? lastRevision : null,
      },
      notifications: { unread: unreadNotifications },
      upcomingDeadlines,
      topNotifications,
      feedbackNotifications: allFeedback.slice(0, 2),
    },
  });
});

export const getFeedback = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  const studentId = req.user._id;
  const project = await projectService.getProjectByStudentIdAndProjectId(
    studentId,
    projectId,
  );

  if (!project) {
    return next(
      new ErrorHandler(
        "Project not found or you are not authorized to view feedback for this project",
        404,
      ),
    );
  }

  const sortedFeedback = [...project.feedbacks].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  res.status(200).json({
    success: true,
    data: { feedbacks: sortedFeedback },
    message: "Feedback fetched successfully",
  });
});

export const downloadFile = asyncHandler(async (req, res, next) => {
  const { projectId, fileId } = req.params;
  const studentId = req.user._id;

  const project = await projectService.getProjectByStudentIdAndProjectId(
    studentId,
    projectId,
  );

  if (!project) {
    return next(
      new ErrorHandler(
        "Project not found or you are not authorized to download files for this project",
        404,
      ),
    );
  }

  const file = project.files.id(fileId);
  if (!file) {
    return next(new ErrorHandler("File not found", 404));
  }

  return res.status(200).json({
    success: true,
    data: { fileUrl: file.fileUrl, originalName: file.originalName },
  });
});

export const getFeedbackHistory = asyncHandler(async (req, res) => {
  const projects = await Project.find({ student: req.user._id })
    .select("title status files feedbacks")
    .populate("feedbacks.supervisorId", "name email department")
    .lean();

  const feedbacks = projects
    .flatMap((p) =>
      (p.feedbacks || []).map((fb) => ({
        ...serializeFeedback(fb),
        projectId: p._id,
        projectTitle: p.title,
        fileName: fb.fileId
          ? p.files
              ?.find((f) => String(f._id) === String(fb.fileId))
              ?.originalName || null
          : null,
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    );

  res.status(200).json({
    success: true,
    message: "Feedback history fetched successfully",
    data: {
      feedbacks,
      summary: {
        total: feedbacks.length,
        unread: feedbacks.filter((f) => !f.isRead).length,
        revisionRequired: feedbacks.filter((f) => f.requiresRevision).length,
      },
    },
  });
});

export const markFeedbackRead = asyncHandler(async (req, res, next) => {
  const project = await Project.findOneAndUpdate(
    { student: req.user._id, "feedbacks._id": req.params.feedbackId },
    {
      $set: {
        "feedbacks.$.isRead": true,
        "feedbacks.$.readAt": new Date(),
      },
    },
  );
  if (!project) return next(new ErrorHandler("Feedback not found", 404));

  res.status(200).json({
    success: true,
    message: "Feedback marked as read",
    data: {},
  });
});

export const markAllFeedbackRead = asyncHandler(async (req, res) => {
  await Project.updateMany(
    { student: req.user._id },
    {
      $set: {
        "feedbacks.$[].isRead": true,
        "feedbacks.$[].readAt": new Date(),
      },
    },
  );
  res.status(200).json({
    success: true,
    message: "All feedback marked as read",
    data: {},
  });
});

export const getMyFiles = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ student: req.user._id })
    .sort({ createdAt: -1 })
    .lean();

  const files = (project?.files || [])
    .map(serializeFile)
    .sort(
      (a, b) =>
        new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0),
    );

  res.status(200).json({
    success: true,
    message: "Files fetched successfully",
    data: {
      project: project
        ? {
            _id: project._id,
            title: project.title,
            status: project.status,
          }
        : null,
      locked: ["rejected", "completed"].includes(project?.status),
      files,
      summary: {
        total: files.length,
        pending: files.filter((f) => f.reviewStatus === "pending").length,
        reviewed: files.filter((f) => f.reviewStatus === "reviewed")
          .length,
        revisionRequested: files.filter(
          (f) => f.reviewStatus === "revision_requested",
        ).length,
      },
    },
  });
});

export const deleteMyFile = asyncHandler(async (req, res, next) => {
  const { projectId, fileId } = req.params;

  const project = await Project.findOne({
    _id: projectId,
    student: req.user._id,
  });
  if (!project) return next(new ErrorHandler("Project not found", 404));

  if (["rejected", "completed"].includes(project.status)) {
    return next(
      new ErrorHandler(
        `Files cannot be changed on a ${project.status} project`,
        400,
      ),
    );
  }

  const file = project.files.id(fileId);
  if (!file) return next(new ErrorHandler("File not found", 404));

  if ((file.reviewStatus || "pending") !== "pending") {
    return next(
      new ErrorHandler(
        "This file has already been reviewed and can no longer be deleted",
        400,
      ),
    );
  }

  await deleteFromCloudinary(file.fileUrl);
  project.files.pull(file._id);
  await project.save();

  res.status(200).json({
    success: true,
    message: "File deleted",
    data: {},
  });
});

export const replyToFeedback = asyncHandler(async (req, res, next) => {
  const project = await Project.findOne({
    student: req.user._id,
    "feedbacks._id": req.params.feedbackId,
  });
  if (!project) return next(new ErrorHandler("Feedback not found", 404));

  if (project.status === "rejected") {
    return next(
      new ErrorHandler("You cannot reply on a rejected project", 400),
    );
  }

  const feedback = project.feedbacks.id(req.params.feedbackId);
  if (feedback.replies.length >= 50) {
    return next(
      new ErrorHandler(
        "This conversation has reached its reply limit",
        400,
      ),
    );
  }

  feedback.replies.push({
    author: req.user._id,
    role: "Student",
    message: req.body.message.trim(),
  });
  await project.save();

  if (project.supervisor) {
    try {
      await notificationService.notifyUser(
        project.supervisor,
        `${req.user.name} replied to your feedback "${feedback.title}".`,
        "feedback",
        `/teacher/assigned-students/${req.user._id}`,
        "medium",
      );
    } catch {
      // the reply is saved, so a notification failure is not fatal
    }
  }

  const reply = feedback.replies[feedback.replies.length - 1];
  res.status(201).json({
    success: true,
    message: "Reply sent",
    data: {
      reply: {
        _id: reply._id,
        role: reply.role,
        message: reply.message,
        createdAt: reply.createdAt,
      },
    },
  });
});