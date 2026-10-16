"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Flame, Users, Package, DollarSign, X } from "lucide-react";

const CITIES = [
  "All Cities",
  "Addis Ababa",
  "Hawassa",
  "Bahir Dar",
  "Mekelle",
  "Debre Birhan",
  "Dire Dawa",
];

const SUPPORT_TYPES = [
  { id: "all", label: "All Needs", icon: null },
  { id: "volunteer", label: "Volunteering", icon: Users },
  { id: "material", label: "Materials", icon: Package },
  { id: "money", label: "Donations", icon: DollarSign },
];

export function NeedFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentQuery = searchParams.get("query") || "";
  const currentType = searchParams.get("type") || "all";
  const currentCity = searchParams.get("city") || "All Cities";
  const currentUrgency = searchParams.get("urgency") === "true";

  const [searchTerm, setSearchTerm] = useState(currentQuery);

  useEffect(() => {
    setSearchTerm(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== currentQuery) {
        updateFilters({ query: searchTerm });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const updateFilters = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all" || value === "All Cities") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.replace(`${pathname}?${params.toString()}`);
  };

  const hasActiveFilters =
    currentQuery !== "" ||
    currentType !== "all" ||
    currentCity !== "All Cities" ||
    currentUrgency;

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4 md:p-6 shadow-sm">
      {/* Top Search & City Bar */}
      <div className="grid gap-3 md:grid-cols-12">
        <div className="relative md:col-span-8">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search needs by title, keyword, or community initiative..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="md:col-span-4">
          <select
            value={currentCity}
            onChange={(e) => updateFilters({ city: e.target.value })}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                📍 {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Tabs & Urgency Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
        <div className="flex flex-wrap gap-1.5">
          {SUPPORT_TYPES.map(({ id, label, icon: Icon }) => {
            const isActive = currentType === id;
            return (
              <button
                key={id}
                onClick={() => updateFilters({ type: id })}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => updateFilters({ urgency: currentUrgency ? null : "true" })}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
              currentUrgency
                ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 shadow-sm"
                : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Flame className={`h-3.5 w-3.5 ${currentUrgency ? "text-red-600 animate-pulse" : ""}`} />
            Urgent First
          </button>

          {hasActiveFilters && (
            <button
              onClick={() => router.replace(pathname)}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
