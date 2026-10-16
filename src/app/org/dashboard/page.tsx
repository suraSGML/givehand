import type { Metadata } from "next";
import Link from "next/link";
import {
  Layers,
  Users,
  Package,
  DollarSign,
  PlusCircle,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Organization Dashboard | GiveHand ET",
};

export default async function OrgDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: org } = user
    ? await supabase
        .from("organizations")
        .select("id, name, status")
        .eq("owner_id", user.id)
        .maybeSingle()
    : { data: null };

  let activeCampaignsCount = 0;
  let volunteersCount = 0;
  let materialsCount = 0;
  let donationsSum = 0;
  let orgNeeds: any[] = [];

  if (org) {
    const { data: needsData } = await supabase
      .from("needs")
      .select(`
        id,
        title,
        status,
        urgency,
        location_text,
        need_items (
          id,
          item_type,
          title,
          target_quantity,
          target_amount
        )
      `)
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false });

    if (needsData) {
      orgNeeds = needsData;
      activeCampaignsCount = needsData.filter((n) => n.status === "open").length;

      const itemIds = (needsData as any[]).flatMap((n: any) => n.need_items?.map((i: any) => i.id) || []);
      const needIds = needsData.map((n) => n.id);

      if (needIds.length > 0 && itemIds.length > 0) {
        const [volunteersRes, materialsRes, donationsRes] = await Promise.all([
          supabase
            .from("volunteer_applications")
            .select("id", { count: "exact", head: true })
            .in("need_item_id", itemIds)
            .in("status", ["approved", "confirmed", "attended", "completed"]),
          supabase
            .from("material_pledges")
            .select("quantity, received_quantity, status")
            .in("need_item_id", itemIds)
            .in("status", ["received", "partially_received"]),
          supabase
            .from("money_donations")
            .select("amount")
            .in("need_item_id", itemIds)
            .eq("status", "confirmed"),
        ]);

        volunteersCount = volunteersRes.count || 0;
        materialsCount = (materialsRes.data || []).reduce(
          (acc: number, p: any) => acc + (Number(p.received_quantity) || Number(p.quantity) || 0),
          0
        );
        donationsSum = (donationsRes.data || []).reduce(
          (acc: number, d: any) => acc + (Number(d.amount) || 0),
          0
        );
      }
    }
  }

  const stats = [
    {
      title: "Active Campaigns",
      value: activeCampaignsCount.toString(),
      change: `${orgNeeds.length} total created`,
      icon: Layers,
      color: "text-primary",
      bg: "bg-teal-500/10",
    },
    {
      title: "Volunteers Engaged",
      value: volunteersCount.toString(),
      change: "Confirmed volunteers",
      icon: Users,
      color: "text-teal-600",
      bg: "bg-teal-500/10",
    },
    {
      title: "Materials Received",
      value: `${materialsCount} units`,
      change: "Delivered items",
      icon: Package,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
    },
    {
      title: "Donations Confirmed",
      value: `${donationsSum.toLocaleString()} ETB`,
      change: "Verified monetary aid",
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
            Organization Dashboard
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Track volunteer attendance, physical material delivery, and verified donations.
          </p>
        </div>

        <Link
          href="/org/needs/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Create New Need
        </Link>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.title}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">{s.title}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.bg} ${s.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-foreground">{s.value}</div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                {s.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action & Management Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Campaigns Card */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-foreground">
              Your Active Needs
            </h2>
            <Link
              href="/org/needs"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {orgNeeds.length > 0 ? (
            <div className="space-y-3 text-xs">
              {orgNeeds.slice(0, 5).map((need) => (
                <div
                  key={need.id}
                  className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-sm truncate">
                      {need.title}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        need.status === "open"
                          ? "bg-teal-500/10 text-teal-600"
                          : "bg-slate-500/10 text-slate-600"
                      }`}
                    >
                      {need.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                    <span>📍 {need.location_text || "Ethiopia"}</span>
                    <span>{need.need_items?.length || 0} support goals</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center bg-background/40">
              <Layers className="mx-auto h-7 w-7 text-muted-foreground/60" />
              <p className="mt-2 text-xs font-semibold text-foreground">
                No campaigns created yet
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Publish a campaign to start gathering volunteer and donor support.
              </p>
              <Link
                href="/org/needs/new"
                className="mt-3 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Create Need
              </Link>
            </div>
          )}
        </div>

        {/* Action Center Card */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="font-display text-base font-bold text-foreground">
            Contribution Tracking Shortcuts
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/org/needs"
              className="rounded-2xl border border-border bg-background/60 p-4 text-center hover:bg-muted/80 transition-colors space-y-1"
            >
              <Users className="mx-auto h-5 w-5 text-teal-600" />
              <div className="text-xs font-bold">Review Volunteers</div>
              <p className="text-[11px] text-muted-foreground">Approve applications & log shift hours</p>
            </Link>

            <Link
              href="/org/needs"
              className="rounded-2xl border border-border bg-background/60 p-4 text-center hover:bg-muted/80 transition-colors space-y-1"
            >
              <Package className="mx-auto h-5 w-5 text-amber-600" />
              <div className="text-xs font-bold">Receive Materials</div>
              <p className="text-[11px] text-muted-foreground">Confirm delivered dropoffs & couriers</p>
            </Link>

            <Link
              href="/org/needs"
              className="rounded-2xl border border-border bg-background/60 p-4 text-center hover:bg-muted/80 transition-colors space-y-1"
            >
              <DollarSign className="mx-auto h-5 w-5 text-emerald-600" />
              <div className="text-xs font-bold">Confirm Donations</div>
              <p className="text-[11px] text-muted-foreground">Verify Telebirr / CBE references</p>
            </Link>

            <Link
              href="/org/profile"
              className="rounded-2xl border border-border bg-background/60 p-4 text-center hover:bg-muted/80 transition-colors space-y-1"
            >
              <Clock className="mx-auto h-5 w-5 text-primary" />
              <div className="text-xs font-bold">Verification Status</div>
              <p className="text-[11px] text-muted-foreground">Upload registration documents</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
