import type { Metadata } from "next";
import { CreateNeedWizard } from "./_components/create-need-wizard";

export const metadata: Metadata = {
  title: "Create New Campaign | GiveHand ET",
};

export default function CreateNeedPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
          Create a Community Need Campaign
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Define volunteer shifts, physical materials, and donation targets in one transparent campaign.
        </p>
      </div>

      <CreateNeedWizard />
    </div>
  );
}
