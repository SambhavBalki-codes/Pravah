import ErrorHandler from "../middlewares/error.js";
import { Project } from "../models/project.js";

export const getProjectByStudentId = async (studentId) => {
  return await Project.findOne({ student: studentId }).sort({ createdAt: -1 });
};

export const getActiveProjectByStudentId = async (studentId) => {
  return await Project.findOne({
    student: studentId,
    status: { $not: /^rejected$/i },
  }).sort({ createdAt: -1 });
};

export const createProject = async (projectData) => {
  const newProject = new Project(projectData);
  return await newProject.save();
};

export const getProjectById = async (projectId) => {
  const project = await Project.findById(projectId)
    .populate("student", "name email")
    .populate("supervisor", "name email");
  if (!project) {
    throw new ErrorHandler("Project not found", 404);
  }
  return project;
};

export const addFilesToProject = async (projectId, files) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  const fileMetadata = files.map((file) => ({
    fileType: file.mimetype,
    fileUrl: file.path,
    originalName: file.originalname,
  }));

  project.files.push(...fileMetadata);
  await project.save();
};
