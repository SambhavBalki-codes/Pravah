import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../middlewares/authMiddleware.js", () => ({
  isAuthenticated: (req, res, next) => {
    const role = req.headers["x-test-role"];
    if (!role) return res.status(401).json({ success: false, message: "Please login" });
    req.user = { role };
    next();
  },
  isAuthorized: (...roles) => (req, res, next) =>
    roles.includes(req.user.role)
      ? next()
      : res.status(403).json({ success: false, message: "Role not allowed" }),
}));

vi.mock("../controllers/visitorController.js", () => ({
  visitorRegister: (req, res) => res.status(200).json({ success: true }),
  visitorLogin: (req, res) => res.status(200).json({ success: true }),
  visitorLogout: (req, res) => res.status(200).json({ success: true }),
  getPublicProjects: (req, res) => res.status(200).json({ success: true }),
  getPublicProject: (req, res) => res.status(200).json({ success: true }),
  getChatHistory: (req, res) => res.status(200).json({ success: true }),
  sendChatMessage: (req, res) => res.status(200).json({ success: true }),
  streamChatMessage: (req, res) => res.status(200).json({ success: true }),
  submitProjectForPublic: (req, res) => res.status(200).json({ success: true }),
}));

const { default: visitorRouter } = await import("../router/visitorRoutes.js");
const app = express();
app.use(express.json());
app.use("/api/v1/visitor", visitorRouter);

describe("visitor route authorization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects unauthenticated project access", async () => {
    const response = await request(app).get("/api/v1/visitor/projects");
    expect(response.status).toBe(401);
  });

  it("rejects non-visitor roles", async () => {
    const response = await request(app)
      .get("/api/v1/visitor/projects")
      .set("x-test-role", "Student");
    expect(response.status).toBe(403);
  });

  it("allows visitors to access the gallery", async () => {
    const response = await request(app)
      .get("/api/v1/visitor/projects")
      .set("x-test-role", "Visitor");
    expect(response.status).toBe(200);
  });
});
