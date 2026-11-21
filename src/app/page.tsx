"use client";
// OWNER: Member C (integration). Members A and B: don't edit; expose what you need from your own files.
// Flow: idle -> loading -> done | error

import { useRef, useState } from "react";
import CameraCapture from "@/components/CameraCapture";
import RecipeCard from "@/components/RecipeCard";
import RecipeSkeleton from "@/components/recipe/RecipeSkeleton";
import { requestRecipe } from "@/lib/api";
import type { Recipe } from "@/types/recipe";

type Status = "idle" | "loading" | "done" | "error";

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [photo, setPhoto] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [resultId, setResultId] = useState(0);
  // Ignore responses from a request that was superseded by a reset or a newer photo
  const requestSeq = useRef(0);

  async function handleCapture(dataUrl: string) {
    const seq = ++requestSeq.current;
    setPhoto(dataUrl);
    setRecipe(null);
    setError(null);
    setStatus("loading");

    const res = await requestRecipe(dataUrl);
    if (seq !== requestSeq.current) return;

    if (res.ok) {
      setRecipe(res.recipe);
      setIsMock(!!res.mock);
      setResultId((n) => n + 1); // fresh checkbox state per recipe
      setStatus("done");
    } else {
      setError(res.error || "Something went wrong.");
      setStatus("error");
    }
  }

  function reset() {
    requestSeq.current++;
    setStatus("idle");
    setPhoto(null);
    setRecipe(null);
    setError(null);
    setIsMock(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="container">
      <header className="app-header">
        <h1>🍳 SnapRecipe</h1>
        <p className="muted">Snap a photo of any dish and get an AI-estimated recipe.</p>
      </header>

      {photo && (
        <div className={`preview-wrap${status === "loading" ? " is-loading" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="preview" src={photo} alt="Your food photo" />
        </div>
      )}

      {status === "idle" && !photo && (
        <div className="hero card">
          <div className="hero-emoji" aria-hidden="true">📸🥘</div>
          <p>Point your camera at a dish. We&apos;ll guess what it is and how to make it.</p>
        </div>
      )}

      {status === "loading" && (
        <div aria-busy="true" aria-live="polite">
          <div className="loading-row">
            <span className="spinner" aria-hidden="true" />
            <span>Cooking up your recipe…</span>
          </div>
          <RecipeSkeleton />
        </div>
      )}

      {status === "error" && (
        <section className="card error-card" role="alert">
          <h2>😕 Couldn&apos;t make a recipe</h2>
          <p>{error}</p>
          <div className="row">
            {photo && (
              <button type="button" className="btn btn-secondary" onClick={() => handleCapture(photo)}>
                🔁 Try again
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={reset}>
              Start over
            </button>
          </div>
        </section>
      )}

      {status === "done" && recipe && (
        <>
          {isMock && (
            <p className="banner">Mock mode: set GEMINI_API_KEY for real results.</p>
          )}
          <RecipeCard key={resultId} recipe={recipe} />
          <button type="button" className="btn btn-primary" onClick={reset}>
            📷 Snap another
          </button>
        </>
      )}

      {(status === "idle" || status === "error") && (
        <CameraCapture onCapture={handleCapture} />
      )}
    </main>
  );
}
