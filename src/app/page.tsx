"use client";
// OWNER: Member C (integration). Members A and B: don't edit; expose what you need from your own files.
// Flow: idle -> loading -> done | error

import { useState } from "react";
import CameraCapture from "@/components/CameraCapture";
import RecipeCard from "@/components/RecipeCard";
import { requestRecipe } from "@/lib/api";
import type { Recipe } from "@/types/recipe";

type Status = "idle" | "loading" | "done" | "error";

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [photo, setPhoto] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  async function handleCapture(dataUrl: string) {
    setPhoto(dataUrl);
    setStatus("loading");
    const res = await requestRecipe(dataUrl);
    if (res.ok) {
      setRecipe(res.recipe);
      setIsMock(!!res.mock);
      setStatus("done");
    } else {
      setError(res.error);
      setStatus("error");
    }
  }

  return (
    <main className="container">
      <h1>🍳 SnapRecipe</h1>
      <p className="muted">Snap a photo of any dish and get an AI-estimated recipe.</p>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photo && <img className="preview" src={photo} alt="Your food photo" />}

      {/* TODO(C4): proper loading skeleton + nicer error state */}
      {status === "loading" && <p>Cooking up your recipe…</p>}
      {status === "error" && <p className="error">{error}</p>}

      {status === "done" && recipe && (
        <>
          {isMock && <p className="banner">Mock mode: set GEMINI_API_KEY for real results.</p>}
          <RecipeCard recipe={recipe} />
        </>
      )}

      {/* TODO(C4): "Snap another" reset button once done */}
      <CameraCapture disabled={status === "loading"} onCapture={handleCapture} />
    </main>
  );
}
