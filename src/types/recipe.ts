/**
 * SHARED CONTRACT — owned by everyone, changed by no one without telling the team.
 * Frontend (Member A), Backend (Member B), and Display (Member C) all code against this.
 */

export type Confidence = "high" | "medium" | "low";

export interface Ingredient {
  item: string; // "all-purpose flour"
  quantity: string; // "2 cups" — free text, AI estimates
}

export interface Recipe {
  isFood: boolean; // false => image wasn't food; UI should show a friendly message
  dishName: string;
  description: string; // 1–2 sentences
  confidence: Confidence; // how sure the model is about the dish identity
  cuisine?: string;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  ingredients: Ingredient[];
  steps: string[];
  tips?: string[];
}

/** POST /api/recipe request body */
export interface RecipeRequest {
  /** base64 data URL, e.g. "data:image/jpeg;base64,/9j/4AAQ..." (client resizes to <=1024px first) */
  image: string;
}

/** POST /api/recipe response body */
export type RecipeResponse =
  | { ok: true; recipe: Recipe }
  | { ok: false; error: string };
