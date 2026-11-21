"use client";
// OWNER: Member C. Share via the native share sheet, falling back to copying to the clipboard.
import { useState } from "react";
import type { Recipe } from "@/types/recipe";

export function recipeToText(r: Recipe): string {
  const lines: string[] = [r.dishName];
  if (r.description) lines.push(r.description);
  const meta = [
    r.servings > 0 ? `Serves ${r.servings}` : "",
    r.prepTimeMinutes ? `Prep ${r.prepTimeMinutes} min` : "",
    r.cookTimeMinutes ? `Cook ${r.cookTimeMinutes} min` : "",
    r.cuisine ?? "",
  ].filter(Boolean);
  if (meta.length) lines.push(meta.join(" · "));
  lines.push("", "Ingredients:");
  for (const ing of r.ingredients ?? []) lines.push(`- ${[ing.quantity, ing.item].filter(Boolean).join(" ")}`);
  lines.push("", "Steps:");
  (r.steps ?? []).forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  if (r.tips?.length) {
    lines.push("", "Tips:");
    for (const t of r.tips) lines.push(`- ${t}`);
  }
  lines.push("", "Made with SnapRecipe (AI-estimated)");
  return lines.join("\n");
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older iOS / non-secure contexts: fall back to a hidden textarea
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export default function ShareButton({ recipe }: { recipe: Recipe }) {
  const [status, setStatus] = useState<string | null>(null);

  async function handleShare() {
    const text = recipeToText(recipe);
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: recipe.dishName, text });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return; // user cancelled
        // otherwise fall through to copy
      }
    }
    const ok = await copyText(text);
    setStatus(ok ? "Recipe copied to clipboard" : "Couldn't copy. Try selecting the text manually.");
    window.setTimeout(() => setStatus(null), 2500);
  }

  return (
    <div className="share">
      <button type="button" className="btn btn-secondary" onClick={handleShare}>
        📤 Share / Copy recipe
      </button>
      <p className="muted small share-status" role="status" aria-live="polite">
        {status ?? ""}
      </p>
    </div>
  );
}
