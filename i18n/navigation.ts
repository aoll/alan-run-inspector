import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware navigation: always use these instead of next/link and next/navigation for internal links.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
