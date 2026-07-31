import { ITEMS, QUEST_ORDER, QUESTS, RECIPES } from "@/src/data/gameData";
import { canCraft, inventoryCount } from "@/src/game/gameState";
import type {
  FurnitureId,
  GameState,
  ItemId,
  ResourceId,
} from "@/src/game/types";

const RESOURCES: ResourceId[] = [
  "wood",
  "stone",
  "berry",
  "herb",
  "shell",
  "glowcap",
  "reed",
  "fish",
  "starleaf",
  "moonpetal",
  "stardew",
];
export function InventoryPanel({
  state,
  onPlace,
}: {
  state: GameState;
  onPlace: (item: FurnitureId) => void;
}) {
  const furniture = Object.entries(state.inventory).filter(
    ([id, amount]) =>
      (amount ?? 0) > 0 && ITEMS[id as ItemId]?.category === "furniture",
  ) as [FurnitureId, number][];

  return (
    <>
      <header className="panel-heading">
        <p className="eyebrow">INVENTORY</p>
        <h2>ミラのバッグ</h2>
        <span>あつめたもの {state.totalGathered}こ</span>
      </header>
      <h3 className="panel-section-title">ざいりょう</h3>
      <div className="inventory-grid">
        {RESOURCES.map((item) => (
          <div className="inventory-slot" key={item}>
            <span
              className="item-swatch"
              style={{ backgroundColor: ITEMS[item].color }}
            />
            <div>
              <strong>{ITEMS[item].name}</strong>
              <small>{ITEMS[item].reading}</small>
            </div>
            <b>{inventoryCount(state, item)}</b>
          </div>
        ))}
      </div>
      <h3 className="panel-section-title">おける家具</h3>
      {furniture.length ? (
        <div className="furniture-list">
          {furniture.map(([item, amount]) => (
            <article key={item}>
              <span
                className="item-swatch item-swatch--large"
                style={{ backgroundColor: ITEMS[item].color }}
              />
              <div>
                <strong>{ITEMS[item].name}</strong>
                <small>もっている数 {amount}</small>
              </div>
              <button onClick={() => onPlace(item)}>場所をえらぶ</button>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-copy">Cキーの「つくる」で家具を作ってみよう。</p>
      )}
    </>
  );
}

export function CraftPanel({
  state,
  onCraft,
}: {
  state: GameState;
  onCraft: (item: FurnitureId) => void;
}) {
  return (
    <>
      <header className="panel-heading">
        <p className="eyebrow">WORKBENCH</p>
        <h2>木かげの作業台</h2>
        <span>つくった数 {state.totalCrafted}こ</span>
      </header>
      <div className="recipe-list">
        {RECIPES.map((recipe) => {
          const unlocked = state.unlockedRecipes.includes(recipe.id);
          const available = unlocked && canCraft(state, recipe.id);
          return (
            <article
              key={recipe.id}
              className={available ? "can-craft" : unlocked ? "" : "is-locked"}
            >
              <span
                className="recipe-swatch"
                style={{ backgroundColor: ITEMS[recipe.id].color }}
              />
              <div className="recipe-copy">
                <h3>{recipe.name}</h3>
                <p>{recipe.description}</p>
                <div className="recipe-cost">
                  {Object.entries(recipe.cost).map(([item, amount]) => (
                    <span
                      key={item}
                      className={
                        inventoryCount(state, item as ResourceId) >=
                        (amount ?? 0)
                          ? "has-item"
                          : ""
                      }
                    >
                      {ITEMS[item as ResourceId].name} {amount}
                    </span>
                  ))}
                </div>
              </div>
              <button disabled={!available} onClick={() => onCraft(recipe.id)}>
                {!unlocked ? "まだ ひみつ" : available ? "つくる" : "材料まち"}
              </button>
            </article>
          );
        })}
      </div>
    </>
  );
}

export function QuestPanel({ state }: { state: GameState }) {
  return (
    <>
      <header className="panel-heading">
        <p className="eyebrow">REQUESTS</p>
        <h2>島のみんなの おねがい</h2>
        <span>島レベル {state.islandLevel}</span>
      </header>
      <div className="quest-list">
        {QUEST_ORDER.map((id, index) => {
          const quest = QUESTS[id];
          const progress = state.quests[id];
          return (
            <article
              key={id}
              className={`quest-list-item quest-list-item--${progress.status}`}
            >
              <b>{String(index + 1).padStart(2, "0")}</b>
              <div>
                <small>{quest.resident}より</small>
                <h3>{quest.title}</h3>
                <p>
                  {progress.status === "locked"
                    ? "ひとつ前のおねがいを終えると読めます。"
                    : quest.description}
                </p>
              </div>
              <span>
                {progress.status === "complete"
                  ? "できた"
                  : progress.status === "active"
                    ? `${progress.amount}/${quest.target}`
                    : "まだ"}
              </span>
            </article>
          );
        })}
      </div>
    </>
  );
}
