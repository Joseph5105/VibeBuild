// OWNER: Member B (AI / Backend)
// Client-side helper for calling the recipe API. Safe to import from client components.

import type { RecipeResponse } from "@/types/recipe";

export async function requestRecipe(image: string): Promise<RecipeResponse> {
  try {
    const res = await fetch("/api/recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image }),
    });
    return (await res.json()) as RecipeResponse;
  } catch {
    return { ok: false, error: "Network error — check your connection." };
  }
}
