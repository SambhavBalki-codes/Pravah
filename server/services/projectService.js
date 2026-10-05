import ErrorHandler from "../middlewares/error.js";
import { Project } from "../models/project.js";
import User from "../models/user.js";

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
    .populate("student", "name email department")
    .populate("supervisor", "name email");
  if (project) {
    await project.populate("feedbacks.supervisorId", "name email");
  }
  if (!project) {
    throw new ErrorHandler("Project not found", 404);
  }
  return project;
};

export const getProjectByStudentIdAndProjectId = async (
  studentId,
  projectId,
) => {
  return await Project.findOne({
    _id: projectId,
    student: studentId,
  })
    .populate("student", "name email")
    .populate("supervisor", "name email");
};

export const getProjectBySupervisorIdAndProjectId = async (
  supervisorId,
  projectId,
) => {
  return await Project.findOne({
    _id: projectId,
    supervisor: supervisorId,
  })
    .populate("student", "name email")
    .populate("supervisor", "name email");
};

export const addFilesToProject = async (projectId, files) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ErrorHandler("Project not found", 404);
  }

  // A file with the same name as an earlier upload becomes its next version
  files.forEach((file) => {
    const sameName = project.files.filter((f) => f.originalName === file.originalname);
    const version = sameName.length
      ? Math.max(...sameName.map((f) => f.version || 1)) + 1
      : 1;

    project.files.push({
      fileType: file.mimetype,
      fileUrl: file.path,
      originalName: file.originalname,
      fileSize: file.size,
      reviewStatus: "pending",
      version,
    });
  });

  // First upload starts the work. A re-upload after a revision request resumes it.
  if (["approved", "revision_required"].includes(project.status)) {
    project.status = "in_progress";
  }

  return await project.save();
};

export const getAllProjects = async ({
  page = 1,
  limit = 10,
  search = "",
  status,
  department,
  supervisor,
} = {}) => {
  const skip = (page - 1) * limit;
  const query = {};
  if (search.trim()) {
    query.title = { $regex: search.trim(), $options: "i" };
  }
  if (status) query.status = status;
  if (supervisor) query.supervisor = supervisor;

  if (department) {
    const students = await User.find({
      role: "Student",
      department,
    }).select("_id").lean();
    query.student = { $in: students.map((student) => student._id) };
  }

  const [projects, total] = await Promise.all([
    Project.find(query)
      .populate("supervisor", "name email department")
      .populate("student", "name email department")
      .populate("feedbacks.supervisorId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Project.countDocuments(query),
  ]);

  return { projects, total };
};
