import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Clock,
  Heart,
  Users,
  Package,
  DollarSign,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import type { NeedCardData } from "@/lib/actions/needs";
import { Badge } from "@/components/ui/badge";

interface Props {
  need: NeedCardData;
}

export function NeedCard({ need }: Props) {
  const volunteerItem = need.items.find((i) => i.itemType === "volunteer");
  const materialItem = need.items.find((i) => i.itemType === "material");
  const moneyItem = need.items.find((i) => i.itemType === "money");

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/40">
      {/* Cover Image & Badges */}
      <div className="relative h-52 w-full overflow-hidden bg-muted">
        {need.coverUrl ? (
          <Image
            src={need.coverUrl}
            alt={need.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-teal-900/10 text-teal-700">
            <Heart className="h-12 w-12 stroke-[1.5]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          {need.category && (
            <Badge
              variant="secondary"
              className="bg-white/90 text-slate-800 backdrop-blur-sm dark:bg-slate-900/90 dark:text-slate-100 font-medium"
            >
              {need.category.nameEn}
            </Badge>
          )}

          {need.urgency && (
            <Badge className="bg-red-500 hover:bg-red-600 text-white font-medium flex items-center gap-1 shadow-md">
              <AlertTriangle className="h-3.5 w-3.5" />
              Urgent
            </Badge>
          )}
        </div>

        {/* Bottom Location & Date on image */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white/90 font-medium">
          <span className="flex items-center gap-1 drop-shadow-sm">
            <MapPin className="h-3.5 w-3.5 text-amber-400" />
            {need.city}
          </span>
          {need.endDate && (
            <span className="flex items-center gap-1 drop-shadow-sm">
              <Clock className="h-3.5 w-3.5" />
              Active
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Organization Info */}
        <div className="mb-2.5 flex items-center gap-2">
          {need.organization.logoUrl ? (
            <div className="relative h-6 w-6 overflow-hidden rounded-full border border-border">
              <Image
                src={need.organization.logoUrl}
                alt={need.organization.name}
                fill
                sizes="24px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
              {need.organization.name.charAt(0)}
            </div>
          )}
          <Link
            href={`/organizations/${need.organization.slug}`}
            className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 truncate"
          >
            <span className="truncate">{need.organization.name}</span>
            {need.organization.status === "verified" && (
              <CheckCircle className="h-3.5 w-3.5 shrink-0 text-teal-600" />
            )}
          </Link>
        </div>

        {/* Title & Description */}
        <Link href={`/needs/${need.id}`} className="block">
          <h3 className="font-display text-lg font-bold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {need.title}
          </h3>
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {need.description}
          </p>
        </Link>

        {/* Support Types Pills */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {volunteerItem && (
            <span className="inline-flex items-center gap-1 rounded-md bg-teal-500/10 px-2 py-1 text-[11px] font-medium text-teal-700 dark:text-teal-300">
              <Users className="h-3 w-3" />
              {volunteerItem.targetQuantity} Volunteers
            </span>
          )}
          {materialItem && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
              <Package className="h-3 w-3" />
              {materialItem.targetQuantity} {materialItem.unit || "Items"}
            </span>
          )}
          {moneyItem && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
              <DollarSign className="h-3 w-3" />
              {moneyItem.targetAmount?.toLocaleString()} ETB
            </span>
          )}
        </div>

        {/* Progress Bar & Footer */}
        <div className="mt-5 pt-3 border-t border-border flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Community Progress</span>
            <span className="font-bold text-primary">{need.overallProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-600 to-amber-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, need.overallProgress))}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4">
          <Link
            href={`/needs/${need.id}`}
            className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Help This Cause
          </Link>
        </div>
      </div>
    </div>
  );
}
