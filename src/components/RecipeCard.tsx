// OWNER: Member C (Recipe Display / UX / Deploy)
import type { Recipe } from "@/types/recipe";

// TODO(C3): meta pills (servings, total time, cuisine, confidence), tips section, disclaimer
// TODO(C4): ingredient checkboxes, tap-to-cross-off steps, Share/Copy button (navigator.share)
// TODO(C5): low-confidence warning
export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  if (!recipe.isFood) {
    return <section className="card">That doesn&apos;t look like food. Try another photo.</section>;
  }

  return (
    <section className="card">
      <h2>{recipe.dishName}</h2>
      <p className="muted">{recipe.description}</p>

      <h3>Ingredients</h3>
      <ul>
        {recipe.ingredients.map((ing, i) => (
          <li key={i}>
            {ing.quantity} {ing.item}
          </li>
        ))}
      </ul>

      <h3>Steps</h3>
      <ol>
        {recipe.steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
    </section>
  );
}
