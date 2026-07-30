import { QUESTS } from "@/src/data/gameData";
import type { GameState, QuestId } from "@/src/game/types";
import type { InteractionHint } from "@/src/scenes/IslandScene";
import { journeyGoalLabel } from "@/src/progression/ProgressionSystem";
import {
  sendGameKey,
  tapGameKey,
} from "@/src/player/PlayerInputController";

export type HudPanel = "inventory" | "craft" | "quests" | "collection" | "menu" | null;

export function GameHud({
  state,
  activeQuestId,
  tutorialVisible,
  hint,
  paused,
  pendingReward,
  panel,
  showKeyboardLetters,
  onOpenMenu,
  onToggleInventory,
  onToggleCraft,
}: {
  state: GameState;
  activeQuestId?: QuestId;
  tutorialVisible: boolean;
  hint: InteractionHint | null;
  paused: boolean;
  pendingReward: boolean;
  panel: HudPanel;
  showKeyboardLetters: boolean;
  onOpenMenu: () => void;
  onToggleInventory: () => void;
  onToggleCraft: () => void;
}) {
  const activeQuest = activeQuestId ? QUESTS[activeQuestId] : null;
  const questProgress = activeQuestId ? state.quests[activeQuestId] : null;
  return (
    <>
      <header className="game-topbar">
        <div className="game-brand">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <strong>LUMI ISLAND</strong>
            <small>DAY {state.day}</small>
          </div>
        </div>
        <div className="top-resources">
          <button className="menu-button" onClick={onOpenMenu}>
            メニュー
          </button>
        </div>
      </header>

      {!tutorialVisible && (
        <aside className="quest-ribbon">
          <p className="eyebrow">いまの おねがい</p>
          {activeQuest && questProgress ? (
            <>
              <span className="quest-resident">{activeQuest.resident}より</span>
              <h2>{activeQuest.title}</h2>
              <p>{activeQuest.goalLabel}</p>
              <div className="quest-progress">
                <span
                  style={{
                    width: `${Math.min(
                      100,
                      ((questProgress.amount || 0) / activeQuest.target) * 100,
                    )}%`,
                  }}
                />
              </div>
              <small>
                {questProgress.amount} / {activeQuest.target}
              </small>
            </>
          ) : (
            <>
              <span className="quest-resident">きょうの島しごと</span>
              <h2>{journeyGoalLabel(state.journeyGoal)}</h2>
              <p>できたら {state.journeyGoal.reward}ルーメン</p>
              <div className="quest-progress">
                <span
                  style={{
                    width: `${Math.min(
                      100,
                      (state.journeyGoal.amount / state.journeyGoal.target) * 100,
                    )}%`,
                  }}
                />
              </div>
              <small>
                {state.journeyGoal.complete
                  ? "できた！ あしたも あそぼう"
                  : `${state.journeyGoal.amount} / ${state.journeyGoal.target}`}
              </small>
            </>
          )}
        </aside>
      )}

      {hint && !paused && !pendingReward && (
        <div className="interaction-hint">
          {showKeyboardLetters && <kbd>E</kbd>}
          <div>
            <strong>{hint.action}</strong>
            <span>{hint.label}</span>
          </div>
        </div>
      )}

      {!paused && (
        <div className="touch-controls" aria-label="画面の操作ボタン">
          <div className="move-pad" aria-label="矢印で歩く">
            <button
              className="move-up"
              aria-label="上へ歩く"
              onPointerDown={() => sendGameKey("ArrowUp", true)}
              onPointerUp={() => sendGameKey("ArrowUp", false)}
              onPointerLeave={() => sendGameKey("ArrowUp", false)}
              onClick={() => tapGameKey("ArrowUp")}
            >
              ↑
            </button>
            {(["ArrowLeft", "ArrowDown", "ArrowRight"] as const).map(
              (key, index) => (
                <button
                  key={key}
                  aria-label={`${["左", "下", "右"][index]}へ歩く`}
                  onPointerDown={() => sendGameKey(key, true)}
                  onPointerUp={() => sendGameKey(key, false)}
                  onPointerLeave={() => sendGameKey(key, false)}
                  onClick={() => tapGameKey(key)}
                >
                  {["←", "↓", "→"][index]}
                </button>
              ),
            )}
          </div>
          {hint && (
            <button className="touch-action" onClick={() => tapGameKey("KeyE")}>
              {showKeyboardLetters && <b>E</b>}
              <span>{hint.action}</span>
            </button>
          )}
        </div>
      )}

      <nav className="game-tools" aria-label="ゲームメニュー">
        <button
          className={panel === "inventory" ? "is-active" : ""}
          onClick={onToggleInventory}
        >
          <span className="tool-icon tool-icon--bag" aria-hidden="true" />
          <span>バッグ</span>
          {showKeyboardLetters && <kbd>I</kbd>}
        </button>
        <button
          className={panel === "craft" ? "is-active" : ""}
          onClick={onToggleCraft}
        >
          <span className="tool-icon tool-icon--hammer" aria-hidden="true" />
          <span>つくる</span>
          {showKeyboardLetters && <kbd>C</kbd>}
        </button>
      </nav>
    </>
  );
}
