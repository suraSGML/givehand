import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth callback route for Supabase email confirmation and OAuth redirects.
 * After verifying the code, redirects to onboarding (new users) or dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user has completed onboarding
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, city")
          .eq("id", user.id)
          .single();

        // If profile is incomplete, redirect to onboarding
        if (!profile?.full_name || !profile?.city) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth error – redirect to login with error message
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
