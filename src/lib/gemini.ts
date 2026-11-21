// OWNER: Member B (AI / Backend)
// SERVER ONLY. Never import this from a client component, because it reads the API key.
// Calls the Gemini REST API directly (no SDK dependency).

import type { Recipe } from "@/types/recipe";
import { RECIPE_PROMPT, RECIPE_SCHEMA } from "@/lib/prompt";
import { normalizeRecipe } from "@/lib/ai/validate";

// Tried in order; we fall through to the next model on rate limit / overload / timeout / model-not-found.
// GEMINI_MODEL (env) always goes first. Note: gemini-2.5-flash is not available to new API keys.
const DEFAULT_MODEL = "gemini-3.6-flash";
const FALLBACK_MODELS = ["gemini-3.5-flash", "gemini-3.5-flash-lite"];
const ATTEMPT_TIMEOUT_MS = 18_000;
const TOTAL_BUDGET_MS = 50_000; // stay under the route's maxDuration (60s)

export type GeminiErrorKind =
  | "config"
  | "bad_input"
  | "rate_limit"
  | "unavailable"
  | "safety"
  | "timeout"
  | "upstream";

const RETRYABLE: GeminiErrorKind[] = ["rate_limit", "unavailable", "timeout"];

export class GeminiError extends Error {
  constructor(
    public kind: GeminiErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

export async function generateRecipeFromImage(dataUrl: string): Promise<Recipe> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiError("config", "GEMINI_API_KEY is not set");

  const match = /^data:(image\/[\w+.-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new GeminiError("bad_input", "Invalid image data URL");
  const [, mimeType, base64] = match;

  const models = [...new Set([process.env.GEMINI_MODEL || DEFAULT_MODEL, ...FALLBACK_MODELS])];
  const started = Date.now();
  let lastError: GeminiError | undefined;

  for (const model of models) {
    const remaining = TOTAL_BUDGET_MS - (Date.now() - started);
    if (remaining < 5_000) break;
    try {
      return await callModel(model, apiKey, mimeType, base64, Math.min(ATTEMPT_TIMEOUT_MS, remaining));
    } catch (err) {
      if (!(err instanceof GeminiError) || !RETRYABLE.includes(err.kind)) throw err;
      console.warn(`[gemini] ${model} failed (${err.kind}), trying next model`);
      lastError = err;
    }
  }
  throw lastError ?? new GeminiError("timeout", "No model responded in time");
}

async function callModel(
  model: string,
  apiKey: string,
  mimeType: string,
  base64: string,
  timeoutMs: number,
): Promise<Recipe> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ inline_data: { mime_type: mimeType, data: base64 } }, { text: RECIPE_PROMPT }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: RECIPE_SCHEMA,
            temperature: 0.4,
          },
        }),
      },
    );
  } catch (err) {
    if ((err as Error).name === "AbortError") throw new GeminiError("timeout", `${model} timed out`);
    throw new GeminiError("upstream", `Gemini network error: ${(err as Error).message}`);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    if (res.status === 429) throw new GeminiError("rate_limit", `${model} 429: ${detail}`);
    if (res.status === 404 || res.status >= 500)
      throw new GeminiError("unavailable", `${model} ${res.status}: ${detail}`);
    if (res.status === 400) throw new GeminiError("bad_input", `${model} 400: ${detail}`);
    throw new GeminiError("upstream", `${model} ${res.status}: ${detail}`);
  }

  const data = await res.json();
  if (data?.promptFeedback?.blockReason) {
    throw new GeminiError("safety", `Prompt blocked: ${data.promptFeedback.blockReason}`);
  }
  const candidate = data?.candidates?.[0];
  if (!candidate || candidate.finishReason === "SAFETY") {
    throw new GeminiError("safety", "Response blocked by safety filters");
  }
  const text: string | undefined = candidate.content?.parts?.[0]?.text;
  if (!text) throw new GeminiError("upstream", `Empty response (finishReason=${candidate.finishReason})`);

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new GeminiError("upstream", "Gemini returned invalid JSON");
  }

  try {
    return normalizeRecipe(parsed);
  } catch (err) {
    throw new GeminiError("upstream", (err as Error).message);
  }
}
