"use client";
// OWNER: Member A (Camera / Capture)
// A native file input with capture="environment" opens the rear camera on phones
// and a file picker on desktop. No permission prompts, and it works over plain HTTP.
// A4: second input without `capture` → photo library.
// A5: preview with Retake / Use photo before calling onCapture.
// A6: error state, aria labels/live regions, ≥52px touch targets.

import { useRef, useState } from "react";
import { fileToResizedDataUrl, ImageProcessingError } from "@/lib/image";
import styles from "@/components/capture/Capture.module.css";

interface Props {
  disabled?: boolean;
  onCapture: (dataUrl: string) => void; // ⚠️ keep this signature, page.tsx depends on it
}

type State =
  | { kind: "idle" }
  | { kind: "processing" }
  | { kind: "preview"; dataUrl: string }
  | { kind: "error"; message: string };

export default function CameraCapture({ disabled, onCapture }: Props) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  const busy = disabled || state.kind === "processing";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return; // user cancelled the picker
    setState({ kind: "processing" });
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setState({ kind: "preview", dataUrl });
    } catch (err) {
      setState({
        kind: "error",
        message:
          err instanceof ImageProcessingError
            ? err.message
            : "Something went wrong preparing your photo. Please try again.",
      });
    }
  }

  function usePhoto() {
    if (state.kind !== "preview") return;
    onCapture(state.dataUrl);
    setState({ kind: "idle" });
  }

  const inputs = (
    <>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        tabIndex={-1}
        aria-hidden="true"
        disabled={busy}
        onChange={handleFile}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        hidden
        tabIndex={-1}
        aria-hidden="true"
        disabled={busy}
        onChange={handleFile}
      />
    </>
  );

  if (state.kind === "preview") {
    return (
      <section className={styles.wrap} aria-label="Photo preview">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.preview} src={state.dataUrl} alt="Preview of the photo you picked" />
        <div className={styles.row}>
          <button
            type="button"
            className={`btn ${styles.btn} ${styles.secondary}`}
            onClick={() => setState({ kind: "idle" })}
            disabled={disabled}
          >
            ↺ Retake
          </button>
          <button
            type="button"
            className={`btn btn-primary ${styles.btn}`}
            onClick={usePhoto}
            disabled={disabled}
            autoFocus
          >
            ✓ Use photo
          </button>
        </div>
        {inputs}
      </section>
    );
  }

  return (
    <section className={styles.wrap} aria-label="Add a food photo" aria-busy={state.kind === "processing"}>
      <button
        type="button"
        className={`btn btn-primary ${styles.btn}`}
        onClick={() => cameraRef.current?.click()}
        disabled={busy}
      >
        <span aria-hidden="true">📷&nbsp;</span>Take a photo
      </button>
      <button
        type="button"
        className={`btn ${styles.btn} ${styles.secondary}`}
        onClick={() => libraryRef.current?.click()}
        disabled={busy}
      >
        <span aria-hidden="true">🖼️&nbsp;</span>Choose from library
      </button>

      <div aria-live="polite">
        {state.kind === "processing" && <p className={`muted ${styles.status}`}>Preparing photo…</p>}
      </div>
      <div aria-live="assertive">
        {state.kind === "error" && (
          <p role="alert" className={styles.error}>
            {state.message}
          </p>
        )}
      </div>
      {inputs}
    </section>
  );
}
