import { describe, expect, it, vi } from "vitest";
import { createNext, createResponse } from "./helpers.js";

const mocks = vi.hoisted(() => ({
  project: {
    _id: "project-1",
    status: "completed",
    isPublic: true,
    publicationStatus: "approved",
    ragIndexed: true,
  },
  chat: {
    messages: [],
    save: vi.fn(),
  },
  streamProject: vi.fn(),
}));

vi.mock("../models/project.js", () => ({
  Project: { findOne: vi.fn(() => Promise.resolve(mocks.project)) },
}));
vi.mock("../models/visitorChat.js", () => ({
  VisitorChat: {
    findOne: vi.fn(() => Promise.resolve(mocks.chat)),
    create: vi.fn(() => Promise.resolve(mocks.chat)),
  },
}));
vi.mock("../services/ragService.js", () => ({
  streamProject: mocks.streamProject,
  queryProject: vi.fn(),
}));

const { streamChatMessage } = await import("../controllers/visitorController.js");

const streamFrom = async function* (parts) {
  for (const content of parts) yield { content };
};

describe("chatbot SSE streaming", () => {
  it("writes sources, response chunks and done events", async () => {
    mocks.streamProject.mockResolvedValue({
      sources: [{ title: "Report.pdf", pageNumber: 2 }],
      stream: streamFrom(["The project ", "uses a scheduler."]),
    });
    const res = createResponse();

    await streamChatMessage(
      { params: { projectId: "project-1" }, body: { message: "What is it?" }, user: { _id: "visitor-1" } },
      res,
      createNext(),
    );

    const output = res.write.mock.calls.map(([value]) => value).join("");
    expect(output).toContain("event: sources");
    expect(output).toContain("The project ");
    expect(output).toContain("uses a scheduler.");
    expect(output).toContain("event: done");
    expect(res.end).toHaveBeenCalled();
  });

  it("writes an error event when generation fails", async () => {
    mocks.streamProject.mockResolvedValue({
      sources: [],
      stream: streamFrom(["partial"]),
    });
    const failingStream = {
      async *[Symbol.asyncIterator]() {
        throw new Error("Groq unavailable");
      },
    };
    mocks.streamProject.mockResolvedValue({ sources: [], stream: failingStream });
    const res = createResponse();

    await streamChatMessage(
      { params: { projectId: "project-1" }, body: { message: "Explain failure" }, user: { _id: "visitor-1" } },
      res,
      createNext(),
    );

    const output = res.write.mock.calls.map(([value]) => value).join("");
    expect(output).toContain("event: error");
    expect(output).toContain("Groq unavailable");
    expect(res.end).toHaveBeenCalled();
  });
});
