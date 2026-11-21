"use client";
// OWNER: Member C (Recipe Display / UX / Deploy)
import { useState } from "react";
import type { Recipe } from "@/types/recipe";
import ShareButton from "@/components/recipe/ShareButton";

const CONFIDENCE_LABEL: Record<Recipe["confidence"], string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

function formatMinutes(total: number): string {
  if (!Number.isFinite(total) || total <= 0) return "—";
  const h = Math.floor(total / 60);
  const m = Math.round(total % 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(() => new Set());
  const [doneSteps, setDoneSteps] = useState<Set<number>>(() => new Set());

  if (!recipe.isFood) {
    return (
      <section className="card empty-state" role="status">
        <div className="empty-emoji" aria-hidden="true">🤔</div>
        <h2>That doesn&apos;t look like food</h2>
        <p className="muted">Try another photo with the dish clearly in frame and good lighting.</p>
      </section>
    );
  }

  const ingredients = recipe.ingredients ?? [];
  const steps = recipe.steps ?? [];
  const tips = recipe.tips ?? [];
  const totalMinutes = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);

  function toggle(setter: typeof setCheckedIngredients, i: number) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <article className="card recipe">
      {recipe.confidence === "low" && (
        <div className="banner banner-warn" role="alert">
          ⚠️ We&apos;re not sure what this dish is. Treat this recipe as a rough guess and
          double-check before cooking.
        </div>
      )}

      <header className="recipe-header">
        <h2>{recipe.dishName}</h2>
        {recipe.description && <p className="muted">{recipe.description}</p>}
      </header>

      <ul className="pills" aria-label="Recipe details">
        {recipe.servings > 0 && (
          <li className="pill">🍽️ {recipe.servings} {recipe.servings === 1 ? "serving" : "servings"}</li>
        )}
        <li className="pill" title={`Prep ${formatMinutes(recipe.prepTimeMinutes)} · Cook ${formatMinutes(recipe.cookTimeMinutes)}`}>
          ⏱️ {formatMinutes(totalMinutes)}
        </li>
        {recipe.cuisine && <li className="pill">🌍 {recipe.cuisine}</li>}
        <li className={`pill pill-conf pill-${recipe.confidence}`}>
          {CONFIDENCE_LABEL[recipe.confidence] ?? recipe.confidence}
        </li>
      </ul>

      {(recipe.prepTimeMinutes > 0 || recipe.cookTimeMinutes > 0) && (
        <p className="muted small">
          Prep {formatMinutes(recipe.prepTimeMinutes)} · Cook {formatMinutes(recipe.cookTimeMinutes)}
        </p>
      )}

      <section>
        <h3>
          Ingredients{" "}
          {ingredients.length > 0 && (
            <span className="muted small">
              ({checkedIngredients.size}/{ingredients.length})
            </span>
          )}
        </h3>
        <ul className="checklist">
          {ingredients.map((ing, i) => {
            const checked = checkedIngredients.has(i);
            return (
              <li key={i} className={checked ? "is-done" : undefined}>
                <label>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(setCheckedIngredients, i)}
                  />
                  <span>
                    {ing.quantity && <strong>{ing.quantity}</strong>} {ing.item}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h3>Steps</h3>
        <p className="muted small">Tap a step to cross it off.</p>
        <ol className="steps">
          {steps.map((step, i) => {
            const done = doneSteps.has(i);
            return (
              <li key={i}>
                <button
                  type="button"
                  className={`step${done ? " is-done" : ""}`}
                  aria-pressed={done}
                  onClick={() => toggle(setDoneSteps, i)}
                >
                  <span className="step-num" aria-hidden="true">{done ? "✓" : i + 1}</span>
                  <span>{step}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      {tips.length > 0 && (
        <section className="tips">
          <h3>💡 Tips</h3>
          <ul>
            {tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </section>
      )}

      <ShareButton recipe={recipe} />

      <p className="disclaimer">
        This recipe is AI-generated from a photo and may not be accurate. Check ingredients for
        allergens and cook food to safe temperatures.
      </p>
    </article>
  );
}
