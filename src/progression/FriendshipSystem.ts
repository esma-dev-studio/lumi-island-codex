import { applyEvent, inventoryCount } from "@/src/game/gameState";
import type { FurnitureId, GameState, ResidentId } from "@/src/game/types";
import { withCalculatedRank } from "@/src/progression/IslandRankSystem";

export const NOLLA_RECIPE: FurnitureId = "nolla-workbench";
export const NOLLA_POSITION = { x: -8.7, z: 4.4 } as const;

export interface FriendshipResult {
  state: GameState;
  increased: boolean;
  level: number;
  message?: string;
}

export function befriendResident(
  state: GameState,
  resident: ResidentId,
): FriendshipResult {
  const current = state.residentFriendship[resident] ?? 0;
  if (resident !== "ノラ" || current >= 1) {
    return { state, increased: false, level: current };
  }
  const next = withCalculatedRank({
    ...state,
    residentFriendship: { ...state.residentFriendship, ノラ: 1 },
    residentLastTalkDay: { ...state.residentLastTalkDay, ノラ: state.day },
  });
  return {
    state: next,
    increased: true,
    level: 1,
    message: "ノラと なかよしになった！",
  };
}

export function progressResidentTalk(
  state: GameState,
  resident: ResidentId,
): FriendshipResult {
  const friendship = befriendResident(state, resident);
  return {
    ...friendship,
    state: applyEvent(friendship.state, { type: "talk", resident }),
  };
}

export function canGiveNollaWood(state: GameState): boolean {
  return (
    state.residentFriendship["ノラ"] === 1 &&
    state.quests["first-kindling"].status === "complete" &&
    inventoryCount(state, "wood") >= 1
  );
}

export function giveNollaWood(state: GameState): FriendshipResult {
  if (!canGiveNollaWood(state)) {
    return {
      state,
      increased: false,
      level: state.residentFriendship["ノラ"],
      message: "木のえだを 1こ持って また来てね",
    };
  }
  const unlockedRecipes = state.unlockedRecipes.includes(NOLLA_RECIPE)
    ? state.unlockedRecipes
    : [...state.unlockedRecipes, NOLLA_RECIPE];
  const next = withCalculatedRank({
    ...state,
    inventory: { ...state.inventory, wood: inventoryCount(state, "wood") - 1 },
    residentFriendship: { ...state.residentFriendship, ノラ: 2 },
    unlockedRecipes,
  });
  return {
    state: next,
    increased: true,
    level: 2,
    message: "ノラの工具台を 作れるようになった！",
  };
}

export function applyNollaFurnitureBond(
  state: GameState,
  item: FurnitureId,
  position: { x: number; z: number },
): FriendshipResult {
  const current = state.residentFriendship["ノラ"];
  const nearNolla = Math.hypot(position.x - NOLLA_POSITION.x, position.z - NOLLA_POSITION.z) <= 4.5;
  if (item !== NOLLA_RECIPE || current !== 2 || !nearNolla) {
    return { state, increased: false, level: current };
  }
  const next = withCalculatedRank({
    ...state,
    residentFriendship: { ...state.residentFriendship, ノラ: 3 },
    nollaMemorySeen: false,
  });
  return {
    state: next,
    increased: true,
    level: 3,
    message: "ノラの作業場が ひらいた！ 思い出の話を聞こう",
  };
}

export function nollaDialogue(level: number): { greeting: string; help: string } {
  if (level >= 3) {
    return {
      greeting: "この作業場は、むかし島のみんなで作ったんだ。",
      help: "きみの工具台が来て、また木の音が聞こえるよ。",
    };
  }
  if (level === 2) {
    return {
      greeting: "工具台の作り方、ちゃんと伝わったかな？",
      help: "ぼくの家の近くに置いたら、いっしょに使おう。",
    };
  }
  if (level === 1) {
    return {
      greeting: "木のえだを1こ見せてくれたら、ひみつの作り方を教えるよ。",
      help: "最初の木しごとが終わったら、また話しかけてね。",
    };
  }
  return {
    greeting: "広場の木が、朝の雨で少しゆるんだみたい。",
    help: "木のえだが3本あれば、すぐに直せるよ。",
  };
}