"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "@/components/providers/theme-provider";
import {
  Heart,
  Menu,
  X,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  LogOut,
  User,
  LayoutDashboard,
  Building2,
  Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOutAction } from "@/lib/actions/auth";
import { setLocaleAction } from "@/lib/actions/locale";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/supabase";

const NAV_LINKS = [
  { key: "needs",         href: "/needs" },
  { key: "organizations", href: "/organizations" },
  { key: "howItWorks",    href: "/how-it-works" },
  { key: "about",         href: "/about" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [isMenuOpen,     setIsMenuOpen]     = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled,     setIsScrolled]     = useState(false);
  const [profile,        setProfile]        = useState<Profile | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [locale,         setLocale]         = useState<"en" | "am">("en");

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    });

    const cookieLocale = document.cookie
      .split("; ")
      .find((r) => r.startsWith("NEXT_LOCALE="))
      ?.split("=")[1];
    if (cookieLocale === "am" || cookieLocale === "en") setLocale(cookieLocale);
  }, []);

  const getDashboardHref = () => {
    if (!profile) return "/dashboard";
    if (profile.role === "admin")        return "/admin";
    if (profile.role === "organization") return "/org/dashboard";
    return "/dashboard";
  };

  const getProfileHref = () => {
    if (!profile) return "/dashboard/profile";
    if (profile.role === "organization") return "/org/profile";
    if (profile.role === "admin")        return "/admin";
    return "/dashboard/profile";
  };

  const handleLocaleSwitch = async () => {
    const next = locale === "en" ? "am" : "en";
    setLocale(next);
    await setLocaleAction(next);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200",
        isScrolled
          ? "border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95"
          : "border-b border-transparent bg-white dark:bg-slate-900"
      )}
    >
      <div className="container-app">
        <div className="flex h-16 items-center justify-between">

          {/* ── Logo ─────────────────────────────────────────────────── */}
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-gradient">
              <Heart className="h-4 w-4 text-white" fill="white" />
            </div>
            <span className="gradient-text hidden sm:inline">GiveHand ET</span>
          </Link>

          {/* ── Desktop nav ──────────────────────────────────────────── */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(({ key, href }) => (
              <Link
                key={key}
                href={href}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                {t(key as "needs" | "organizations" | "howItWorks" | "about")}
              </Link>
            ))}
          </nav>

          {/* ── Right actions ────────────────────────────────────────── */}
          <div className="flex items-center gap-1.5">

            {/* Language switcher */}
            <button
              onClick={handleLocaleSwitch}
              className="hidden rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white sm:flex"
              aria-label="Switch language"
            >
              {locale === "en" ? "አማ" : "EN"}
            </button>

            {/* Dark / light toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Toggle dark mode"
            >
              <Moon className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Sun className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>

            {/* Auth area — skeleton while loading */}
            {loading ? (
              <div className="h-8 w-20 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />

            ) : profile ? (
              /* ── Logged-in user menu ─────────────────────────────── */
              <div className="relative flex items-center gap-1">
                {/* Notifications bell */}
                <Link
                  href={profile.role === "organization" ? "/org/dashboard" : "/dashboard/notifications"}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                  aria-label={t("notifications")}
                >
                  <Bell className="h-4 w-4" />
                </Link>

                {/* Avatar + name trigger */}
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-gradient text-xs font-bold text-white">
                    {(profile.full_name ?? "U")[0].toUpperCase()}
                  </div>
                  <span className="hidden max-w-24 truncate font-medium text-slate-700 dark:text-slate-200 md:block">
                    {profile.full_name?.split(" ")[0] ?? "User"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 text-slate-400 transition-transform duration-200",
                      isUserMenuOpen && "rotate-180"
                    )}
                  />
                </button>

                {/* Dropdown menu */}
                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                    <div className="animate-scale-in absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {profile.full_name}
                        </p>
                        <p className="text-xs capitalize text-slate-500 dark:text-slate-400">
                          {profile.role}
                        </p>
                      </div>
                      <nav className="p-1.5">
                        <Link
                          href={getDashboardHref()}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                        >
                          {profile.role === "admin"        ? <Shield className="h-4 w-4" />
                           : profile.role === "organization" ? <Building2 className="h-4 w-4" />
                           : <LayoutDashboard className="h-4 w-4" />}
                          {t("dashboard")}
                        </Link>
                        <Link
                          href={getProfileHref()}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                        >
                          {profile.role === "organization" ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                          {profile.role === "organization" ? "Org Profile & Docs" : t("profile")}
                        </Link>
                        <div className="my-1 h-px bg-slate-100 dark:bg-slate-700" />
                        <button
                          onClick={async () => {
                            setIsUserMenuOpen(false);
                            await signOutAction();
                            setProfile(null);
                            router.push("/");
                            router.refresh();
                          }}
                          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <LogOut className="h-4 w-4" />
                          {t("signOut")}
                        </button>
                      </nav>
                    </div>
                  </>
                )}
              </div>

            ) : (
              /* ── Guest buttons ───────────────────────────────────── */
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-primary-gradient px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md"
                >
                  {t("register")}
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile nav ───────────────────────────────────────────── */}
        {isMenuOpen && (
          <nav className="animate-fade-in border-t border-slate-100 pb-4 pt-2 dark:border-slate-800 md:hidden">
            {NAV_LINKS.map(({ key, href }) => (
              <Link
                key={key}
                href={href}
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                {t(key as "needs" | "organizations" | "howItWorks" | "about")}
              </Link>
            ))}
            <div className="mt-2 px-3">
              <button
                onClick={handleLocaleSwitch}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >
                {locale === "en" ? "አማርኛ" : "English"}
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
