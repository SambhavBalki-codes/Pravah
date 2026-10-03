import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import User from "../models/user.js";
import * as projectService from "../services/projectService.js";
import * as requestService from "../services/requestService.js";
import * as notificationService from "../services/notificationService.js";
import { Project } from "../models/project.js";
import { Notification } from "../models/notifications.js";
import * as fileServices from "../services/fileServices.js";

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
    await projectService.getProjectByStudentId(studentID);

  if (existingProject && existingProject.status !== "rejected") {
    return next(
      new ErrorHandler(
        "You have an active project. You can only submit a new proposal if the previous project is rejected.",
        400,
      ),
    );
  }

  if (existingProject && existingProject.status === "rejected") {
    await Project.findByIdAndDelete(existingProject._id);
  }

  const projectData = {
    student: studentID,
    title,
    description,
  };

  const newProject = await projectService.createProject(projectData);

  await User.findByIdAndUpdate(studentID, { project: newProject._id });

  res.status(201).json({
    success: true,
    data: { project: newProject },
    message: "Proposal submitted successfully",
  });
});

export const uploadFiles = asyncHandler(async (req, res, next) => {
  const { projectID } = req.params;
  const studentId = req.user._id;

  const project = await projectService.getProjectById(projectID);

  if (!project || project.student.toString() !== studentId.toString()) {
    return next(
      new ErrorHandler(
        "Project not found or you are not authorized to upload files for this project",
        404,
      ),
    );
  }

  if (!req.files || req.files.length === 0) {
    return next(new ErrorHandler("No files uploaded", 400));
  }

  const updatedProject = await projectService.addFilesToProject(
    projectID,
    req.files,
  );

  res.status(200).json({
    success: true,
    data: { project: updatedProject },
    message: "Files uploaded successfully",
  });
});

export const getAvailableSupervisors = asyncHandler(async (req, res, next) => {
  const supervisors = await User.find({ role: "Teacher" })
    .select("name email department expertise maxStudents assignedStudents")
    .lean();

  res.status(200).json({
    success: true,
    data: { supervisors },
    message: "Available supervisors fetched successfully",
  });
});

export const getSupervisor = asyncHandler(async (req, res, next) => {
  const studentId = req.user._id;
  const student = await User.findById(studentId)
    .populate(
      "supervisor",
      "name email department expertise maxStudents assignedStudents",
    )
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

export const requestSupervisor = asyncHandler(async (req, res, next) => {
  const { teacherId, message } = req.body; // doubtfull
  const studentId = req.user._id;

  const student = await User.findById(studentId);
  if (!student) {
    return next(new ErrorHandler("Student not found", 404));
  }

  if (student.supervisor) {
    return next(
      new ErrorHandler("You already have a supervisor assigned", 400),
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

  const requestData = {
    student: studentId,
    message: message || "Requesting to be my supervisor",
    supervisor: teacherId,
  };

  const request = await requestService.createRequest(requestData);

  await notificationService.notifyUser(
    teacherId,
    `New supervisor request from ${student.name}`,
    "request",
    "/teacher/requests",
    "medium",
  );

  res.status(201).json({
    success: true,
    data: { request },
    message: "Supervisor request sent successfully",
  });
});

export const getDashboardStats = asyncHandler(async (req, res, next) => {
  const studentId = req.user._id;

  const project = await Project.findOne({ student: studentId })
    .sort({ createdAt: -1 })
    .populate("supervisor", "name")
    .lean();

  const now = new Date();
  const upcomingDeadlines = await Project.find({
    student: studentId,
    deadline: { $gte: now },
  })
    .select("title description")
    .sort({ deadline: 1 })
    .limit(3)
    .lean();

  const topNotifications = await Notification.find({ user: studentId })
    .populate("user", "name")
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();

  const feedbackNotifications =
    project?.feedback && project.feedback.length > 0
      ? project.feedback
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 2)
      : [];

  const supervisorName = project?.supervisor?.name || "N/A";

  res.status(200).json({
    success: true,
    message: "Dashboard stats fetched successfully",
    data: {
      project: project,
      upcomingDeadlines,
      topNotifications,
      feedbackNotifications,
      supervisorName,
    },
  });
});

export const getFeedback = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  const studentId = req.user._id;
  const project = await projectService.getProjectById(projectId);

  if (!project || project.student.toString() !== studentId.toString()) {
    return next(
      new ErrorHandler(
        "Project not found or you are not authorized to view feedback for this project",
        404,
      ),
    );
  }

  const sortedFeedback = project.feedback.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  res.status(200).json({
    success: true,
    data: { feedback: sortedFeedback },
    message: "Feedback fetched successfully",
  });
});

export const downloadFile = asyncHandler(async (req, res, next) => {
  const { projectId, fileId } = req.params;
  const studentId = req.user._id;

  const project = await projectService.getProjectById(projectId);

  if (!project || project.student.toString() !== studentId.toString()) {
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

  fileServices.streamDownload(file.fileUrl, res, file.originalName, next);
});
