"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ITEMS } from "@/src/data/gameData";
import {
  gatheringReward,
  type GatheringReward,
} from "@/src/gathering/GatheringSystem";
import {
  discoverForage,
  type ForageDiscovery,
  type ForageResource,
} from "@/src/gathering/ForagingSystem";
import {
  judgeTiming,
  timingConfig,
  timingProgress,
  type TimingGrade,
} from "@/src/gathering/TimingGatheringGame";
import {
  advanceFishingGame,
  createFishingGame,
  tryCatchFish,
  type FishingGameState,
} from "@/src/fishing/FishingMiniGame";
import {
  resolveFishing,
  type FishingResult,
} from "@/src/fishing/FishingSystem";
import { playSound } from "@/src/audio/AudioSystem";
import type { ResourceId } from "@/src/game/types";

export interface ActivityRequest {
  kind: "wood" | "stone" | "forage" | "fishing";
  item: ResourceId;
  sourceId: string;
}

export interface ActivityCompletion {
  item: ResourceId;
  amount: number;
  bonusItem?: ResourceId;
  discoveryId?: string;
  fishId?: string;
  message: string;
}

interface ActivityOverlayProps {
  request: ActivityRequest;
  easyMode: boolean;
  day: number;
  alreadyDiscovered: boolean;
  onComplete: (completion: ActivityCompletion) => void;
  onCancel: () => void;
}

export function ActivityOverlay({
  request,
  easyMode,
  day,
  alreadyDiscovered,
  onComplete,
  onCancel,
}: ActivityOverlayProps) {
  const timing = useMemo(
    () =>
      request.kind === "wood" || request.kind === "stone"
        ? timingConfig(request.kind, easyMode)
        : null,
    [easyMode, request.kind],
  );
  const [elapsed, setElapsed] = useState(0);
  const [timingResult, setTimingResult] = useState<{
    grade: TimingGrade;
    reward: GatheringReward;
  } | null>(null);
  const [fishing, setFishing] = useState<FishingGameState>(() =>
    createFishingGame(easyMode),
  );
  const [fishResult, setFishResult] = useState<FishingResult | null>(null);

  const discovery = useMemo(
    () =>
      request.kind === "forage"
        ? discoverForage(request.item as ForageResource, request.sourceId, day)
        : null,
    [day, request],
  );

  useEffect(() => {
    if (!timing || timingResult) return;
    const startedAt = performance.now();
    const timer = window.setInterval(
      () => setElapsed((performance.now() - startedAt) / 1000),
      32,
    );
    return () => window.clearInterval(timer);
  }, [timing, timingResult]);

  useEffect(() => {
    if (request.kind !== "fishing" || fishResult) return;
    const timer = window.setInterval(() => {
      setFishing((current) => {
        const next = advanceFishingGame(current, 0.05);
        if (current.phase !== "bite" && next.phase === "bite") {
          playSound("bite");
        }
        return next;
      });
    }, 50);
    return () => window.clearInterval(timer);
  }, [fishResult, request.kind]);

  const finishTiming = useCallback(() => {
    if (!timing || timingResult) return;
    const progress = timingProgress(elapsed, timing.durationSeconds);
    const grade = judgeTiming(progress, timing.window);
    const reward = gatheringReward(
      request.kind as "wood" | "stone",
      grade,
    );
    setTimingResult({ grade, reward });
    playSound(request.kind === "wood" ? "chop" : "tap");
  }, [elapsed, request.kind, timing, timingResult]);

  const catchFish = useCallback(() => {
    if (fishResult || fishing.phase !== "bite") return;
    const next = tryCatchFish(fishing);
    const result = resolveFishing(next);
    setFishing(next);
    setFishResult(result);
    playSound(result.caught ? "catch" : "splash");
  }, [fishResult, fishing]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space" && event.code !== "KeyE") return;
      event.preventDefault();
      if (timing) finishTiming();
      if (request.kind === "fishing") catchFish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [catchFish, finishTiming, request.kind, timing]);

  const progress = timing
    ? timingProgress(elapsed, timing.durationSeconds)
    : 0;

  return (
    <div className="activity-scrim" role="presentation">
      <section
        className={`activity-card activity-card--${request.kind}`}
        aria-label={`${ITEMS[request.item].name}のミニゲーム`}
      >
        <button className="activity-close" onClick={onCancel} aria-label="やめる">
          ×
        </button>
        {easyMode && <span className="easy-badge">やさしい表示</span>}

        {(request.kind === "wood" || request.kind === "stone") && timing && (
          <>
            <p className="eyebrow">
              {request.kind === "wood" ? "WOOD GATHERING" : "STONE GATHERING"}
            </p>
            <h2>
              {request.kind === "wood" ? "木を よく見て！" : "石の 音をきこう！"}
            </h2>
            {!timingResult ? (
              <>
                <p className="activity-instruction">
                  光が みどりのところに来たら、ボタンをおそう。
                </p>
                <div className="timing-track" aria-label="タイミングゲージ">
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
                <button className="activity-action" onClick={finishTiming}>
                  <kbd>E</kbd> いまだ！
                </button>
              </>
            ) : (
              <ResultPanel
                title={
                  timingResult.grade === "great"
                    ? "ぴったり！"
                    : timingResult.grade === "good"
                      ? "いいね！"
                      : "だいじょうぶ！"
                }
                message={timingResult.reward.message}
                onDone={() =>
                  onComplete({
                    ...timingResult.reward,
                  })
                }
              />
            )}
          </>
        )}

        {request.kind === "forage" && discovery && (
          <ForagePanel
            discovery={discovery}
            alreadyDiscovered={alreadyDiscovered}
            onDone={() => {
              playSound("rustle");
              onComplete({
                item: discovery.item,
                amount: discovery.amount,
                discoveryId: discovery.discoveryId,
                message: `${discovery.title}を ${discovery.amount}こ見つけた`,
              });
            }}
          />
        )}

        {request.kind === "fishing" && (
          <FishingPanel
            state={fishing}
            result={fishResult}
            onCatch={catchFish}
            onRetry={() => {
              setFishing(createFishingGame(easyMode));
              setFishResult(null);
            }}
            onDone={() => {
              if (!fishResult?.caught || !fishResult.fish) return;
              onComplete({
                item: "fish",
                amount: 1,
                fishId: fishResult.fish.id,
                message: fishResult.message,
              });
            }}
          />
        )}
      </section>
    </div>
  );
}

function ResultPanel({
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
      <button className="activity-action" onClick={onDone}>
        バッグに いれる
      </button>
    </div>
  );
}

function ForagePanel({
  discovery,
  alreadyDiscovered,
  onDone,
}: {
  discovery: ForageDiscovery;
  alreadyDiscovered: boolean;
  onDone: () => void;
}) {
  return (
    <>
      <p className="eyebrow">LITTLE DISCOVERY</p>
      <h2>{alreadyDiscovered ? "また 見つけた！" : "はじめて 見つけた！"}</h2>
      <div className="discovery-orb" aria-hidden="true">✿</div>
      <div className="discovery-copy">
        <h3>{discovery.title}</h3>
        <ruby>
          {discovery.title}
          <rt>{discovery.reading}</rt>
        </ruby>
        <p>{discovery.note}</p>
      </div>
      <button className="activity-action" onClick={onDone}>
        そっと ひろう
      </button>
    </>
  );
}

function FishingPanel({
  state,
  result,
  onCatch,
  onRetry,
  onDone,
}: {
  state: FishingGameState;
  result: FishingResult | null;
  onCatch: () => void;
  onRetry: () => void;
  onDone: () => void;
}) {
  if (result?.caught && result.fish) {
    return (
      <>
        <p className="eyebrow">NEW CATCH</p>
        <h2>つれた！</h2>
        <div className="fish-silhouette" aria-hidden="true">◀●</div>
        <div className="discovery-copy">
          <h3>{result.fish.name}</h3>
          <ruby>
            {result.fish.name}
            <rt>{result.fish.reading}</rt>
          </ruby>
          <p>{result.fish.size}魚。{result.fish.discovery}</p>
        </div>
        <button className="activity-action" onClick={onDone}>
          さかな図かんに のせる
        </button>
      </>
    );
  }
  if (state.phase === "missed") {
    return (
      <>
        <p className="eyebrow">FISHING</p>
        <h2>おしい！</h2>
        <p className="activity-instruction">
          だいじょうぶ。魚は またすぐに来るよ。
        </p>
        <button className="activity-action" onClick={onRetry}>
          もういちど
        </button>
      </>
    );
  }
  return (
    <>
      <p className="eyebrow">FISHING</p>
      <h2>{state.phase === "bite" ? "いま！ ひいて！" : "しずかに まとう…"}</h2>
      <div className={`fishing-water ${state.phase === "bite" ? "is-biting" : ""}`}>
        <span className="fishing-line" />
        <span className="fishing-bobber" />
        <i />
        <i />
      </div>
      <p className="activity-instruction">
        {state.phase === "bite"
          ? "水が光ったら、大きなボタンをおそう！"
          : "うきが しずむまで まってね。"}
      </p>
      <button
        className="activity-action"
        disabled={state.phase !== "bite"}
        onClick={onCatch}
      >
        <kbd>E</kbd> ひく！
      </button>
    </>
  );
}

