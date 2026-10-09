// Копирует логотип EcoStep (иконки + экран загрузки) в Android-проект.
// Запускается автоматически в конце `npm run cap:sync`; можно и вручную: `npm run cap:icons`.
import { cpSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(root, "resources", "android", "res");
const to = join(root, "android", "app", "src", "main", "res");

if (!existsSync(join(root, "android"))) {
  console.log("[icons] Папка android не найдена — пропускаю. Сначала выполните: npx cap add android");
  process.exit(0);
}

cpSync(from, to, { recursive: true, force: true });
console.log("[icons] Логотип EcoStep применён к Android-проекту.");
