import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import User from "../models/user.js";
import { Project } from "../models/project.js";
import { supervisorRequest } from "../models/supervisorRequest.js";
import * as assignmentService from "../services/supervisorAssignmentService.js";
import * as notificationService from "../services/notificationService.js";
import { Deadline } from "../models/deadline.js";
import * as fileServices from "../services/fileServices.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";
import { isValidProjectStatusTransition } from "../utils/projectStatus.js";
import {
  serializeFile,
  serializeFeedback,
  getLastFile,
  getLastFeedbackDate,
  countPendingFiles,
  getProgressState,
} from "../utils/projectProgress.js";

const teacherProjectQuery = (teacherId, projectId) => ({
  _id: projectId,
  supervisor: teacherId,
});

const populateProject = (query) =>
  query
    .populate("student", "name email department")
    .populate("supervisor", "name email department")
    .populate("feedbacks.supervisorId", "name email");

export const getSupervisorRequests = asyncHandler(async (req, res) => {
  const { status = "pending" } = req.query;
  const query = { supervisor: req.user._id };
    query.status =
    status === "all"
      ? { $ne: "cancelled" }
      : ["pending", "accepted", "rejected"].includes(status)
        ? status
        : "pending";

  const requestDocuments = await supervisorRequest.find(query)
    .populate("student", "name email department")
    .sort({ createdAt: -1 })
    .lean();
  const requests = await Promise.all(
    requestDocuments.map(async (request) => ({
      ...request,
      project: await Project.findOne({ student: request.student._id })
        .select("title description status")
        .sort({ createdAt: -1 })
        .lean(),
    })),
  );

  res.status(200).json({
    success: true,
    message: "Supervisor requests fetched successfully",
    data: { requests },
  });
});

export const acceptSupervisorRequest = asyncHandler(async (req, res, next) => {
  const requestId = req.params.id || req.params.requestId;
  const request = await supervisorRequest.findOne({
    _id: requestId,
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
  const acceptedRequest = await supervisorRequest.findById(request._id).lean();

  res.status(200).json({
    success: true,
    message: "Supervisor request accepted successfully",
    data: { project: assignedProject, request: acceptedRequest },
  });
});

export const rejectSupervisorRequest = asyncHandler(async (req, res, next) => {
  const requestId = req.params.id || req.params.requestId;
  const rejectionReason = req.body.rejectionReason?.trim();
  if (!rejectionReason) {
    return next(new ErrorHandler("A rejection reason is required", 400));
  }
  const request = await supervisorRequest.findOneAndUpdate(
    { _id: requestId, supervisor: req.user._id, status: "pending" },
    { $set: { status: "rejected", rejectionReason } },
    { new: true },
  );
  if (!request) return next(new ErrorHandler("Supervisor request not found", 404));

  await User.findByIdAndUpdate(request.student, {
    $set: { supervisor: null },
  });
  await notificationService.notifyUser(
    request.student,
    `Your supervisor request was declined: ${rejectionReason}`,
    "request",
    "/student/supervisor",
    "medium",
  );
  res.status(200).json({
    success: true,
    message: "Supervisor request rejected successfully",
    data: { request },
  });
});

export const getTeacherDashboard = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const [teacher, projectRows, pendingRequestCount] = await Promise.all([
    User.findById(teacherId).select("assignedStudents maxStudents").lean(),
    populateProject(
      Project.find({ supervisor: teacherId })
        .sort({ updatedAt: -1 })
        .limit(30),
    ).lean(),
    supervisorRequest.countDocuments({ supervisor: teacherId, status: "pending" }),
  ]);

  const projectIds = projectRows.map((project) => project._id);
  const upcomingDeadlines = projectIds.length
    ? await Deadline.find({
        isActive: { $ne: false },
        dueDate: { $gte: new Date() },
        project: { $in: projectIds },
      })
        .populate("project", "title")
        .sort({ dueDate: 1 })
        .limit(5)
        .lean()
    : [];

  const recentFiles = projectRows
    .flatMap((project) =>
      (project.files || []).map((file) => ({
        ...file,
        projectId: project._id,
        projectTitle: project.title,
        student: project.student,
      })),
    )
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    .slice(0, 6);

  const recentProposals = [...projectRows]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  const activeStatuses = ["approved", "in_progress", "revision_required"];
  const reviewStatuses = ["pending", "revision_required"];

  res.status(200).json({
    success: true,
    message: "Teacher dashboard fetched successfully",
    data: {
      summary: {
        assignedStudentCount: teacher?.assignedStudents?.length || 0,
        maxStudents: teacher?.maxStudents || 0,
        pendingRequestCount,
        activeProjectCount: projectRows.filter((project) => activeStatuses.includes(project.status)).length,
        projectsRequiringReview: projectRows.filter((project) => reviewStatuses.includes(project.status)).length,
      },
      projects: projectRows.slice(0, 5),
      recentFiles,
      recentProposals,
      upcomingDeadlines,
    },
  });
});
//here
// Next upcoming deadline per project: earliest of project-specific, student-specific and global
const loadNextDeadlines = async (projects) => {
  const map = new Map();
  if (!projects.length) return map;

  const rows = await Deadline.find({
    isActive: { $ne: false },
    dueDate: { $gte: new Date() },
    $or: [
      { project: { $in: projects.map((p) => p._id) } },
      { student: { $in: projects.map((p) => p.student) } },
      { project: null, student: null },
    ],
  })
    .sort({ dueDate: 1 })
    .lean();

  for (const p of projects) {
    const match = rows.find(
      (d) =>
        (d.project && String(d.project) === String(p._id)) ||
        (d.student && String(d.student) === String(p.student)) ||
        (!d.project && !d.student),
    );
    if (match) map.set(String(p._id), { _id: match._id, name: match.name, dueDate: match.dueDate });
  }
  return map;
};

export const getAssignedStudents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const teacher = await User.findById(req.user._id).select("assignedStudents").lean();
  const filter = { _id: { $in: teacher?.assignedStudents || [] }, role: "Student" };

  const [students, total] = await Promise.all([
    User.find(filter).select("name email department").sort({ name: 1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  const projects = await Project.find({
    student: { $in: students.map((s) => s._id) },
    supervisor: req.user._id,
    status: { $ne: "rejected" },
  })
    .sort({ createdAt: -1 })
    .lean();

  const projectByStudent = new Map();
  projects.forEach((p) => {
    if (!projectByStudent.has(String(p.student))) projectByStudent.set(String(p.student), p);
  });
  const deadlineMap = await loadNextDeadlines([...projectByStudent.values()]);

  const rows = students.map((student) => {
    const project = projectByStudent.get(String(student._id)) || null;
    const files = project?.files || [];
    const lastFile = getLastFile(files);
    return {
      student,
      project: project ? { _id: project._id, title: project.title, status: project.status } : null,
      progressState: getProgressState(project),
      fileCount: files.length,
      pendingReviewCount: countPendingFiles(files),
      lastUpload: lastFile ? serializeFile(lastFile) : null,
      lastFeedbackAt: getLastFeedbackDate(project?.feedbacks || []),
      nextDeadline: project ? deadlineMap.get(String(project._id)) || null : null,
    };
  });

  res.status(200).json({
    success: true,
    message: "Assigned students fetched successfully",
    data: { students: rows, pagination: getPaginationMeta(page, limit, total) },
  });
});

export const getAssignedStudent = asyncHandler(async (req, res, next) => {
  const student = await User.findOne({
    _id: req.params.id,
    role: "Student",
    supervisor: req.user._id,
  })
    .select("name email department")
    .lean();
  if (!student) return next(new ErrorHandler("Student not found", 404));

  const project = await Project.findOne({
    student: student._id,
    supervisor: req.user._id,
    status: { $ne: "rejected" },
  })
    .sort({ createdAt: -1 })
    .populate("feedbacks.supervisorId", "name email")
    .lean();

  const nextDeadline = project
    ? (await loadNextDeadlines([project])).get(String(project._id)) || null
    : null;

  const byNewest = (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0);

  res.status(200).json({
    success: true,
    message: "Assigned student fetched successfully",
    data: {
      student,
      progressState: getProgressState(project),
      nextDeadline,
      project: project
        ? {
            _id: project._id,
            title: project.title,
            description: project.description,
            status: project.status,
            createdAt: project.createdAt,
            files: (project.files || [])
              .map(serializeFile)
              .sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0)),
            feedbacks: (project.feedbacks || []).map(serializeFeedback).sort(byNewest),
          }
        : null,
    },
  });
});

export const getTeacherFiles = asyncHandler(async (req, res) => {
  const projects = await Project.find({ supervisor: req.user._id })
    .select("title status student files")
    .populate("student", "name email department")
    .lean();

  const files = projects
    .flatMap((p) =>
      (p.files || []).map((f) => ({
        ...serializeFile(f),
        projectId: p._id,
        projectTitle: p.title,
        student: p.student,
      })),
    )
    .sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));

  res.status(200).json({
    success: true,
    message: "Files fetched successfully",
    data: {
      files,
      summary: {
        total: files.length,
        pending: files.filter((f) => f.reviewStatus === "pending").length,
        reviewed: files.filter((f) => f.reviewStatus === "reviewed").length,
        revisionRequested: files.filter((f) => f.reviewStatus === "revision_requested").length,
      },
    },
  });
});

export const reviewTeacherFile = asyncHandler(async (req, res, next) => {
  const { projectId, fileId } = req.params;
  const { action } = req.body;
  const message = req.body.message?.trim() || "";

  const project = await Project.findOne(teacherProjectQuery(req.user._id, projectId));
  if (!project) return next(new ErrorHandler("Project not found", 404));
  const file = project.files.id(fileId);
  if (!file) return next(new ErrorHandler("File not found", 404));

  if (action === "revision_requested" && message.length < 2) {
    return next(new ErrorHandler("Please describe what needs to be revised", 400));
  }

  file.reviewStatus = action;
  file.reviewedAt = new Date();

  if (action === "revision_requested") {
    project.feedbacks.push({
      supervisorId: req.user._id,
      type: "negative",
      title: `Revision requested: ${file.originalName}`.slice(0, 100),
      message,
      requiresRevision: true,
      fileId: file._id,
    });
    if (isValidProjectStatusTransition(project.status, "revision_required")) {
      project.status = "revision_required";
    }
  }

  await project.save();

  await notificationService.notifyUser(
    project.student,
    action === "reviewed"
      ? `Your file "${file.originalName}" was reviewed by your supervisor.`
      : `Your supervisor requested a revision on "${file.originalName}".`,
    "feedback",
    "/student/feedback",
    action === "reviewed" ? "medium" : "high",
  );

  res.status(200).json({
    success: true,
    message: action === "reviewed" ? "File marked as reviewed" : "Revision requested",
    data: { reviewStatus: file.reviewStatus, projectStatus: project.status },
  });
});

export const addProjectFeedback = asyncHandler(async (req, res, next) => {
  const { type = "general", title, message, fileId } = req.body;
  const requiresRevision = req.body.requiresRevision === true || req.body.requiresRevision === "true";

  const project = await Project.findOne(teacherProjectQuery(req.user._id, req.params.id));
  if (!project) return next(new ErrorHandler("Project not found", 404));

  let file = null;
  if (fileId) {
    file = project.files.id(fileId);
    if (!file) return next(new ErrorHandler("File not found on this project", 400));
  }

  project.feedbacks.push({
    supervisorId: req.user._id,
    type,
    title: title.trim(),
    message: message.trim(),
    requiresRevision,
    ...(file ? { fileId: file._id } : {}),
  });

  if (requiresRevision) {
    if (file) {
      file.reviewStatus = "revision_requested";
      file.reviewedAt = new Date();
    }
    if (isValidProjectStatusTransition(project.status, "revision_required")) {
      project.status = "revision_required";
    }
  }

  await project.save();

  await notificationService.notifyUser(
    project.student,
    requiresRevision
      ? `Your supervisor added feedback to "${project.title}" and requested a revision.`
      : `Your supervisor added feedback to "${project.title}".`,
    "feedback",
    "/student/feedback",
    requiresRevision ? "high" : "medium",
  );

  res.status(201).json({
    success: true,
    message: "Feedback added successfully",
    data: {
      feedback: project.feedbacks[project.feedbacks.length - 1],
      projectStatus: project.status,
    },
  });
});



export const getTeacherProjects = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const query = { supervisor: req.user._id };
  const [projects, total] = await Promise.all([
    populateProject(Project.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit)).lean(),
    Project.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    message: "Teacher projects fetched successfully",
    data: { projects, pagination: getPaginationMeta(page, limit, total) },
  });
});

export const getTeacherProject = asyncHandler(async (req, res, next) => {
  const project = await populateProject(
    Project.findOne(teacherProjectQuery(req.user._id, req.params.id)),
  ).lean();
  if (!project) return next(new ErrorHandler("Project not found", 404));

  res.status(200).json({
    success: true,
    message: "Teacher project fetched successfully",
    data: { project },
  });
});

export const getTeacherProjectFiles = asyncHandler(async (req, res, next) => {
  const project = await Project.findOne(teacherProjectQuery(req.user._id, req.params.id))
    .select("files")
    .lean();
  if (!project) return next(new ErrorHandler("Project not found", 404));

  const { page, limit, skip } = getPagination(req.query);
  const files = project.files.slice(skip, skip + limit);
  res.status(200).json({
    success: true,
    message: "Project files fetched successfully",
    data: { files, pagination: getPaginationMeta(page, limit, project.files.length) },
  });
});

export const downloadTeacherProjectFile = asyncHandler(async (req, res, next) => {
  const project = await Project.findOne(teacherProjectQuery(req.user._id, req.params.projectId));
  if (!project) return next(new ErrorHandler("Project not found", 404));
  const file = project.files.id(req.params.fileId);
  if (!file) return next(new ErrorHandler("File not found", 404));
  fileServices.streamDownload(file.fileUrl, res, file.originalName, next);
});



export const updateTeacherProjectStatus = asyncHandler(async (req, res, next) => {
  const project = await Project.findOne(teacherProjectQuery(req.user._id, req.params.id));
  if (!project) return next(new ErrorHandler("Project not found", 404));
  if (req.body.status === "rejected" && !req.body.rejectionReason?.trim()) {
    return next(new ErrorHandler("A rejection reason is required", 400));
  }
  if (!isValidProjectStatusTransition(project.status, req.body.status)) {
    return next(new ErrorHandler(`Invalid project status transition from "${project.status}" to "${req.body.status}"`, 400));
  }

  project.status = req.body.status;
  if (project.status !== "rejected") project.rejectionReason = null;
  if (project.status === "rejected") project.rejectionReason = req.body.rejectionReason?.trim() || null;
  await project.save();
  await notificationService.notifyUser(
    project.student,
    `Your project "${project.title}" status was updated to ${project.status}.`,
    "project",
    "/student",
    project.status === "rejected" ? "high" : "medium",
  );

  res.status(200).json({
    success: true,
    message: "Project status updated successfully",
    data: { project },
  });
});

export const getTeacherDeadlines = asyncHandler(async (req, res) => {
  const projectIds = await Project.find({ supervisor: req.user._id }).distinct("_id");
  const deadlines = await Deadline.find({
    isActive: { $ne: false },
    $or: [{ project: { $in: projectIds } }, { student: { $in: req.user.assignedStudents || [] } }, { project: null, student: null }],
  })
    .populate("project", "title")
    .populate("student", "name email")
    .sort({ dueDate: 1 })
    .lean();

  res.status(200).json({
    success: true,
    message: "Teacher deadlines fetched successfully",
    data: { deadlines },
  });
});


export const replyToStudentFeedback = asyncHandler(async (req, res, next) => {
  const { projectId, feedbackId } = req.params;

  const project = await Project.findOne(teacherProjectQuery(req.user._id, projectId));
  if (!project) return next(new ErrorHandler("Project not found", 404));

  const feedback = project.feedbacks.id(feedbackId);
  if (!feedback) return next(new ErrorHandler("Feedback not found", 404));
  if (feedback.replies.length >= 50) {
    return next(new ErrorHandler("This conversation has reached its reply limit", 400));
  }

  feedback.replies.push({
    author: req.user._id,
    role: "Teacher",
    message: req.body.message.trim(),
  });
  // Show it as new to the student
  feedback.isRead = false;
  feedback.readAt = null;
  await project.save();

  await notificationService.notifyUser(
    project.student,
    `Your supervisor replied on "${feedback.title}".`,
    "feedback",
    "/student/feedback",
    "medium",
  );

  const reply = feedback.replies[feedback.replies.length - 1];
  res.status(201).json({
    success: true,
    message: "Reply sent",
    data: {
      reply: { _id: reply._id, role: reply.role, message: reply.message, createdAt: reply.createdAt },
    },
  });
});