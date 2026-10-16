"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Package,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { createNeedAction } from "@/lib/actions/needs";
import type { ItemType } from "@/types/supabase";

interface NeedItemState {
  id: string;
  itemType: ItemType;
  title: string;
  description: string;
  targetQuantity?: number;
  targetAmount?: number;
  unit: string;
  shiftStartsAt?: string;
  shiftEndsAt?: string;
  shiftCapacity?: number;
}

const CATEGORIES = [
  { id: "11111111-0000-0000-0000-000000000001", name: "Education & Literacy (ትምህርት)" },
  { id: "11111111-0000-0000-0000-000000000002", name: "Healthcare & Clinics (ጤና)" },
  { id: "11111111-0000-0000-0000-000000000003", name: "Food Security & Nutrition (ምግብ ዋስትና)" },
  { id: "11111111-0000-0000-0000-000000000004", name: "Disaster & Emergency Relief (ድንገተኛ አደጋ)" },
  { id: "11111111-0000-0000-0000-000000000005", name: "Elderly & Disability Care (አረጋውያን)" },
  { id: "11111111-0000-0000-0000-000000000006", name: "Youth & Vocational Skills (ወጣቶች)" },
  { id: "11111111-0000-0000-0000-000000000007", name: "Environmental & Green Legacy (አረንጓዴ አሻራ)" },
];

const CITIES = [
  "Addis Ababa",
  "Hawassa",
  "Bahir Dar",
  "Mekelle",
  "Debre Birhan",
  "Dire Dawa",
  "Gondar",
  "Jimma",
];

export function CreateNeedWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1: Basics
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id);
  const [city, setCity] = useState("Addis Ababa");
  const [locationText, setLocationText] = useState("");
  const [urgency, setUrgency] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Step 2: Items
  const [items, setItems] = useState<NeedItemState[]>([
    {
      id: "item-1",
      itemType: "volunteer",
      title: "Weekend Volunteers",
      description: "General assistance and community engagement",
      targetQuantity: 10,
      unit: "volunteers",
      shiftCapacity: 10,
      shiftStartsAt: "",
      shiftEndsAt: "",
    },
  ]);

  const addItem = (type: ItemType) => {
    const newItem: NeedItemState = {
      id: `item-${Date.now()}`,
      itemType: type,
      title:
        type === "volunteer"
          ? "Volunteer Helpers"
          : type === "material"
            ? "Educational Supplies"
            : "Emergency Relief Fund",
      description: "",
      targetQuantity: type === "money" ? undefined : 50,
      targetAmount: type === "money" ? 25000 : undefined,
      unit: type === "money" ? "ETB" : type === "volunteer" ? "volunteers" : "items",
      shiftCapacity: type === "volunteer" ? 10 : undefined,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, updates: Partial<NeedItemState>) => {
    setItems(items.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const payloadItems = items.map((i) => ({
        itemType: i.itemType,
        title: i.title.trim() || (i.itemType === "volunteer" ? "Volunteer Helpers" : i.itemType === "material" ? "Material Supplies" : "Donation Fund"),
        description: i.description?.trim() || undefined,
        targetQuantity: i.itemType === "money" ? undefined : Math.max(1, Number(i.targetQuantity) || 1),
        targetAmount: i.itemType === "money" ? Math.max(10, Number(i.targetAmount) || 1000) : undefined,
        unit: i.unit?.trim() || (i.itemType === "money" ? "ETB" : i.itemType === "volunteer" ? "volunteers" : "items"),
        shifts:
          i.itemType === "volunteer" && i.shiftStartsAt && i.shiftEndsAt
            ? [
                {
                  startsAt: i.shiftStartsAt,
                  endsAt: i.shiftEndsAt,
                  capacity: Math.max(1, Number(i.shiftCapacity) || 10),
                },
              ]
            : undefined,
      }));

      const res = await createNeedAction({
        title: title.trim(),
        description: description.trim(),
        categoryId,
        locationText: locationText.trim() || city,
        city,
        isRemote: false,
        urgency,
        coverUrl: coverUrl.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: "open",
        items: payloadItems,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to create campaign");
        setSubmitting(false);
        return;
      }

      router.push("/org/needs");
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps Header */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: "1. Basics & Location" },
            { num: 2, label: "2. Contribution Targets" },
            { num: 3, label: "3. Review & Submit" },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => {
                if (s.num < step) setStep(s.num as any);
              }}
              className={`flex items-center gap-2 text-xs font-bold transition-colors ${
                step === s.num
                  ? "text-primary"
                  : step > s.num
                    ? "text-teal-600"
                    : "text-muted-foreground"
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  step === s.num
                    ? "bg-primary text-primary-foreground"
                    : step > s.num
                      ? "bg-teal-500/10 text-teal-600"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.num ? "✓" : s.num}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step 1: Campaign Basics */}
      {step === 1 && (
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="font-display text-lg font-bold">Step 1: Campaign Basics</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Campaign Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Free Eye Screening & Eyeglasses Drive for 200 Students"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Primary Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  City / Region *
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      📍 {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Specific Location / Venue Address *
              </label>
              <input
                type="text"
                placeholder="e.g. Bole Subcity, Kebele 03 Community Hall, Addis Ababa"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Campaign Description & Background *
              </label>
              <textarea
                rows={4}
                placeholder="Explain who this helps, why it is urgent, and how contributions will be managed..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-input bg-background p-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Cover Photo URL (Unsplash or direct image)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="urgency"
                  checked={urgency}
                  onChange={(e) => setUrgency(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="urgency" className="text-xs font-semibold text-foreground cursor-pointer">
                  Mark as Urgent Emergency Initiative
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              onClick={() => {
                if (title.trim().length < 3) {
                  setErrorMsg("Please enter a title (at least 3 characters)");
                  return;
                }
                if (description.trim().length < 5) {
                  setErrorMsg("Please enter a description (at least 5 characters)");
                  return;
                }
                setErrorMsg(null);
                setStep(2);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90"
            >
              Next: Add Contribution Targets
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Need Items */}
      {step === 2 && (
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold">Step 2: Contribution Targets</h2>
              <p className="text-xs text-muted-foreground">
                Supporters can help with their time, physical materials, or money. Add the dimensions you need.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => addItem("volunteer")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-500/20"
              >
                <Plus className="h-3.5 w-3.5" />
                + Volunteers
              </button>
              <button
                type="button"
                onClick={() => addItem("material")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
              >
                <Plus className="h-3.5 w-3.5" />
                + Materials
              </button>
              <button
                type="button"
                onClick={() => addItem("money")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
              >
                <Plus className="h-3.5 w-3.5" />
                + Money (ETB)
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="rounded-2xl border border-border/80 bg-background/80 p-5 space-y-4 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {index + 1}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                        item.itemType === "volunteer"
                          ? "bg-teal-500/10 text-teal-700 dark:text-teal-300"
                          : item.itemType === "material"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                            : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      {item.itemType.toUpperCase()}
                    </span>
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Item Title *
                    </label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateItem(item.id, { title: e.target.value })}
                      placeholder="e.g. Science Tutors / High School Textbooks / Medical Fund"
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  </div>

                  {item.itemType === "money" ? (
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        Target Amount in ETB *
                      </label>
                      <input
                        type="number"
                        value={item.targetAmount || 10000}
                        onChange={(e) =>
                          updateItem(item.id, { targetAmount: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="50000"
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">
                          Target Quantity *
                        </label>
                        <input
                          type="number"
                          value={item.targetQuantity || 10}
                          onChange={(e) =>
                            updateItem(item.id, { targetQuantity: parseInt(e.target.value) || 1 })
                          }
                          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">
                          Unit / Type
                        </label>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                          placeholder="volunteers, books, kg"
                          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={() => {
                if (items.some((i) => !i.title.trim())) {
                  setErrorMsg("Please make sure all items have a title.");
                  return;
                }
                setErrorMsg(null);
                setStep(3);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90"
            >
              Review Campaign
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="font-display text-lg font-bold">Step 3: Review & Publish Campaign</h2>

          <div className="rounded-2xl border border-border/80 bg-background/80 p-5 space-y-3 text-xs">
            <h3 className="font-bold text-sm text-foreground">{title}</h3>
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{description}</p>
            <div className="flex items-center gap-4 text-muted-foreground pt-2 border-t border-border/60">
              <span>📍 {city} ({locationText || "General"})</span>
              {urgency && <span className="text-red-500 font-bold">🔥 Urgent</span>}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Target Contributions ({items.length} items)
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((i) => (
                <div key={i.id} className="rounded-xl border border-border bg-card p-3 text-xs space-y-1">
                  <div className="font-semibold text-foreground">{i.title}</div>
                  <div className="text-muted-foreground">
                    {i.itemType === "money"
                      ? `${i.targetAmount?.toLocaleString()} ETB`
                      : `${i.targetQuantity} ${i.unit}`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Publish Campaign Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
