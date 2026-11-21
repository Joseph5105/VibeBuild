// OWNER: Member C. Placeholder shown while the recipe is generating.
export default function RecipeSkeleton() {
  return (
    <div className="card skeleton" aria-hidden="true">
      <div className="sk sk-title" />
      <div className="sk sk-line" />
      <div className="sk sk-line short" />
      <div className="sk-pills">
        <div className="sk sk-pill" />
        <div className="sk sk-pill" />
        <div className="sk sk-pill" />
      </div>
      <div className="sk sk-heading" />
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="sk sk-line" />
      ))}
      <div className="sk sk-heading" />
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="sk sk-block" />
      ))}
    </div>
  );
}
