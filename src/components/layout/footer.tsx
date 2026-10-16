import Link from "next/link";
import { Heart, Mail, Phone, MapPin, ExternalLink } from "lucide-react";

/**
 * Site-wide footer with links, contact info, and legal pages.
 * Server component – no client JS needed.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-slate-900 text-slate-300">
      {/* Main footer */}
      <div className="container-app py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link
              href="/"
              className="mb-4 flex items-center gap-2 font-display font-bold text-white"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-gradient">
                <Heart className="h-4 w-4 text-white" fill="white" />
              </div>
              GiveHand ET
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              Building stronger communities across Ethiopia through volunteering,
              material donations, and financial contributions.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <a
                href="mailto:hello@givehandet.org"
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <Mail className="h-4 w-4 flex-shrink-0" />
                hello@givehandet.org
              </a>
              <a
                href="tel:+251911000000"
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <Phone className="h-4 w-4 flex-shrink-0" />
                +251 91 100 0000
              </a>
              <span className="flex items-center gap-2 text-sm text-slate-400">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                Addis Ababa, Ethiopia
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-200">
              Platform
            </h3>
            <ul className="space-y-2">
              {[
                { label: "Browse Needs", href: "/needs" },
                { label: "Organizations", href: "/organizations" },
                { label: "How It Works", href: "/how-it-works" },
                { label: "Post a Need", href: "/register" },
                { label: "Verify Certificate", href: "/verify" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-200">
              Support
            </h3>
            <ul className="space-y-2">
              {[
                { label: "About Us", href: "/about" },
                { label: "Contact", href: "/contact" },
                { label: "FAQ", href: "/how-it-works#faq" },
                { label: "Report an Issue", href: "/contact?type=report" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-200">
              Legal
            </h3>
            <ul className="space-y-2">
              {[
                { label: "Terms of Service", href: "/terms" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Donation Disclaimer", href: "/terms#donations" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Disclaimer bar */}
      <div className="border-t border-slate-800 bg-slate-950 py-4">
        <div className="container-app">
          <p className="text-center text-xs leading-relaxed text-slate-500">
            ⚠️ GiveHand ET is a platform that connects supporters with verified
            organizations. We do not hold, process, or guarantee any financial
            transactions. Always verify organizations before donating.
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800 py-4">
        <div className="container-app flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {year} GiveHand ET. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/givehandet"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              GitHub
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
