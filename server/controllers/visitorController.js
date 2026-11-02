import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import User from "../models/user.js";
import { Project } from "../models/project.js";
import { VisitorChat } from "../models/visitorChat.js";
import { queryProject, streamProject } from "../services/ragService.js";
import { generateToken } from "../utils/generateToken.js";
import bcrypt from "bcrypt";

export const visitorRegister = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return next(new ErrorHandler("Email already registered", 400));
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: "Visitor",
  });

  generateToken(user, 201, "Registered successfully", res);
});

export const visitorLogin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({
    email: email.toLowerCase(),
    role: "Visitor",
  }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  generateToken(user, 200, "Logged in successfully", res);
});

export const visitorLogout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    expires: new Date(0),
    httpOnly: true,
  });
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

export const getPublicProjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, search = "", department = "" } = req.query;
  const skip = (page - 1) * limit;

  const query = {
    status: "completed",
    isPublic: true,
    publicationStatus: { $in: ["approved", null] },
  };

  if (search.trim()) {
    query.title = { $regex: search.trim(), $options: "i" };
  }

  if (department.trim()) {
    query.department = department.trim();
  }

  const [projects, total] = await Promise.all([
    Project.find(query)
      .populate("student", "name department")
      .populate("supervisor", "name")
      .select(
        "title description department githubUrl completedAt student supervisor files ragIndexed ragStatus ragError ragIndexedAt publicationStatus publishedAt"
      )
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Project.countDocuments(query),
  ]);

  const serialized = projects.map((p) => ({
    ...p,
    files: (p.files || []).map((f) => ({
      _id: f._id,
      originalName: f.originalName,
      fileType: f.fileType,
      fileSize: f.fileSize,
      fileUrl: f.fileUrl,
      uploadedAt: f.uploadedAt,
    })),
  }));

  res.status(200).json({
    success: true,
    message: "Public projects fetched successfully",
    data: {
      projects: serialized,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    },
  });
});

export const getPublicProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findOne({
    _id: req.params.id,
    status: "completed",
    isPublic: true,
    publicationStatus: { $in: ["approved", null] },
  })
    .populate("student", "name department")
    .populate("supervisor", "name")
    .lean();

  if (!project) {
    return next(new ErrorHandler("Project not found", 404));
  }

  const serialized = {
    ...project,
    files: (project.files || []).map((f) => ({
      _id: f._id,
      originalName: f.originalName,
      fileType: f.fileType,
      fileSize: f.fileSize,
      fileUrl: f.fileUrl,
      uploadedAt: f.uploadedAt,
    })),
  };

  res.status(200).json({
    success: true,
    message: "Project fetched successfully",
    data: { project: serialized },
  });
});

export const getChatHistory = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  const visitorId = req.user._id;

  const project = await Project.findOne({
    _id: projectId,
    status: "completed",
    isPublic: true,
    publicationStatus: { $in: ["approved", null] },
  }).lean();

  if (!project) {
    return next(new ErrorHandler("Project not found", 404));
  }

  let chat = await VisitorChat.findOne({
    visitor: visitorId,
    project: projectId,
  }).lean();

  res.status(200).json({
    success: true,
    data: { messages: chat?.messages || [] },
  });
});

export const sendChatMessage = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  const { message } = req.body;
  const visitorId = req.user._id;

  if (!message || !message.trim()) {
    return next(new ErrorHandler("Message is required", 400));
  }

  const project = await Project.findOne({
    _id: projectId,
    status: "completed",
    isPublic: true,
    publicationStatus: { $in: ["approved", null] },
  })
    .populate("student", "name department")
    .populate("supervisor", "name");

  if (!project) {
    return next(new ErrorHandler("Project not found", 404));
  }

  if (!project.ragIndexed) {
    return next(
      new ErrorHandler(
        "This project's AI assistant is not ready yet. Please try again later.",
        503
      )
    );
  }

  let chat = await VisitorChat.findOne({
    visitor: visitorId,
    project: projectId,
  });

  if (!chat) {
    chat = await VisitorChat.create({
      visitor: visitorId,
      project: projectId,
      messages: [],
    });
  }

  const recentHistory = chat.messages.slice(-10);

  const { answer, sources } = await queryProject(
    projectId,
    message.trim(),
    recentHistory
  );

  chat.messages.push({ role: "user", content: message.trim() });
  chat.messages.push({ role: "assistant", content: answer });
  await chat.save();

  res.status(200).json({
    success: true,
    data: {
      message: answer,
      userMessage: message.trim(),
      sources,
    },
  });
});

export const streamChatMessage = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  const message = req.body.message?.trim();
  if (!message) return next(new ErrorHandler("Message is required", 400));

  const project = await Project.findOne({
    _id: projectId,
    status: "completed",
    isPublic: true,
    publicationStatus: { $in: ["approved", null] },
    ragIndexed: true,
  });
  if (!project) {
    return next(new ErrorHandler("Project not found or AI assistant is unavailable", 404));
  }

  let chat = await VisitorChat.findOne({
    visitor: req.user._id,
    project: projectId,
  });
  if (!chat) {
    chat = await VisitorChat.create({
      visitor: req.user._id,
      project: projectId,
      messages: [],
    });
  }

  const { stream, sources } = await streamProject(
    projectId,
    message,
    chat.messages.slice(-10),
  );
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  res.write(`event: sources\ndata: ${JSON.stringify(sources)}\n\n`);

  let answer = "";
  try {
    for await (const chunk of stream) {
      const content =
        typeof chunk.content === "string"
          ? chunk.content
          : Array.isArray(chunk.content)
          ? chunk.content.map((part) => String(part.text || "")).join("")
            : "";
      if (!content) continue;
      answer += content;
      res.write(`data: ${JSON.stringify(content)}\n\n`);
    }
    chat.messages.push({ role: "user", content: message });
    chat.messages.push({ role: "assistant", content: answer });
    await chat.save();
    res.write("event: done\ndata: {}\n\n");
    res.end();
  } catch (error) {
    res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
    res.end();
  }
});

export const submitProjectForPublic = asyncHandler(async (req, res, next) => {
  const studentId = req.user._id;
  const { githubUrl } = req.body;

  const project = await Project.findOne({
    student: studentId,
    status: "completed",
  })
    .populate("student", "name department")
    .populate("supervisor", "name");

  if (!project) {
    return next(
      new ErrorHandler("No completed project found to submit for public", 404)
    );
  }

  if (["requested", "approved"].includes(project.publicationStatus)) {
    return next(
      new ErrorHandler("Project publication is already submitted", 400)
    );
  }

  if (githubUrl) {
    project.githubUrl = githubUrl.trim();
  }
  project.publicationStatus = "requested";
  project.publicationRequestedAt = new Date();
  project.isPublic = false;
  project.publicationRejectedReason = null;
  await project.save();

  res.status(200).json({
    success: true,
    message:
      "Project submitted for public approval.",
    data: {
      projectId: project._id,
      isPublic: false,
      publicationStatus: project.publicationStatus,
      githubUrl: project.githubUrl,
    },
  });
});