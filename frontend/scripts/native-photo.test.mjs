import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const { CameraSource, CameraResultType } = require("@capacitor/camera");
const compiled = ts.transpileModule(readFileSync(new URL("../lib/native.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function fixture({ native = true, getPhoto, input } = {}) {
  const exports = {};
  const context = {
    exports, File, Blob, Error,
    fetch: async () => new Response(new Blob(["test image"], { type: "image/jpeg" })),
    document: { createElement: () => input, body: { appendChild() {} } },
    require: name => ({
      "@capacitor/core": { Capacitor: { isNativePlatform: () => native } },
      "@capacitor/geolocation": {},
      "@capacitor/camera": { CameraSource, CameraResultType, Camera: { getPhoto } },
    })[name],
  };
  vm.runInNewContext(compiled, context);
  return exports;
}

test("gallery opens the native photo library and returns an uploadable image", async () => {
  let options;
  const { takePhoto } = fixture({ getPhoto: async value => { options = value; return { webPath: "native://image", format: "jpeg" }; } });
  const file = await takePhoto("gallery");
  assert.equal(options.source, CameraSource.Photos);
  assert.equal(options.resultType, CameraResultType.Uri);
  assert.equal(file.type, "image/jpeg");
  assert.equal(await file.text(), "test image");
});

test("camera remains available as a separate source", async () => {
  let source;
  const { takePhoto } = fixture({ getPhoto: async options => { source = options.source; return { webPath: "native://image", format: "jpeg" }; } });
  await takePhoto("camera");
  assert.equal(source, CameraSource.Camera);
});

test("cancelling the native picker does not report an upload error", async () => {
  const { takePhoto } = fixture({ getPhoto: async () => { throw new Error("User cancelled photos app"); } });
  assert.equal(await takePhoto("gallery"), null);
});

test("permission and image errors are preserved for the form to display", async () => {
  const denied = fixture({ getPhoto: async () => { throw new Error("Camera permission denied"); } });
  await assert.rejects(denied.takePhoto("camera"), /permission denied/);
  const missing = fixture({ getPhoto: async () => ({ format: "jpeg" }) });
  await assert.rejects(missing.takePhoto("gallery"), /Не удалось получить фото/);
});

test("mobile browser gallery does not force capture and cancellation removes the temporary input", async () => {
  let cancel, removed = false;
  const input = { addEventListener: (name, callback) => { if (name === "cancel") cancel = callback; }, click() {}, remove() { removed = true; } };
  const { takePhoto } = fixture({ native: false, input });
  const pending = takePhoto("gallery");
  assert.equal(input.capture, undefined);
  assert.equal(input.accept, "image/*");
  cancel();
  assert.equal(await pending, null);
  assert.equal(removed, true);
});
