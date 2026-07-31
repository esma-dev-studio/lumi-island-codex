"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ITEMS, QUEST_ORDER, QUESTS } from "@/src/data/gameData";
import {
  advanceTimeWhileRunning,
  craftItem,
  createInitialState,
  moveFurniture,
  placeFurniture,
  removeFurniture,
} from "@/src/game/gameState";
import type {
  FurnitureId,
  GameState,
  ResidentId,
} from "@/src/game/types";
import { configureAudio, playSound, preloadAudio } from "@/src/audio/FileAudioSystem";
import {
  clearSave,
  hasSave,
  loadGame,
  saveGame,
} from "@/src/save/SaveSystem";
import { TitleScreen } from "@/src/ui/TitleScreen";
import { ResidentDialog } from "@/src/ui/ResidentDialog";
import { GameHud, type HudPanel } from "@/src/ui/GameHud";
import { CraftPanel, InventoryPanel, QuestPanel } from "@/src/ui/GamePanels";
import { MainMenu } from "@/src/ui/MainMenu";
import { IslandBuildingPanel } from "@/src/ui/IslandBuildingPanel";
import { SettingsPanel } from "@/src/ui/SettingsPanel";
import type { InteractionHint } from "@/src/scenes/IslandScene";
import {
  rotatePlacement,
  type PlacementMode,
  type PlacementPreview,
} from "@/src/placement/PlacementController";
import {
  ActivityOverlayPhase21,
  type ActivityRequest,
} from "@/src/ui/minigames/ActivityOverlayPhase21";
import type { ActivityResult } from "@/src/activities/ActivityResult";
import { settleActivityResult } from "@/src/activities/ActivitySettlement";
import { tickResourceStates } from "@/src/resources/ResourceStateSystem";
import { CollectionPanel } from "@/src/collection/CollectionPanel";
import {
  applyTutorialEventToState,
  resetTutorial,
} from "@/src/tutorial/TutorialSystem";
import { TutorialOverlay } from "@/src/tutorial/TutorialOverlay";
import {
  TUTORIAL_RESIDENT_ID,
  TUTORIAL_STEPS,
  TUTORIAL_TREE_SOURCE_ID,
} from "@/src/tutorial/TutorialSteps";
import { easyModeSettings } from "@/src/accessibility/EasyModeSettings";
import { spendLumen } from "@/src/economy/EconomySystem";
import {
  applyNollaFurnitureBond,
  befriendResident,
  canGiveNollaWood,
  giveNollaWood,
} from "@/src/progression/FriendshipSystem";

const CharacterShowcase = dynamic(
  () =>
    import("@/src/ui/CharacterShowcasePhase2").then(
      (module) => module.CharacterShowcasePhase2,
    ),
  { ssr: false },
);
const GameCanvas = dynamic(
  () => import("@/src/ui/GameCanvas").then((module) => module.GameCanvas),
  { ssr: false },
);

type Screen = "title" | "showcase" | "game";
type Panel = HudPanel;

interface Toast {
  id: number;
  message: string;
  tone: "normal" | "success";
  action?: "collection";
}

export function LumiIslandApp() {
  const [screen, setScreen] = useState<Screen>("title");
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [canContinue, setCanContinue] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [dialogResident, setDialogResident] = useState<ResidentId | null>(null);
  const [dialogLine, setDialogLine] = useState(0);
  const [tutorialHidden, setTutorialHidden] = useState(false);
  const [hint, setHint] = useState<InteractionHint | null>(null);
  const [, setFps] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);
  const [activity, setActivity] = useState<ActivityRequest | null>(null);
  const [pendingActivityResult, setPendingActivityResult] =
    useState<ActivityResult | null>(null);
  const [placementMode, setPlacementMode] =
    useState<PlacementMode | null>(null);
  const [placementPreview, setPlacementPreview] =
    useState<PlacementPreview | null>(null);
  const [cameraResetToken, setCameraResetToken] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowDebug(new URLSearchParams(window.location.search).has("debug"));
      setCanContinue(hasSave());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    configureAudio(state.audioSettings);
  }, [state.audioSettings]);

  const notify = useCallback(
    (
      message: string,
      tone: Toast["tone"] = "normal",
      action?: Toast["action"],
    ) => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ id: Date.now(), message, tone, action });
      toastTimer.current = setTimeout(
        () => setToast(null),
        action ? 6000 : 2300,
      );
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
  const easySettings = useMemo(
    () => easyModeSettings(state.easyMode),
    [state.easyMode],
  );
  const tutorialActive = state.tutorialProgress.step < TUTORIAL_STEPS.length;
  const tutorialVisible = tutorialActive && !tutorialHidden;
  const tutorialGuideTarget = useMemo(() => {
    if (!easySettings.guideGlow || !tutorialVisible) return null;
    if (state.tutorialProgress.step === 1 || state.tutorialProgress.step === 2) {
      return { sourceId: TUTORIAL_TREE_SOURCE_ID };
    }
    if (state.tutorialProgress.step === 6) {
      return { resident: TUTORIAL_RESIDENT_ID };
    }
    return null;
  }, [
    easySettings.guideGlow,
    state.tutorialProgress.step,
    tutorialVisible,
  ]);

  const isPaused = panel !== null || dialogResident !== null || activity !== null;

  useEffect(() => {
    if (screen !== "game" || isPaused) return;
    const timer = window.setInterval(() => {
      setState((current) => {
        const advanced = advanceTimeWhileRunning(current, 3, false);
        const playSeconds = advanced.playSeconds + 1;
        return {
          ...advanced,
          playSeconds,
          resourceStates: tickResourceStates(advanced.resourceStates, playSeconds),
        };
      });
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
      if (activity !== null || pendingActivityResult !== null) return;
      if (event.code === "Tab" || event.code === "KeyI") {
        event.preventDefault();
        setPlacementMode(null);
        setPlacementPreview(null);
        setState((current) =>
          applyTutorialEventToState(current, { type: "inventory" }),
        );
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
        setPanel((current) => (current === null ? "menu" : null));
        playSound("ui");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activity, notify, pendingActivityResult, placementMode, screen]);

  const startNewGame = () => {
    clearSave();
    setState(createInitialState());
    setPanel(null);
    setDialogResident(null);
    setActivity(null);
    setTutorialHidden(false);
    setDialogLine(0);
    setPlacementMode(null);
    setPlacementPreview(null);
    preloadAudio();
    setScreen("game");
    playSound("ui");
  };

  const continueGame = () => {
    const loaded = loadGame();
    setState(loaded ?? createInitialState());
    setPanel(null);
    setActivity(null);
    setTutorialHidden(false);
    setDialogLine(0);
    setDialogResident(null);
    setPlacementMode(null);
    setPlacementPreview(null);
    setScreen("game");
    playSound("ui");
  };

  const focusGameCanvas = useCallback(() => {
    requestAnimationFrame(() => {
      document
        .querySelector<HTMLCanvasElement>("canvas.game-canvas")
        ?.focus();
    });
  }, []);

  const queueActivityResult = useCallback((result: ActivityResult) => {
    setActivity(null);
    setHint(null);
    setPendingActivityResult(result);
    focusGameCanvas();
  }, [focusGameCanvas]);

  const beginActivity = useCallback((nextActivity: ActivityRequest) => {
    setHint(null);
    setActivity(nextActivity);
  }, []);

  const cancelActivity = useCallback(() => {
    setActivity(null);
    setHint(null);
    focusGameCanvas();
  }, [focusGameCanvas]);

  const settleActivity = useCallback(
    (result: ActivityResult) => {
      setState((current) => {
        const settlement = settleActivityResult(current, result);
        notify(
          settlement.message,
          "success",
          settlement.collectionAction ? "collection" : undefined,
        );
        playSound(settlement.sound);
        return settlement.state;
      });
      setHint(null);
      setPendingActivityResult(null);
    },
    [notify],
  );

  const craft = (item: FurnitureId) => {
    setState((current) => {
      if (!current.unlockedRecipes.includes(item)) {
        notify("この作り方は まだ おぼえていないよ");
        playSound("ui");
        return current;
      }
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
      return applyTutorialEventToState(result.state, { type: "craft", item });
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
          if (!moved.ok) return moved.state;
          const bond = applyNollaFurnitureBond(
            moved.state,
            mode.type,
            preview.position,
          );
          notify(
            bond.message ?? `${ITEMS[mode.type].name}を うごかした`,
            bond.increased ? "success" : "normal",
          );
          playSound(bond.increased ? "quest" : "place");
          return bond.state;
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
        const tutorialState = applyTutorialEventToState(result.state, {
          type: "place",
          item: mode.type,
        });
        const bond = applyNollaFurnitureBond(
          tutorialState,
          mode.type,
          preview.position,
        );
        if (bond.increased && bond.message) notify(bond.message, "success");
        playSound(completed || bond.increased ? "quest" : "place");
        return bond.state;
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


  const talk = useCallback((resident: ResidentId) => {
    setDialogResident(resident);
    setDialogLine(0);
    setState((current) => {
      const friendship = befriendResident(current, resident);
      if (friendship.increased) {
        notify(`${resident}と なかよし ${friendship.level}/3に なった！`, "success");
      }
      return applyTutorialEventToState(friendship.state, {
        type: "talk",
        resident,
      });
    });
    playSound("ui");
  }, [notify]);

  const updatePlayerPosition = useCallback(
    (position: { x: number; z: number }) => {
      setState((current) => {
        const distance = Math.hypot(
          position.x - current.playerPosition.x,
          position.z - current.playerPosition.z,
        );
        return applyTutorialEventToState(
          { ...current, playerPosition: position },
          { type: "move", distance },
        );
      });
    },
    [],
  );

  const updateHint = useCallback((nextHint: InteractionHint | null) => {
    setHint(nextHint);
    if (nextHint) {
      setState((current) =>
        applyTutorialEventToState(current, {
          type: "hint",
          sourceId: nextHint.sourceId,
          item: nextHint.item,
          resident: nextHint.resident,
        }),
      );
    }
  }, []);

  const buyIslandUpgrade = (use: Parameters<typeof spendLumen>[1]) => {
    setState((current) => {
      const result = spendLumen(current, use);
      notify(result.message, result.ok ? "success" : "normal");
      playSound(result.ok ? "quest" : "ui");
      return result.state;
    });
  };
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
        showShowcase={showDebug && process.env.NODE_ENV !== "production"}
      />
    );
  }

  return (
    <main className={`game-screen ${state.easyMode ? "is-easy" : ""}`}>
      <GameCanvas
        state={state}
        paused={isPaused}
        placementMode={placementMode}
        tutorialGuideTarget={tutorialGuideTarget}
        pendingActivityResult={pendingActivityResult}
        cameraResetToken={cameraResetToken}
        onHint={updateHint}
        onActivity={beginActivity}
        onActivitySettled={settleActivity}
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

      <GameHud
        state={state}
        activeQuestId={activeQuestId}
        tutorialVisible={tutorialVisible}
        hint={hint}
        paused={isPaused}
        pendingReward={pendingActivityResult !== null}
        panel={panel}
        showKeyboardLetters={easySettings.showKeyboardLetters}
        onOpenMenu={() => {
          setPlacementMode(null);
          setPlacementPreview(null);
          setPanel("menu");
        }}
        onToggleInventory={() => {
          setPlacementMode(null);
          setPlacementPreview(null);
          setPanel(panel === "inventory" ? null : "inventory");
          setState((current) =>
            applyTutorialEventToState(current, { type: "inventory" }),
          );
        }}
        onToggleCraft={() => {
          setPlacementMode(null);
          setPlacementPreview(null);
          setPanel(panel === "craft" ? null : "craft");
        }}
      />
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

      {panel && (
        <div className="panel-scrim" onMouseDown={() => setPanel(null)}>
          <section
            className={`game-panel game-panel--${panel}`}
            onMouseDown={(event) => event.stopPropagation()}
            aria-label={
              panel === "inventory"
                ? "バッグ"
                : panel === "craft"
                  ? "クラフト"
                  : panel === "quests"
                    ? "お願い"
                    : panel === "collection"
                      ? "島の図かん"
                      : panel === "building"
                        ? "島づくり"
                        : panel === "settings"
                          ? "せってい"
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
            {panel === "collection" && <CollectionPanel counts={state.collectionCounts} easyMode={state.easyMode} />}
            {panel === "quests" && <QuestPanel state={state} />}
            {panel === "menu" && (
              <MainMenu
                state={state}
                onOpenInventory={() => setPanel("inventory")}
                onOpenCollection={() => setPanel("collection")}
                onOpenBuilding={() => setPanel("building")}
                onOpenSettings={() => setPanel("settings")}
              />
            )}
            {panel === "building" && (
              <IslandBuildingPanel
                state={state}
                onSpendLumen={buyIslandUpgrade}
                onOpenCraft={() => setPanel("craft")}
                onOpenQuests={() => setPanel("quests")}
              />
            )}
            {panel === "settings" && (
              <SettingsPanel
                state={state}
                tutorialActive={tutorialActive}
                tutorialHidden={tutorialHidden}
                onSave={manualSave}
                onResumeTutorial={() => {
                  setTutorialHidden(false);
                  setPanel(null);
                }}
                onRestartTutorial={() => {
                  setState((current) => ({
                    ...current,
                    tutorialStep: 0,
                    tutorialProgress: resetTutorial(),
                  }));
                  setTutorialHidden(false);
                  setPanel(null);
                }}
                onCameraReset={() => {
                  setCameraResetToken((value) => value + 1);
                  setPanel(null);
                }}
                onTitle={returnToTitle}
                onEasyMode={(easyMode) =>
                  setState((current) => ({ ...current, easyMode }))
                }
                onAudioSettings={(audioSettings) =>
                  setState((current) => ({ ...current, audioSettings }))
                }
              />
            )}
          </section>
        </div>
      )}

      {tutorialVisible &&
        (panel === null || panel === "inventory" || panel === "craft") && (
        <TutorialOverlay
          progress={state.tutorialProgress}
          easyMode={state.easyMode}
          onHide={() => setTutorialHidden(true)}
          onQuit={() => {
            setState((current) => ({
              ...current,
              tutorialStep: TUTORIAL_STEPS.length,
              tutorialProgress: {
                ...current.tutorialProgress,
                step: TUTORIAL_STEPS.length,
              },
            }));
            setTutorialHidden(false);
          }}
        />
      )}

      {activity && (
        <ActivityOverlayPhase21
          request={activity}
          easyMode={state.easyMode}
          day={state.day}
          discoveredIds={state.discoveredItems}
          onResolve={queueActivityResult}
          onCancel={cancelActivity}
        />
      )}

      {dialogResident && (
        <ResidentDialog
          resident={dialogResident}
          easyMode={state.easyMode}
          line={dialogLine}
          friendshipLevel={state.residentFriendship[dialogResident]}
          canGiveWood={dialogResident === "ノラ" && canGiveNollaWood(state)}
          nightGardenUnlocked={state.collectionMilestones.includes(75)}
          onGiveWood={() => {
            setState((current) => {
              const result = giveNollaWood(current);
              if (result.message) notify(result.message, result.increased ? "success" : "normal");
              playSound(result.increased ? "quest" : "ui");
              return result.state;
            });
            setDialogLine(0);
          }}
          onNext={() => {
            setDialogLine(1);
            playSound("ui");
          }}
          onClose={() => {
            if (dialogResident === "ノラ" && state.residentFriendship["ノラ"] >= 3) {
              setState((current) => ({ ...current, nollaMemorySeen: true }));
            }
            setDialogResident(null);
            playSound("ui");
          }}
        />
      )}

      {toast && (
        <div
          key={toast.id}
          className={`toast ${toast.tone === "success" ? "toast--success" : ""}`}
          role="status"
        >
          <span aria-hidden="true" />
          {toast.message}
          {toast.action === "collection" && (
            <button
              onClick={() => {
                setTutorialHidden(true);
                setPanel("collection");
                setToast(null);
              }}
            >
              ずかんを見る
            </button>
          )}
        </div>
      )}
    </main>
  );
}
