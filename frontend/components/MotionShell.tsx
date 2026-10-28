"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BrandMark } from "./Brand";

const MotionNavigation = createContext<((href: string, scroll?: boolean) => void) | null>(null);
export const useMotionNavigation = () => useContext(MotionNavigation);

/** A short, interruptible transition; navigation never depends on animation events. */
export default function MotionShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<"idle" | "cover" | "reveal">("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pending = useRef(false);
  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const navigate = useCallback((href: string, scroll = true) => {
    clearTimers();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      pending.current = false;
      setPhase("idle");
      router.push(href, { scroll });
      return;
    }
    pending.current = true;
    setPhase("cover");
    timers.current.push(setTimeout(() => router.push(href, { scroll }), 300));
    // A slow connection must not leave an opaque curtain over the current page.
    timers.current.push(setTimeout(() => {
      pending.current = false;
      setPhase("idle");
    }, 1800));
  }, [clearTimers, router]);

  useEffect(() => {
    clearTimers();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (pending.current && !reduced) {
      setPhase("reveal");
      timers.current.push(setTimeout(() => setPhase("idle"), 650));
    } else setPhase("idle");
    pending.current = false;

    const main = document.getElementById("main");
    // Fixed map controls must keep the viewport as their containing block.
    const isMap = pathname.replace(/\/$/, "") === "/map";
    const animation = !reduced && main?.animate([
      { opacity: 0.35, transform: isMap ? "none" : "translateY(18px)" },
      { opacity: 1, transform: "none" },
    ], { duration: 680, easing: "cubic-bezier(.16,1,.3,1)" });
    return () => { animation && animation.cancel(); clearTimers(); };
  }, [pathname, clearTimers]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => {
      if (preference.matches) {
        setPhase("idle");
        document.getElementById("main")?.getAnimations().forEach(a => a.cancel());
      }
    };
    preference.addEventListener("change", change);
    return () => preference.removeEventListener("change", change);
  }, []);

  return <MotionNavigation.Provider value={navigate}>
    {children}
    <div className="route-wipe" data-phase={phase} aria-hidden="true">
      <div className="route-wipe-accent"/>
      <div className="route-wipe-forest"/>
      <div className="route-wipe-mark"><BrandMark/><span>eco<span>step</span></span></div>
    </div>
  </MotionNavigation.Provider>;
}
