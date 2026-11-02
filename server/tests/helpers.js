import { vi } from "vitest";

export const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
  setHeader: vi.fn(),
  flushHeaders: vi.fn(),
  write: vi.fn(),
  end: vi.fn(),
});

export const createNext = () => vi.fn();
