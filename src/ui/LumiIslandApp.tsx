"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ITEMS, QUEST_ORDER, QUESTS, RECIPES } from "@/src/data/gameData";
import {
  advanceTimeWhileRunning,
  canCraft,
  craftItem,
  createInitialState,
  formatGameTime,
  gatherItem,
  inventoryCount,
  moveFurniture,
  placeFurniture,
  removeFurniture,
} from "@/src/game/gameState";
import type {
  FurnitureId,
  GameState,
  ItemId,
  ResourceId,
} from "@/src/game/types";
import { playSound } from "@/src/audio/AudioSystem";
import {
  clearSave,
  hasSave,
  loadGame,
  saveGame,
} from "@/src/save/SaveSystem";
import { TitleScreen } from "@/src/ui/TitleScreen";
import type { InteractionHint } from "@/src/scenes/LumiScenes";
import {
  rotatePlacement,
  type PlacementMode,
  type PlacementPreview,
} from "@/src/placement/PlacementController";

const CharacterShowcase = dynamic(
  () =>
    import("@/src/ui/CharacterShowcase").then(
      (module) => module.CharacterShowcase,
    ),
  { ssr: false },
);
const GameCanvas = dynamic(
  () => import("@/src/ui/GameCanvas").then((module) => module.GameCanvas),
  { ssr: false },
);

type Screen = "title" | "showcase" | "game";
type Panel = "inventory" | "craft" | "quests" | "menu" | null;

interface Toast {
  id: number;
  message: string;
  tone: "normal" | "success";
}

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

const RESIDENT_COPY = {
  ノラ: {
    greeting: "広場の木が、朝の雨で少しゆるんだみたい。",
    help: "木のえだが3本あれば、すぐに直せるよ。",
  },
  カイ: {
    greeting: "池の水面、今日は銀色に光っているね。",
    help: "波のあとには、音のちがう貝が見つかるんだ。",
  },
  セラ: {
    greeting: "月のハーブは、夕方にいちばん香るの。",
    help: "赤い実と合わせたら、みんなのお茶になるよ。",
  },
} as const;

export function LumiIslandApp() {
  const [screen, setScreen] = useState<Screen>("title");
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [canContinue, setCanContinue] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [dialogResident, setDialogResident] = useState<
    "ノラ" | "カイ" | "セラ" | null
  >(null);
  const [hint, setHint] = useState<InteractionHint | null>(null);
  const [fps, setFps] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);
  const [placementMode, setPlacementMode] =
    useState<PlacementMode | null>(null);
  const [placementPreview, setPlacementPreview] =
    useState<PlacementPreview | null>(null);
  const [cameraResetToken, setCameraResetToken] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setCanContinue(hasSave()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const notify = useCallback(
    (message: string, tone: Toast["tone"] = "normal") => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ id: Date.now(), message, tone });
      toastTimer.current = setTimeout(() => setToast(null), 2300);
    },
    [],
  );

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const activeQuestId = useMemo(
    () => QUEST_ORDER.find((id) => state.quests[id].status === "active"),
    [state.quests],
  );
  const activeQuest = activeQuestId ? QUESTS[activeQuestId] : null;

  const isPaused =
    panel !== null || tutorialOpen || dialogResident !== null;

  useEffect(() => {
    if (screen !== "game" || isPaused) return;
    const timer = window.setInterval(() => {
      setState((current) => advanceTimeWhileRunning(current, 3, false));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isPaused, screen]);

  useEffect(() => {
    if (screen !== "game") return;
    const timer = window.setInterval(() => {
      setState((current) => {
        saveGame(current);
        return current;
      });
      setCanContinue(true);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [screen]);

  useEffect(() => {
    if (screen !== "game") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Tab" || event.code === "KeyI") {
        event.preventDefault();
        setPlacementMode(null);
        setPlacementPreview(null);
        setPanel((current) => (current === "inventory" ? null : "inventory"));
        playSound("ui");
      } else if (event.code === "KeyC") {
        setPlacementMode(null);
        setPlacementPreview(null);
        setPanel((current) => (current === "craft" ? null : "craft"));
        playSound("ui");
      } else if (event.code === "KeyQ") {
        setPlacementMode(null);
        setPlacementPreview(null);
        setPanel((current) => (current === "quests" ? null : "quests"));
        playSound("ui");
      } else if (event.code === "Escape") {
        if (placementMode) {
          event.preventDefault();
          setPlacementMode(null);
          setPlacementPreview(null);
          notify("家具を置くのを やめました");
          playSound("ui");
          return;
        }
        setDialogResident(null);
        setTutorialOpen(false);
        setPanel((current) => (current === null ? "menu" : null));
        playSound("ui");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [notify, placementMode, screen]);

  const startNewGame = () => {
    clearSave();
    setState(createInitialState());
    setPanel(null);
    setDialogResident(null);
    setPlacementMode(null);
    setPlacementPreview(null);
    setTutorialOpen(true);
    setScreen("game");
    playSound("ui");
  };

  const continueGame = () => {
    const loaded = loadGame();
    setState(loaded ?? createInitialState());
    setPanel(null);
    setTutorialOpen(false);
    setDialogResident(null);
    setPlacementMode(null);
    setPlacementPreview(null);
    setScreen("game");
    playSound("ui");
  };

  const gather = useCallback(
    (item: ResourceId) => {
      setState((current) => {
        const beforeQuest = QUEST_ORDER.find(
          (id) => current.quests[id].status === "active",
        );
        const next = gatherItem(current, item);
        const completed =
          beforeQuest && next.quests[beforeQuest].status === "complete";
        if (completed) {
          notify(`依頼「${QUESTS[beforeQuest].title}」を達成！`, "success");
          playSound("quest");
        } else {
          notify(`${ITEMS[item].name}を 1こ ひろった`);
          playSound("pickup");
        }
        return next;
      });
    },
    [notify],
  );

  const craft = (item: FurnitureId) => {
    setState((current) => {
      const beforeQuest = QUEST_ORDER.find(
        (id) => current.quests[id].status === "active",
      );
      const result = craftItem(current, item);
      if (!result.ok) {
        notify("ざいりょうが たりないようです");
        playSound("ui");
        return current;
      }
      const completed =
        beforeQuest && result.state.quests[beforeQuest].status === "complete";
      notify(
        completed
          ? `依頼「${QUESTS[beforeQuest].title}」を達成！`
          : `${ITEMS[item].name}が できた！`,
        completed ? "success" : "normal",
      );
      playSound(completed ? "quest" : "craft");
      return result.state;
    });
  };

  const beginPlacement = useCallback(
    (item: FurnitureId) => {
      setPanel(null);
      setPlacementPreview(null);
      setPlacementMode({ type: item, rotation: 0 });
      notify(`${ITEMS[item].name}を置く場所をえらぼう`);
      playSound("ui");
    },
    [notify],
  );

  const editFurniture = useCallback(
    (id: string) => {
      const item = state.placedFurniture.find(
        (placed) => placed.id === id,
      );
      if (!item) return;
      setPlacementPreview(null);
      setPlacementMode({
        type: item.type,
        rotation: item.rotation,
        editingId: item.id,
      });
      notify(`${ITEMS[item.type].name}をならべかえよう`);
      playSound("ui");
    },
    [notify, state.placedFurniture],
  );

  const rotatePlacementPreview = useCallback(() => {
    setPlacementMode((current) =>
      current
        ? {
            ...current,
            rotation: rotatePlacement(current.rotation, 1),
          }
        : current,
    );
    playSound("ui");
  }, []);

  const confirmPlacement = useCallback(
    (preview: PlacementPreview) => {
      const mode = placementMode;
      if (!mode || !preview.valid) return;
      setState((current) => {
        if (mode.editingId) {
          const moved = moveFurniture(
            current,
            mode.editingId,
            preview.position,
            preview.rotation,
          );
          if (moved.ok) {
            notify(`${ITEMS[mode.type].name}を うごかした`);
            playSound("place");
          }
          return moved.state;
        }

        const beforeQuest = QUEST_ORDER.find(
          (id) => current.quests[id].status === "active",
        );
        const result = placeFurniture(
          current,
          mode.type,
          preview.position,
          preview.rotation,
        );
        if (!result.ok) return current;
        const completed =
          beforeQuest &&
          result.state.quests[beforeQuest].status === "complete";
        notify(
          completed
            ? `依頼「${QUESTS[beforeQuest].title}」を達成！`
            : `${ITEMS[mode.type].name}を おいた`,
          completed ? "success" : "normal",
        );
        playSound(completed ? "quest" : "place");
        return result.state;
      });
      setPlacementMode(null);
      setPlacementPreview(null);
    },
    [notify, placementMode],
  );

  const removePlacedFurniture = useCallback(
    (id: string) => {
      setState((current) => {
        const result = removeFurniture(current, id);
        if (result.ok && result.item) {
          notify(`${ITEMS[result.item].name}を バッグへもどした`);
          playSound("ui");
        }
        return result.state;
      });
      setPlacementMode(null);
      setPlacementPreview(null);
    },
    [notify],
  );

  const cancelPlacement = useCallback(() => {
    setPlacementMode(null);
    setPlacementPreview(null);
    notify("家具を置くのを やめました");
    playSound("ui");
  }, [notify]);


  const talk = useCallback((resident: "ノラ" | "カイ" | "セラ") => {
    setDialogResident(resident);
    playSound("ui");
  }, []);

  const updatePlayerPosition = useCallback(
    (position: { x: number; z: number }) => {
      setState((current) => ({ ...current, playerPosition: position }));
    },
    [],
  );

  const manualSave = () => {
    saveGame(state);
    setCanContinue(true);
    notify("島のようすを セーブしました");
    playSound("ui");
  };

  const returnToTitle = () => {
    saveGame(state);
    setCanContinue(true);
    setPanel(null);
    setPlacementMode(null);
    setPlacementPreview(null);
    setScreen("title");
    playSound("ui");
  };

  if (screen === "showcase") {
    return <CharacterShowcase onBack={() => setScreen("title")} />;
  }

  if (screen === "title") {
    return (
      <TitleScreen
        canContinue={canContinue}
        onNewGame={startNewGame}
        onContinue={continueGame}
        onShowcase={() => setScreen("showcase")}
      />
    );
  }

  const guideStep =
    state.totalGathered < 3
      ? 1
      : state.totalCrafted < 1
        ? 2
        : state.placedFurniture.length < 1
          ? 3
          : 4;

  return (
    <main className="game-screen">
      <GameCanvas
        state={state}
        paused={isPaused}
        placementMode={placementMode}
        cameraResetToken={cameraResetToken}
        onHint={setHint}
        onGather={gather}
        onTalk={talk}
        onEditFurniture={editFurniture}
        onPlacementPreview={setPlacementPreview}
        onPlacementConfirm={confirmPlacement}
        onPlacementRotate={rotatePlacementPreview}
        onPlacementRemove={removePlacedFurniture}
        onPlayerMove={updatePlayerPosition}
        onFps={setFps}
      />
      <div className="game-vignette" aria-hidden="true" />

      <header className="game-topbar">
        <div className="game-brand">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <strong>LUMI ISLAND</strong>
            <small>DAY {state.day}</small>
          </div>
        </div>
        <div className="day-clock" aria-label={`島の時刻 ${formatGameTime(state.dayMinute)}`}>
          <span className="clock-sun" aria-hidden="true" />
          <div>
            <small>{state.dayMinute >= 17 * 60 ? "夕ぐれ" : "昼"}</small>
            <strong>{formatGameTime(state.dayMinute)}</strong>
          </div>
        </div>
        <div className="top-resources">
          <div className="lumen-counter">
            <span aria-hidden="true" />
            <div>
              <small>ルーメン</small>
              <strong>{state.lumen}</strong>
            </div>
          </div>
          <button
            className="camera-reset-button"
            onClick={() => {
              setCameraResetToken((value) => value + 1);
              playSound("ui");
            }}
            aria-label="カメラをはじめの向きへもどす"
          >
            カメラ ↺
          </button>
          <button
            className="menu-button"
            onClick={() => {
              setPlacementMode(null);
              setPlacementPreview(null);
              setPanel("menu");
            }}
          >
            メニュー
          </button>
        </div>
      </header>

      <aside className="quest-ribbon">
        <p className="eyebrow">いまの おねがい</p>
        {activeQuest ? (
          <>
            <span className="quest-resident">{activeQuest.resident}より</span>
            <h2>{activeQuest.title}</h2>
            <p>{activeQuest.goalLabel}</p>
            <div className="quest-progress">
              <span
                style={{
                  width: `${Math.min(
                    100,
                    ((state.quests[activeQuest.id].amount || 0) /
                      activeQuest.target) *
                      100,
                  )}%`,
                }}
              />
            </div>
            <small>
              {state.quests[activeQuest.id].amount} / {activeQuest.target}
            </small>
          </>
        ) : (
          <>
            <h2>島の灯りが そろった！</h2>
            <p>好きな家具で、暮らしをつづけよう。</p>
          </>
        )}
      </aside>

      <aside className="guide-rail" aria-label="はじめてガイド">
        <span>はじめてガイド</span>
        <ol>
          <li className={guideStep >= 1 ? "is-active" : ""}>
            <b>{guideStep > 1 ? "✓" : "1"}</b>
            <span>光るものへ歩く</span>
          </li>
          <li className={guideStep >= 2 ? "is-active" : ""}>
            <b>{guideStep > 2 ? "✓" : "2"}</b>
            <span>材料を集める</span>
          </li>
          <li className={guideStep >= 3 ? "is-active" : ""}>
            <b>{guideStep > 3 ? "✓" : "3"}</b>
            <span>家具を作って置く</span>
          </li>
        </ol>
      </aside>

      {hint && !isPaused && (
        <div className="interaction-hint">
          <kbd>E</kbd>
          <div>
            <strong>{hint.action}</strong>
            <span>{hint.label}</span>
          </div>
        </div>
      )}

      {placementMode && (
        <section
          className={`placement-hud ${
            placementPreview?.valid ? "is-valid" : "is-invalid"
          }`}
          aria-label="家具配置"
        >
          <div>
            <p>家具をならべる</p>
            <h2>{ITEMS[placementMode.type].name}</h2>
            <strong>
              {placementPreview?.reason ?? "置ける場所をさがしています"}
            </strong>
          </div>
          <div className="placement-actions">
            <button onClick={rotatePlacementPreview}>
              <kbd>R</kbd> 90°まわす
            </button>
            <button
              className="placement-confirm"
              disabled={!placementPreview?.valid}
              onClick={() => {
                if (placementPreview) confirmPlacement(placementPreview);
              }}
            >
              <kbd>E</kbd> ここに置く
            </button>
            {placementMode.editingId && (
              <button
                className="placement-remove"
                onClick={() =>
                  removePlacedFurniture(placementMode.editingId as string)
                }
              >
                <kbd>X</kbd> バッグへ
              </button>
            )}
            <button onClick={cancelPlacement}>
              <kbd>Esc</kbd> やめる
            </button>
          </div>
          <small>矢印キーで歩くと、家具もいっしょに動きます。</small>
        </section>
      )}

      <nav className="game-tools" aria-label="ゲームメニュー">
        <button
          className={panel === "inventory" ? "is-active" : ""}
          onClick={() => {
            setPlacementMode(null);
            setPlacementPreview(null);
            setPanel(panel === "inventory" ? null : "inventory");
          }}
        >
          <span className="tool-icon tool-icon--bag" aria-hidden="true" />
          <span>バッグ</span>
          <kbd>I</kbd>
        </button>
        <button
          className={panel === "craft" ? "is-active" : ""}
          onClick={() => {
            setPlacementMode(null);
            setPlacementPreview(null);
            setPanel(panel === "craft" ? null : "craft");
          }}
        >
          <span className="tool-icon tool-icon--hammer" aria-hidden="true" />
          <span>つくる</span>
          <kbd>C</kbd>
        </button>
        <button
          className={panel === "quests" ? "is-active" : ""}
          onClick={() => {
            setPlacementMode(null);
            setPlacementPreview(null);
            setPanel(panel === "quests" ? null : "quests");
          }}
        >
          <span className="tool-icon tool-icon--note" aria-hidden="true" />
          <span>おねがい</span>
          <kbd>Q</kbd>
        </button>
      </nav>

      <div className="fps-indicator" aria-label={`${fps} FPS`}>
        {fps || "—"} FPS
      </div>

      {panel && (
        <div className="panel-scrim" onMouseDown={() => setPanel(null)}>
          <section
            className="game-panel"
            onMouseDown={(event) => event.stopPropagation()}
            aria-label={
              panel === "inventory"
                ? "バッグ"
                : panel === "craft"
                  ? "クラフト"
                  : panel === "quests"
                    ? "お願い"
                    : "メニュー"
            }
          >
            <button className="panel-close" onClick={() => setPanel(null)}>
              閉じる
            </button>
            {panel === "inventory" && (
              <InventoryPanel
                state={state}
                onPlace={beginPlacement}
              />
            )}
            {panel === "craft" && (
              <CraftPanel state={state} onCraft={craft} />
            )}
            {panel === "quests" && <QuestPanel state={state} />}
            {panel === "menu" && (
              <MenuPanel
                onSave={manualSave}
                onHelp={() => setTutorialOpen(true)}
                onTitle={returnToTitle}
              />
            )}
          </section>
        </div>
      )}

      {tutorialOpen && (
        <div className="modal-scrim">
          <section className="tutorial-modal">
            <p className="eyebrow">WELCOME TO LUMI ISLAND</p>
            <h2>島の暮らしは、3つだけ。</h2>
            <div className="tutorial-steps">
              <article>
                <b>01</b>
                <h3>歩いて、見つける</h3>
                <p>WASDか矢印で歩こう。光るものの近くでE。</p>
              </article>
              <article>
                <b>02</b>
                <h3>集めて、つくる</h3>
                <p>木や石を集めたら、Cで家具をつくれる。</p>
              </article>
              <article>
                <b>03</b>
                <h3>置いて、つながる</h3>
                <p>家具を置いて、島のみんなのお願いをかなえよう。</p>
              </article>
            </div>
            <button
              className="primary-button tutorial-start"
              onClick={() => {
                setTutorialOpen(false);
                setPanel(null);
                playSound("ui");
              }}
            >
              島を歩いてみる
            </button>
          </section>
        </div>
      )}

      {dialogResident && (
        <div className="dialog-wrap">
          <section className="resident-dialog">
            <div className={`resident-portrait resident-portrait--${dialogResident}`}>
              <span />
            </div>
            <div>
              <p className="dialog-name">{dialogResident}</p>
              <p>{RESIDENT_COPY[dialogResident].greeting}</p>
              <p>{RESIDENT_COPY[dialogResident].help}</p>
            </div>
            <button
              onClick={() => {
                setDialogResident(null);
                playSound("ui");
              }}
            >
              またね
            </button>
          </section>
        </div>
      )}

      {toast && (
        <div
          key={toast.id}
          className={`toast ${toast.tone === "success" ? "toast--success" : ""}`}
          role="status"
        >
          <span aria-hidden="true" />
          {toast.message}
        </div>
      )}
    </main>
  );
}

function InventoryPanel({
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

function CraftPanel({
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
          const available = canCraft(state, recipe.id);
          return (
            <article key={recipe.id} className={available ? "can-craft" : ""}>
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
                {available ? "つくる" : "材料まち"}
              </button>
            </article>
          );
        })}
      </div>
    </>
  );
}

function QuestPanel({ state }: { state: GameState }) {
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

function MenuPanel({
  onSave,
  onHelp,
  onTitle,
}: {
  onSave: () => void;
  onHelp: () => void;
  onTitle: () => void;
}) {
  return (
    <>
      <header className="panel-heading">
        <p className="eyebrow">PAUSE</p>
        <h2>ひと休み</h2>
        <span>ゲームは止まっています</span>
      </header>
      <div className="menu-list">
        <button onClick={onSave}>
          <strong>セーブする</strong>
          <span>いまの島のようすを、この端末に保存</span>
        </button>
        <button onClick={onHelp}>
          <strong>遊びかた</strong>
          <span>歩く・集める・作るをもう一度見る</span>
        </button>
        <button onClick={onTitle}>
          <strong>タイトルにもどる</strong>
          <span>もどる前に自動でセーブします</span>
        </button>
      </div>
    </>
  );
}
