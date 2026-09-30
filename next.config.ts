import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withBotId } from "botid/next/config";
// Fails the build (and this import) if a required variable is missing or invalid.
import "./lib/env";

// next-intl without URL routing: i18n/request.ts reads the locale from a cookie.
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  cacheComponents: true, // 'use cache', PPR, dynamic by default
  reactCompiler: true, // automatic memoization
  typedRoutes: true, // typed links and redirects
  experimental: {
    taint: true, // React taint APIs: keep sensitive objects out of Client Components
  },
};

// withBotId adds the rewrites and headers BotID's client challenge needs.
export default withNextIntl(withBotId(nextConfig));
