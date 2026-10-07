/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: "export",     // статическая сборка: нужна и для Capacitor, и для простого хостинга сайта
  trailingSlash: true,  // корректные пути к страницам внутри мобильного приложения
  images: { unoptimized: true },
};
export default nextConfig;
