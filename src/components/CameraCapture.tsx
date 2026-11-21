"use client";
// OWNER: Member A (Camera / Capture)
// A native file input with capture="environment" opens the rear camera on phones
// and a file picker on desktop. No permission prompts, and it works over plain HTTP.

import { fileToResizedDataUrl } from "@/lib/image";

interface Props {
  disabled?: boolean;
  onCapture: (dataUrl: string) => void; // ⚠️ keep this signature, page.tsx depends on it
}

// TODO(A4): add a "Choose from library" button (second input without `capture`)
// TODO(A5): preview with Retake / Use photo before calling onCapture
// TODO(A6): error state, accessibility, big touch targets
export default function CameraCapture({ disabled, onCapture }: Props) {
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    onCapture(await fileToResizedDataUrl(file));
  }

  return (
    <label className="btn btn-primary">
      📷 Take a photo
      <input
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        disabled={disabled}
        onChange={handleFile}
      />
    </label>
  );
}
