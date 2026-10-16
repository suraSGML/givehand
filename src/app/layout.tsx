import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, Geist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://givehandet.org"
  ),
  title: {
    default: "GiveHand ET — Volunteer, Donate, Create Impact",
    template: "%s | GiveHand ET",
  },
  description:
    "GiveHand ET connects volunteers and donors with verified Ethiopian organizations. Volunteer your time, donate materials, or contribute money — and see your real impact.",
  keywords: [
    "Ethiopia",
    "volunteer",
    "NGO",
    "donation",
    "community",
    "charity",
    "Addis Ababa",
    "givehandet",
  ],
  authors: [{ name: "GiveHand ET" }],
  creator: "GiveHand ET",
  openGraph: {
    type: "website",
    locale: "en_ET",
    alternateLocale: "am_ET",
    url: "https://givehandet.org",
    siteName: "GiveHand ET",
    title: "GiveHand ET — Volunteer, Donate, Create Impact",
    description:
      "Connect with verified Ethiopian organizations to volunteer, donate materials, or give money.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GiveHand ET",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GiveHand ET",
    description: "Volunteer, donate, and create impact in Ethiopia.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0d9488" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(inter.variable, plusJakarta.variable, "font-sans", geist.variable)}
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages} locale={locale}>
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
