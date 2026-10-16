import type { Metadata } from "next";
import Link from "next/link";
import {
  Heart,
  Shield,
  Globe,
  Users,
  Target,
  Lightbulb,
  ArrowRight,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | GiveHand ET",
  description:
    "GiveHand ET is an Ethiopian community support platform that connects volunteers and donors with verified NGOs, schools, clinics, and community groups.",
};

const VALUES = [
  {
    icon: Shield,
    title: "Trust & Transparency",
    description:
      "Every organization is verified. Every contribution is tracked. Every certificate is cryptographically signed and publicly verifiable.",
    color: "bg-teal-500",
  },
  {
    icon: Globe,
    title: "Ethiopian Context First",
    description:
      "Built specifically for Ethiopia — supporting Telebirr and CBE Birr payments, Amharic language, Ethiopian cities, and local NGO structures.",
    color: "bg-amber-500",
  },
  {
    icon: Users,
    title: "Community Driven",
    description:
      "We serve everyone from university students volunteering on weekends to diaspora donors supporting their home communities remotely.",
    color: "bg-teal-600",
  },
  {
    icon: Target,
    title: "Accountability",
    description:
      "Organizations confirm every pledge received. Supporters see exactly where their time and resources go, down to the specific item or hour.",
    color: "bg-slate-700",
  },
  {
    icon: Lightbulb,
    title: "Simplicity",
    description:
      "A clear three-step flow for supporters. A simple need-post and dashboard for organizations. No complex interfaces, no jargon.",
    color: "bg-amber-600",
  },
  {
    icon: Heart,
    title: "Dignity of Giving",
    description:
      "Contributions are acknowledged with professional certificates and receipts. Every helper — big or small — deserves recognition.",
    color: "bg-rose-500",
  },
];

const STATS = [
  { value: "48+",    label: "Verified Organizations" },
  { value: "1,240+", label: "Registered Supporters" },
  { value: "8,500+", label: "Volunteer Hours Logged" },
  { value: "3,200+", label: "Items Donated" },
];

export default function AboutPage() {
  return (
    <div className="bg-white dark:bg-slate-950">

      {/* ── Hero ── */}
      <section className="bg-primary-gradient hero-pattern py-16 md:py-24">
        <div className="container-app text-center">
          <div className="mx-auto max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm font-medium text-white">
              <Heart className="h-4 w-4 text-amber-300" fill="currentColor" />
              About GiveHand ET
            </div>
            <h1 className="text-3xl font-extrabold text-white md:text-4xl lg:text-5xl">
              Connecting Helpers with<br className="hidden sm:block" /> Communities That Need Them
            </h1>
            <p className="mt-4 text-base text-white/80 md:text-lg">
              GiveHand ET is a community support platform purpose-built for Ethiopia,
              making it easy for individuals and companies to volunteer, donate, and
              track their real-world impact.
            </p>
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="py-16">
        <div className="container-app">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Our Mission
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-800 dark:text-slate-100 md:text-3xl">
                Bridging the gap between compassion and action
              </h2>
              <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                <p>
                  Ethiopia has a long tradition of community solidarity — <em>edir</em>, <em>iqub</em>, and <em>jegna</em> spirit.
                  GiveHand ET is a digital extension of that tradition, helping modern Ethiopians channel
                  their desire to help into organised, verifiable action.
                </p>
                <p>
                  Thousands of NGOs, schools, clinics, and community groups across Ethiopia operate
                  without a reliable way to reach potential volunteers or donors. At the same time,
                  millions of Ethiopians — including diaspora, students, and professionals — want to
                  help but don&apos;t know where to start or how to verify organizations are legitimate.
                </p>
                <p>
                  GiveHand ET solves both sides of that problem with a single platform: verified
                  organizations post specific needs, and supporters contribute in the way that suits
                  them best — time, goods, or money.
                </p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4">
              {STATS.map(({ value, label }) => (
                <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-3xl font-extrabold text-teal-600 dark:text-teal-400">{value}</p>
                  <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="bg-slate-50 py-16 dark:bg-slate-900/40">
        <div className="container-app">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              What We Stand For
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100 md:text-3xl">
              Our core values
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, description, color }) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="mb-1.5 text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who we serve ── */}
      <section className="py-16">
        <div className="container-app">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 md:text-3xl">
              Who uses GiveHand ET?
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { emoji: "🎓", title: "University Students", desc: "Complete community service hours and earn certificates recognized by employers." },
              { emoji: "💼", title: "Professionals & Companies", desc: "Run organized CSR volunteering days. Track hours and generate team impact reports." },
              { emoji: "🌍", title: "Ethiopian Diaspora", desc: "Support home communities remotely. Donate in ETB via Telebirr or bank transfer." },
              { emoji: "🏥", title: "NGOs & Charities", desc: "Post specific needs, manage applicants, confirm deliveries, and track donations." },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-3 text-3xl">{emoji}</div>
                <h3 className="mb-1.5 text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section className="bg-slate-50 py-16 dark:bg-slate-900/40">
        <div className="container-app">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              Get in touch
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Questions, partnership inquiries, or press requests — we'd love to hear from you.
            </p>

            <div className="mt-8 space-y-3">
              <a href="mailto:hello@givehandet.org"
                className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-all hover:border-teal-300 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-teal-600 dark:hover:bg-teal-950/30">
                <Mail className="h-4 w-4 text-teal-600" />
                hello@givehandet.org
              </a>
              <a href="tel:+251911000000"
                className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-all hover:border-teal-300 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-teal-600 dark:hover:bg-teal-950/30">
                <Phone className="h-4 w-4 text-teal-600" />
                +251 91 100 0000
              </a>
              <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <MapPin className="h-4 w-4 text-teal-600" />
                Bole Sub-city, Addis Ababa, Ethiopia
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-primary-gradient py-14">
        <div className="container-app text-center">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Be part of the change
          </h2>
          <p className="mt-3 text-white/80">
            Create a free account today and start making an impact.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-teal-700 shadow-md transition-all hover:bg-amber-50">
              Join GiveHand ET <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/needs"
              className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20">
              Browse Needs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
