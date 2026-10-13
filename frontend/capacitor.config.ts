import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "kz.ecostep.app",
  appName: "EcoStep",
  webDir: "out",
  // Адрес, с которого приложение обращается к серверу: https://localhost (сервер его разрешает в CORS).
  server: { androidScheme: "https" },
};

export default config;
