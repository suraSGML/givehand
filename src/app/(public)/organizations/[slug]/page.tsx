import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Globe,
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  AlertTriangle,
  Upload,
} from "lucide-react";
import { getOrganizationBySlug } from "@/lib/actions/organizations";
import { getNeeds } from "@/lib/actions/needs";
import { NeedCard } from "@/components/needs/need-card";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const org = await getOrganizationBySlug(slug);
  if (!org) return { title: "Organization Not Found | GiveHand ET" };

  return {
    title: `${org.name} | GiveHand ET`,
    description: org.description || undefined,
  };
}

export default async function OrganizationProfilePage({ params }: Props) {
  const { slug } = await params;
  const org = await getOrganizationBySlug(slug);

  if (!org) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = user && org.owner_id === user.id;
  const isPending = org.status === "pending";
  const isRejected = org.status === "rejected";

  const allNeeds = await getNeeds();
  const orgNeeds = allNeeds.filter((n) => n.organization.slug === slug);

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Navigation & Status Notice */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link
            href="/organizations"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to organizations directory
          </Link>

          {isPending && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Clock className="h-3.5 w-3.5" />
              {isOwner ? "Owner Preview Mode" : "Pending Verification"}
            </span>
          )}
        </div>

        {/* Verification Status Warning / Preview Banner */}
        {isPending && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <p className="font-bold">
                  {isOwner
                    ? "Your organization is currently under verification review"
                    : "This organization is pending administrator verification"}
                </p>
                <p className="text-muted-foreground">
                  {isOwner
                    ? "This preview is visible to you. Once verified by our administrators, your organization and active campaigns will appear publicly."
                    : "Campaigns and donations for this organization will be activated after official NGO credentials verification."}
                </p>
              </div>
            </div>
            {isOwner && (
              <Link
                href="/org/profile"
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload Documents
              </Link>
            )}
          </div>
        )}

        {isRejected && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-800 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <p className="font-bold">Verification documents require attention</p>
                <p className="text-muted-foreground">
                  The verification documents submitted were not approved. Please visit your dashboard to review feedback and re-upload.
                </p>
              </div>
            </div>
            {isOwner && (
              <Link
                href="/org/profile"
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                <Upload className="h-3.5 w-3.5" />
                Manage Documents
              </Link>
            )}
          </div>
        )}

        {/* Organization Header Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          {/* Cover image or decorative gradient */}
          <div className="h-44 sm:h-56 w-full bg-gradient-to-r from-teal-900 via-teal-800 to-amber-900 relative">
            {org.cover_url && (
              <Image src={org.cover_url} alt={org.name} fill className="object-cover opacity-35" />
            )}
          </div>

          <div className="px-6 pb-6 pt-0 sm:px-8">
            <div className="relative -mt-16 sm:-mt-20 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-3xl border-4 border-card bg-card shadow-lg">
                  {org.logo_url ? (
                    <Image src={org.logo_url} alt={org.name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/20 text-primary text-2xl font-bold">
                      {org.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="mb-2">
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
                      {org.name}
                    </h1>
                  </div>
                  {org.status === "verified" ? (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-teal-600 font-bold">
                      <ShieldCheck className="h-4 w-4" />
                      Verified Non-Profit
                    </div>
                  ) : org.status === "pending" ? (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-600 font-bold">
                      <Clock className="h-4 w-4" />
                      Verification In Progress
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-rose-600 font-bold">
                      <AlertTriangle className="h-4 w-4" />
                      Verification Rejected
                    </div>
                  )}
                </div>
              </div>

              {org.website && (
                <a
                  href={org.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-sm"
                >
                  <Globe className="h-4 w-4 text-primary" />
                  Official Website
                </a>
              )}
            </div>

            {/* Description & Contact Details */}
            <div className="mt-6 grid gap-6 md:grid-cols-12 pt-6 border-t border-border">
              <div className="md:col-span-8 space-y-4">
                <h2 className="font-display text-base font-bold text-foreground">Mission & Overview</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {org.description}
                </p>
              </div>

              <div className="md:col-span-4 space-y-3 rounded-2xl bg-muted/50 p-4 text-xs text-muted-foreground border border-border/60">
                <h3 className="font-bold text-foreground">Contact & Legal</h3>
                {org.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-amber-500" />
                    <span>{org.address}</span>
                  </div>
                )}
                {org.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-teal-600" />
                    <span>{org.phone}</span>
                  </div>
                )}
                {org.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0 text-primary" />
                    <span>{org.email}</span>
                  </div>
                )}
                {org.registration_number && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-slate-500" />
                    <span>License: {org.registration_number}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Active Needs by this Organization */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-foreground">
              Active Community Campaigns ({orgNeeds.length})
            </h2>
          </div>

          {orgNeeds.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {orgNeeds.map((need) => (
                <NeedCard key={need.id} need={need} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              This organization does not currently have any active public campaigns.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
