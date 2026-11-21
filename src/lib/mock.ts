// OWNER: Member B (AI / Backend)
// Canned response, used when GEMINI_API_KEY is unset or MOCK_AI=1.
// Lets Members A and C build UI without a key.

import type { Recipe } from "@/types/recipe";

export const MOCK_RECIPE: Recipe = {
  isFood: true,
  dishName: "Margherita Pizza",
  description: "A classic Neapolitan pizza with tomato, fresh mozzarella, and basil.",
  confidence: "high",
  cuisine: "Italian",
  servings: 2,
  prepTimeMinutes: 20,
  cookTimeMinutes: 10,
  ingredients: [
    { item: "pizza dough", quantity: "1 lb" },
    { item: "crushed tomatoes", quantity: "1/2 cup" },
    { item: "fresh mozzarella", quantity: "4 oz" },
    { item: "fresh basil", quantity: "6 leaves" },
  ],
  steps: [
    "Preheat oven to its highest setting.",
    "Stretch dough, top with tomatoes and mozzarella.",
    "Bake 8–10 minutes, finish with basil.",
  ],
  tips: ["Pat the mozzarella dry to avoid a soggy center."],
};
