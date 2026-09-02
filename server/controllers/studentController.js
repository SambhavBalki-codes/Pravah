import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import User from "../models/user.js";
import * as projectService from "../services/projectService.js";


export const getStudentProject = asyncHandler(async (req, res, next) => {

  const studentID = req.user.id;

  const {project} = await projectService.getProjectByStudentId(studentID);

  if(!project){
    return res.status(200).json({
      success: true,
      data : {project: null},
      message: "No project found for this student"
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

  const existingProject = await projectService.getProjectByStudentId(studentID);

  if (existingProject && existingProject.status !== "rejected") {
    return next(new ErrorHandler("You have an active project. You can only submit a new proposal if the previous project is rejected.", 400));
  }

  const projectData = {
    student: studentID,
    title,
    description,
  }

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

  if(!project || project.student.toString() !== studentId.toString()){
    return next(new ErrorHandler("Project not found or you are not authorized to upload files for this project", 404));
  } 

  if(!req.files || req.files.length === 0){
    return next(new ErrorHandler("No files uploaded", 400));
  }

  const updatedProject = await projectService.addFilesToProject(projectID, req.files);

  res.status(200).json({
    success: true,
    data: { project: updatedProject },
    message: "Files uploaded successfully",
  });
});

export const getAvailableSupervisors = asyncHandler(async (req, res, next) => {
  const supervisors = await User.find({ role: "Teacher" }).select("name email department expertise maxStudents assignedStudents").lean();

  res.status(200).json({
    success: true,
    data: { supervisors },
    message: "Available supervisors fetched successfully",
  });
});