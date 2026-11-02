import { beforeEach, describe, expect, it, vi } from "vitest";
import { createNext, createResponse } from "./helpers.js";

const mocks = vi.hoisted(() => ({
  project: null,
  enqueueRagIndexing: vi.fn(),
}));

vi.mock("../models/project.js", () => ({
  Project: { findById: vi.fn(() => Promise.resolve(mocks.project)) },
}));
vi.mock("../jobs/ragIndexer.js", () => ({
  enqueueRagIndexing: mocks.enqueueRagIndexing,
  retryRagIndexing: vi.fn(),
}));
vi.mock("../models/ragJob.js", () => ({ RagJob: {} }));
vi.mock("../services/notificationService.js", () => ({
  notifyUser: vi.fn(),
  safeNotify: vi.fn(),
}));

const { updateProjectPublication } = await import("../controllers/adminController.js");

describe("publication approval", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.project = {
      _id: "project-1",
      status: "completed",
      publicationStatus: "requested",
      isPublic: false,
      publishedAt: null,
      publicationRequestedAt: null,
      save: vi.fn(),
    };
  });

  it("publishes a completed project and queues RAG indexing", async () => {
    const res = createResponse();
    await updateProjectPublication(
      { params: { projectId: "project-1" }, body: { status: "approved" } },
      res,
      createNext(),
    );

    expect(mocks.project.publicationStatus).toBe("approved");
    expect(mocks.project.isPublic).toBe(true);
    expect(mocks.project.save).toHaveBeenCalledOnce();
    expect(mocks.enqueueRagIndexing).toHaveBeenCalledWith("project-1");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("rejects publication for a project that is not completed", async () => {
    mocks.project.status = "in_progress";
    const next = createNext();

    await updateProjectPublication(
      { params: { projectId: "project-1" }, body: { status: "approved" } },
      createResponse(),
      next,
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 }),
    );
    expect(mocks.enqueueRagIndexing).not.toHaveBeenCalled();
  });
});
