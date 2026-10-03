import ErrorHandler from "../middlewares/error.js";
import { Project } from "../models/project.js";

export const getProjectByStudentId = async (studentId) => {
  return await Project.findOne({ student: studentId }).sort({ createdAt: -1 });
};

export const getActiveProjectByStudentId = async (studentId) => {
  return await Project.findOne({
    student: studentId,
    status: {
      $in: [
        "pending",
        "approved",
        "in_progress",
        "revision_required",
        "completed",
      ],
    },
  }).sort({ createdAt: -1 });
};

export const createProject = async (projectData) => {
  const newProject = new Project(projectData);
  try {
    return await newProject.save();
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.student) {
      throw new ErrorHandler(
        "You already have an active project. Please wait for it to be rejected before submitting another proposal.",
        400,
      );
    }
    throw error;
  }
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
  return await project.save();
};

export const getAllProjects = async ({ page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;
  const [projects, total] = await Promise.all([
    Project.find()
      .populate("supervisor", "name email department")
      .populate("student", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Project.countDocuments(),
  ]);

  return { projects, total };
};
