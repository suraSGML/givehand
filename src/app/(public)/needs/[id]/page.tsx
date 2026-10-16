import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Users,
  Package,
  DollarSign,
  ArrowLeft,
  Share2,
  Heart,
  Clock,
  Phone,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { getNeedById } from "@/lib/actions/needs";
import { LocationMap } from "@/components/ui/map";
import { Badge } from "@/components/ui/badge";
import { VolunteerApplyModal } from "@/components/volunteers/volunteer-apply-modal";
import { MaterialPledgeModal } from "@/components/materials/material-pledge-modal";
import { DonationModal } from "@/components/donations/donation-modal";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const need = await getNeedById(id);
  if (!need) return { title: "Need Not Found | GiveHand ET" };

  return {
    title: `${need.title} | GiveHand ET`,
    description: need.description,
  };
}

export default async function NeedDetailPage({ params }: Props) {
  const { id } = await params;
  const need = await getNeedById(id);

  if (!need) {
    notFound();
  }

  const volunteerItems = need.items.filter((i) => i.itemType === "volunteer");
  const materialItems = need.items.filter((i) => i.itemType === "material");
  const moneyItems = need.items.filter((i) => i.itemType === "money");

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/needs"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all community needs
          </Link>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
        </div>

        {/* Hero Banner Grid */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Main Column */}
          <div className="space-y-8 lg:col-span-8">
            {/* Cover & Badges */}
            <div className="relative h-72 sm:h-96 w-full overflow-hidden rounded-3xl border border-border bg-muted shadow-md">
              {need.coverUrl ? (
                <Image
                  src={need.coverUrl}
                  alt={need.title}
                  fill
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-teal-900/10 text-teal-700">
                  <Heart className="h-20 w-20 stroke-[1.5]" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                {need.category && (
                  <Badge className="bg-white/95 text-slate-800 backdrop-blur-md dark:bg-slate-900/90 dark:text-slate-100 font-semibold shadow">
                    {need.category.nameEn}
                  </Badge>
                )}

                {need.urgency && (
                  <Badge className="bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center gap-1 shadow-lg">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Urgent Initiative
                  </Badge>
                )}
              </div>

              <div className="absolute bottom-6 left-6 right-6 text-white">
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-white/90">
                  <span className="flex items-center gap-1.5 drop-shadow">
                    <MapPin className="h-4 w-4 text-amber-400" />
                    {need.locationText}
                  </span>
                  {need.endDate && (
                    <span className="flex items-center gap-1.5 drop-shadow">
                      <Calendar className="h-4 w-4 text-teal-300" />
                      Active campaign
                    </span>
                  )}
                </div>
                <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold leading-tight text-white drop-shadow-md">
                  {need.title}
                </h1>
              </div>
            </div>

            {/* Campaign Story */}
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="font-display text-xl font-bold text-foreground">
                About this Initiative
              </h2>
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {need.description}
              </div>
            </div>

            {/* 3 Contribution Dimensions */}
            <div className="space-y-6">
              {/* 1. Volunteers Section */}
              {volunteerItems.length > 0 && (
                <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-bold">Volunteer Opportunities</h3>
                        <p className="text-xs text-muted-foreground">Give your time and professional skills</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {volunteerItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-border/80 bg-background/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm text-foreground">{item.title}</h4>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Target: {item.targetQuantity} volunteers</span>
                            <span>•</span>
                            <span className="text-teal-600 font-semibold">
                              {item.currentVolunteers || 0} joined
                            </span>
                          </div>
                        </div>

                        <VolunteerApplyModal
                          needId={need.id}
                          needTitle={need.title}
                          needItem={item}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Materials Section */}
              {materialItems.length > 0 && (
                <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-bold">Material Contributions</h3>
                        <p className="text-xs text-muted-foreground">Donate physical goods and equipment</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {materialItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-border/80 bg-background/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm text-foreground">{item.title}</h4>
                            <span className="text-xs font-bold text-amber-600">
                              {item.receivedQuantity || 0} / {item.targetQuantity} {item.unit}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-amber-500"
                              style={{
                                width: `${Math.min(
                                  100,
                                  ((item.receivedQuantity || 0) / (item.targetQuantity || 1)) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        <MaterialPledgeModal
                          needId={need.id}
                          needTitle={need.title}
                          orgName={need.organization.name}
                          orgAddress={need.locationText}
                          item={item}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Money Donations Section */}
              {moneyItems.length > 0 && (
                <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                        <DollarSign className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-bold">Monetary Support (ETB)</h3>
                        <p className="text-xs text-muted-foreground">Telebirr, CBE Birr & direct bank transfers</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {moneyItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-border/80 bg-background/80 p-5 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm text-foreground">{item.title}</h4>
                          <span className="text-xs font-bold text-emerald-600">
                            {item.confirmedAmount?.toLocaleString()} / {item.targetAmount?.toLocaleString()} ETB
                          </span>
                        </div>

                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{
                              width: `${Math.min(
                                100,
                                ((item.confirmedAmount || 0) / (item.targetAmount || 1)) * 100
                              )}%`,
                            }}
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">Supported:</span>
                            <span className="rounded bg-muted px-2 py-0.5 text-[11px]">Telebirr</span>
                            <span className="rounded bg-muted px-2 py-0.5 text-[11px]">CBE Birr</span>
                            <span className="rounded bg-muted px-2 py-0.5 text-[11px]">Bank Transfer</span>
                            <span className="rounded bg-muted px-2 py-0.5 text-[11px]">Chapa</span>
                          </div>

                          <DonationModal
                            needId={need.id}
                            needTitle={need.title}
                            orgName={need.organization.name}
                            item={item}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Location Map Section */}
            {need.lat && need.lng && (
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-lg font-bold">Activity Location</h3>
                </div>
                <p className="text-xs text-muted-foreground">{need.locationText}</p>
                <div className="overflow-hidden rounded-2xl border border-border">
                  <LocationMap lat={need.lat} lng={need.lng} title={need.title} />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6 lg:col-span-4">
            {/* Organization Card */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
              <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                Verified Organizer
              </span>

              <div className="flex items-center gap-3">
                {need.organization.logoUrl ? (
                  <div className="relative h-12 w-12 overflow-hidden rounded-full border border-border">
                    <Image
                      src={need.organization.logoUrl}
                      alt={need.organization.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                    {need.organization.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-display text-sm font-bold leading-tight">
                    {need.organization.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-1 text-xs text-teal-600 font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Government Registered NGO
                  </div>
                </div>
              </div>

              <Link
                href={`/organizations/${need.organization.slug}`}
                className="block text-center rounded-xl border border-border bg-background py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                View Organization Profile
              </Link>
            </div>

            {/* Overall Progress Summary */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
              <h3 className="font-display text-sm font-bold">Impact Summary</h3>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-primary">{need.overallProgress}%</span>
                <span className="text-xs font-medium text-muted-foreground">Overall Goal Reached</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-600 to-amber-500"
                  style={{ width: `${Math.min(100, Math.max(5, need.overallProgress))}%` }}
                />
              </div>

              <div className="pt-2 border-t border-border/80 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Volunteers needed</span>
                  <span className="font-semibold text-foreground">
                    {volunteerItems.reduce((acc, i) => acc + (i.targetQuantity || 0), 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Materials target</span>
                  <span className="font-semibold text-foreground">
                    {materialItems.reduce((acc, i) => acc + (i.targetQuantity || 0), 0)} units
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Fundraising goal</span>
                  <span className="font-semibold text-foreground">
                    {moneyItems.reduce((acc, i) => acc + (i.targetAmount || 0), 0).toLocaleString()} ETB
                  </span>
                </div>
              </div>
            </div>

            {/* Trust and Safety Banner */}
            <div className="rounded-3xl border border-teal-500/20 bg-teal-50/50 dark:bg-teal-950/20 p-5 text-xs text-teal-800 dark:text-teal-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle className="h-4 w-4 text-teal-600" />
                GiveHand ET Trust Guarantee
              </div>
              <p className="leading-relaxed text-[11px] text-teal-700/90 dark:text-teal-300/80">
                All donations and pledged deliveries generate cryptographically signed digital receipts and certificates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
