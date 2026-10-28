// Настраивает Android-проект EcoStep: ставит логотип (иконки и экран загрузки) и добавляет разрешения
// на геолокацию и камеру в AndroidManifest.xml. Запускается автоматически в конце `npm run cap:sync`,
// вручную — `npm run cap:setup`. Повторный запуск безопасен: уже добавленное не дублируется.
import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const androidDir = join(root, "android");

if (!existsSync(androidDir)) {
  console.log("[android] Папка android не найдена — пропускаю. Сначала выполните: npx cap add android");
  process.exit(0);
}

// Keep the application version reproducible when the ignored Android project is regenerated.
const version = JSON.parse(readFileSync(join(root, "android-version.json"), "utf8"));
if (!Number.isSafeInteger(version.versionCode) || version.versionCode < 1 || !/^\d+\.\d+\.\d+$/.test(version.versionName)) {
  throw new Error("Некорректная версия в android-version.json");
}
const gradlePath = join(androidDir, "app", "build.gradle");
if (existsSync(gradlePath)) {
  const gradle = readFileSync(gradlePath, "utf8")
    .replace(/versionCode\s+\d+/, `versionCode ${version.versionCode}`)
    .replace(/versionName\s+"[^"]+"/, `versionName "${version.versionName}"`);
  writeFileSync(gradlePath, gradle);
  console.log(`[android] Версия ${version.versionName} (${version.versionCode}).`);
}

// 1) Логотип
const iconsFrom = join(root, "resources", "android", "res");
const iconsTo = join(androidDir, "app", "src", "main", "res");
if (existsSync(iconsFrom)) {
  cpSync(iconsFrom, iconsTo, { recursive: true, force: true });
  console.log("[android] Логотип EcoStep применён.");
} else {
  console.log("[android] ВНИМАНИЕ: папка frontend\\resources не найдена — логотип не применён (остаётся стандартный).");
  console.log("[android] Скопируйте папку resources из архива проекта в frontend и выполните: npm run cap:setup");
}

// 2) Разрешения
const manifestPath = join(androidDir, "app", "src", "main", "AndroidManifest.xml");
if (!existsSync(manifestPath)) {
  console.log("[android] AndroidManifest.xml не найден — разрешения не добавлены.");
  process.exit(0);
}

const lines = [
  '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
  '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
  '<uses-permission android:name="android.permission.CAMERA" />',
  '<uses-feature android:name="android.hardware.location.gps" android:required="false" />',
  '<uses-feature android:name="android.hardware.camera" android:required="false" />',
];
const keyOf = (line) => line.match(/android:name="([^"]+)"/)[1];

let xml = readFileSync(manifestPath, "utf8");
const missing = lines.filter((l) => !xml.includes(`"${keyOf(l)}"`));

if (missing.length === 0) {
  console.log("[android] Разрешения на геолокацию и камеру уже на месте.");
} else if (!xml.includes("</manifest>")) {
  console.log("[android] Не удалось разобрать AndroidManifest.xml — добавьте разрешения вручную (см. docs/mobile-build.md).");
} else {
  xml = xml.replace("</manifest>", missing.map((l) => `    ${l}`).join("\n") + "\n</manifest>");
  writeFileSync(manifestPath, xml);
  console.log(`[android] Добавлены разрешения: ${missing.map(keyOf).join(", ")}`);
}
