// Убирает папку downloads из собранного сайта перед копированием в Android-приложение.
// Иначе APK попал бы внутрь самого приложения (а в нём — предыдущий APK, и так далее: размер рос бы с каждой сборкой).
import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
rmSync(join(root, "out", "downloads"), { recursive: true, force: true });
console.log("[apk] Папка downloads исключена из мобильной сборки.");
