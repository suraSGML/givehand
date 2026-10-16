import type { Metadata } from "next";
import { getNeeds } from "@/lib/actions/needs";
import { NeedCard } from "@/components/needs/need-card";
import { NeedFilters } from "@/components/needs/need-filters";
import { HeartHandshake } from "lucide-react";

export const metadata: Metadata = {
  title: "Explore Community Needs | GiveHand ET",
  description:
    "Browse verified community support requests across Ethiopia. Support schools, clinics, and charities with your time, materials, or financial pledges.",
};

interface Props {
  searchParams: Promise<{
    query?: string;
    category?: string;
    type?: string;
    city?: string;
    urgency?: string;
  }>;
}

export default async function NeedsBrowsePage({ searchParams }: Props) {
  const params = await searchParams;
  const needs = await getNeeds({
    query: params.query,
    category: params.category,
    type: params.type,
    city: params.city,
    urgency: params.urgency === "true",
  });

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Hero */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3.5 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300">
            <HeartHandshake className="h-4 w-4" />
            Verified Causes in Ethiopia
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Explore Community Needs
          </h1>
          <p className="mt-2 text-base text-muted-foreground max-w-2xl">
            Choose how you want to make an impact today. Give your time as a volunteer,
            donate tangible materials, or support with monetary contributions.
          </p>
        </div>

        {/* Filter Section */}
        <div className="mb-8">
          <NeedFilters />
        </div>

        {/* Needs Grid */}
        {needs.length > 0 ? (
          <div>
            <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Showing {needs.length} community {needs.length === 1 ? "need" : "needs"}</span>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {needs.map((need) => (
                <NeedCard key={need.id} need={need} />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center bg-card/50">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <HeartHandshake className="h-8 w-8 stroke-[1.5]" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
              No needs found matching your criteria
            </h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
              Try adjusting your search terms, clearing location filters, or checking back soon for new community initiatives.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
