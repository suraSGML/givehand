import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import { getNeedById } from "@/lib/actions/needs";
import { getMaterialPledgesForOrg } from "@/lib/actions/materials";
import { MaterialInventoryList } from "./_components/material-inventory-list";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const need = await getNeedById(id);
  return {
    title: `Material Pledges: ${need?.title || "Campaign"} | GiveHand ET Org`,
  };
}

export default async function OrgNeedMaterialsPage({ params }: Props) {
  const { id } = await params;
  const need = await getNeedById(id);

  if (!need) {
    notFound();
  }

  const { pledges, summary } = await getMaterialPledgesForOrg(id);

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-3">
        <Link
          href={`/org/needs`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/org/needs" className="hover:underline">
              Campaigns
            </Link>
            <span>/</span>
            <span className="truncate max-w-[200px]">{need.title}</span>
            <span>/</span>
            <span className="text-foreground font-semibold">Materials</span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Material Goods & Inventory
          </h1>
        </div>
      </div>

      <MaterialInventoryList
        needId={id}
        initialPledges={pledges}
        summary={summary}
      />
    </div>
  );
}
