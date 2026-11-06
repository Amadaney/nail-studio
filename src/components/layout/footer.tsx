import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export async function Footer({ name }: { name: string }) {
  const { t } = await getT();
  return (
    <footer className="border-t border-sand bg-sand/50">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 text-sm text-stone sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} {name}. {t("footer.rights")}</p>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/privacy" className="hover:text-ink">{t("footer.privacy")}</Link>
          <Link href="/terms" className="hover:text-ink">{t("footer.terms")}</Link>
        </nav>
      </div>
    </footer>
  );
}
