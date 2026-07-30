"use client";

import { useEffect, useRef, useState } from "react";
import { CHARACTERS } from "@/src/data/gameData";
import type { AnimationName } from "@/src/game/types";
import type {
  CharacterLoadStatus,
  CharacterMetrics,
} from "@/src/characters/CharacterView";
import {
  createShowcaseScene,
  type ShowcaseController,
  type ShowcaseTime,
  type ShowcaseView,
} from "@/src/scenes/ShowcaseScene";

const ANIMATIONS: { id: AnimationName; label: string }[] = [
  { id: "idle", label: "待つ" },
  { id: "walk", label: "歩く" },
  { id: "run", label: "走る" },
  { id: "talk", label: "話す" },
  { id: "pickup", label: "拾う" },
  { id: "happy", label: "よろこぶ" },
  { id: "surprised", label: "おどろく" },
  { id: "blink", label: "まばたき" },
];

const VIEWS: { id: ShowcaseView; label: string }[] = [
  { id: "front", label: "正面" },
  { id: "angle", label: "ななめ45°" },
  { id: "side", label: "横" },
  { id: "back", label: "うしろ" },
];

const EMPTY_METRICS: CharacterMetrics = {
  triangles: 0,
  meshes: 0,
  materials: 0,
  textureBytes: 0,
};

export function CharacterShowcasePhase2({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controllerRef = useRef<ShowcaseController | null>(null);
  const [selected, setSelected] = useState(0);
  const [animation, setAnimation] = useState<AnimationName>("idle");
  const [time, setTime] = useState<ShowcaseTime>("day");
  const [view, setView] = useState<ShowcaseView>("front");
  const [compare, setCompare] = useState(false);
  const [fps, setFps] = useState(0);
  const [metrics, setMetrics] = useState<CharacterMetrics>(EMPTY_METRICS);
  const [status, setStatus] = useState<CharacterLoadStatus>("loading");

  useEffect(() => {
    if (!canvasRef.current) return;
    const controller = createShowcaseScene(
      canvasRef.current,
      setFps,
      setMetrics,
      setStatus,
    );
    controllerRef.current = controller;
    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, []);

  const chooseCharacter = (index: number) => {
    setSelected(index);
    setCompare(false);
    controllerRef.current?.setCompare(false);
    controllerRef.current?.selectCharacter(index);
  };

  return (
    <main className={`showcase-screen showcase-screen--${time}`}>
      <header className="showcase-header">
        <button className="quiet-button" onClick={onBack}>← タイトルへ</button>
        <div>
          <p className="eyebrow">CHARACTER QUALITY GATE</p>
          <h1>島で出会う、4人</h1>
        </div>
        <div className="showcase-metrics" aria-label="実測表示情報">
          <span>{fps || "—"} FPS</span>
          <span>{Math.round(metrics.triangles).toLocaleString()} 三角形</span>
          <span>メッシュ {metrics.meshes}</span>
          <span>材質 {metrics.materials}</span>
          <span>画像 {Math.round(metrics.textureBytes / 1024)}KB</span>
        </div>
      </header>

      <section className="showcase-stage">
        <canvas
          ref={canvasRef}
          aria-label={`${compare ? "ミラとノラ" : CHARACTERS[selected].name}の3Dキャラクター展示`}
        />
        {status !== "ready" && (
          <div className={`model-status model-status--${status}`} role="status">
            {status === "loading"
              ? "3Dモデルを よみこんでいます…"
              : "3Dモデルを よみこめませんでした。タイトルにもどって、もう一度ためしてください。"}
          </div>
        )}
        <div className="showcase-character-copy">
          <span>{compare ? "HEIGHT CHECK" : `${String(selected + 1).padStart(2, "0")} / 04`}</span>
          <h2>{compare ? "ミラ ＋ ノラ" : CHARACTERS[selected].name}</h2>
          <p>{compare ? "プレイヤーと住民の 身長・シルエット比較" : CHARACTERS[selected].role}</p>
          <small>ボタンで角度を固定　ドラッグでも回転できます</small>
        </div>
      </section>

      <aside className="showcase-controls" aria-label="キャラクター確認操作">
        <ControlGroup label="人物">
          {CHARACTERS.map((character, index) => (
            <button
              key={character.id}
              className={!compare && selected === index ? "is-active" : ""}
              onClick={() => chooseCharacter(index)}
            >
              {character.name}
            </button>
          ))}
          <button
            className={compare ? "is-active" : ""}
            onClick={() => {
              const next = !compare;
              setCompare(next);
              controllerRef.current?.setCompare(next);
            }}
          >
            くらべる
          </button>
        </ControlGroup>
        <ControlGroup label="見る方向">
          {VIEWS.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "is-active" : ""}
              onClick={() => {
                setView(item.id);
                controllerRef.current?.setView(item.id);
              }}
            >
              {item.label}
            </button>
          ))}
        </ControlGroup>
        <ControlGroup label="動き">
          {ANIMATIONS.map((item) => (
            <button
              key={item.id}
              className={animation === item.id ? "is-active" : ""}
              onClick={() => {
                setAnimation(item.id);
                controllerRef.current?.setAnimation(item.id);
              }}
            >
              {item.label}
            </button>
          ))}
        </ControlGroup>
        <ControlGroup label="光">
          {(["day", "evening", "night"] as const).map((item) => (
            <button
              key={item}
              className={time === item ? "is-active" : ""}
              onClick={() => {
                setTime(item);
                controllerRef.current?.setTime(item);
              }}
            >
              {item === "day" ? "昼" : item === "evening" ? "夕方" : "夜"}
            </button>
          ))}
        </ControlGroup>
      </aside>
    </main>
  );
}

function ControlGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="showcase-control-group">
      <span className="control-label">{label}</span>
      <div className="segmented-row segmented-row--wrap">{children}</div>
    </div>
  );
}

