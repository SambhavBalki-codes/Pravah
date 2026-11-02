import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  job: null,
  ingestProject: vi.fn(),
  projectUpdates: [],
  jobUpdates: [],
}));

vi.mock("../models/project.js", () => ({
  Project: {
    findByIdAndUpdate: vi.fn((id, update) => {
      mocks.projectUpdates.push({ id, update });
      return Promise.resolve({});
    }),
  },
}));
vi.mock("../models/ragJob.js", () => ({
  RagJob: {
    findOneAndUpdate: vi.fn(() => ({
      populate: vi.fn(() => Promise.resolve(mocks.job)),
    })),
    findByIdAndUpdate: vi.fn((id, update) => {
      mocks.jobUpdates.push({ id, update });
      return Promise.resolve({});
    }),
  },
}));
vi.mock("../services/ragService.js", () => ({
  ingestProject: mocks.ingestProject,
}));

const { processNextRagJob } = await import("../jobs/ragIndexer.js");

describe("RAG job lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.projectUpdates.length = 0;
    mocks.jobUpdates.length = 0;
    mocks.job = {
      _id: "job-1",
      attempts: 1,
      project: { _id: "project-1" },
    };
    mocks.ingestProject.mockResolvedValue(true);
  });

  it("moves a successful job to completed and indexes the project", async () => {
    await processNextRagJob();

    expect(mocks.ingestProject).toHaveBeenCalledWith(mocks.job.project);
    expect(mocks.jobUpdates.at(-1).update).toMatchObject({
      status: "completed",
      lockedAt: null,
    });
    expect(mocks.projectUpdates.at(-1).update).toMatchObject({
      ragIndexed: true,
      ragStatus: "indexed",
    });
  });

  it("queues a failed attempt for retry", async () => {
    mocks.job.attempts = 1;
    mocks.ingestProject.mockRejectedValue(new Error("temporary Pinecone failure"));

    await processNextRagJob();

    expect(mocks.jobUpdates.at(-1).update).toMatchObject({
      status: "queued",
      lastError: "temporary Pinecone failure",
    });
    expect(mocks.projectUpdates.at(-1).update).toMatchObject({
      ragIndexed: false,
      ragStatus: "failed",
    });
  });

  it("marks an exhausted job as failed", async () => {
    mocks.job.attempts = 3;
    mocks.ingestProject.mockRejectedValue(new Error("permanent failure"));

    await processNextRagJob();

    expect(mocks.jobUpdates.at(-1).update).toMatchObject({
      status: "failed",
      lastError: "permanent failure",
    });
  });
});
