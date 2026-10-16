/**
 * Next.js Proxy (formerly middleware)
 *
 * Responsibilities:
 * 1. Refresh the Supabase session on every request (cookie sync)
 * 2. Protect authenticated routes — redirect to /login if not signed in
 * 3. Enforce role-based access — redirect to the correct dashboard if the
 *    user's role does not match the required role for the route
 * 4. Redirect already-authenticated users away from auth pages
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/supabase";

// ── Route protection config ───────────────────────────────────────────────
// Each entry: the URL prefix that triggers the check, and which roles may
// access it.  The FIRST matching entry wins.
const PROTECTED: Array<{ prefix: string; roles: Array<string> }> = [
  { prefix: "/admin",      roles: ["admin"] },
  { prefix: "/org/",       roles: ["organization", "admin"] },  // trailing slash prevents matching /organizations
  { prefix: "/dashboard",  roles: ["supporter", "organization", "admin"] },
  { prefix: "/onboarding", roles: ["supporter", "organization", "admin"] },
];

// Pages that logged-in users should not see
const AUTH_ONLY_PATHS = ["/login", "/register", "/forgot-password"];

// Role → default dashboard
function dashboardFor(role: string): string {
  if (role === "admin")        return "/admin";
  if (role === "organization") return "/org/dashboard";
  return "/dashboard";
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Build a Supabase client that refreshes the session cookie
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Always call getUser() immediately after createServerClient — do NOT
  // use getSession() here; it relies on the (unverified) JWT in the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── 1. Redirect authenticated users away from auth pages ─────────────
  if (user && AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
    // Fetch the role so we redirect to the right dashboard
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const url = request.nextUrl.clone();
    url.pathname = dashboardFor(profile?.role ?? "supporter");
    return NextResponse.redirect(url);
  }

  // ── 2. Protect private routes ─────────────────────────────────────────
  for (const route of PROTECTED) {
    if (!pathname.startsWith(route.prefix)) continue;

    // Not logged in → send to login, preserve destination
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }

    // Logged in — check the role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const userRole = profile?.role ?? "supporter";

    if (!route.roles.includes(userRole)) {
      // Wrong role → redirect to the user's own dashboard
      const url = request.nextUrl.clone();
      url.pathname = dashboardFor(userRole);
      return NextResponse.redirect(url);
    }

    break; // first matching rule wins
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on every path EXCEPT:
     * - Next.js internals (_next/static, _next/image)
     * - favicon and public static assets
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
