import type { Metadata } from "next";
import { getPlatformImpactMetrics } from "@/lib/actions/analytics";
import { AdminAnalyticsDashboard } from "@/components/admin/analytics-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Analytics & Impact Reporting | GiveHand ET",
  description: "Platform-wide humanitarian impact analytics, financial gateways, and regulatory audit reporting.",
};

export default async function AdminOverviewPage() {
  const metrics = await getPlatformImpactMetrics();

  return <AdminAnalyticsDashboard metrics={metrics} />;
}
