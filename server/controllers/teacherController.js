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
  if (status !== "all") query.status = ["pending", "accepted", "rejected"].includes(status) ? status : "pending";

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

export const getAssignedStudents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const teacher = await User.findById(req.user._id).select("assignedStudents").lean();
  const studentIds = teacher?.assignedStudents || [];
  const [students, total] = await Promise.all([
    User.find({ _id: { $in: studentIds }, role: "Student" })
      .select("name email department supervisor project")
      .populate("project", "title status")
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments({ _id: { $in: studentIds }, role: "Student" }),
  ]);

  res.status(200).json({
    success: true,
    message: "Assigned students fetched successfully",
    data: { students, pagination: getPaginationMeta(page, limit, total) },
  });
});

export const getAssignedStudent = asyncHandler(async (req, res, next) => {
  const student = await User.findOne({
    _id: req.params.id,
    role: "Student",
    supervisor: req.user._id,
  })
    .select("name email department supervisor project")
    .populate("project", "title description status files feedbacks deadline")
    .lean();
  if (!student) return next(new ErrorHandler("Student not found", 404));

  res.status(200).json({
    success: true,
    message: "Assigned student fetched successfully",
    data: { student },
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

export const addProjectFeedback = asyncHandler(async (req, res, next) => {
  const { type = "general", title, message } = req.body;
  const project = await Project.findOne(teacherProjectQuery(req.user._id, req.params.id));
  if (!project) return next(new ErrorHandler("Project not found", 404));

  project.feedbacks.push({ supervisorId: req.user._id, type, title: title.trim(), message: message.trim() });
  await project.save();
  await notificationService.notifyUser(
    project.student,
    `Your supervisor added feedback to "${project.title}".`,
    "feedback",
    `/student/feedback/${project._id}`,
    "medium",
  );

  res.status(201).json({
    success: true,
    message: "Feedback added successfully",
    data: { feedback: project.feedbacks[project.feedbacks.length - 1] },
  });
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
