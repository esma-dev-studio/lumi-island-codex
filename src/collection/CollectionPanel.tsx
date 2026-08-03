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
import type { GameState } from "@/src/game/types";
import { nextReachableCollectionId } from "@/src/progression/ProgressionReachability";

function timeRecommendation(timeHint: string): string {
  if (timeHint.endsWith("見つけやすい")) return `${timeHint}よ。`;
  if (timeHint === "いつでも") return "いつでも 見つけられるよ。";
  if (timeHint.endsWith("だけ")) return `${timeHint} 見つけられるよ。`;
  return `${timeHint}に 見つけやすいよ。`;
}

export function CollectionPanel({ state }: { state: GameState }) {
  const [category, setCategory] = useState<CollectionCategory | "all">("all");
  const completion = collectionCompletion(state.collectionCounts);
  const entries = useMemo(
    () =>
      COLLECTION_ENTRIES.filter(
        (entry) => category === "all" || entry.category === category,
      ),
    [category],
  );
  const recommendedId = nextReachableCollectionId(
    state.collectionCounts,
    state.collectionMilestones,
    state.bridgeRepaired,
  );
  const recommended = COLLECTION_ENTRIES.find(
    (entry) => entry.id === recommendedId,
  );

  return (
    <div className="collection-panel" data-testid="collection-panel">
      <header className="panel-heading collection-heading">
        <div>
          <p className="eyebrow">島のきろく</p>
          <h2>{state.easyMode ? "しまの ずかん" : "島の図かん"}</h2>
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
      {recommended && (
        <aside className="collection-next" data-testid="collection-next">
          <span className="collection-next-mark" aria-hidden="true" />
          <div>
            <small>つぎの おすすめは 1つだけ</small>
            <strong>{recommended.place}を さがそう</strong>
            <p>{timeRecommendation(recommended.timeHint)}</p>
          </div>
        </aside>
      )}
      <div className="collection-tabs" aria-label="図かんの種類">
        {COLLECTION_CATEGORIES.map((item) => {
          const progress = collectionCategoryCompletion(state.collectionCounts, item.id);
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
          const count = state.collectionCounts[entry.id] ?? 0;
          const found = count > 0;
          const hinted = state.unlockedCollectionHintIds.includes(entry.id);
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
                    : hinted
                      ? `ヒント：${entry.place}を さがそう。`
                      : "見つけると 名前がわかるよ。"}
                </p>
                <small>
                  {found || hinted ? `${entry.place} · ${entry.timeHint}` : entry.timeHint}
                  {found && state.collectionFirstSeenDay[entry.id]
                    ? ` · はじめて ${state.collectionFirstSeenDay[entry.id]}日目`
                    : ""}
                </small>
              </div>
              <b>{found ? `${count}回` : hinted ? "ヒント" : "—"}</b>
            </article>
          );
        })}
      </div>
    </div>
  );
}