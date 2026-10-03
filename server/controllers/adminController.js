import crypto from "crypto";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import User from "../models/user.js";
import * as userServices from "../services/userServices.js";
import * as projectServices from "../services/projectService.js";

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
  });
});

export const getAllUsers = asyncHandler(async (req, res, next) => {
  try {
    const query = { role: { $in: ["Student", "Teacher"] } };
    const users = await User.find(query)
      .select("-password -resetPasswordToken -resetPasswordExpire")
      .populate("supervisor", "name email department")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Users fetched succes sfully",
      data: { users },
    });
  } catch (error) {
    return next(
      new ErrorHandler(`Error fetching users: ${error.message}`, 500),
    );
  }
});

export const getAllProjects = asyncHandler(async (req, res, next) => {
  const projects = await projectServices.getAllProjects();

  res.status(200).json({
    success: true,
    message: "Projects fetched successfully",
    data: { projects },
  });
});

export const assignedSupervisor = asyncHandler(async (req, res, next) => {});

export const getDashboardStats = asyncHandler(async (req, res, next) => {});
