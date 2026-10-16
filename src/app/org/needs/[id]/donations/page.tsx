import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, DollarSign, Users, Package } from "lucide-react";
import { getMoneyDonationsForOrg } from "@/lib/actions/donations";
import { OrgDonationRoster } from "@/components/donations/org-donation-roster";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Manage Donations | GiveHand ET`,
    description: `Review and confirm monetary donations for need campaign ${id}`,
  };
}

export default async function OrgNeedDonationsPage({ params }: Props) {
  const { id: needId } = await params;
  const { donations, summary } = await getMoneyDonationsForOrg(needId);

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Back Navigation */}
        <div className="flex items-center gap-4 flex-wrap">
          <Link
            href={`/org/needs`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Needs
          </Link>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <Link
              href={`/org/needs/${needId}/volunteers`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              <Users className="h-3.5 w-3.5" />
              Volunteers
            </Link>
            <Link
              href={`/org/needs/${needId}/materials`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              <Package className="h-3.5 w-3.5" />
              Materials
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <DollarSign className="h-3.5 w-3.5" />
              Donations
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-foreground">
              Money Donations
            </h1>
            <p className="text-xs text-muted-foreground">
              Confirm or reject ETB donation payments for this campaign
            </p>
          </div>
        </div>

        {/* Donation Roster */}
        <OrgDonationRoster donations={donations} summary={summary} />
      </div>
    </div>
  );
}
