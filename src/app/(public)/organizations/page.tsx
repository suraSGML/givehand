import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, MapPin, Building2, Phone, Mail, Globe, ArrowRight } from "lucide-react";
import { getOrganizations } from "@/lib/actions/organizations";

export const metadata: Metadata = {
  title: "Verified Organizations | GiveHand ET",
  description:
    "Discover verified non-profit organizations, charities, and community groups operating across Ethiopia.",
};

interface Props {
  searchParams: Promise<{
    city?: string;
    query?: string;
  }>;
}

export default async function OrganizationsDirectoryPage({ searchParams }: Props) {
  const params = await searchParams;
  const orgs = await getOrganizations({
    city: params.city,
    query: params.query,
  });

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3.5 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300">
            <ShieldCheck className="h-4 w-4" />
            100% Verified Community Organizations
          </div>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Trusted Non-Profits & Charities
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Every organization on GiveHand ET is vetted with legal registration documents and ongoing accountability standards.
          </p>
        </div>

        {/* Organizations Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org) => (
            <div
              key={org.id}
              className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {org.logo_url ? (
                    <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-border shadow-inner">
                      <Image src={org.logo_url} alt={org.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary font-bold text-lg">
                      {org.name.charAt(0)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-base font-bold text-foreground leading-snug truncate">
                      {org.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-1 text-xs text-teal-600 font-semibold">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                      Verified
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {org.description}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                  {org.address && (
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <span className="truncate">{org.address}</span>
                    </div>
                  )}
                  {org.phone && (
                    <div className="flex items-center gap-2 truncate">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-teal-600" />
                      <span>{org.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  {org.activeNeedsCount} Active Causes
                </span>
                <Link
                  href={`/organizations/${org.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  View Profile
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
