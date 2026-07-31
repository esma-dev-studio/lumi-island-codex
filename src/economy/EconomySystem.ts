import { COLLECTION_ENTRIES } from "@/src/collection/CollectionData";
import type { GameState } from "@/src/game/types";
import {
  LUMEN_RECIPE,
  purchaseComplete,
  purchaseCost,
  type LumenPurchase,
} from "@/src/economy/UnlockCatalog";

export interface PurchaseResult {
  state: GameState;
  ok: boolean;
  message: string;
}

export function spendLumen(state: GameState, use: LumenPurchase): PurchaseResult {
  if (purchaseComplete(state, use)) {
    const message =
      use === "bridge"
        ? "橋は もうなおっているよ"
        : use === "grove"
          ? "森は すっかり元気だよ"
          : "この作り方は もうおぼえているよ";
    return { state, ok: false, message };
  }

  const cost = purchaseCost(state, use);
  if (state.lumen < cost) {
    return {
      state,
      ok: false,
      message: `あと ${cost - state.lumen}ルーメン ためよう`,
    };
  }

  if (use === "recipe") {
    return {
      state: {
        ...state,
        lumen: state.lumen - cost,
        unlockedRecipes: [...state.unlockedRecipes, LUMEN_RECIPE],
      },
      ok: true,
      message: "杉のベンチを 作れるようになった！",
    };
  }

  if (use === "bridge") {
    return {
      state: { ...state, lumen: state.lumen - cost, bridgeRepaired: true },
      ok: true,
      message: "橋が なおった！ 小島へ行ってみよう",
    };
  }

  if (use === "grove") {
    const groveRepairs = state.groveRepairs + 1;
    const additions = ["あかい実", "月のハーブ", "ひかりキノコ"];
    return {
      state: { ...state, lumen: state.lumen - cost, groveRepairs },
      ok: true,
      message: `森が ${groveRepairs}/3 げんきになった！ ${additions[groveRepairs - 1]}の場所がふえた`,
    };
  }

  const remaining = COLLECTION_ENTRIES.filter(
    (entry) => (state.collectionCounts[entry.id] ?? 0) === 0,
  );
  if (!remaining.length) {
    return { state, ok: false, message: "ずかんは ぜんぶ見つけたよ！" };
  }
  const entry = remaining[state.collectionHintsBought % remaining.length];
  return {
    state: {
      ...state,
      lumen: state.lumen - cost,
      collectionHintsBought: state.collectionHintsBought + 1,
    },
    ok: true,
    message: `${entry.name}は「${entry.place}」で ${entry.timeHint}に 見つかるかも！`,
  };
}