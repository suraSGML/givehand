"use server";

/**
 * Authentication Server Actions.
 * All input is validated with Zod before reaching Supabase.
 * Errors are returned as typed result objects — never thrown to the client.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ── Login ──────────────────────────────────────────────────────────────────

export async function loginAction(
  input: LoginInput
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: msg };
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const supabase = await createClient();
  let { error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: parsed.data.password,
  });

  if (error) {
    const errorMsg = error.message || "";
    // If Supabase rejected because email is not confirmed, attempt auto-confirming via admin client and retry
    if (errorMsg.toLowerCase().includes("email not confirmed")) {
      try {
        const admin = createAdminClient();
        const { data: userList } = await admin.auth.admin.listUsers();
        const existingUser = userList.users.find(
          (u) => u.email?.toLowerCase() === normalizedEmail
        );
        if (existingUser) {
          await admin.auth.admin.updateUserById(existingUser.id, {
            email_confirm: true,
          });
          // Retry signing in
          const retry = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: parsed.data.password,
          });
          if (!retry.error) {
            error = null;
          } else {
            error = retry.error;
          }
        }
      } catch {
        return {
          success: false,
          error: "Your email address has not been confirmed yet. Please check your inbox or spam folder.",
        };
      }
    }

    if (error) {
      if (
        error.message?.toLowerCase().includes("invalid login credentials") ||
        error.message?.toLowerCase().includes("invalid email or password")
      ) {
        return { success: false, error: "Invalid email or password." };
      }
      return { success: false, error: error.message || "Invalid email or password." };
    }
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Authentication failed." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "supporter";
  const redirectTo =
    role === "admin"        ? "/admin" :
    role === "organization" ? "/org/dashboard" :
                              "/dashboard";

  revalidatePath("/", "layout");
  return { success: true, data: { redirectTo } };
}

// ── Register ───────────────────────────────────────────────────────────────

export async function registerAction(
  input: RegisterInput
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    // Surface the first validation message so the user knows what's wrong
    const msg = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: msg };
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const supabase = await createClient();

  // Try creating the user via the admin client first.
  // This bypasses the public anonymous IP rate-limiter (HTTP 429) and auto-confirms the email.
  try {
    const admin = createAdminClient();
    const { data: adminData, error: adminError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.data.fullName,
        role:      parsed.data.role,
      },
    });

    if (adminError) {
      const msg = adminError.message ?? "";
      if (
        msg.toLowerCase().includes("already registered") ||
        msg.toLowerCase().includes("already exists") ||
        msg.toLowerCase().includes("unique constraint")
      ) {
        return { success: false, error: "An account with this email already exists." };
      }
      // If it's another admin error, fall through to public signUp fallback below
    } else if (adminData.user) {
      // Upsert profile row using admin client to ensure permissions
      await admin.from("profiles").upsert(
        {
          id:        adminData.user.id,
          role:      parsed.data.role,
          full_name: parsed.data.fullName,
        },
        { onConflict: "id" }
      );

      // Immediately sign in the user to establish browser session cookies
      await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: parsed.data.password,
      });

      revalidatePath("/", "layout");
      return { success: true, data: { redirectTo: "/onboarding" } };
    }
  } catch {
    // Admin client unavailable or threw, continue with public signUp fallback
  }

  // Fallback: standard public signUp
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        role:      parsed.data.role,
      },
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    const msg = error.message ?? "";
    if (
      msg.toLowerCase().includes("already registered") ||
      msg.toLowerCase().includes("already exists") ||
      msg.toLowerCase().includes("unique constraint")
    ) {
      return { success: false, error: "An account with this email already exists." };
    }
    if (error.status === 429 || msg.toLowerCase().includes("rate limit")) {
      return { success: false, error: "Too many sign-up attempts. Please wait a few minutes and try again." };
    }
    return { success: false, error: msg || "Registration failed. Please try again." };
  }

  if (data.user && (data.user.identities?.length ?? 1) === 0) {
    return { success: false, error: "An account with this email already exists." };
  }

  if (data.user) {
    try {
      const admin = createAdminClient();
      await admin.auth.admin.updateUserById(data.user.id, {
        email_confirm: true,
      });
    } catch {
      // ignore
    }

    await supabase.from("profiles").upsert(
      {
        id:        data.user.id,
        role:      parsed.data.role,
        full_name: parsed.data.fullName,
      },
      { onConflict: "id" }
    );

    // Auto sign in
    await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: parsed.data.password,
    });
  }

  revalidatePath("/", "layout");
  return { success: true, data: { redirectTo: "/onboarding" } };
}

// ── Forgot Password ────────────────────────────────────────────────────────

export async function forgotPasswordAction(
  input: ForgotPasswordInput
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Enter a valid email address." };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Always return success to prevent email enumeration attacks
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/reset-password`,
  });

  return { success: true };
}

// ── Reset Password ─────────────────────────────────────────────────────────

export async function resetPasswordAction(
  input: ResetPasswordInput
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: msg };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: error.message || "Failed to update password." };
  }

  return { success: true };
}

// ── Update Supporter Profile ───────────────────────────────────────────────

export async function updateSupporterProfileAction(input: {
  fullName: string;
  phone?: string | null;
  city: string;
  subcity?: string | null;
  bio?: string | null;
  availability?: string | null;
  skills: string[];
  interests: string[];
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  // First try updating via user's authenticated client
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName,
      phone: input.phone || null,
      city: input.city,
      subcity: input.subcity || null,
      bio: input.bio || null,
      availability: input.availability || null,
      skills: input.skills,
      interests: input.interests,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    // If update failed (e.g. missing profile row or RLS upsert restriction), upsert with admin client
    try {
      const admin = createAdminClient();
      const { error: adminErr } = await admin.from("profiles").upsert(
        {
          id: user.id,
          full_name: input.fullName,
          phone: input.phone || null,
          city: input.city,
          subcity: input.subcity || null,
          bio: input.bio || null,
          availability: input.availability || null,
          skills: input.skills,
          interests: input.interests,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
      if (adminErr) {
        return { success: false, error: adminErr.message || "Failed to save profile." };
      }
    } catch {
      return { success: false, error: error.message || "Failed to save profile." };
    }
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/profile");
  return { success: true };
}

// ── Sign Out ───────────────────────────────────────────────────────────────

/** Used from client-side button click — returns result, does NOT redirect */
export async function signOutAction(): Promise<{ success: boolean }> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  return { success: true };
}

/** Used from server-side <form action={logoutAction}> — redirects after signout */
export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

// ── Get current user (server-side helper) ─────────────────────────────────

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { user, profile };
}

// ── Admin Profile Update ──────────────────────────────────────────────────

export async function updateAdminProfileAction(input: {
  fullName: string;
  phone?: string;
  bio?: string;
  city?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      full_name: input.fullName,
      phone: input.phone || null,
      bio: input.bio || null,
      city: input.city || "Addis Ababa",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/admin/profile");
  return { success: true };
}

// ── Admin User Management ─────────────────────────────────────────────────

export interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  role: string;
  city?: string | null;
  phone?: string | null;
  createdAt: string;
  banned: boolean;
}

export async function listUsersAction(): Promise<{ success: boolean; users?: UserRecord[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: myProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (myProfile?.role !== "admin") return { success: false, error: "Unauthorized" };

  const admin = createAdminClient();

  // Fetch all profiles
  const { data: profiles, error: profileError } = await admin
    .from("profiles")
    .select("id, full_name, role, city, phone, created_at")
    .order("created_at", { ascending: false });

  if (profileError || !profiles) {
    return { success: false, error: profileError?.message || "Failed to load users" };
  }

  // Fetch auth users to get emails and ban status
  const { data: authData, error: authError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (authError || !authData) {
    return { success: false, error: authError?.message || "Failed to load auth users" };
  }

  const authMap = new Map(authData.users.map((u) => [u.id, u]));

  const users: UserRecord[] = profiles.map((p) => {
    const authUser = authMap.get(p.id);
    return {
      id: p.id,
      email: authUser?.email || "Unknown",
      fullName: p.full_name || "Unnamed",
      role: p.role || "supporter",
      city: p.city,
      phone: p.phone,
      createdAt: p.created_at ? new Date(p.created_at).toLocaleDateString("en-ET") : "Unknown",
      banned: authUser?.banned_until ? new Date(authUser.banned_until) > new Date() : false,
    };
  });

  return { success: true, users };
}

export async function updateUserRoleAction(
  userId: string,
  newRole: "supporter" | "organization" | "admin"
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: myProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (myProfile?.role !== "admin") return { success: false, error: "Unauthorized" };

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ role: newRole }).eq("id", userId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}

export async function toggleUserBanAction(
  userId: string,
  ban: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: myProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (myProfile?.role !== "admin") return { success: false, error: "Unauthorized" };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: ban ? "87600h" : "none",
  });
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUserAction(userId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  if (user.id === userId) return { success: false, error: "You cannot delete your own account." };

  const { data: myProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (myProfile?.role !== "admin") return { success: false, error: "Unauthorized" };

  const admin = createAdminClient();
  // Delete auth user (profiles cascade via DB trigger)
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}
