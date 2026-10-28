"use client";

import { createElement, useEffect, useRef } from "react";

/** Progressive enhancement: content is visible without JS and with reduced motion. */
export default function Reveal({ as = "div", delay = 0, children, ...props }: {
  as?: "section" | "div" | "li";
  delay?: number;
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  const element = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = element.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!node || preference.matches || !("IntersectionObserver" in window)) return;
    let animation: Animation | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      node.style.opacity = "";
      animation = node.animate([
        { opacity: 0, transform: "translateY(28px)" },
        { opacity: 1, transform: "none" },
      ], { duration: 760, delay, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
      observer.disconnect();
    }, { threshold: 0.08 });
    // Never hide already visible content while hydration is taking place.
    if (node.getBoundingClientRect().top >= innerHeight) node.style.opacity = "0";
    observer.observe(node);
    const show = () => { if (preference.matches) { observer.disconnect(); animation?.cancel(); node.style.opacity = ""; } };
    preference.addEventListener("change", show);
    return () => { observer.disconnect(); animation?.cancel(); node.style.opacity = ""; preference.removeEventListener("change", show); };
  }, [delay]);
  return createElement(as, { ...props, ref: element, "data-reveal": "" }, children);
}
