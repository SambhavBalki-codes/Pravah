import { connectDB } from "./config/db.js";
import { startDeadlineReminders } from "./jobs/deadlineReminders.js";
import { startRagIndexer } from "./jobs/ragIndexer.js";
import app from "./app.js";

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, async () => {
  try {
    await connectDB();
    startDeadlineReminders();
    startRagIndexer();
    console.log(`Server running on port ${PORT}`);
  } catch (error) {
    console.error(`Startup failed: ${error.message}`);
    server.close(() => process.exit(1));
  }
});

process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to Unhandled Promise Rejection`);

  server.close(() => {
    process.exit(1);
  });
});

process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to Uncaught Exception`);
  server.close(() => {
    process.exit(1);
  });
});

export default server;
