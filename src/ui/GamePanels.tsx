import { ITEMS, QUEST_ORDER, QUESTS, RECIPES } from "@/src/data/gameData";
import { canCraft, inventoryCount } from "@/src/game/gameState";
import type {
  FurnitureId,
  GameState,
  ItemId,
  ResidentId,
  ResourceId,
} from "@/src/game/types";
import { journeyGoalLabel } from "@/src/progression/ProgressionSystem";

const RESOURCES: ResourceId[] = [
  "wood",
  "stone",
  "berry",
  "herb",
  "shell",
  "glowcap",
  "reed",
  "fish",
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

export function MenuPanel({
  onSave,
  onResumeTutorial,
  onRestartTutorial,
  onOpenQuests,
  onOpenCollection,
  onCameraReset,
  onTitle,
  easyMode,
  onEasyMode,
  audioSettings,
  onAudioSettings,
  onSpendLumen,
  tutorialActive,
  tutorialHidden,
  state,
  day,
  lumen,
  islandLevel,
}: {
  onSave: () => void;
  onResumeTutorial: () => void;
  onRestartTutorial: () => void;
  onOpenQuests: () => void;
  onOpenCollection: () => void;
  onCameraReset: () => void;
  onTitle: () => void;
  easyMode: boolean;
  onEasyMode: (enabled: boolean) => void;
  audioSettings: GameState["audioSettings"];
  onAudioSettings: (settings: GameState["audioSettings"]) => void;
  onSpendLumen: (use: "recipe" | "grove" | "hint") => void;
  tutorialActive: boolean;
  tutorialHidden: boolean;
  state: GameState;
  day: number;
  lumen: number;
  islandLevel: number;
}) {
  return (
    <>
      <header className="panel-heading">
        <p className="eyebrow">MENU</p>
        <h2>メニュー</h2>
        <span>ゲームは止まっています</span>
      </header>
      <div className="menu-status" aria-label="島のきろく">
        <span><small>日</small><strong>{day}</strong></span>
        <span><small>ルーメン</small><strong>{lumen}</strong></span>
        <span><small>島ランク</small><strong>{islandLevel}</strong></span>
      </div>
      <section className="progression-card" aria-label="つぎの楽しみ">
        <div>
          <small>きょうの島しごと</small>
          <strong>{journeyGoalLabel(state.journeyGoal)}</strong>
          <span>{state.journeyGoal.amount}/{state.journeyGoal.target} ・ ごほうび {state.journeyGoal.reward}</span>
        </div>
        <div className="friendship-row" aria-label="なかよし度">
          {(["ノラ", "カイ", "セラ"] as ResidentId[]).map((resident) => (
            <span key={resident}>{resident} {"●".repeat(state.residentFriendship[resident])}{"○".repeat(3 - state.residentFriendship[resident])}</span>
          ))}
        </div>
      </section>
      <section className="lumen-shop" aria-label="ルーメンのつかいみち">
        <h3>ルーメンで 島をそだてる</h3>
        <button onClick={() => onSpendLumen("recipe")} disabled={state.unlockedRecipes.includes("cedar-bench")}>
          <strong>20 ・ 杉のベンチの作り方</strong>
          <span>{state.unlockedRecipes.includes("cedar-bench") ? "おぼえた！" : "新しい家具を作れる"}</span>
        </button>
        <button onClick={() => onSpendLumen("grove")} disabled={state.groveRepairs >= 3}>
          <strong>15 ・ 木もれ日の森をなおす</strong>
          <span>{state.groveRepairs}/3 ・ 木と花がふえる</span>
        </button>
        <button onClick={() => onSpendLumen("hint")}>
          <strong>10 ・ ずかんのヒント</strong>
          <span>まだ見つけていないものの場所</span>
        </button>
      </section>
      <div className="menu-list">
        <button onClick={onSave}>
          <strong>セーブする</strong>
          <span>いまの島のようすを、この端末に保存</span>
        </button>
        {tutorialActive && (
          <button onClick={onResumeTutorial}>
            <strong>{tutorialHidden ? "チュートリアルを再開" : "チュートリアルへもどる"}</strong>
            <span>いまのつづきから、遊びかたを見る</span>
          </button>
        )}
        <button onClick={onRestartTutorial}>
          <strong>チュートリアルを最初から</strong>
          <span>歩くところから、もう一度ためす</span>
        </button>
        <button onClick={onOpenQuests}>
          <strong>おねがいを見る</strong>
          <span>島のみんなからの頼まれごと</span>
        </button>
        <button onClick={onOpenCollection}>
          <strong>ずかんを見る</strong>
          <span>見つけたものと集めた数</span>
        </button>
        <button onClick={onCameraReset}>
          <strong>カメラをもどす</strong>
          <span>見やすい向きにもどします</span>
        </button>
        <button
          className={easyMode ? "is-selected" : ""}
          onClick={() => onEasyMode(!easyMode)}
        >
          <strong>やさしい表示 {easyMode ? "ON" : "OFF"}</strong>
          <span>短い文・大きな案内・ゆっくりした操作にします</span>
        </button>
        <div className="audio-settings-card">
          <div>
            <strong>こうか音</strong>
            <span>{audioSettings.muted ? "音をけしています" : `音量 ${Math.round(audioSettings.effectsVolume * 100)}%`}</span>
          </div>
          <button
            className={audioSettings.muted ? "is-selected" : ""}
            onClick={() =>
              onAudioSettings({ ...audioSettings, muted: !audioSettings.muted })
            }
          >
            {audioSettings.muted ? "音を出す" : "音をけす"}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={audioSettings.effectsVolume}
            aria-label="こうか音の音量"
            onChange={(event) =>
              onAudioSettings({
                ...audioSettings,
                effectsVolume: Number(event.target.value),
                muted: false,
              })
            }
          />
        </div>
        <button onClick={onTitle}>
          <strong>タイトルにもどる</strong>
          <span>もどる前に自動でセーブします</span>
        </button>
      </div>
    </>
  );
}