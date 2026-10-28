"use client";

import { useEffect, useRef, useState } from "react";
import { takePhoto, type PhotoSource } from "@/lib/native";
import { useI18n } from "@/lib/i18n";
import Icon from "./Icon";

export default function PhotoPicker({ file, onChange, onError, disabled = false }: {
  file: File | null;
  onChange: (file: File) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const [preview, setPreview] = useState("");
  const [picking, setPicking] = useState(false);
  const inFlight = useRef(false);
  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function pick(source: PhotoSource) {
    if (disabled || inFlight.current) return;
    inFlight.current = true;
    setPicking(true);
    onError("");
    try {
      const selected = await takePhoto(source);
      if (selected) onChange(selected);
    } catch {
      onError(t("report.photoFailed"));
    } finally {
      inFlight.current = false;
      setPicking(false);
    }
  }

  return <div className="photo-picker" aria-busy={picking}>
    <button type="button" onClick={() => pick("gallery")} disabled={disabled || picking}
      aria-label={file ? t("report.replacePhoto") : t("report.fromGallery")}
      className="upload-zone grid h-56 w-full place-items-center overflow-hidden rounded-2xl border-2 border-dashed bg-white text-slate-500 disabled:opacity-60">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={t("report.photoAlt")} className="h-full w-full object-cover"/>
      ) : <span className="upload-prompt"><Icon name="image"/><strong>{t("brand.upload")}</strong><span>JPEG · PNG · WebP</span></span>}
    </button>
    <div className="photo-actions">
      <button type="button" onClick={() => pick("camera")} disabled={disabled || picking}><Icon name="camera"/>{t("report.takePhoto")}</button>
      <button type="button" onClick={() => pick("gallery")} disabled={disabled || picking}><Icon name="image"/>{t("report.fromGallery")}</button>
    </div>
    {picking && <p className="text-xs text-slate-500" role="status">{t("report.selectingPhoto")}</p>}
  </div>;
}
