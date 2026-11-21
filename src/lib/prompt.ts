// OWNER: Member B (AI / Backend)
// Prompt + JSON schema sent to Gemini.

// TODO(B2): improve this prompt (servings, units, non-food handling, confidence rules)
export const RECIPE_PROMPT = `Identify the dish in this photo and write a home-cookable recipe
that reproduces it. If the image is not food, set isFood=false.`;

// TODO(B1): finish this Gemini responseSchema (OpenAPI subset: "OBJECT", "STRING",
// "INTEGER", "BOOLEAN", "ARRAY") so it mirrors the Recipe type in src/types/recipe.ts.
// Docs: https://ai.google.dev/gemini-api/docs/structured-output
export const RECIPE_SCHEMA = {
  type: "OBJECT",
  properties: {
    isFood: { type: "BOOLEAN" },
    dishName: { type: "STRING" },
    // ...description, confidence, servings, prepTimeMinutes, cookTimeMinutes,
    //    ingredients (ARRAY of {item, quantity}), steps (ARRAY of STRING), tips
  },
  required: ["isFood", "dishName"],
} as const;
