"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { ITEMS } from "@/src/data/gameData";
import type { ResourceId } from "@/src/game/types";
import type { ActivityResult } from "@/src/activities/ActivityResult";
import {
  judgeTiming,
  timingConfig,
  timingProgress,
} from "@/src/gathering/TimingGatheringGame";
import {
  createWoodGathering,
  recordWoodHit,
  woodReward,
} from "@/src/gathering/WoodGatheringGame";
import {
  chooseRockCrack,
  createRockCracks,
} from "@/src/gathering/RockGatheringGame";
import {
  discoverForage,
  type ForageResource,
} from "@/src/gathering/ForagingSystem";
import {
  advanceFishingJourney,
  castFishingLine,
  createFishingJourney,
  pullFishingLine,
} from "@/src/fishing/FishingJourneyGame";
import { resolveFishing } from "@/src/fishing/FishingSystem";
import { playSound } from "@/src/audio/FileAudioSystem";
import {
  activityInputIntent,
  nextChoiceIndex,
} from "@/src/activities/ActivityInputController";

export interface ActivityRequest {
  kind: "wood" | "stone" | "forage" | "fishing";
  item: ResourceId;
  sourceId: string;
}

export function ActivityOverlayPhase21({
  request,
  easyMode,
  day,
  discoveredIds,
  onResolve,
  onCancel,
}: {
  request: ActivityRequest;
  easyMode: boolean;
  day: number;
  discoveredIds: readonly string[];
  onResolve: (result: ActivityResult) => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusPreferred = () => {
      const preferred = dialog.querySelector<HTMLElement>(
        "[data-initial-focus]:not(:disabled), [data-activity-primary]:not(:disabled), [data-activity-confirm]:not(:disabled)",
      );
      (preferred ?? dialog).focus();
    };
    const focusIfNeeded = () => {
      if (!dialog.contains(document.activeElement)) focusPreferred();
    };
    const frame = requestAnimationFrame(focusIfNeeded);
    const observer = new MutationObserver(focusIfNeeded);
    observer.observe(dialog, { attributes: true, childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleDialogKey = (event: KeyboardEvent) => {
      if (event.code === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        playSound("cancel");
        onCancel();
        return;
      }
      if (event.code !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "button:not(:disabled), [tabindex]:not([tabindex='-1'])",
        ),
      );
      if (focusable.length === 0) {
        dialog.focus();
        return;
      }
      const currentIndex = focusable.findIndex(
        (element) => element === document.activeElement,
      );
      const direction = event.shiftKey ? -1 : 1;
      const nextIndex =
        currentIndex < 0
          ? 0
          : (currentIndex + direction + focusable.length) % focusable.length;
      focusable[nextIndex]?.focus();
    };
    window.addEventListener("keydown", handleDialogKey, true);
    return () => window.removeEventListener("keydown", handleDialogKey, true);
  }, [onCancel]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    const intent = activityInputIntent(event.code, event.repeat);
    if (!intent) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (intent === "tab") {
      event.preventDefault();
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "button:not(:disabled), [tabindex]:not([tabindex='-1'])",
        ),
      );
      if (focusable.length === 0) {
        dialog.focus();
        return;
      }
      const currentIndex = focusable.findIndex(
        (element) => element === document.activeElement,
      );
      const direction = event.shiftKey ? -1 : 1;
      const nextIndex =
        currentIndex < 0
          ? 0
          : (currentIndex + direction + focusable.length) % focusable.length;
      focusable[nextIndex]?.focus();
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
    if (intent === "cancel") {
      playSound("cancel");
      onCancel();
      return;
    }

    const choices = Array.from(
      dialog.querySelectorAll<HTMLButtonElement>(
        "[data-activity-choice]:not(:disabled)",
      ),
    );
    if (intent === "previous" || intent === "next") {
      if (choices.length === 0) return;
      const activeIndex = Math.max(
        0,
        choices.findIndex((choice) => choice === document.activeElement),
      );
      choices[nextChoiceIndex(activeIndex, intent, choices.length)]?.focus();
      return;
    }

    const activeChoice = choices.find(
      (choice) => choice === document.activeElement,
    );
    const target =
      intent === "confirm"
        ? dialog.querySelector<HTMLButtonElement>(
            "[data-activity-confirm]:not(:disabled)",
          ) ??
          activeChoice ??
          dialog.querySelector<HTMLButtonElement>(
            "[data-activity-primary]:not(:disabled)",
          )
        : activeChoice ??
          dialog.querySelector<HTMLButtonElement>(
            "[data-activity-primary]:not(:disabled)",
          );
    target?.click();
  };

  return (
    <div className="activity-scrim" role="presentation">
      <section
        ref={dialogRef}
        className={`activity-card activity-card--${request.kind}`}
        aria-modal="true"
        role="dialog"
        tabIndex={-1}
        aria-label={`${ITEMS[request.item].name}のミニゲーム`}
        data-testid={`activity-${request.kind}`}
        onKeyDownCapture={handleKeyDown}
      >
        <button className="activity-close" onClick={onCancel} aria-label="やめる">
          ×
        </button>
        {easyMode && <span className="easy-badge">やさしい表示</span>}
        {request.kind === "wood" && (
          <WoodPanel request={request} easyMode={easyMode} onResolve={onResolve} />
        )}
        {request.kind === "stone" && (
          <RockPanel request={request} easyMode={easyMode} onResolve={onResolve} />
        )}
        {request.kind === "forage" && (
          <ForagePanel
            request={request}
            day={day}
            discoveredIds={discoveredIds}
            onResolve={onResolve}
          />
        )}
        {request.kind === "fishing" && (
          <FishingPanel request={request} easyMode={easyMode} onResolve={onResolve} />
        )}
      </section>
    </div>
  );
}

function WoodPanel({
  request,
  easyMode,
  onResolve,
}: {
  request: ActivityRequest;
  easyMode: boolean;
  onResolve: (result: ActivityResult) => void;
}) {
  const timing = useMemo(() => timingConfig("wood", easyMode), [easyMode]);
  const [game, setGame] = useState(createWoodGathering);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const roundStartedAt = useRef(0);

  useEffect(() => {
    if (!roundStartedAt.current) roundStartedAt.current = performance.now();
    if (finished) return;
    const timer = window.setInterval(
      () => setElapsed((performance.now() - roundStartedAt.current) / 1000),
      32,
    );
    return () => window.clearInterval(timer);
  }, [finished]);

  const hit = () => {
    if (finished) return;
    const grade = judgeTiming(
      timingProgress(elapsed, timing.durationSeconds),
      timing.window,
    );
    const next = recordWoodHit(game, grade);
    playSound("chop");
    setGame(next);
    setElapsed(0);
    roundStartedAt.current = performance.now();
    if (next.hits.length >= next.requiredHits) setFinished(true);
  };

  const reward = finished ? woodReward(game) : null;
  return (
    <>
      <p className="eyebrow">WOOD RHYTHM</p>
      <h2>トン・トン・トン！</h2>
      <p className="activity-instruction">
        {easyMode ? "みどりで 3かい おそう。" : "光がみどりに来たら、3回たたこう。"}
      </p>
      <div className="wood-hit-count" aria-label={`${game.hits.length} / 3回`}>
        {[0, 1, 2].map((index) => (
          <span key={index} className={game.hits[index] ? `is-${game.hits[index]}` : ""}>
            {game.hits[index] ? "✓" : index + 1}
          </span>
        ))}
      </div>
      {!finished ? (
        <>
          <TimingTrack elapsed={elapsed} activity="wood" easyMode={easyMode} />
          <button
            className="activity-action"
            data-activity-primary
            data-initial-focus
            onClick={hit}
          >
            {easyMode ? "たたく！" : <><kbd>E</kbd> たたく！</>}
          </button>
        </>
      ) : (
        <Result
          title={reward?.grade === "excellent" ? "ぜんぶ ぴったり！" : "木が よろこんだ！"}
          message={`木のえだを ${reward?.amount ?? 1}こ 集めた`}
          onDone={() =>
            onResolve({
              activityType: "wood",
              sourceId: request.sourceId,
              grade: reward?.grade ?? "normal",
              rewardItems: [{ itemId: "wood", quantity: reward?.amount ?? 1 }],
              message: `木のえだを ${reward?.amount ?? 1}こ集めた`,
            })
          }
        />
      )}
    </>
  );
}

function TimingTrack({
  elapsed,
  activity,
  easyMode,
}: {
  elapsed: number;
  activity: "wood";
  easyMode: boolean;
}) {
  const timing = timingConfig(activity, easyMode);
  const progress = timingProgress(elapsed, timing.durationSeconds);
  return (
    <div className="timing-track" aria-label="木のタイミングゲージ">
      <span
        className="timing-good"
        style={{
          left: `${timing.window.goodStart * 100}%`,
          width: `${(timing.window.goodEnd - timing.window.goodStart) * 100}%`,
        }}
      />
      <span
        className="timing-great"
        style={{
          left: `${timing.window.greatStart * 100}%`,
          width: `${(timing.window.greatEnd - timing.window.greatStart) * 100}%`,
        }}
      />
      <b style={{ left: `${progress * 100}%` }} />
    </div>
  );
}

function RockPanel({
  request,
  easyMode,
  onResolve,
}: {
  request: ActivityRequest;
  easyMode: boolean;
  onResolve: (result: ActivityResult) => void;
}) {
  const cracks = useMemo(() => createRockCracks(request.sourceId), [request.sourceId]);
  const [selected, setSelected] = useState(0);
  const [choice, setChoice] = useState<ReturnType<typeof chooseRockCrack> | null>(null);
  return (
    <>
      <p className="eyebrow">ROCK LISTENING</p>
      <h2>{easyMode ? "いちばん ひかる ひびは？" : "強く光る ひびを見つけよう"}</h2>
      <p className="activity-instruction">3つの ひびから ひとつ えらぼう。</p>
      <div className="rock-cracks" role="group" aria-label="石のひび">
        {cracks.map((crack) => (
          <button
            className={selected === crack.id ? "is-selected" : ""}
            data-activity-choice
            data-initial-focus={crack.id === 0 ? "" : undefined}
            tabIndex={selected === crack.id ? 0 : -1}
            aria-pressed={selected === crack.id}
            onFocus={() => setSelected(crack.id)}
            key={crack.id}
            style={{ "--crack-strength": crack.strength } as React.CSSProperties}
            disabled={choice !== null}
            onClick={() => {
              setSelected(crack.id);
              setChoice(chooseRockCrack(cracks, crack.id));
              playSound("tap");
            }}
            aria-label={`ひび ${crack.id + 1}`}
          >
            <i />
            <span>{crack.id + 1}</span>
          </button>
        ))}
      </div>
      {choice && (
        <Result
          title={choice.correct ? "ここだ！" : "おしい！ でも見つけた"}
          message={`石を ${choice.amount}こ 集めた`}
          onDone={() =>
            onResolve({
              activityType: "rock",
              sourceId: request.sourceId,
              grade: choice.grade,
              rewardItems: [{ itemId: "stone", quantity: choice.amount }],
              message: `石を ${choice.amount}こ集めた`,
            })
          }
        />
      )}
    </>
  );
}

function ForagePanel({
  request,
  day,
  discoveredIds,
  onResolve,
}: {
  request: ActivityRequest;
  day: number;
  discoveredIds: readonly string[];
  onResolve: (result: ActivityResult) => void;
}) {
  const discovery = discoverForage(
    request.item as ForageResource,
    request.sourceId,
    day,
  );
  const alreadyDiscovered = discoveredIds.includes(discovery.discoveryId);
  return (
    <>
      <p className="eyebrow">LITTLE DISCOVERY</p>
      <h2>{alreadyDiscovered ? "また 見つけた！" : "はじめて 見つけた！"}</h2>
      <div className="discovery-orb" aria-hidden="true">✿</div>
      <div className="discovery-copy">
        <h3><ruby>{discovery.title}<rt>{discovery.reading}</rt></ruby></h3>
        <p>{discovery.note}</p>
      </div>
      <button
        className="activity-action"
        data-activity-primary
        data-initial-focus
        onClick={() => {
          playSound(request.item === "shell" ? "pickup" : "rustle");
          onResolve({
            activityType: "forage",
            sourceId: request.sourceId,
            grade: "good",
            rewardItems: [{ itemId: discovery.item, quantity: discovery.amount }],
            discoveryId: discovery.discoveryId,
            message: `${discovery.title}を ${discovery.amount}こ見つけた`,
          });
        }}
      >
        そっと ひろう
      </button>
    </>
  );
}

function FishingPanel({
  request,
  easyMode,
  onResolve,
}: {
  request: ActivityRequest;
  easyMode: boolean;
  onResolve: (result: ActivityResult) => void;
}) {
  const [journey, setJourney] = useState(() => createFishingJourney(easyMode));
  const [selectedTarget, setSelectedTarget] = useState(journey.shadow);
  const fish = useMemo(() => resolveFishing({ phase: "caught", elapsed: 0, biteAt: 0, biteWindow: 1 }), []);

  useEffect(() => {
    if (!["waiting", "nibble", "bite"].includes(journey.phase)) return;
    const timer = window.setInterval(() => {
      setJourney((current) => {
        const next = advanceFishingJourney(current, 0.05);
        if (current.phase !== "bite" && next.phase === "bite") playSound("bite");
        return next;
      });
    }, 50);
    return () => window.clearInterval(timer);
  }, [journey.phase]);

  const restartFishing = () => {
    const next = createFishingJourney(easyMode);
    setJourney(next);
    setSelectedTarget(next.shadow);
  };

  if (journey.phase === "aim") {
    return (
      <>
        <p className="eyebrow">FISHING · 1</p>
        <h2>魚の かげへ なげよう</h2>
        <div className="fish-shadows" role="group" aria-label="魚影をえらぶ">
          {[0, 1, 2].map((target) => (
            <button
              key={target}
              data-activity-choice
              data-initial-focus={target === journey.shadow ? "" : undefined}
              tabIndex={target === selectedTarget ? 0 : -1}
              aria-pressed={target === selectedTarget}
              onFocus={() => setSelectedTarget(target)}
              className={`${target === journey.shadow ? "has-shadow" : ""} ${target === selectedTarget ? "is-selected" : ""}`.trim()}
              onClick={() => {
                setSelectedTarget(target);
                setJourney((current) => castFishingLine(current, target));
                playSound("splash");
              }}
              aria-label={`水面 ${target + 1}`}
            >
              <i>{target === journey.shadow ? "◀" : "≈"}</i>
            </button>
          ))}
        </div>
      </>
    );
  }
  if (journey.phase === "missed") {
    return (
      <>
        <p className="eyebrow">FISHING</p>
        <h2>だいじょうぶ！</h2>
        <p className="activity-instruction">魚は まだいるよ。すぐに もう一度できるよ。</p>
        <button
          className="activity-action"
          data-activity-primary
          data-initial-focus
          onClick={restartFishing}
        >
          もういちど
        </button>
      </>
    );
  }
  if (journey.phase === "caught" && fish.fish) {
    return (
      <>
        <p className="eyebrow">NEW CATCH</p>
        <h2>つれた！</h2>
        <div className="fish-silhouette" aria-hidden="true">◀●</div>
        <div className="discovery-copy">
          <h3><ruby>{fish.fish.name}<rt>{fish.fish.reading}</rt></ruby></h3>
          <p>{fish.fish.discovery}</p>
        </div>
        <button
          data-activity-confirm
          data-initial-focus
          className="activity-action"
          onClick={() => {
            playSound("catch");
            onResolve({
              activityType: "fishing",
              sourceId: request.sourceId,
              grade: "good",
              rewardItems: [{ itemId: "fish", quantity: 1 }],
              fishId: fish.fish?.id,
              message: `${fish.fish?.name}を つった！`,
            });
          }}
        >
          つづける
        </button>
      </>
    );
  }
  const pull = () => {
    if (journey.phase !== "bite" && journey.phase !== "reeling") return;
    setJourney((current) => pullFishingLine(current));
  };
  return (
    <>
      <p className="eyebrow">FISHING · 2</p>
      <h2>
        {journey.phase === "bite"
          ? "いま！ ひいて！"
          : journey.phase === "reeling"
            ? "もういちど ひこう！"
            : journey.phase === "nibble"
              ? "コト… まだ まとう"
              : "しずかに まとう…"}
      </h2>
      <div className={`fishing-water is-${journey.phase}`}>
        <span className="fishing-line" />
        <span className="fishing-bobber" />
        <i />
        <i />
      </div>
      <p className="activity-instruction">
        {journey.phase === "nibble"
          ? "小さな ゆれは まだだよ。"
          : journey.phase === "bite" || journey.phase === "reeling"
            ? "水が大きく光ったら ひこう！"
            : "うきが しずむまで まってね。"}
      </p>
      <button
        data-activity-primary
        data-initial-focus
        className="activity-action"
        disabled={journey.phase !== "bite" && journey.phase !== "reeling"}
        onClick={pull}
      >
        {easyMode ? "ひく！" : <><kbd>E</kbd> ひく！</>}
      </button>
    </>
  );
}

function Result({
  title,
  message,
  onDone,
}: {
  title: string;
  message: string;
  onDone: () => void;
}) {
  return (
    <div className="activity-result">
      <span aria-hidden="true">✦</span>
      <h3>{title}</h3>
      <p>{message}</p>
      <button
        className="activity-action"
        data-activity-confirm
        data-initial-focus
        onClick={onDone}
      >
        バッグに いれる
      </button>
    </div>
  );
}
