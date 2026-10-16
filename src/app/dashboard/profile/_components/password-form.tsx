"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    newPassword:     z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function PasswordForm() {
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    setSaved(false);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: data.newPassword });
    if (error) {
      setServerError(error.message || "Failed to update password.");
      return;
    }
    setSaved(true);
    reset();
    setTimeout(() => setSaved(false), 4000);
  };

  const inputClass = (err?: boolean) =>
    cn(
      "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition-all",
      "dark:bg-slate-800 dark:text-slate-100 placeholder:text-slate-400",
      "focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20",
      err ? "border-red-400" : "border-slate-200 dark:border-slate-700"
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4" noValidate>

      {/* New password */}
      <div>
        <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          New password
        </label>
        <div className="relative">
          <input
            id="newPassword"
            type={showNew ? "text" : "password"}
            autoComplete="new-password"
            {...register("newPassword")}
            className={cn(inputClass(!!errors.newPassword), "pr-11")}
            placeholder="At least 8 characters"
          />
          <button type="button" onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.newPassword && (
          <p className="mt-1 text-xs text-red-500">{errors.newPassword.message}</p>
        )}
      </div>

      {/* Confirm password */}
      <div>
        <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Confirm new password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            {...register("confirmPassword")}
            className={cn(inputClass(!!errors.confirmPassword), "pr-11")}
          />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Server error */}
      {serverError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
          {serverError}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Update Password
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 dark:text-teal-400">
            <CheckCircle2 className="h-4 w-4" /> Password updated
          </span>
        )}
      </div>
    </form>
  );
}
