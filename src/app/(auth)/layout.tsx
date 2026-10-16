import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Log in to your GiveHand ET account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-teal-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950 px-4 py-12">
      {/* Logo */}
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 font-display font-bold text-2xl"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-gradient shadow-md">
          <Heart className="h-5 w-5 text-white" fill="white" />
        </div>
        <span className="gradient-text">GiveHand ET</span>
      </Link>

      {/* Auth card */}
      <div className="w-full max-w-md">
        <div className="card-glass rounded-2xl p-8 shadow-lg">
          {children}
        </div>
      </div>

      {/* Footer links */}
      <div className="mt-6 flex gap-4 text-xs text-muted-foreground">
        <Link href="/terms" className="hover:text-foreground transition-colors">
          Terms
        </Link>
        <span>·</span>
        <Link href="/privacy" className="hover:text-foreground transition-colors">
          Privacy
        </Link>
        <span>·</span>
        <Link href="/contact" className="hover:text-foreground transition-colors">
          Help
        </Link>
      </div>
    </div>
  );
}
