import { Header } from "./header";
import { Footer } from "./footer";
import { WhatsAppButton } from "./whatsapp-button";
import { getSettings } from "@/lib/settings";

export async function PublicShell({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <>
      <Header name={s.business_name} />
      <main>{children}</main>
      <Footer name={s.business_name} />
      <WhatsAppButton number={s.whatsapp} />
    </>
  );
}
