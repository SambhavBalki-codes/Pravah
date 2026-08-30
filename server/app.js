import express from "express";
import cors from "cors";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import dns from "dns";
import { errorMiddleware } from "./middlewares/error.js";
import authRouter from "./router/userRoutes.js";
import adminRouter from "./router/adminRoutes.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

// this config() method will read your .env file, parse the contents, assign it to process.env
config();
const app = express();

app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // true allows the server to accept cookies from the client
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/auth", authRouter); // auth routes
app.use("/api/v1/admin", adminRouter);
app.use(errorMiddleware); // error middleware
export default app;
