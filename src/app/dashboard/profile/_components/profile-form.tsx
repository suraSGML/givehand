"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, X, CheckCircle2 } from "lucide-react";
import { updateSupporterProfileAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const ETHIOPIAN_CITIES = [
  "Addis Ababa", "Dire Dawa", "Bahir Dar", "Gondar", "Mekelle",
  "Hawassa", "Adama (Nazret)", "Harar", "Jimma", "Debre Birhan",
  "Debre Markos", "Dessie", "Nekemte", "Arba Minch", "Jijiga",
  "Shashamane", "Bishoftu (Debre Zeit)", "Woldia", "Asosa", "Other",
];

const SKILL_SUGGESTIONS = [
  "Teaching", "Nursing", "Medical", "IT & Software", "Construction",
  "Accounting", "Legal", "Translation", "Photography", "Driving",
  "Cooking", "Carpentry", "Agriculture", "Social Work", "Admin",
];

const CAUSE_SUGGESTIONS = [
  "Education", "Healthcare", "Food Security", "Women Empowerment",
  "Children", "Environment", "Elderly Care", "Disability Support",
  "Community Development", "Emergency Relief",
];

const AVAILABILITY_OPTIONS = [
  "Weekdays (daytime)",
  "Weekdays (evenings)",
  "Weekends",
  "Flexible / Any time",
  "Remote / Online only",
];

const schema = z.object({
  fullName:     z.string().min(2, "Name must be at least 2 characters"),
  phone:        z.string().optional(),
  city:         z.string().min(1, "Please select a city"),
  subcity:      z.string().optional(),
  bio:          z.string().max(500, "Bio must be under 500 characters").optional(),
  availability: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  userId: string;
  email: string;
  initialData: {
    fullName: string;
    phone: string;
    city: string;
    subcity: string;
    bio: string;
    skills: string[];
    interests: string[];
    availability: string;
  };
}

export function ProfileForm({ userId, email, initialData }: Props) {
  const [skills,       setSkills]       = useState<string[]>(initialData.skills);
  const [interests,    setInterests]    = useState<string[]>(initialData.interests);
  const [skillInput,   setSkillInput]   = useState("");
  const [saved,        setSaved]        = useState(false);
  const [serverError,  setServerError]  = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName:     initialData.fullName,
      phone:        initialData.phone,
      city:         initialData.city,
      subcity:      initialData.subcity,
      bio:          initialData.bio,
      availability: initialData.availability,
    },
  });

  const addSkill = (value: string) => {
    const t = value.trim();
    if (t && !skills.includes(t)) setSkills([...skills, t]);
    setSkillInput("");
  };

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    setSaved(false);
    const result = await updateSupporterProfileAction({
      fullName:     data.fullName,
      phone:        data.phone   || null,
      city:         data.city,
      subcity:      data.subcity || null,
      bio:          data.bio     || null,
      availability: data.availability || null,
      skills,
      interests,
    });

    if (!result.success) {
      setServerError(result.error || "Failed to save profile. Please try again.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputClass = (err?: boolean) =>
    cn(
      "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition-all",
      "dark:bg-slate-800 dark:text-slate-100 placeholder:text-slate-400",
      "focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20",
      err ? "border-red-400" : "border-slate-200 dark:border-slate-700"
    );

  const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>

      {/* Email (read-only) */}
      <div>
        <label className={labelClass}>Email address</label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full cursor-not-allowed rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500"
        />
        <p className="mt-1 text-xs text-slate-400">Your email cannot be changed here.</p>
      </div>

      {/* Name + Phone */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fullName" className={labelClass}>Full name *</label>
          <input id="fullName" {...register("fullName")} className={inputClass(!!errors.fullName)} placeholder="Abebe Bikila" />
          {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>Phone number</label>
          <input id="phone" {...register("phone")} className={inputClass()} placeholder="+251911234567" />
        </div>
      </div>

      {/* City + Sub-city */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="city" className={labelClass}>City / Town *</label>
          <select id="city" {...register("city")} className={cn(inputClass(!!errors.city), "cursor-pointer")}>
            <option value="">Select city…</option>
            {ETHIOPIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>}
        </div>
        <div>
          <label htmlFor="subcity" className={labelClass}>Sub-city / District</label>
          <input id="subcity" {...register("subcity")} className={inputClass()} placeholder="Bole, Yeka, Kirkos…" />
        </div>
      </div>

      {/* Availability */}
      <div>
        <label htmlFor="availability" className={labelClass}>General availability</label>
        <select id="availability" {...register("availability")} className={cn(inputClass(), "cursor-pointer")}>
          <option value="">Select availability…</option>
          {AVAILABILITY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className={labelClass}>Short bio</label>
        <textarea
          id="bio"
          {...register("bio")}
          rows={3}
          className={cn(inputClass(), "resize-none")}
          placeholder="Tell organizations a little about yourself and your motivation to help…"
        />
        <p className="mt-1 text-xs text-slate-400">Max 500 characters</p>
      </div>

      {/* Skills */}
      <div>
        <label className={labelClass}>Skills</label>
        {/* Current tags */}
        {skills.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                {s}
                <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))}
                  className="text-teal-500 hover:text-red-500 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        {/* Input */}
        <div className="flex gap-2">
          <input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(skillInput); } }}
            className={cn(inputClass(), "flex-1")}
            placeholder="Type a skill and press Enter…"
          />
          <button type="button" onClick={() => addSkill(skillInput)}
            className="flex items-center gap-1 rounded-xl border border-teal-300 px-3 py-2 text-sm font-medium text-teal-600 transition-colors hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-900/30">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
        {/* Suggestions */}
        <div className="mt-2 flex flex-wrap gap-1">
          {SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).map((s) => (
            <button key={s} type="button" onClick={() => setSkills([...skills, s])}
              className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500 transition-colors hover:border-teal-400 hover:text-teal-600 dark:border-slate-700 dark:text-slate-400 dark:hover:text-teal-400">
              + {s}
            </button>
          ))}
        </div>
      </div>

      {/* Causes / Interests */}
      <div>
        <label className={labelClass}>Causes you care about</label>
        <div className="flex flex-wrap gap-1.5">
          {CAUSE_SUGGESTIONS.map((cause) => {
            const active = interests.includes(cause);
            return (
              <button
                key={cause}
                type="button"
                onClick={() => setInterests(active ? interests.filter((i) => i !== cause) : [...interests, cause])}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                  active
                    ? "border-teal-500 bg-teal-50 text-teal-700 dark:border-teal-600 dark:bg-teal-900/30 dark:text-teal-300"
                    : "border-slate-200 text-slate-500 hover:border-teal-300 dark:border-slate-700 dark:text-slate-400"
                )}
              >
                {active && <span className="mr-1">✓</span>}{cause}
              </button>
            );
          })}
        </div>
      </div>

      {/* Server error */}
      {serverError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
          {serverError}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-gradient px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Changes
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 dark:text-teal-400">
            <CheckCircle2 className="h-4 w-4" /> Saved successfully
          </span>
        )}
      </div>
    </form>
  );
}
