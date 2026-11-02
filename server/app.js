import express from "express";
import cors from "cors";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import dns from "dns";
import { errorMiddleware } from "./middlewares/error.js";
import authRouter from "./router/userRoutes.js";
import adminRouter from "./router/adminRoutes.js";
import studentRouter from "./router/studentRoutes.js";
import notificationRouter from "./router/notificationRoutes.js";
import teacherRouter from "./router/teacherRoutes.js";
import visitorRouter from "./router/visitorRoutes.js";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);

const uploadsDir = path.join(__dirname, "../uploads");
const tempDir = path.join(__dirname, "temp");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/student", studentRouter);
app.use("/api/v1/teacher", teacherRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/visitor", visitorRouter);
app.use(errorMiddleware);

export default app;