import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getFeaturedNeeds } from "@/lib/actions/needs";
import {
  Heart,
  Users,
  Package,
  ArrowRight,
  CheckCircle,
  Zap,
  Star,
  Clock,
  Shield,
  HandHeart,
  PlusCircle,
  MapPin,
  Flame,
  Layers,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "GiveHand ET — Volunteer, Donate, Create Impact in Ethiopia",
  description:
    "Connect with verified Ethiopian organizations. Volunteer your time, donate materials, or contribute money — and see your real impact.",
};

const IMPACT_STATS = [
  { icon: Users,   label: "Volunteers",    value: "1,240+", iconClass: "text-teal-600",  bgClass: "bg-teal-50"  },
  { icon: Clock,   label: "Hours Given",   value: "8,500+", iconClass: "text-amber-500", bgClass: "bg-amber-50" },
  { icon: Package, label: "Items Donated", value: "3,200+", iconClass: "text-blue-500",  bgClass: "bg-blue-50"  },
  { icon: Heart,   label: "Organizations", value: "48",     iconClass: "text-rose-500",  bgClass: "bg-rose-50"  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Browse Verified Needs",
    description: "Discover needs posted by verified Ethiopian NGOs, schools, clinics, and community groups.",
    icon: Star,
    color: "bg-teal-600",
  },
  {
    step: "02",
    title: "Choose How to Help",
    description: "Volunteer your time, pledge physical items, or make a direct financial contribution.",
    icon: Heart,
    color: "bg-amber-500",
  },
  {
    step: "03",
    title: "Track Your Impact",
    description: "Get verifiable certificates and receipts. See exactly how your contribution made a difference.",
    icon: CheckCircle,
    color: "bg-teal-700",
  },
];


export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let role: string | null = null;
  let dashboardHref = "/dashboard";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    role = profile?.role ?? "supporter";
    dashboardHref =
      role === "admin"
        ? "/admin"
        : role === "organization"
        ? "/org/dashboard"
        : "/dashboard";
  }

  const isOrg = role === "organization";
  const isAdmin = role === "admin";

  const [featuredNeeds, volunteersRes, materialsRes, orgsRes] = await Promise.all([
    getFeaturedNeeds(6),
    supabase
      .from("volunteer_applications")
      .select("hours_logged")
      .in("status", ["approved", "confirmed", "attended", "completed"]),
    supabase
      .from("material_pledges")
      .select("received_quantity, quantity")
      .in("status", ["received", "partially_received"]),
    supabase
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .eq("status", "verified"),
  ]);

  const realVolunteersCount = volunteersRes.data?.length || 0;
  const realHoursGiven = (volunteersRes.data || []).reduce(
    (acc, v) => acc + (Number(v.hours_logged) || 0),
    0
  );
  const realItemsDonated = (materialsRes.data || []).reduce(
    (acc, m) => acc + (Number(m.received_quantity) || Number(m.quantity) || 0),
    0
  );
  const realOrgsCount = orgsRes.count || 0;

  const impactStats = [
    {
      icon: Users,
      label: "Volunteers",
      value: realVolunteersCount > 0 ? `${realVolunteersCount.toLocaleString()}+` : "1,240+",
      iconClass: "text-teal-600",
      bgClass: "bg-teal-50",
    },
    {
      icon: Clock,
      label: "Hours Given",
      value: realHoursGiven > 0 ? `${Math.round(realHoursGiven).toLocaleString()}+` : "8,500+",
      iconClass: "text-amber-500",
      bgClass: "bg-amber-50",
    },
    {
      icon: Package,
      label: "Items Donated",
      value: realItemsDonated > 0 ? `${realItemsDonated.toLocaleString()}+` : "3,200+",
      iconClass: "text-blue-500",
      bgClass: "bg-blue-50",
    },
    {
      icon: Heart,
      label: "Organizations",
      value: realOrgsCount > 0 ? realOrgsCount.toString() : "48",
      iconClass: "text-rose-500",
      bgClass: "bg-rose-50",
    },
  ];

  return (
    <div className="flex flex-col bg-white dark:bg-slate-950">

      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-primary-gradient hero-pattern py-20 md:py-28 lg:py-36">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/5" />

        <div className="container-app relative z-10 text-center">
          <div className="mx-auto max-w-3xl">

            {/* Pill badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              <Zap className="h-3.5 w-3.5 text-amber-300" />
              Connecting communities across Ethiopia
            </div>

            <h1 className="text-4xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl"
                style={{ fontFamily: "var(--font-display, inherit)" }}>
              Help Where It{" "}
              <span className="relative inline-block">
                Matters Most
                <span className="absolute -bottom-1 left-0 right-0 h-1 rounded-full bg-amber-400/60" />
              </span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-white/85 md:text-xl">
              Connect with verified Ethiopian organizations to volunteer your time,
              donate materials, or contribute money — and see your real impact.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              {isAdmin ? (
                <>
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-bold text-teal-800 shadow-xl transition-all hover:bg-amber-50 hover:shadow-2xl"
                  >
                    Admin Console
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/admin/organizations"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                  >
                    <Shield className="h-4 w-4" />
                    Verify Organizations
                  </Link>
                </>
              ) : isOrg ? (
                <>
                  <Link
                    href="/org/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-bold text-teal-800 shadow-xl transition-all hover:bg-amber-50 hover:shadow-2xl"
                  >
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/org/needs/new"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Post New Need
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/needs"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-bold text-teal-800 shadow-xl transition-all hover:bg-amber-50 hover:shadow-2xl"
                  >
                    Browse Community Needs
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  {user ? (
                    <Link
                      href={dashboardHref}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                    >
                      Go to Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                    >
                      Join Free
                    </Link>
                  )}
                </>
              )}
            </div>


          </div>
        </div>
      </section>

      {/* ══ IMPACT COUNTERS ══════════════════════════════════════════ */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="container-app py-12">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {impactStats.map(({ icon: Icon, label, value, iconClass, bgClass }, i) => (
              <div key={label}
                className={`animate-fade-in stagger-${i + 1} flex flex-col items-center gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/60 p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md`}>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bgClass} dark:bg-slate-700`}>
                  <Icon className={`h-6 w-6 ${iconClass}`} />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">
                    {value}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══ HOW IT WORKS ══════════════════════════════════════════════ */}
      <section className="bg-white dark:bg-slate-950 py-16">
        <div className="container-app">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
              Simple Process
            </p>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 md:text-3xl"
                style={{ fontFamily: "var(--font-display, inherit)" }}>
              How GiveHand ET Works
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Three steps to create real impact
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map(({ step, title, description, icon: Icon, color }, i) => (
              <div key={step}
                className={`animate-fade-in stagger-${i + 1} relative flex flex-col items-center text-center p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40`}>
                {/* Step number watermark */}
                <span className="absolute top-4 right-5 text-5xl font-black text-slate-100 dark:text-slate-800 select-none">
                  {step}
                </span>
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${color} shadow-md`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-2 text-base font-bold text-slate-800 dark:text-slate-100"
                    style={{ fontFamily: "var(--font-display, inherit)" }}>
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TRUST STRIP ═══════════════════════════════════════════════ */}
      <section className="border-y border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-10">
        <div className="container-app">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { icon: Shield,    title: "Verified Organizations", desc: "Every NGO is reviewed and approved before posting needs." },
              { icon: HandHeart, title: "Transparent Impact",     desc: "Track exactly where your time, items, and money go." },
              { icon: CheckCircle, title: "Official Certificates", desc: "Download verifiable service certificates with QR codes." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-900/30">
                  <Icon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{title}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURED NEEDS ════════════════════════════════════════════ */}
      <section className="bg-slate-50 dark:bg-slate-900 py-16">
        <div className="container-app">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
                Live Campaigns
              </p>
              <h2
                className="text-2xl font-bold text-slate-800 dark:text-slate-100 md:text-3xl"
                style={{ fontFamily: "var(--font-display, inherit)" }}
              >
                Featured Community Needs
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Urgent and recent needs posted by verified Ethiopian organizations
              </p>
            </div>
            <Link
              href="/needs"
              className="inline-flex items-center gap-1.5 rounded-xl border border-teal-600 px-4 py-2 text-sm font-semibold text-teal-600 hover:bg-teal-600 hover:text-white transition-all shrink-0"
            >
              View all needs <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {featuredNeeds.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-10 text-center text-sm text-slate-500">
              No active campaigns right now — check back soon!
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredNeeds.map((need) => {
                const typeIcons: Record<string, React.ElementType> = {
                  volunteer: Users,
                  material: Package,
                  monetary: Heart,
                };
                const primaryType = need.items[0]?.itemType || "volunteer";
                const TypeIcon = typeIcons[primaryType] || Star;
                const typeColors: Record<string, string> = {
                  volunteer: "bg-teal-500/10 text-teal-700 border-teal-500/20",
                  material: "bg-blue-500/10 text-blue-700 border-blue-500/20",
                  monetary: "bg-rose-500/10 text-rose-700 border-rose-500/20",
                };

                return (
                  <Link
                    key={need.id}
                    href={`/needs/${need.id}`}
                    className="group flex flex-col rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  >
                    {/* Cover image or gradient placeholder */}
                    <div className="relative h-44 w-full overflow-hidden">
                      {need.coverUrl ? (
                        <img
                          src={need.coverUrl}
                          alt={need.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-700 flex items-center justify-center">
                          <Layers className="h-14 w-14 text-white/30" />
                        </div>
                      )}
                      {/* Overlaid badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        {need.urgency && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold text-white shadow">
                            <Flame className="h-3 w-3" /> Urgent
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm ${typeColors[primaryType] || "bg-white/80 text-slate-700"}`}>
                          <TypeIcon className="h-3 w-3" />
                          {primaryType.charAt(0).toUpperCase() + primaryType.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="flex flex-1 flex-col p-5">
                      {/* Org */}
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 truncate">
                        {need.organization.name}
                      </p>

                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {need.title}
                      </h3>

                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                        {need.description}
                      </p>

                      {/* Progress bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          <span>Progress</span>
                          <span>{need.overallProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-700"
                            style={{ width: `${Math.min(need.overallProgress, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3">
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{need.locationText || "Ethiopia"}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-600 dark:text-teal-400 group-hover:gap-2 transition-all">
                          Help now <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ══ CTA BANNER ════════════════════════════════════════════════ */}
      <section className="bg-primary-gradient py-16">
        <div className="container-app text-center">
          <h2 className="text-2xl font-bold text-white md:text-3xl"
              style={{ fontFamily: "var(--font-display, inherit)" }}>
            Ready to make a difference?
          </h2>
          <p className="mt-3 text-base text-white/80">
            Join 1,240+ Ethiopians already creating impact in their communities.
          </p>
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {isAdmin ? (
              <>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 text-base font-bold text-teal-700 shadow-lg transition-all hover:bg-amber-50 hover:shadow-xl"
                >
                  Admin Console
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/admin/users"
                  className="rounded-xl border border-white/40 bg-white/10 px-8 py-3 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  Manage Users
                </Link>
              </>
            ) : isOrg ? (
              <>
                <Link
                  href="/org/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 text-base font-bold text-teal-700 shadow-lg transition-all hover:bg-amber-50 hover:shadow-xl"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/org/needs"
                  className="rounded-xl border border-white/40 bg-white/10 px-8 py-3 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  Manage Campaigns
                </Link>
              </>
            ) : user ? (
              <>
                <Link
                  href={dashboardHref}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 text-base font-bold text-teal-700 shadow-lg transition-all hover:bg-amber-50 hover:shadow-xl"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/needs"
                  className="rounded-xl border border-white/40 bg-white/10 px-8 py-3 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  Browse Community Needs
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="rounded-xl bg-white px-8 py-3 text-base font-bold text-teal-700 shadow-lg transition-all hover:bg-amber-50 hover:shadow-xl"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/organizations"
                  className="rounded-xl border border-white/40 bg-white/10 px-8 py-3 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  View Organizations
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
