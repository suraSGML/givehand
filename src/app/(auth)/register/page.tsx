"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Users, Building2, CheckCircle2 } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { registerAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const ROLES = [
  {
    value: "supporter" as const,
    icon: Users,
    title: "Supporter",
    description: "Volunteer, donate items, or contribute money to verified causes.",
  },
  {
    value: "organization" as const,
    icon: Building2,
    title: "Organization",
    description: "Post needs, manage volunteers, and track donations for your NGO or charity.",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [serverError, setServerError]   = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "supporter" },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    const result = await registerAction(data);
    if (result.success) {
      router.push(result.data?.redirectTo ?? "/onboarding");
    } else {
      setServerError(result.error);
    }
  };

  const inputClass = (hasError: boolean) =>
    cn(
      "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition-all",
      "dark:bg-slate-800 dark:text-slate-100 placeholder:text-slate-400",
      "focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20",
      hasError
        ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
        : "border-slate-200 dark:border-slate-700"
    );

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Join GiveHand ET and start making an impact
        </p>
      </div>

      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

        {/* ── Role selector ── */}
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            I want to join as a…
          </p>
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map(({ value, icon: Icon, title, description }) => {
              const selected = selectedRole === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue("role", value, { shouldValidate: true })}
                  className={cn(
                    "relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all",
                    selected
                      ? "border-teal-500 bg-teal-50 dark:border-teal-500 dark:bg-teal-900/20"
                      : "border-slate-200 bg-white hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-600"
                  )}
                >
                  {selected && (
                    <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-teal-500" />
                  )}
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    selected ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={cn("text-sm font-semibold", selected ? "text-teal-700 dark:text-teal-300" : "text-slate-700 dark:text-slate-200")}>
                      {title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          {errors.role && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.role.message}</p>
          )}
        </div>

        {/* ── Full name ── */}
        <div>
          <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            {...register("fullName")}
            className={inputClass(!!errors.fullName)}
            placeholder="Abebe Bikila"
          />
          {errors.fullName && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.fullName.message}</p>
          )}
        </div>

        {/* ── Email ── */}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            className={inputClass(!!errors.email)}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>
          )}
        </div>

        {/* ── Password ── */}
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              {...register("password")}
              className={inputClass(!!errors.password) + " pr-11"}
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password.message}</p>
          )}
        </div>

        {/* ── Confirm password ── */}
        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              {...register("confirmPassword")}
              className={inputClass(!!errors.confirmPassword) + " pr-11"}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-gradient px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Create Account
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-teal-600 hover:underline dark:text-teal-400">
          Sign in
        </Link>
      </p>
    </div>
  );
}
