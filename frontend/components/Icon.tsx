import type { SVGProps } from "react";
export type IconName = "eye" | "flag" | "trash" | "clock" | "alert" | "spark" | "sweep" | "copy" | "image" | "download" | "external" | "ban" | "home" | "leaf" | "map" | "chart" | "user" | "plus" | "arrow" | "camera" | "pin" | "check" | "menu" | "close" | "phone" | "shield" | "logout" | "file" | "locate";
const paths: Record<IconName, React.ReactNode> = {
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
  flag: <><path d="M5 22V3m0 1c4-4 10 4 15 0v11c-5 4-11-4-15 0"/></>,
  trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
  alert: <><path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5m0 3v.1"/></>,
  spark: <><path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"/></>,
  sweep: <><path d="m19 3-8 9M7 11l7 6-4 5H2l1-8 4-3ZM6 16l-2 5m6-2-1 3"/></>,
  copy: <><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 5V3H3v13h2"/></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2"/><path d="m3 17 5-5 4 4 4-6 5 7"/></>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></>,
  external: <><path d="M14 3h7v7M21 3 10 14M10 3H3v18h18v-7"/></>,
  ban: <><circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/></>,
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"/><path d="M9 21v-8h6v8"/></>,
  leaf: <><path d="M20 4C10 2 3 7 5 14s13 8 15-10Z"/><path d="M4 21 15 10M9 16v-5m0 5h5"/></>,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15"/></>,
  chart: <><path d="M4 4v16h16M9 15v-4m5 4V7m5 8V3"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></>,
  plus: <path d="M12 5v14M5 12h14"/>, arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
  camera: <><path d="M4 6h4l2-3h4l2 3h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="4"/></>,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  check: <path d="m5 12 4 4L19 6"/>, menu: <path d="M4 6h16M4 12h16M4 18h16"/>, close: <path d="m6 6 12 12M6 18 18 6"/>,
  phone: <><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 5h4M11 19h2"/></>,
  shield: <><path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Z"/><path d="m8 12 3 3 5-6"/></>,
  logout: <><path d="M10 4H4v16h6m4-13 5 5-5 5M9 12h12"/></>,
  file: <><path d="M14 2H5v20h14V7l-5-5Zm0 0v6h5M8 12h8m-8 4h6"/></>,
  locate: <><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></>,
};
export default function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
