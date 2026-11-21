// OWNER: Member B (AI / Backend)
// Prompt + JSON schema sent to Gemini.

export const RECIPE_PROMPT = `You are a professional chef and food scientist.
Look at the photo, identify the dish, and write a realistic, home-cookable recipe
that would reproduce it as closely as possible.

Rules:
- If the image does not contain food or a drink, set isFood=false, dishName="Not food",
  description to a short note on what you see, confidence="high", servings=0,
  times=0, and leave ingredients, steps, and tips empty.
- Default to 2 servings unless the photo clearly shows more.
- Use common US measurements (cups, tbsp, tsp, oz, lb) with metric in parentheses for weights.
- Include every ingredient needed, including oil, salt, and seasoning.
- Steps: concise, actionable, in order, one action per step, no numbering in the text.
- confidence: "high" if the dish is clearly identifiable, "medium" if it's a reasonable guess,
  "low" if the photo is blurry or ambiguous.
- At most 3 short tips.`;

// Gemini responseSchema (OpenAPI subset). Must mirror the Recipe type in src/types/recipe.ts.
// Docs: https://ai.google.dev/gemini-api/docs/structured-output
export const RECIPE_SCHEMA = {
  type: "OBJECT",
  properties: {
    isFood: { type: "BOOLEAN" },
    dishName: { type: "STRING" },
    description: { type: "STRING" },
    confidence: { type: "STRING", enum: ["high", "medium", "low"] },
    cuisine: { type: "STRING" },
    servings: { type: "INTEGER" },
    prepTimeMinutes: { type: "INTEGER" },
    cookTimeMinutes: { type: "INTEGER" },
    ingredients: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          item: { type: "STRING" },
          quantity: { type: "STRING" },
        },
        required: ["item", "quantity"],
        propertyOrdering: ["item", "quantity"],
      },
    },
    steps: { type: "ARRAY", items: { type: "STRING" } },
    tips: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: [
    "isFood",
    "dishName",
    "description",
    "confidence",
    "servings",
    "prepTimeMinutes",
    "cookTimeMinutes",
    "ingredients",
    "steps",
  ],
  propertyOrdering: [
    "isFood",
    "dishName",
    "description",
    "confidence",
    "cuisine",
    "servings",
    "prepTimeMinutes",
    "cookTimeMinutes",
    "ingredients",
    "steps",
    "tips",
  ],
} as const;
