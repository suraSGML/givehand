import type { Metadata } from "next";
import { HandHeart } from "lucide-react";
import { getUserDonations } from "@/lib/actions/donations";
import { DonationHistoryList } from "@/components/donations/donation-history-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Donations | GiveHand ET",
  description: "Track your monetary donations to Ethiopian community campaigns.",
};

export default async function SupporterDonationsPage() {
  const { donations, stats } = await getUserDonations();

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
            <HandHeart className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-foreground">
              My Donations
            </h1>
            <p className="text-xs text-muted-foreground">
              Track your ETB contributions to Ethiopian communities
            </p>
          </div>
        </div>

        {/* Content */}
        <DonationHistoryList donations={donations} stats={stats} />
      </div>
    </div>
  );
}
