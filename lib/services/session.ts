import "server-only";
import { getViewer, type Viewer } from "@/lib/dal/session";

export type { Viewer };

// The signed-in user, or null. Pages use it to redirect; the DAL enforces access on every query anyway.
export const getCurrentViewer = getViewer;
