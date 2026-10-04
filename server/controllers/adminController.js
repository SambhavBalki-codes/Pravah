import crypto from "crypto";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import User from "../models/user.js";
import { Project } from "../models/project.js";
import { Deadline } from "../models/deadline.js";
import * as userServices from "../services/userServices.js";
import * as projectServices from "../services/projectService.js";
import * as dashboardService from "../services/dashboardService.js";
import * as notificationService from "../services/notificationService.js";
import * as assignmentService from "../services/supervisorAssignmentService.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";
import { isValidProjectStatusTransition } from "../utils/projectStatus.js";

export const createStudent = asyncHandler(async (req, res, next) => {
  const { name, email, password, department } = req.body;

  if (!name || !email || !password || !department) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  const user = await userServices.createUser({
    name,
    email,
    password,
    role: "Student",
    department,
  });

  res.status(201).json({
    success: true,
    message: "Student created successfully",
    data: { user },
  });
});

export const updateStudent = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  delete updateData.role;

  const user = await userServices.updateUser(id, updateData);

  if (!user) {
    return next(new ErrorHandler("Student not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Student updated successfully",
    data: { user },
  });
});

export const deleteStudent = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await userServices.getUserById(id);

  if (!user) {
    return next(new ErrorHandler("Student not found", 404));
  }
  if (user.role !== "Student") {
    return next(new ErrorHandler("User is not a student", 400));
  }

  await userServices.deleteUser(id);

  res.status(200).json({
    success: true,
    message: "Student deleted successfully",
    data: {},
  });
});

export const createTeacher = asyncHandler(async (req, res, next) => {
  const { name, email, password, department, maxStudents, expertise } =
    req.body;

  if (
    !name ||
    !email ||
    !password ||
    !department ||
    !maxStudents ||
    !expertise
  ) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  const user = await userServices.createUser({
    name,
    email,
    password,
    role: "Teacher",
    department,
    maxStudents,
    expertise: Array.isArray(expertise)
      ? expertise
      : typeof expertise === "string" && expertise.trim() !== ""
        ? expertise.split(",").map((item) => item.trim())
        : [],
  });

  res.status(201).json({
    success: true,
    message: "Teacher created successfully",
    data: { user },
  });
});

export const updateTeacher = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  delete updateData.role;

  const user = await userServices.updateUser(id, updateData);

  if (!user) {
    return next(new ErrorHandler("Teacher not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Teacher updated successfully",
    data: { user },
  });
});

export const deleteTeacher = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await userServices.getUserById(id);

  if (!user) {
    return next(new ErrorHandler("Teacher not found", 404));
  }
  if (user.role !== "Teacher") {
    return next(new ErrorHandler("User is not a Teacher", 400));
  }

  await userServices.deleteUser(id);

  res.status(200).json({
    success: true,
    message: "Teacher deleted successfully",
    data: {},
  });
});

export const getAllUsers = asyncHandler(async (req, res, next) => {
  try {
    const query = { role: { $in: ["Student", "Teacher"] } };
    const { page, limit, skip } = getPagination(req.query);
    const [users, total] = await Promise.all([
      User.find(query)
      .select("-password -resetPasswordToken -resetPasswordExpire")
      .populate("supervisor", "name email department")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      message: "Users fetched succes sfully",
      data: { users, pagination: getPaginationMeta(page, limit, total) },
    });
  } catch (error) {
    return next(
      new ErrorHandler(`Error fetching users: ${error.message}`, 500),
    );
  }
});

export const getAllProjects = asyncHandler(async (req, res, next) => {
  const { page, limit } = getPagination(req.query);
  const { search = "", status, department, supervisor } = req.query;
  const { projects, total } = await projectServices.getAllProjects({
    page,
    limit,
    search,
    status,
    department,
    supervisor,
  });

  res.status(200).json({
    success: true,
    message: "Projects fetched successfully",
    data: { projects, pagination: getPaginationMeta(page, limit, total) },
  });
});

export const getProjectDetails = asyncHandler(async (req, res, next) => {
  const project = await projectServices.getProjectById(req.params.projectId);
  res.status(200).json({
    success: true,
    message: "Project details fetched successfully",
    data: { project },
  });
});

export const decideProject = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  const { status, rejectionReason } = req.body;
  const project = await Project.findById(projectId);

  if (!project) return next(new ErrorHandler("Project not found", 404));
  if (!isValidProjectStatusTransition(project.status, status)) {
    return next(
      new ErrorHandler(
        `Invalid project status transition from "${project.status}" to "${status}"`,
        400,
      ),
    );
  }
  if (status === "rejected" && !rejectionReason?.trim()) {
    return next(new ErrorHandler("A rejection reason is required", 400));
  }

  project.status = status;
  project.rejectionReason = status === "rejected" ? rejectionReason.trim() : null;
  await project.save();
  await notificationService.notifyUser(
    project.student,
    status === "approved"
      ? `Your proposal "${project.title}" was approved.`
      : `Your proposal "${project.title}" was rejected: ${project.rejectionReason}`,
    "project",
    "/student",
    status === "approved" ? "medium" : "high",
  );

  res.status(200).json({
    success: true,
    message: `Project ${status} successfully`,
    data: { project },
  });
});

export const assignProjectSupervisor = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  const { supervisorId } = req.body;
  const updatedProject = await assignmentService.assignSupervisorToProject({
    projectId,
    supervisorId,
  });
  res.status(200).json({
    success: true,
    message: "Supervisor assigned successfully",
    data: { project: updatedProject },
  });
});

export const updateProjectStatus = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  const { status } = req.body;
  const project = await Project.findById(projectId);

  if (!project) {
    return next(new ErrorHandler("Project not found", 404));
  }

  if (!isValidProjectStatusTransition(project.status, status)) {
    return next(
      new ErrorHandler(
        `Invalid project status transition from "${project.status}" to "${status}"`,
        400,
      ),
    );
  }

  project.status = status;
  if (status !== "rejected") project.rejectionReason = null;
  await project.save();

  res.status(200).json({
    success: true,
    message: "Project status updated successfully",
    data: { project },
  });
});

const validateDeadlineInput = ({ name, dueDate }, next) => {
    if (!name?.trim() || !dueDate || Number.isNaN(new Date(dueDate).getTime())) {
      next(new ErrorHandler("A title and valid due date are required", 400));
      return false;
    }
    if (new Date(dueDate) <= new Date()) {
      next(new ErrorHandler("Due date must be in the future", 400));
      return false;
    }
    return true;
};

export const getDeadlines = asyncHandler(async (req, res) => {
    const { filter = "all" } = req.query;
    const query = {};
    if (filter === "active") query.isActive = { $ne: false };
    if (filter === "inactive") query.isActive = false;
    if (filter === "overdue") {
      query.dueDate = { $lt: new Date() };
      query.isActive = { $ne: false };
    }

    const deadlines = await Deadline.find(query)
      .populate("project", "title student")
      .populate("student", "name email department")
      .populate("createdBy", "name email")
      .sort({ dueDate: 1 })
      .lean()
      .then((items) => items.map((item) => ({ ...item, isActive: item.isActive !== false })));

    res.status(200).json({
      success: true,
      message: "Deadlines fetched successfully",
      data: { deadlines },
    });
});

export const createDeadline = asyncHandler(async (req, res, next) => {
    const { name, dueDate, project, student } = req.body;
    if (!validateDeadlineInput({ name, dueDate }, next)) return;

    if (project) {
      const projectExists = await Project.exists({ _id: project });
      if (!projectExists) return next(new ErrorHandler("Project not found", 404));
    }
    if (student && !(await User.exists({ _id: student, role: "Student" }))) {
      return next(new ErrorHandler("Student not found", 404));
    }
    if (project && student) {
      return next(new ErrorHandler("Choose either a student or a project scope", 400));
    }

    const createdDeadline = await Deadline.create({
      name: name.trim(),
      dueDate: new Date(dueDate),
      project: project || null,
      student: student || null,
      createdBy: req.user._id,
    });

    const deadline = await Deadline.findById(createdDeadline._id)
      .populate("project", "title student")
      .populate("student", "name email department")
      .lean();

    res.status(201).json({
      success: true,
      message: "Deadline created successfully",
      data: { deadline },
    });
});

export const updateDeadline = asyncHandler(async (req, res, next) => {
    const { deadlineId } = req.params;
    const { name, dueDate, project, student } = req.body;
    if (!validateDeadlineInput({ name, dueDate }, next)) return;

    if (project) {
      const projectExists = await Project.exists({ _id: project });
      if (!projectExists) return next(new ErrorHandler("Project not found", 404));
    }
    if (student && !(await User.exists({ _id: student, role: "Student" }))) {
      return next(new ErrorHandler("Student not found", 404));
    }
    if (project && student) {
      return next(new ErrorHandler("Choose either a student or a project scope", 400));
    }

    const updatedDeadline = await Deadline.findByIdAndUpdate(
      deadlineId,
      {
        name: name.trim(),
        dueDate: new Date(dueDate),
        project: project || null,
        student: student || null,
      },
      { new: true, runValidators: true },
    );
    if (!updatedDeadline) return next(new ErrorHandler("Deadline not found", 404));
    const deadline = await Deadline.findById(updatedDeadline._id)
      .populate("project", "title student")
      .populate("student", "name email department")
      .lean();

    res.status(200).json({
      success: true,
      message: "Deadline updated successfully",
      data: { deadline },
    });
});

export const toggleDeadline = asyncHandler(async (req, res, next) => {
    const deadlineDocument = await Deadline.findById(req.params.deadlineId);
    if (!deadlineDocument) return next(new ErrorHandler("Deadline not found", 404));
    deadlineDocument.isActive = !deadlineDocument.isActive;
    await deadlineDocument.save();
    const deadline = await Deadline.findById(deadlineDocument._id)
      .populate("project", "title student")
      .populate("student", "name email department")
      .lean();
    res.status(200).json({
      success: true,
      message: `Deadline marked ${deadlineDocument.isActive ? "active" : "inactive"}`,
      data: { deadline },
    });
});

export const deleteDeadline = asyncHandler(async (req, res, next) => {
    const deadline = await Deadline.findByIdAndDelete(req.params.deadlineId);
    if (!deadline) return next(new ErrorHandler("Deadline not found", 404));
    res.status(200).json({
      success: true,
      message: "Deadline deleted successfully",
      data: { deadlineId: req.params.deadlineId },
  });
});

export const assignedSupervisor = asyncHandler(async (req, res, next) => {});

export const getDashboardStats = asyncHandler(async (req, res, next) => {
  const dashboard = await dashboardService.getDashboardData();

  res.status(200).json({
    success: true,
    message: "Dashboard data fetched successfully",
    data: dashboard,
  });
});
