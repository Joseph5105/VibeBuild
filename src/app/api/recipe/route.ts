// OWNER: Member B (AI / Backend)
// POST /api/recipe  { image: dataUrl }  ->  RecipeResponse

import { NextResponse } from "next/server";
import type { RecipeRequest, RecipeResponse } from "@/types/recipe";
import { generateRecipeFromImage } from "@/lib/gemini";
import { MOCK_RECIPE } from "@/lib/mock";

export const runtime = "nodejs";
export const maxDuration = 30; // seconds

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as RecipeRequest | null;
  if (!body || typeof body.image !== "string" || !body.image.startsWith("data:image/")) {
    return json({ ok: false, error: "Missing or invalid `image` (expected data URL)" }, 400);
  }
  // TODO(B4): reject oversized images (413) and map errors to friendly messages / status codes

  // Mock mode: no key yet, or explicitly enabled
  if (process.env.MOCK_AI === "1" || !process.env.GEMINI_API_KEY) {
    return json({ ok: true, recipe: MOCK_RECIPE, mock: true });
  }

  try {
    const recipe = await generateRecipeFromImage(body.image);
    return json({ ok: true, recipe });
  } catch (err) {
    console.error("[api/recipe]", err);
    return json({ ok: false, error: "AI request failed." }, 502);
  }
}

function json(data: RecipeResponse, status = 200) {
  return NextResponse.json(data, { status });
}
