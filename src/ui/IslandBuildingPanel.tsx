import { useState } from "react";
import type { GameState } from "@/src/game/types";
import {
  UNLOCK_CATALOG,
  purchaseComplete,
  purchaseCost,
  type LumenPurchase,
} from "@/src/economy/UnlockCatalog";
import { rankActions, type RankAction } from "@/src/progression/UnlockEffects";
import { nightGardenStatus } from "@/src/world/NightGardenController";

const SHOP_ORDER: LumenPurchase[] = ["bridge", "recipe", "grove", "hint"];
type ShopTab = "available" | "later" | "done";

const TAB_LABELS: Record<ShopTab, string> = {
  available: "いま できる",
  later: "もうすこし",
  done: "できた",
};

export function IslandBuildingPanel({
  state,
  onSpendLumen,
  onOpenCraft,
  onOpenQuests,
  onRankAction,
}: {
  state: GameState;
  onSpendLumen: (use: LumenPurchase) => void;
  onOpenCraft: () => void;
  onOpenQuests: () => void;
  onRankAction: (action: RankAction["id"]) => void;
}) {
  const actions = rankActions(state);
  const [tab, setTab] = useState<ShopTab>(() =>
    SHOP_ORDER.some(
      (use) => !purchaseComplete(state, use) && state.lumen >= purchaseCost(state, use),
    )
      ? "available"
      : "later",
  );
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
  const visiblePurchases = SHOP_ORDER.filter((use) => {
    const done = purchaseComplete(state, use);
    const affordable = state.lumen >= purchaseCost(state, use);
    if (tab === "done") return done;
    if (tab === "available") return !done && affordable;
    return !done && !affordable;
  });

  return (
    <>
      <header className="panel-heading building-heading">
        <p className="eyebrow">島づくり</p>
        <h2>つぎの遊びを ひらこう</h2>
        <span>もっている ルーメンで えらべるよ</span>
      </header>
      <div className="menu-status" aria-label="島づくりのきろく">
        <span><small>もっている</small><strong>{state.lumen} L</strong></span>
        <span><small>島ランク</small><strong>{state.islandLevel}</strong></span>
        <span><small>ノラ</small><strong>{nollaLevel} / 3</strong></span>
      </div>

      <section className="next-fun-card" aria-label="つぎの目標">
        <span className="next-fun-orb" aria-hidden="true" />
        <div>
          <small>いま すること</small>
          <strong>島のみんなの おねがいを 1つ進めよう</strong>
          <span>ルーメンと 新しい作り方が もらえるよ</span>
        </div>
        <button onClick={onOpenQuests}>おねがい</button>
      </section>

      <div className="building-tabs" aria-label="島づくりの種類">
        {(Object.keys(TAB_LABELS) as ShopTab[]).map((id) => (
          <button key={id} className={tab === id ? "is-active" : ""} onClick={() => setTab(id)}>
            {TAB_LABELS[id]}
          </button>
        ))}
      </div>
      {visiblePurchases.length ? (
        <div className="unlock-shop-grid">
          {visiblePurchases.map((use) => {
            const entry = UNLOCK_CATALOG[use];
            const complete = purchaseComplete(state, use);
            const cost = purchaseCost(state, use);
            const canBuy = state.lumen >= cost && !complete;
            const stage = use === "grove" ? ` ${state.groveRepairs}/3` : "";
            return (
              <article key={use} className={`unlock-card unlock-card--${use} ${complete ? "is-complete" : ""}`}>
                <div className={`unlock-card-art unlock-card-art--${use}`} aria-hidden="true"><span /></div>
                <div className="unlock-card-copy">
                  <small>{entry.shortDescription}{stage}</small>
                  <h3>{entry.name}</h3>
                  <p>{entry.resultDescription}</p>
                  <dl><div><dt>ひつよう</dt><dd>{cost} L</dd></div><div><dt>いま</dt><dd>{state.lumen} L</dd></div></dl>
                </div>
                <button disabled={!canBuy} className={canBuy ? "can-buy" : ""} onClick={() => onSpendLumen(use)}>
                  {complete ? "できた！" : canBuy ? `${cost} Lで ひらく` : `あと ${Math.max(0, cost - state.lumen)} L`}
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="building-empty">ここに入るものは まだないよ。ほかのタブを見よう。</p>
      )}

      {actions.length > 0 && (
        <section className="rank-actions" aria-label="島ランクでできること">
          <div><small>島ランクの力</small><strong>時間をえらんで 探検できる</strong></div>
          {actions.map((action) => (
            <button key={action.id} onClick={() => onRankAction(action.id)}>
              <strong>{action.label}</strong><small>{action.description}</small>
            </button>
          ))}
        </section>
      )}

      <section className="friendship-story-card">
        <div><small>ノラと 木しごと</small><strong>{nollaGoal}</strong><span>話して、わたして、いっしょに作ろう。</span></div>
        <button onClick={onOpenCraft}>つくる</button>
      </section>

      <section className="world-unlock-strip" aria-label="島の新しい場所">
        <span className={state.bridgeRepaired ? "is-open" : ""}>小島 {state.bridgeRepaired ? "ひらいた" : "橋を修理"}</span>
        <span className={harborOpen ? "is-open" : ""}>港の釣り {harborOpen ? "ひらいた" : "ずかん50%"}</span>
        <span className={nightGardenOpen ? "is-open" : ""}>夜の庭 {nightGardenOpen ? nightStatus : "ずかん75%"}</span>
      </section>
    </>
  );
}