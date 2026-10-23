// Кладёт свежесобранный APK на сайт: копирует его в public/downloads и записывает размер и контрольную сумму.
// Использование: сначала соберите APK в Android Studio (Build → Build APK(s)), затем `npm run publish:apk`,
// после этого сделайте git add / commit / push — сайт на Vercel обновится сам.
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk");
const dir = join(root, "public", "downloads");

if (!existsSync(src)) {
  console.error("[apk] Не найден собранный APK: " + src);
  console.error("[apk] Сначала соберите его в Android Studio: Build → Build App Bundle(s) / APK(s) → Build APK(s).");
  process.exit(1);
}

mkdirSync(dir, { recursive: true });
copyFileSync(src, join(dir, "EcoStep.apk"));
const bytes = readFileSync(src);
const info = {
  file: "EcoStep.apk",
  sizeBytes: bytes.length,
  sha256: createHash("sha256").update(bytes).digest("hex"),
  builtAt: statSync(src).mtime.toISOString(),
};
writeFileSync(join(dir, "apk-info.json"), JSON.stringify(info, null, 2));
console.log(`[apk] Готово: EcoStep.apk, ${(info.sizeBytes / 1048576).toFixed(1)} МБ, SHA-256 ${info.sha256.slice(0, 16)}…`);
console.log("[apk] Теперь: git add . && git commit -m \"Новая версия APK\" && git push");
