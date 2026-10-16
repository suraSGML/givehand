import type { Metadata } from "next";
import { getUserCommitments } from "@/lib/actions/volunteers";
import { CommitmentsView } from "./_components/commitments-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Commitments & Volunteer Passes | GiveHand ET",
  description:
    "View your upcoming volunteer shifts, verified digital QR check-in passes, and service hours.",
};

export default async function DashboardCommitmentsPage() {
  const { commitments, stats } = await getUserCommitments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          My Volunteer Commitments
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your upcoming shifts, present your verified digital QR passes at check-in stations, and track hours.
        </p>
      </div>

      <CommitmentsView
        initialCommitments={commitments}
        stats={stats}
      />
    </div>
  );
}
