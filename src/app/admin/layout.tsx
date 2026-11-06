import { Suspense } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireRole } from "@/lib/security/auth";
import { signOutAction } from "@/actions/auth";
import { FlashToast } from "@/components/ui/flash-toast";

export const dynamic = "force-dynamic"; // private pages are never cached
export const metadata = { title: "Admin", robots: { index: false, follow: false } };

const LINKS = [
  { href: "/admin", label: "Resumen" }, { href: "/admin/bookings", label: "Reservas" },
  { href: "/admin/services", label: "Servicios" }, { href: "/admin/gallery", label: "Galería" },
  { href: "/admin/reviews", label: "Reseñas" }, { href: "/admin/settings", label: "Ajustes" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole(["admin"]);
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-sand bg-white/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <p className="font-serif text-xl">Panel · <span className="text-stone">{profile.full_name}</span></p>
          <div className="flex items-center gap-2">
            <Link href="/" className="btn-sm border border-sand hover:bg-sand" target="_blank">Ver sitio</Link>
            <form action={signOutAction}><button className="btn-sm border border-sand hover:bg-sand gap-1"><LogOut className="h-3.5 w-3.5" aria-hidden />Salir</button></form>
          </div>
        </div>
        <nav aria-label="Admin" className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
          {LINKS.map((l) => <Link key={l.href} href={l.href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-ink/80 hover:bg-sand">{l.label}</Link>)}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
      <Suspense><FlashToast /></Suspense>
    </div>
  );
}
