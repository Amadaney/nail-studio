import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { SITE } from "@/lib/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/client";
import "./globals.css";

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-serif" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} | Manicure & Pedicure`, template: `%s | ${SITE.name}` },
  description: "Premium manicure and pedicure studio. Book online in a minute. / Estudio de manicure y pedicure. Reserva en línea.",
  openGraph: { type: "website", siteName: SITE.name, locale: "en_US", alternateLocale: ["es_US"] },
};
export const viewport: Viewport = { themeColor: "#FAF8F5", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${serif.variable} ${sans.variable}`}>
      <body>
        <I18nProvider locale={locale} dict={dictionaries[locale]}>{children}</I18nProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
