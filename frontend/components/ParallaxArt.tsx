"use client";

import { useEffect, useRef, useState } from "react";
import { BrandArt } from "./Brand";
import { useI18n } from "@/lib/i18n";

export default function ParallaxArt({ caption }: { caption: string }) {
  const scene = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  const { t } = useI18n();
  useEffect(() => {
    const node = scene.current;
    if (!node || paused) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    let visible = false;
    let pointerX = 0, pointerY = 0;
    let currentX = 0, currentY = 0, currentScroll = 0;
    let targetScroll = 0;

    const draw = () => {
      frame = 0;
      if (!visible || preference.matches || document.hidden) return;
      currentX += (pointerX - currentX) * 0.09;
      currentY += (pointerY - currentY) * 0.09;
      currentScroll += (targetScroll - currentScroll) * 0.09;
      node.style.setProperty("--parallax-x", `${currentX.toFixed(2)}px`);
      node.style.setProperty("--parallax-y", `${currentY.toFixed(2)}px`);
      node.style.setProperty("--parallax-scroll", `${currentScroll.toFixed(2)}px`);
      if (Math.abs(pointerX - currentX) + Math.abs(pointerY - currentY) + Math.abs(targetScroll - currentScroll) > 0.1) frame = requestAnimationFrame(draw);
    };
    const schedule = () => { if (!frame && visible && !preference.matches && !document.hidden) frame = requestAnimationFrame(draw); };
    const scroll = () => {
      // Decorative depth only: browser scroll and all reading content remain native.
      const rect = node.getBoundingClientRect();
      const range = finePointer.matches ? 64 : 30;
      targetScroll = Math.max(-range, Math.min(range, (innerHeight * 0.42 - rect.top - rect.height / 2) * 0.13));
      schedule();
    };
    const move = (event: PointerEvent) => {
      if (!finePointer.matches || event.pointerType === "touch") return;
      const rect = node.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 32;
      pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 24;
      schedule();
    };
    const leave = () => { pointerX = 0; pointerY = 0; schedule(); };
    const reset = () => {
      cancelAnimationFrame(frame); frame = 0;
      if (preference.matches) {
        currentX = currentY = currentScroll = 0;
        ["x", "y", "scroll"].forEach(key => node.style.removeProperty(`--parallax-${key}`));
      } else scroll();
    };
    const visibility = () => {
      node.dataset.sceneActive = String(visible && !document.hidden);
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else scroll();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      visibility();
    });
    observer.observe(node);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll, { passive: true });
    node.addEventListener("pointermove", move, { passive: true });
    node.addEventListener("pointerleave", leave);
    preference.addEventListener("change", reset);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerleave", leave);
      preference.removeEventListener("change", reset);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [paused]);

  return <figure ref={scene} className="hero-art parallax-scene" data-scene-active="false" data-scene-paused={paused}>
    <BrandArt/>
    <figcaption><span>{caption}</span><button type="button" className="scene-pause" aria-pressed={paused} aria-label={t("brand.pauseMotion")} onClick={() => setPaused(!paused)}>
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">{paused ? <path d="m5 3 7 5-7 5V3Z" fill="currentColor"/> : <path d="M5 3v10M11 3v10" stroke="currentColor" strokeWidth="2"/>}</svg>
      <span>{paused ? t("brand.resume") : t("brand.pause")}</span>
    </button></figcaption>
  </figure>;
}
