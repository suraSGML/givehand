import type { Metadata } from "next";
import Link from "next/link";
import {
  Search,
  UserPlus,
  ClipboardCheck,
  PackageCheck,
  CreditCard,
  Award,
  Building2,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Clock,
  Heart,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works | GiveHand ET",
  description:
    "Learn how GiveHand ET connects supporters with verified Ethiopian organizations through volunteering, material donations, and financial contributions.",
};

const SUPPORTER_STEPS = [
  {
    number: "01",
    icon: Search,
    title: "Browse Verified Needs",
    description:
      "Explore campaigns posted by verified Ethiopian NGOs, schools, clinics, and community groups. Filter by cause, location, or contribution type.",
    color: "bg-teal-500",
  },
  {
    number: "02",
    icon: UserPlus,
    title: "Choose How to Help",
    description:
      "Apply to volunteer your time and skills, pledge physical items like books or blankets, or make a direct financial contribution in ETB.",
    color: "bg-amber-500",
  },
  {
    number: "03",
    icon: ClipboardCheck,
    title: "Get Approved & Show Up",
    description:
      "Organizations review applications and approve volunteers. On the day, scan your digital QR pass at the venue for instant check-in.",
    color: "bg-teal-600",
  },
  {
    number: "04",
    icon: Award,
    title: "Receive Your Certificate",
    description:
      "After your contribution is confirmed, download a verifiable digital certificate or receipt with a unique QR code. Share your impact.",
    color: "bg-amber-600",
  },
];

const ORG_STEPS = [
  {
    number: "01",
    icon: Building2,
    title: "Register Your Organization",
    description:
      "Create an account as an organization, fill in your details, and upload your government registration certificate for verification.",
    color: "bg-slate-700",
  },
  {
    number: "02",
    icon: ShieldCheck,
    title: "Get Admin Verified",
    description:
      "A GiveHand ET admin reviews your documents within 1–2 business days. Once approved, you can publish public-facing campaigns.",
    color: "bg-teal-600",
  },
  {
    number: "03",
    icon: Heart,
    title: "Post a Need",
    description:
      "Create a campaign with volunteer roles, material item lists, or fundraising targets. Set shift times, quantities, and deadlines.",
    color: "bg-amber-500",
  },
  {
    number: "04",
    icon: BarChart3,
    title: "Manage & Track Impact",
    description:
      "Review applications, confirm deliveries, verify ETB payments, and track real-time progress from your organization dashboard.",
    color: "bg-teal-500",
  },
];

const CONTRIBUTION_TYPES = [
  {
    icon: Clock,
    title: "Volunteer Time",
    color: "text-teal-600",
    bg: "bg-teal-50 dark:bg-teal-900/20",
    points: [
      "Browse open volunteer roles by skill or location",
      "Apply with a short message and pick your shift",
      "Check in via QR code on the day",
      "Hours are logged automatically on check-out",
      "Earn a verifiable service certificate",
    ],
  },
  {
    icon: PackageCheck,
    title: "Physical Materials",
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    points: [
      "View specific items organizations need",
      "Pledge a quantity (books, blankets, medicine, etc.)",
      "Choose drop-off or request a pickup",
      "Organization confirms receipt with actual quantity",
      "Receive a digital donation acknowledgement",
    ],
  },
  {
    icon: CreditCard,
    title: "Financial Support (ETB)",
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    points: [
      "See the organization's payment details (Telebirr, CBE Birr, bank)",
      "Transfer directly — GiveHand ET never holds funds",
      "Submit your transaction reference number",
      "Organization verifies and confirms",
      "Download an official ETB receipt",
    ],
  },
];

const FAQS = [
  {
    q: "Is GiveHand ET free to use?",
    a: "Yes. Creating an account, browsing needs, and all contribution workflows are completely free for supporters. Organizations are also free to register and post needs.",
  },
  {
    q: "How does GiveHand ET verify organizations?",
    a: "Organizations upload their government registration documents (MOJ certificate, trade license, etc.) during onboarding. A platform admin reviews the documents before granting verified status and the ability to publish public campaigns.",
  },
  {
    q: "Does GiveHand ET process or hold donations?",
    a: "No. The platform connects you with organizations. All financial transactions happen directly between you and the organization via Telebirr, CBE Birr, or bank transfer. GiveHand ET records and confirms the transaction but never touches the funds.",
  },
  {
    q: "What if an organization rejects my volunteer application?",
    a: "You will receive an in-app and email notification explaining the reason. You are free to apply to other open needs at any time.",
  },
  {
    q: "How are volunteer certificates verified?",
    a: "Every certificate contains a unique ID and a QR code. Anyone can scan the QR or visit /verify/[code] to confirm the certificate is genuine without exposing your personal data.",
  },
  {
    q: "Can I donate anonymously?",
    a: "Yes. When making a financial contribution you can choose to donate anonymously. Your identity remains hidden from the public profile but is still visible to the organization and platform admins for accountability.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="bg-white dark:bg-slate-950">

      {/* ── Hero ── */}
      <section className="bg-primary-gradient hero-pattern py-16 md:py-24">
        <div className="container-app text-center">
          <div className="mx-auto max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-teal-200">
              Simple · Transparent · Impactful
            </p>
            <h1 className="text-3xl font-extrabold text-white md:text-4xl lg:text-5xl">
              How GiveHand ET Works
            </h1>
            <p className="mt-4 text-base text-white/80 md:text-lg">
              Connect with verified Ethiopian organizations and create real, trackable impact —
              whether you give your time, goods, or money.
            </p>
          </div>
        </div>
      </section>

      {/* ── For Supporters ── */}
      <section className="py-16">
        <div className="container-app">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              For Supporters
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100 md:text-3xl">
              Four steps to make an impact
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SUPPORTER_STEPS.map(({ number, icon: Icon, title, description, color }) => (
              <div key={number} className="relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="absolute right-4 top-4 text-4xl font-black text-slate-100 dark:text-slate-800 select-none">
                  {number}
                </span>
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${color} shadow-sm`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="mb-2 text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contribution types ── */}
      <section className="bg-slate-50 py-16 dark:bg-slate-900/40">
        <div className="container-app">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Three Ways to Help
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100 md:text-3xl">
              Choose your contribution type
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {CONTRIBUTION_TYPES.map(({ icon: Icon, title, color, bg, points }) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <h3 className={`mb-4 text-base font-bold ${color}`}>{title}</h3>
                <ul className="space-y-2.5">
                  {points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <CheckCircle className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Organizations ── */}
      <section className="py-16">
        <div className="container-app">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              For Organizations
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100 md:text-3xl">
              Post needs and manage contributions
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ORG_STEPS.map(({ number, icon: Icon, title, description, color }) => (
              <div key={number} className="relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="absolute right-4 top-4 text-4xl font-black text-slate-100 dark:text-slate-800 select-none">
                  {number}
                </span>
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${color} shadow-sm`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="mb-2 text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-slate-50 py-16 dark:bg-slate-900/40">
        <div className="container-app">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 md:text-3xl">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mx-auto max-w-3xl space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                <p className="font-semibold text-slate-800 dark:text-slate-100">{q}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-primary-gradient py-14">
        <div className="container-app text-center">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Ready to get started?
          </h2>
          <p className="mt-3 text-white/80">
            Join thousands of Ethiopians already creating impact.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-teal-700 shadow-md transition-all hover:bg-amber-50">
              Create Free Account <ArrowRight className="h-4 w-4" />
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
