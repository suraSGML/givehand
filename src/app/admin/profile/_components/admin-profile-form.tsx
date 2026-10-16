"use client";
import { useState, useTransition } from "react";
import { User, Mail, Phone, MapPin, Save, CheckCircle, AlertCircle, Loader2, Shield } from "lucide-react";
import { updateAdminProfileAction } from "@/lib/actions/auth";

interface Props {
  initialProfile: { id: string; email: string; fullName: string; phone: string; bio: string; city: string };
}

export function AdminProfileForm({ initialProfile }: Props) {
  const [fullName, setFullName] = useState(initialProfile.fullName);
  const [phone, setPhone] = useState(initialProfile.phone);
  const [bio, setBio] = useState(initialProfile.bio);
  const [city, setCity] = useState(initialProfile.city);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null); setError(null);
    startTransition(async () => {
      const res = await updateAdminProfileAction({ fullName, phone, bio, city });
      if (res.success) setSuccess("Admin profile saved successfully!");
      else setError((res as any).error || "Failed to save profile.");
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-foreground">Administrator Account</h2>
            <p className="text-xs text-muted-foreground">{initialProfile.email}</p>
          </div>
          <span className="ml-auto px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700">ADMIN</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-foreground">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                  className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2.5 outline-none focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-foreground">Email (read-only)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input type="email" value={initialProfile.email} readOnly
                  className="w-full rounded-xl border border-input bg-muted pl-9 pr-3 py-2.5 outline-none text-muted-foreground cursor-not-allowed" />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-foreground">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+251 11 ..."
                  className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2.5 outline-none focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-foreground">City</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Addis Ababa"
                  className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2.5 outline-none focus:border-primary" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1 text-foreground">Bio / Notes</label>
              <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Brief description..."
                className="w-full rounded-xl border border-input bg-background p-2.5 outline-none focus:border-primary resize-none" />
            </div>
          </div>

          {success && (
            <div className="rounded-xl bg-teal-500/10 border border-teal-500/20 p-3 text-xs text-teal-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0" /><span>{success}</span>
            </div>
          )}
          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-border">
            <button type="submit" disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
