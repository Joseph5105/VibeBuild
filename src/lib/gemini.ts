// OWNER: Member B (AI / Backend)
// SERVER ONLY. Never import this from a client component, because it reads the API key.

import type { Recipe } from "@/types/recipe";
import { RECIPE_PROMPT, RECIPE_SCHEMA } from "@/lib/prompt";

const DEFAULT_MODEL = "gemini-2.5-flash";

/**
 * TODO(B1): Call Gemini with the image and return a Recipe.
 *
 * Hints (REST, no SDK needed):
 *   POST https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent
 *   headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY }
 *   body: {
 *     contents: [{ role: "user", parts: [
 *       { inline_data: { mime_type: "image/jpeg", data: <base64 WITHOUT the "data:...;base64," prefix> } },
 *       { text: RECIPE_PROMPT },
 *     ]}],
 *     generationConfig: { responseMimeType: "application/json", responseSchema: RECIPE_SCHEMA },
 *   }
 *   result text lives at: json.candidates[0].content.parts[0].text  -> JSON.parse it
 *
 * TODO(B3): validate the parsed output before returning it
 * TODO(B4): handle 429 / safety blocks / timeouts (AbortController ~25s)
 */
export async function generateRecipeFromImage(dataUrl: string): Promise<Recipe> {
  void dataUrl;
  void RECIPE_PROMPT;
  void RECIPE_SCHEMA;
  void DEFAULT_MODEL;
  throw new Error("generateRecipeFromImage not implemented yet (task B1)");
}
