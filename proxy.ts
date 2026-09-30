import { getSessionCookie } from "better-auth/cookies";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { parseLocalePath, signInPath } from "@/i18n/paths";
import { routing } from "@/i18n/routing";
import { APP_HOME } from "@/lib/app-config";

const handleI18n = createMiddleware(routing);

// Paths (without the locale prefix) that need a session. OPTIMISTIC check only: cookie presence, never a
// database query and never a role. The real authorization happens in the DAL, on every query.
const isProtected = (path: string) => path === APP_HOME || path.startsWith(`${APP_HOME}/`);

export default function proxy(request: NextRequest) {
  const { path } = parseLocalePath(request.nextUrl.pathname);
  if (isProtected(path) && getSessionCookie(request) === null) {
    return NextResponse.redirect(new URL(signInPath(request.nextUrl.pathname), request.url));
  }
  return handleI18n(request);
}

export const config = {
  // Everything except API routes, Next internals and files with an extension.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
