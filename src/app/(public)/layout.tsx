import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

/**
 * Layout shared by all public-facing pages (home, browse, org pages, etc.)
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
