import mongoose from "mongoose";
import ErrorHandler from "../middlewares/error.js";
import User from "../models/user.js";
import { Project } from "../models/project.js";
import { supervisorRequest } from "../models/supervisorRequest.js";
import { Notification } from "../models/notifications.js";

const notify = (userId, message, link, priority, session) =>
  Notification.create(
    [
      {
        user: userId,
        message,
        type: "approval",
        link,
        priority,
      },
    ],
    { session },
  );

export const assignSupervisorToProject = async ({
  projectId,
  supervisorId,
  requestId,
}) => {
  const session = await mongoose.startSession();
  try {
    let assignedProject;
    await session.withTransaction(async () => {
      const project = await Project.findById(projectId).session(session);
      const supervisor = await User.findOne({
        _id: supervisorId,
        role: "Teacher",
      }).session(session);

      if (!project) throw new ErrorHandler("Project not found", 404);
      if (!supervisor) throw new ErrorHandler("Teacher not found", 404);
      if (project.supervisor) {
        throw new ErrorHandler("A supervisor is already assigned to this project", 400);
      }
      if (supervisor.assignedStudents.length >= supervisor.maxStudents) {
        throw new ErrorHandler("This supervisor has reached capacity", 400);
      }
      const student = await User.findById(project.student).session(session);
      if (!student) throw new ErrorHandler("Student not found", 404);
      if (student.supervisor) {
        throw new ErrorHandler("This student already has a supervisor", 400);
      }
      const existingSupervisedProject = await Project.findOne({
        _id: { $ne: project._id },
        student: project.student,
        supervisor: { $ne: null },
      }).session(session);
      if (existingSupervisedProject) {
        throw new ErrorHandler(
          "This student already has a supervisor on another project",
          409,
        );
      }

      if (requestId) {
        const request = await supervisorRequest.findOne({
          _id: requestId,
          student: project.student,
          supervisor: supervisor._id,
          status: "pending",
        }).session(session);
        if (!request) throw new ErrorHandler("Supervisor request is no longer pending", 409);
        request.status = "accepted";
        await request.save({ session });
      }

      project.supervisor = supervisor._id;
      await project.save({ session });
      const studentUpdate = await User.updateOne(
        { _id: project.student, supervisor: null },
        { $set: { supervisor: supervisor._id } },
        { session },
      );
      if (studentUpdate.modifiedCount !== 1) {
        throw new ErrorHandler("Student supervisor assignment could not be completed", 409);
      }
      const supervisorUpdate = await User.updateOne(
        {
          _id: supervisor._id,
          $expr: { $lt: [{ $size: "$assignedStudents" }, "$maxStudents"] },
        },
        { $addToSet: { assignedStudents: project.student } },
        { session },
      );
      if (supervisorUpdate.modifiedCount !== 1) {
        throw new ErrorHandler("Supervisor capacity changed. Please try again", 409);
      }
      await supervisorRequest.updateMany(
        {
          student: project.student,
          status: "pending",
          _id: requestId ? { $ne: requestId } : { $exists: true },
        },
        { $set: { status: "rejected" } },
        { session },
      );

      await notify(
        project.student,
        `Supervisor ${supervisor.name} has been assigned to your project "${project.title}".`,
        "/student/supervisor",
        "medium",
        session,
      );
      await notify(
        supervisor._id,
        `You are now supervising "${project.title}".`,
        "/teacher/assigned-students",
        "medium",
        session,
      );
      assignedProject = project;
    });

    return Project.findById(assignedProject._id)
      .populate("student", "name email department")
      .populate("supervisor", "name email department")
      .lean();
  } finally {
    await session.endSession();
  }
};
