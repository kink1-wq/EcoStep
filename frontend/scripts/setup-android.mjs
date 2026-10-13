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

// 1) Логотип
const iconsFrom = join(root, "resources", "android", "res");
const iconsTo = join(androidDir, "app", "src", "main", "res");
cpSync(iconsFrom, iconsTo, { recursive: true, force: true });
console.log("[android] Логотип EcoStep применён.");

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
