import type { Metadata } from "next";
import { getUserMaterialPledges } from "@/lib/actions/materials";
import { SupporterMaterialsView } from "./_components/supporter-materials-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Material Pledges | GiveHand ET",
  description: "Track your physical goods donations, drop-off locations, and delivery statuses.",
};

export default async function DashboardMaterialsPage() {
  const { pledges, stats } = await getUserMaterialPledges();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          My Material Pledges
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review your contributed physical supplies, check handover drop-off addresses, and track receiving progress.
        </p>
      </div>

      <SupporterMaterialsView
        initialPledges={pledges}
        stats={stats}
      />
    </div>
  );
}
