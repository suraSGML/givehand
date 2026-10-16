"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { locales, type Locale } from "@/i18n/request";

/**
 * Server action to switch the display language.
 * Stores the preference in a cookie (no database, works for guests too).
 */
export async function setLocaleAction(locale: Locale): Promise<void> {
  if (!locales.includes(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set("NEXT_LOCALE", locale, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
}
