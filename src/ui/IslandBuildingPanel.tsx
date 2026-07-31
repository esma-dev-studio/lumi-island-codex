import type { GameState } from "@/src/game/types";
import {
  UNLOCK_CATALOG,
  purchaseComplete,
  purchaseCost,
  type LumenPurchase,
} from "@/src/economy/UnlockCatalog";
import {
  dailyGoalIsActive,
  journeyGoalLabel,
} from "@/src/progression/DailyGoalSystem";
import { nightGardenStatus } from "@/src/world/NightGardenController";

const SHOP_ORDER: LumenPurchase[] = ["bridge", "recipe", "grove", "hint"];

export function IslandBuildingPanel({
  state,
  onSpendLumen,
  onOpenCraft,
  onOpenQuests,
}: {
  state: GameState;
  onSpendLumen: (use: LumenPurchase) => void;
  onOpenCraft: () => void;
  onOpenQuests: () => void;
}) {
  const dailyActive = dailyGoalIsActive(state.dailyGoalsStartDay, state.day);
  const nollaLevel = state.residentFriendship["ノラ"];
  const nightStatus = nightGardenStatus(state.dayMinute);
  const harborOpen = state.collectionMilestones.includes(50);
  const nightGardenOpen = state.collectionMilestones.includes(75);
  const nollaGoal =
    nollaLevel === 0
      ? "まずは ノラと話そう"
      : nollaLevel === 1
        ? "木のえだを 1こプレゼント"
        : nollaLevel === 2
          ? "工具台を ノラの近くに置こう"
          : "ふたりの作業場が できた！";

  return (
    <>
      <header className="panel-heading building-heading">
        <p className="eyebrow">ISLAND BUILDING</p>
        <h2>島づくり</h2>
        <span>ルーメンで 新しい遊びをひらこう</span>
      </header>
      <div className="menu-status" aria-label="島づくりのきろく">
        <span>
          <small>つかえる</small>
          <strong>{state.lumen} L</strong>
        </span>
        <span>
          <small>島ランク</small>
          <strong>{state.islandLevel}</strong>
        </span>
        <span>
          <small>ノラ</small>
          <strong>
            {"★".repeat(nollaLevel)}
            {"☆".repeat(3 - nollaLevel)}
          </strong>
        </span>
      </div>

      <section className="next-fun-card" aria-label="つぎの目標">
        <span className="next-fun-orb" aria-hidden="true" />
        <div>
          <small>
            {dailyActive ? "きょうの 島しごと" : "いまの おねがい"}
          </small>
          <strong>
            {dailyActive
              ? journeyGoalLabel(state.journeyGoal)
              : "島のみんなの おねがいを進めよう"}
          </strong>
          <span>
            {dailyActive
              ? `${state.journeyGoal.amount}/${state.journeyGoal.target} ・ ごほうび ${state.journeyGoal.reward} L`
              : "ぜんぶ終わると、毎日の島しごとが始まるよ"}
          </span>
        </div>
        <button onClick={onOpenQuests}>おねがい</button>
      </section>

      <h3 className="panel-section-title">ルーメンで ひらく</h3>
      <div className="unlock-shop-grid">
        {SHOP_ORDER.map((use) => {
          const entry = UNLOCK_CATALOG[use];
          const complete = purchaseComplete(state, use);
          const cost = purchaseCost(state, use);
          const canBuy = state.lumen >= cost && !complete;
          const stage = use === "grove" ? ` ${state.groveRepairs}/3` : "";
          const icon =
            use === "bridge"
              ? "🌉"
              : use === "grove"
                ? "🌳"
                : use === "recipe"
                  ? "🪚"
                  : "🔎";
          return (
            <article
              key={use}
              className={`unlock-card unlock-card--${use} ${complete ? "is-complete" : ""}`}
            >
              <div className="unlock-card-art" aria-hidden="true">
                <span>{icon}</span>
              </div>
              <div className="unlock-card-copy">
                <small>
                  {entry.shortDescription}
                  {stage}
                </small>
                <h3>{entry.name}</h3>
                <p>{entry.resultDescription}</p>
              </div>
              <button
                disabled={complete}
                className={canBuy ? "can-buy" : ""}
                onClick={() => onSpendLumen(use)}
              >
                {complete ? "できた！" : `${cost} L`}
              </button>
            </article>
          );
        })}
      </div>

      <section className="friendship-story-card">
        <div>
          <small>ノラと 木しごと</small>
          <strong>{nollaGoal}</strong>
          <span>会話だけでなく、いっしょに作ると仲よしになります。</span>
        </div>
        <button onClick={onOpenCraft}>つくる</button>
      </section>

      <section className="world-unlock-strip" aria-label="島の新しい場所">
        <span className={state.bridgeRepaired ? "is-open" : ""}>
          小島 {state.bridgeRepaired ? "OPEN" : "橋を修理"}
        </span>
        <span className={harborOpen ? "is-open" : ""}>
          港の釣り {harborOpen ? "OPEN" : "ずかん50%"}
        </span>
        <span className={nightGardenOpen ? "is-open" : ""}>
          夜の庭 {nightStatus}
        </span>
      </section>
    </>
  );
}
