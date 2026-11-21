// OWNER: Member B (AI / Backend)
// POST /api/recipe  { image: dataUrl }  ->  RecipeResponse

import { NextResponse } from "next/server";
import type { RecipeRequest, RecipeResponse } from "@/types/recipe";
import { generateRecipeFromImage, GeminiError, type GeminiErrorKind } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60; // seconds (Vercel Hobby max); gemini.ts budgets 50s across fallbacks

const MAX_IMAGE_CHARS = 4_000_000; // ~3 MB of base64; Vercel's body limit is 4.5 MB

const ERROR_MAP: Record<GeminiErrorKind, { status: number; message: string }> = {
  config: { status: 500, message: "Server is not configured for AI yet." },
  bad_input: { status: 400, message: "Couldn't read that image. Try another photo." },
  rate_limit: { status: 429, message: "Busy right now. Try again in a minute." },
  unavailable: { status: 503, message: "The AI is overloaded right now. Try again in a minute." },
  safety: { status: 422, message: "Couldn't analyze that image. Try a different photo." },
  timeout: { status: 504, message: "That took too long. Please try again." },
  upstream: { status: 502, message: "The AI had trouble with that one. Please try again." },
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as RecipeRequest | null;
  if (!body || typeof body.image !== "string" || !body.image.startsWith("data:image/")) {
    return json({ ok: false, error: "Missing or invalid `image` (expected data URL)" }, 400);
  }
  if (body.image.length > MAX_IMAGE_CHARS) {
    return json({ ok: false, error: "Image is too large. Try a smaller photo." }, 413);
  }

  try {
    const recipe = await generateRecipeFromImage(body.image);
    return json({ ok: true, recipe });
  } catch (err) {
    // Log details server-side only; the client gets a friendly message.
    console.error("[api/recipe]", err instanceof Error ? err.message : err);
    const { status, message } =
      err instanceof GeminiError ? ERROR_MAP[err.kind] : ERROR_MAP.upstream;
    return json({ ok: false, error: message }, status);
  }
}

function json(data: RecipeResponse, status = 200) {
  return NextResponse.json(data, { status });
}
