import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "EcoStep — карта загрязнений города",
  description: "Сфотографируйте проблемное место — ИИ проверит, а город увидит его на карте.",
};

// viewport-fit=cover + themeColor — чтобы на телефоне с вырезом/чёлкой контент не прятался
// под системными панелями, а цвет строки состояния совпадал с темой приложения.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#059669",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      {/* flex-колонка на ТОЧНУЮ высоту экрана (не min-height!) — только так процентная высота
          (h-full) корректно пробрасывается вниз до карты через вложенные блоки.
          Контент выше этой высоты всё равно прокручивается — overflow тут не ограничен. */}
      <body className="flex h-screen h-[100dvh] flex-col bg-slate-50 text-slate-900 antialiased">
        <Header />
        <main className="min-h-0 flex-1">{children}</main>
      </body>
    </html>
  );
}
