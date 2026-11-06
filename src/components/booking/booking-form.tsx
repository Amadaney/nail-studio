"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { CheckCircle2, Clock, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { createBookingAction, getSlotsAction } from "@/actions/booking";
import { useT } from "@/lib/i18n/client";
import { cn, fmtDate, fmtTime, formatUSD, waLink } from "@/lib/utils";

export type BookableService = { id: string; name: string; description: string | null; price: number; duration: number };
type Props = { services: BookableService[]; allowMulti: boolean; maxDays: number; whatsapp: string | null; preselect?: string };

const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function BookingForm({ services, allowMulti, maxDays, whatsapp, preselect }: Props) {
  const { t, locale } = useT();
  const [selected, setSelected] = useState<string[]>(preselect && services.some((s) => s.id === preselect) ? [preselect] : []);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "", website: "" });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, start] = useTransition();
  const [done, setDone] = useState<{ date: string; time: string; names: string; name: string } | null>(null);

  const chosen = useMemo(() => services.filter((s) => selected.includes(s.id)), [services, selected]);
  const total = chosen.reduce((a, s) => a + s.price, 0);
  const minutes = chosen.reduce((a, s) => a + s.duration, 0);
  const today = new Date();
  const max = new Date(today.getTime() + maxDays * 86_400_000);

  const toggle = (id: string) =>
    setSelected((cur) => (!allowMulti ? [id] : cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  useEffect(() => {
    setSlot("");
    if (!date || selected.length === 0) { setSlots([]); return; }
    let cancelled = false;
    setLoadingSlots(true);
    getSlotsAction(date, selected)
      .then((r) => { if (!cancelled) setSlots(r); })
      .catch(() => { if (!cancelled) setSlots([]); })
      .finally(() => { if (!cancelled) setLoadingSlots(false); });
    return () => { cancelled = true; };
  }, [date, selected]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length === 0) return toast.error(t("book.pickService"));
    if (!slot) return toast.error(t("book.pickSlot"));
    start(async () => {
      const r = await createBookingAction({
        customerName: form.name, customerEmail: form.email, customerPhone: form.phone, serviceIds: selected,
        date, startTime: slot, notes: form.notes, consent, website: form.website,
      });
      if (r.ok) {
        setDone({ date, time: slot, names: chosen.map((s) => s.name).join(", "), name: form.name });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setErrors(r.fieldErrors ?? {});
        toast.error(r.error.includes(" / ") ? r.error.split(" / ")[locale === "es" ? 1 : 0]! : r.error);
      }
    });
  }

  if (done) {
    const msg = locale === "es"
      ? `¡Hola! Soy ${done.name}. Acabo de reservar ${done.names} el ${fmtDate(done.date, "es")} a las ${fmtTime(done.time)}.`
      : `Hi! I'm ${done.name}. I just booked ${done.names} on ${fmtDate(done.date, "en")} at ${fmtTime(done.time)}.`;
    return (
      <div className="card mx-auto max-w-xl p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-nude" aria-hidden />
        <h2 className="mt-4 text-3xl">{t("book.successTitle")}</h2>
        <p className="mt-2 text-stone">{t("book.successText")}</p>
        <p className="mt-5 font-medium capitalize">{fmtDate(done.date, locale)} · {fmtTime(done.time)}</p>
        <p className="text-sm text-stone">{done.names}</p>
        <p className="mt-1 text-xs text-stone">{t("book.status")}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {whatsapp && (
            <a href={waLink(whatsapp, msg)} target="_blank" rel="noopener noreferrer" className="btn-primary gap-2">
              <MessageCircle className="h-4 w-4" aria-hidden /> {t("book.waConfirm")}
            </a>
          )}
          <button className="btn-outline" onClick={() => { setDone(null); setSelected([]); setDate(""); setSlot(""); setConsent(false); setForm({ name: "", email: "", phone: "", notes: "", website: "" }); }}>
            {t("book.another")}
          </button>
        </div>
      </div>
    );
  }

  const err = (k: string) => errors[k]?.[0] && <p className="mt-1 text-xs text-red-600" role="alert">{errors[k]![0]}</p>;

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_320px]" noValidate>
      <div className="space-y-8">
        <fieldset>
          <legend className="mb-3 text-2xl">{t("book.s1")}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((s) => {
              const on = selected.includes(s.id);
              return (
                <button type="button" key={s.id} onClick={() => toggle(s.id)} aria-pressed={on}
                  className={cn("rounded-xl2 border p-4 text-left transition-all", on ? "border-nude bg-blush/20 shadow-soft" : "border-sand bg-white/70 hover:border-blush")}>
                  <span className="block font-serif text-xl">{s.name}</span>
                  <span className="mt-1 flex items-center justify-between text-sm text-stone">
                    <span>{formatUSD(s.price)}</span><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden />{s.duration} min</span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="b-date" className="mb-3 block text-2xl">{t("book.s2")}</label>
          <input id="b-date" type="date" className="input max-w-xs" value={date} min={isoDate(today)} max={isoDate(max)} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div aria-live="polite">
          <h2 className="mb-3 text-2xl">{t("book.s3")}</h2>
          {!date || selected.length === 0 ? <p className="text-sm text-stone">{t("book.pickFirst")}</p>
            : loadingSlots ? <p className="flex items-center gap-2 text-sm text-stone"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />{t("book.loading")}</p>
            : slots.length === 0 ? <p className="text-sm text-stone">{t("book.noSlots")}</p>
            : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {slots.map((s) => (
                  <button type="button" key={s} onClick={() => setSlot(s)} aria-pressed={slot === s}
                    className={cn("rounded-lg border px-2 py-2.5 text-sm transition-colors", slot === s ? "border-nude bg-nude text-white" : "border-sand bg-white hover:border-blush")}>
                    {fmtTime(s)}
                  </button>
                ))}
              </div>
            )}
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl">{t("book.s4")}</h2>
          <div>
            <label htmlFor="b-name" className="label">{t("book.name")}</label>
            <input id="b-name" className="input" autoComplete="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />{err("customerName")}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="b-email" className="label">{t("book.email")}</label>
              <input id="b-email" type="email" inputMode="email" className="input" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />{err("customerEmail")}
            </div>
            <div>
              <label htmlFor="b-phone" className="label">{t("book.phone")}</label>
              <input id="b-phone" type="tel" inputMode="tel" className="input" autoComplete="tel" placeholder="(305) 555-1234" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />{err("customerPhone")}
            </div>
          </div>
          <div>
            <label htmlFor="b-notes" className="label">{t("book.notes")}</label>
            <textarea id="b-notes" rows={3} maxLength={500} className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <input tabIndex={-1} autoComplete="off" aria-hidden className="absolute left-[-9999px]" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-[#C9A99B]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>{t("book.consent")}</span>
          </label>{err("consent")}
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card p-5">
          <ul className="space-y-1.5 text-sm">
            {chosen.map((s) => <li key={s.id} className="flex justify-between gap-3"><span>{s.name}</span><span className="text-stone">{formatUSD(s.price)}</span></li>)}
          </ul>
          {chosen.length > 0 && <hr className="my-3 border-sand" />}
          <p className="flex justify-between text-sm text-stone"><span>{t("book.duration")}</span><span>{minutes} min</span></p>
          <p className="mt-1 flex justify-between font-medium"><span>{t("book.total")}</span><span>{formatUSD(total)}</span></p>
          {date && slot && <p className="mt-3 text-sm capitalize text-cocoa">{fmtDate(date, locale)} · {fmtTime(slot)}</p>}
          <button type="submit" disabled={pending} className="btn-primary mt-5 w-full gap-2 disabled:opacity-60">
            {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}{pending ? t("book.submitting") : t("book.submit")}
          </button>
        </div>
      </aside>
    </form>
  );
}
