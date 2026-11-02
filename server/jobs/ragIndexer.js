import { Project } from "../models/project.js";
import { RagJob } from "../models/ragJob.js";
import { ingestProject } from "../services/ragService.js";

const POLL_INTERVAL_MS = 5000;
const MAX_ATTEMPTS = 3;
const LOCK_TIMEOUT_MS = 5 * 60 * 1000;
let timer;
let running = false;

const claimJob = async () => {
  const now = new Date();
  const staleLock = new Date(now.getTime() - LOCK_TIMEOUT_MS);
  return RagJob.findOneAndUpdate(
    {
      attempts: { $lt: MAX_ATTEMPTS },
      $or: [
        {
          status: { $in: ["queued", "failed"] },
          nextAttemptAt: { $lte: now },
          $or: [{ lockedAt: null }, { lockedAt: { $lt: staleLock } }],
        },
        {
          status: "processing",
          lockedAt: { $lt: staleLock },
        },
      ],
    },
    {
      $set: { status: "processing", lockedAt: now, lastError: null },
      $inc: { attempts: 1 },
    },
    { returnDocument: "after", sort: { createdAt: 1 } },
  ).populate({
    path: "project",
    populate: [
      { path: "student", select: "name department" },
      { path: "supervisor", select: "name" },
    ],
  });
};

const processNextJob = async () => {
  if (running) return;
  running = true;

  try {
    const job = await claimJob();
    if (!job) return;
    if (!job.project) {
      await RagJob.findByIdAndUpdate(job._id, {
        status: "failed",
        lockedAt: null,
        lastError: "Project no longer exists",
      });
      return;
    }

    await Project.findByIdAndUpdate(job.project._id, {
      ragStatus: "processing",
      ragError: null,
    });

    try {
      await ingestProject(job.project);
      await Promise.all([
        RagJob.findByIdAndUpdate(job._id, {
          status: "completed",
          lockedAt: null,
          lastError: null,
        }),
        Project.findByIdAndUpdate(job.project._id, {
          ragIndexed: true,
          ragStatus: "indexed",
          ragError: null,
          ragIndexedAt: new Date(),
        }),
      ]);
    } catch (error) {
      const exhausted = job.attempts >= MAX_ATTEMPTS;
      const message = error.message || "RAG indexing failed";
      await Promise.all([
        RagJob.findByIdAndUpdate(job._id, {
          status: exhausted ? "failed" : "queued",
          lockedAt: null,
          lastError: message,
          nextAttemptAt: new Date(Date.now() + (exhausted ? 0 : job.attempts * 30_000)),
        }),
        Project.findByIdAndUpdate(job.project._id, {
          ragIndexed: false,
          ragStatus: "failed",
          ragError: message,
        }),
      ]);
      console.error(`RAG job ${job._id} failed: ${message}`);
    }
  } finally {
    running = false;
  }
};

export const enqueueRagIndexing = async (projectId) => {
  await Project.findByIdAndUpdate(projectId, {
    ragIndexed: false,
    ragStatus: "queued",
    ragError: null,
  });

  await RagJob.findOneAndUpdate(
    { project: projectId },
    {
      $set: {
        status: "queued",
        attempts: 0,
        nextAttemptAt: new Date(),
        lockedAt: null,
        lastError: null,
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
};

export const retryRagIndexing = async (projectId) => {
  await RagJob.findOneAndUpdate(
    { project: projectId },
    {
      $set: {
        status: "queued",
        attempts: 0,
        nextAttemptAt: new Date(),
        lockedAt: null,
        lastError: null,
      },
      $setOnInsert: { project: projectId },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  await Project.findByIdAndUpdate(projectId, {
    ragIndexed: false,
    ragStatus: "queued",
    ragError: null,
    ragIndexedAt: null,
  });
};

export const startRagIndexer = () => {
  if (timer) return;
  timer = setInterval(() => {
    processNextJob().catch((error) =>
      console.error(`RAG worker poll failed: ${error.message}`),
    );
  }, POLL_INTERVAL_MS);
  timer.unref?.();
  processNextJob().catch((error) =>
    console.error(`RAG worker startup failed: ${error.message}`),
  );
};

export const processNextRagJob = processNextJob;
