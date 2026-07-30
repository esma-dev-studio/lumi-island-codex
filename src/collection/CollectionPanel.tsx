import { useMemo, useState } from "react";
import {
  COLLECTION_CATEGORIES,
  COLLECTION_ENTRIES,
  type CollectionCategory,
} from "@/src/collection/CollectionData";
import { CollectionThumbnail } from "@/src/collection/CollectionThumbnail";
import {
  collectionCategoryCompletion,
  collectionCompletion,
} from "@/src/collection/CollectionSystem";

export function CollectionPanel({
  counts,
  easyMode,
}: {
  counts: Record<string, number>;
  easyMode: boolean;
}) {
  const [category, setCategory] = useState<CollectionCategory | "all">("all");
  const completion = collectionCompletion(counts);
  const entries = useMemo(
    () =>
      COLLECTION_ENTRIES.filter(
        (entry) => category === "all" || entry.category === category,
      ),
    [category],
  );

  return (
    <div className="collection-panel" data-testid="collection-panel">
      <header className="panel-heading collection-heading">
        <div>
          <p className="eyebrow">ISLAND COLLECTION</p>
          <h2>{easyMode ? "しまの ずかん" : "島の図かん"}</h2>
          <span>{completion.found} / {completion.total} 見つけた</span>
        </div>
        <div
          className="collection-ring"
          style={{
            background: `conic-gradient(#efb85d ${completion.percent}%, #d9d1bd ${completion.percent}% 100%)`,
          }}
          aria-label={`図かん ${completion.percent}パーセント`}
        >
          <b>{completion.percent}%</b>
        </div>
      </header>
      <div className="collection-tabs" aria-label="図かんの種類">
        {COLLECTION_CATEGORIES.map((item) => {
          const progress = collectionCategoryCompletion(counts, item.id);
          return (
            <button
              key={item.id}
              className={category === item.id ? "is-active" : ""}
              onClick={() => setCategory(item.id)}
            >
              {item.label} <small>{progress.percent}%</small>
            </button>
          );
        })}
      </div>
      <div className="collection-grid">
        {entries.map((entry) => {
          const count = counts[entry.id] ?? 0;
          const found = count > 0;
          return (
            <article
              key={entry.id}
              className={found ? "is-found" : "is-missing"}
              data-testid={`collection-entry-${entry.id}`}
            >
              <CollectionThumbnail entry={entry} found={found} />
              <div>
                <h3>
                  {found ? (
                    <ruby>
                      {entry.name}
                      <rt>{entry.reading}</rt>
                    </ruby>
                  ) : (
                    "まだ 見つけていない"
                  )}
                </h3>
                <p>
                  {found
                    ? entry.description
                    : `${entry.place}を さがしてみよう。`}
                </p>
                <small>{entry.place} · {entry.timeHint}</small>
              </div>
              <b>{found ? `${count}回` : "—"}</b>
            </article>
          );
        })}
      </div>
    </div>
  );
}
