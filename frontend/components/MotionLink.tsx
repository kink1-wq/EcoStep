"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useMotionNavigation } from "./MotionShell";

/** Retains Next prefetch and normal browser behaviour for modified/external links. */
export default function MotionLink({ onClick, scroll, replace, ...props }: ComponentProps<typeof Link>) {
  const navigate = useMotionNavigation();
  return <Link {...props} scroll={scroll} replace={replace} onClick={event => {
    onClick?.(event);
    const anchor = event.currentTarget;
    if (!navigate || replace || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;
    const target = new URL(anchor.href);
    if (target.origin !== location.origin || target.pathname.replace(/\/$/, "") === location.pathname.replace(/\/$/, "") || target.hash) return;
    event.preventDefault();
    navigate(target.pathname + target.search, scroll);
  }}/>;
}
