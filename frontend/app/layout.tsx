import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./motion.css";
import Header from "@/components/Header";
import MotionShell from "@/components/MotionShell";
import { I18nProvider } from "@/lib/i18n";

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
  themeColor: "#193E2E",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="site-body antialiased">
        <I18nProvider>
          <MotionShell>
          <Header />
          <main id="main" className="site-main">{children}</main>
          </MotionShell>
        </I18nProvider>
      </body>
    </html>
  );
}
