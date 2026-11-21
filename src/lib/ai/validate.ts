// OWNER: Member B (AI / Backend)
// Runtime guard for Gemini output. The schema makes the output *usually* valid; this makes it *always* valid.

import type { Confidence, Ingredient, Recipe } from "@/types/recipe";

const CONFIDENCE: Confidence[] = ["high", "medium", "low"];

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v.trim() : fallback;
}

function int(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function strArray(v: unknown, limit: number): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((s) => str(s)).filter(Boolean).slice(0, limit);
}

export function normalizeRecipe(raw: unknown): Recipe {
  if (!raw || typeof raw !== "object") throw new Error("AI output is not an object");
  const r = raw as Record<string, unknown>;

  const isFood = r.isFood !== false;
  const ingredients: Ingredient[] = Array.isArray(r.ingredients)
    ? r.ingredients
        .map((i) => {
          const o = (i ?? {}) as Record<string, unknown>;
          return { item: str(o.item), quantity: str(o.quantity, "to taste") || "to taste" };
        })
        .filter((i) => i.item)
        .slice(0, 40)
    : [];
  const steps = strArray(r.steps, 30);

  if (isFood && (ingredients.length === 0 || steps.length === 0)) {
    throw new Error("AI output missing ingredients or steps");
  }

  const confidence = CONFIDENCE.includes(r.confidence as Confidence)
    ? (r.confidence as Confidence)
    : "medium";

  return {
    isFood,
    dishName: str(r.dishName) || (isFood ? "Unknown dish" : "Not food"),
    description: str(r.description),
    confidence,
    cuisine: str(r.cuisine) || undefined,
    servings: isFood ? int(r.servings, 1, 20, 2) : 0,
    prepTimeMinutes: int(r.prepTimeMinutes, 0, 600, 0),
    cookTimeMinutes: int(r.cookTimeMinutes, 0, 600, 0),
    ingredients: isFood ? ingredients : [],
    steps: isFood ? steps : [],
    tips: strArray(r.tips, 3),
  };
}
