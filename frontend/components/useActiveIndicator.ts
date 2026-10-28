"use client";

import { useEffect, useRef } from "react";

export default function useActiveIndicator(updateKey: string) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = ref.current;
    if (!nav) return;
    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const active = nav.querySelector<HTMLElement>('[aria-current="page"]');
      nav.dataset.indicator = active ? "ready" : "hidden";
      if (!active) return;
      nav.style.setProperty("--active-left", `${active.offsetLeft}px`);
      nav.style.setProperty("--active-width", `${active.offsetWidth}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    document.fonts.ready.then(measure);
    return () => { disposed = true; observer.disconnect(); };
  }, [updateKey]);
  return ref;
}
