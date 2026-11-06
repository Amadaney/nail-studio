"use client";
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// Shows ?msg= / ?err= from server-action redirects as a toast, then cleans the URL.
export function FlashToast() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    const msg = sp.get("msg"), err = sp.get("err");
    if (!msg && !err) return;
    if (msg) toast.success(msg);
    if (err) toast.error(err);
    const p = new URLSearchParams(sp.toString());
    p.delete("msg"); p.delete("err");
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [sp, router, pathname]);
  return null;
}
