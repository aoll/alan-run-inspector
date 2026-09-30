import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/lib/errors";

const getViewer = vi.fn();
const readLocalFile = vi.fn();
vi.mock("@/lib/dal/session", () => ({ getViewer: (...args: unknown[]) => getViewer(...args) }));
vi.mock("@/lib/storage", () => ({ readLocalFile: (...args: unknown[]) => readLocalFile(...args) }));

const { readOwnedFile } = await import("./files");

describe("readOwnedFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readLocalFile.mockResolvedValue(Buffer.from("data"));
  });

  it("serves a file to its owner", async () => {
    getViewer.mockResolvedValue({ id: "user-1" });
    expect((await readOwnedFile("exports/user-1/a.pdf")).toString()).toBe("data");
  });

  it("answers 'not found' to another user or to an anonymous visitor", async () => {
    getViewer.mockResolvedValue({ id: "user-2" });
    await expect(readOwnedFile("exports/user-1/a.pdf")).rejects.toBeInstanceOf(NotFoundError);
    getViewer.mockResolvedValue(null);
    await expect(readOwnedFile("exports/user-1/a.pdf")).rejects.toBeInstanceOf(NotFoundError);
    expect(readLocalFile).not.toHaveBeenCalled();
  });
});
