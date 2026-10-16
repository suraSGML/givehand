"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, X } from "lucide-react";
import {
  supporterProfileSchema,
  organizationProfileSchema,
  type SupporterProfileInput,
  type OrganizationProfileInput,
} from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/supabase";

const ETHIOPIAN_CITIES = [
  "Addis Ababa",
  "Dire Dawa",
  "Bahir Dar",
  "Gondar",
  "Mekelle",
  "Hawassa",
  "Adama (Nazret)",
  "Harar",
  "Jimma",
  "Debre Birhan",
  "Debre Markos",
  "Dessie",
  "Nekemte",
  "Arba Minch",
  "Jijiga",
  "Shashamane",
  "Bishoftu (Debre Zeit)",
  "Other",
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

interface Props {
  userId: string;
  role: UserRole;
  email: string;
}

export function OnboardingForm({ userId, role, email: _email }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

  const isSupporterMode = role === "supporter";

  // Supporter form
  const supporterForm = useForm<SupporterProfileInput>({
    resolver: zodResolver(supporterProfileSchema),
    defaultValues: {
      fullName: "",
      city: "",
      phone: "",
      subcity: "",
      bio: "",
      availability: "",
      skills: [],
      interests: [],
    },
  });

  // Org form
  const orgForm = useForm<OrganizationProfileInput>({
    resolver: zodResolver(organizationProfileSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      registrationNumber: "",
    },
  });

  const isSubmitting = isSupporterMode
    ? supporterForm.formState.isSubmitting
    : orgForm.formState.isSubmitting;

  const addTag = (
    value: string,
    list: string[],
    setList: (v: string[]) => void,
    setInput: (v: string) => void
  ) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
    }
    setInput("");
  };

  const removeTag = (value: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.filter((t) => t !== value));
  };

  const onSupporterSubmit = async (data: SupporterProfileInput) => {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: data.fullName,
      city: data.city,
      phone: data.phone || null,
      subcity: data.subcity || null,
      bio: data.bio || null,
      availability: data.availability || null,
      skills,
      interests,
    });
    if (error) {
      setServerError("Failed to save profile. Please try again.");
      return;
    }
    router.push("/dashboard");
  };

  const onOrgSubmit = async (data: OrganizationProfileInput) => {
    setServerError(null);
    const supabase = createClient();

    // Update profile full_name
    await supabase.from("profiles").upsert({
      id: userId,
      full_name: data.name,
      city: data.address ?? "Addis Ababa",
    });

    // Create organization
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const { error } = await supabase.from("organizations").insert({
      owner_id: userId,
      name: data.name,
      slug: `${slug}-${Date.now()}`,
      description: data.description || null,
      address: data.address || null,
      phone: data.phone || null,
      email: data.email || null,
      website: data.website || null,
      registration_number: data.registrationNumber || null,
      status: "pending",
    });

    if (error) {
      setServerError("Failed to create organization. Please try again.");
      return;
    }
    router.push("/org/dashboard?welcome=1");
  };

  const inputClass = cn(
    "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors",
    "focus:border-ring focus:ring-2 focus:ring-ring/20"
  );
  const labelClass = "mb-1.5 block text-sm font-medium";
  const errorClass = "mt-1 text-xs text-destructive";

  if (isSupporterMode) {
    return (
      <form
        onSubmit={supporterForm.handleSubmit(onSupporterSubmit)}
        className="space-y-5"
        noValidate
      >
        <h2 className="font-display text-lg font-semibold">Your Profile</h2>

        {serverError && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="on-name" className={labelClass}>Full Name *</label>
            <input
              id="on-name"
              {...supporterForm.register("fullName")}
              className={cn(inputClass, supporterForm.formState.errors.fullName && "border-destructive")}
              placeholder="Abebe Bikila"
            />
            {supporterForm.formState.errors.fullName && (
              <p className={errorClass}>{supporterForm.formState.errors.fullName.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="on-phone" className={labelClass}>Phone Number</label>
            <input
              id="on-phone"
              {...supporterForm.register("phone")}
              className={inputClass}
              placeholder="+251911234567"
            />
            {supporterForm.formState.errors.phone && (
              <p className={errorClass}>{supporterForm.formState.errors.phone.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="on-city" className={labelClass}>City / Town *</label>
            <select
              id="on-city"
              {...supporterForm.register("city")}
              className={cn(inputClass, "cursor-pointer")}
            >
              <option value="">Select city</option>
              {ETHIOPIAN_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="on-subcity" className={labelClass}>Sub-city / District</label>
            <input
              id="on-subcity"
              {...supporterForm.register("subcity")}
              className={inputClass}
              placeholder="Bole, Yeka..."
            />
          </div>
        </div>

        <div>
          <label htmlFor="on-bio" className={labelClass}>Short Bio</label>
          <textarea
            id="on-bio"
            {...supporterForm.register("bio")}
            rows={3}
            className={cn(inputClass, "resize-none")}
            placeholder="Tell organizations a little about yourself..."
          />
        </div>

        {/* Skills tags */}
        <div>
          <label className={labelClass}>Skills</label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <span
                key={s}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
              >
                {s}
                <button
                  type="button"
                  onClick={() => removeTag(s, skills, setSkills)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag(skillInput, skills, setSkills, setSkillInput);
                }
              }}
              className={cn(inputClass, "flex-1")}
              placeholder="Type a skill and press Enter..."
            />
            <button
              type="button"
              onClick={() => addTag(skillInput, skills, setSkills, setSkillInput)}
              className="flex items-center gap-1 rounded-lg border border-primary px-3 py-2 text-sm text-primary hover:bg-primary/5"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSkills([...skills, s])}
                className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        {/* Interests tags */}
        <div>
          <label className={labelClass}>Causes You Care About</label>
          <div className="flex flex-wrap gap-1.5">
            {CAUSE_SUGGESTIONS.map((cause) => (
              <button
                key={cause}
                type="button"
                onClick={() => {
                  setInterests(
                    interests.includes(cause)
                      ? interests.filter((i) => i !== cause)
                      : [...interests, cause]
                  );
                }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                  interests.includes(cause)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {cause}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-gradient px-4 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Complete Profile →
        </button>
      </form>
    );
  }

  // Organization mode
  return (
    <form
      onSubmit={orgForm.handleSubmit(onOrgSubmit)}
      className="space-y-5"
      noValidate
    >
      <h2 className="font-display text-lg font-semibold">Organization Details</h2>

      {serverError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
        ℹ️ After registration, an admin will review your documents (1–2 business
        days) before you can publish needs.
      </div>

      <div>
        <label htmlFor="org-name" className={labelClass}>Organization Name *</label>
        <input
          id="org-name"
          {...orgForm.register("name")}
          className={cn(inputClass, orgForm.formState.errors.name && "border-destructive")}
          placeholder="Ethiopian Education Foundation"
        />
        {orgForm.formState.errors.name && (
          <p className={errorClass}>{orgForm.formState.errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="org-desc" className={labelClass}>About Your Organization</label>
        <textarea
          id="org-desc"
          {...orgForm.register("description")}
          rows={4}
          className={cn(inputClass, "resize-none")}
          placeholder="Describe your mission, who you serve, and your impact..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="org-phone" className={labelClass}>Phone</label>
          <input
            id="org-phone"
            {...orgForm.register("phone")}
            className={inputClass}
            placeholder="+251 11 123 4567"
          />
        </div>
        <div>
          <label htmlFor="org-email" className={labelClass}>Email</label>
          <input
            id="org-email"
            type="email"
            {...orgForm.register("email")}
            className={inputClass}
            placeholder="info@yourorg.org"
          />
        </div>
      </div>

      <div>
        <label htmlFor="org-address" className={labelClass}>Address</label>
        <input
          id="org-address"
          {...orgForm.register("address")}
          className={inputClass}
          placeholder="Bole Sub-city, Addis Ababa"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="org-website" className={labelClass}>Website</label>
          <input
            id="org-website"
            type="url"
            {...orgForm.register("website")}
            className={inputClass}
            placeholder="https://yourorg.org"
          />
        </div>
        <div>
          <label htmlFor="org-reg" className={labelClass}>Registration Number</label>
          <input
            id="org-reg"
            {...orgForm.register("registrationNumber")}
            className={inputClass}
            placeholder="MOJ/NGO/12345"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-gradient px-4 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60 transition-opacity"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Register Organization →
      </button>
    </form>
  );
}
