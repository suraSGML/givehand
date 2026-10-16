import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNeedById } from "@/lib/actions/needs";
import { getVolunteerApplicationsForOrg } from "@/lib/actions/volunteers";
import { ScannerStation } from "./_components/scanner-station";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const need = await getNeedById(id);
  return {
    title: `QR Scanner Station: ${need?.title || "Campaign"} | GiveHand ET Org`,
  };
}

export default async function OrgNeedScannerPage({ params }: Props) {
  const { id } = await params;
  const need = await getNeedById(id);

  if (!need) {
    notFound();
  }

  const applications = await getVolunteerApplicationsForOrg(id);

  return (
    <div className="mx-auto max-w-6xl pb-12">
      <ScannerStation
        needId={id}
        needTitle={need.title}
        initialApplications={applications}
      />
    </div>
  );
}
