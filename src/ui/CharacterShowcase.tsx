"use client";

import { useEffect, useRef, useState } from "react";
import { CHARACTERS } from "@/src/data/gameData";
import type { AnimationName } from "@/src/game/types";
import {
  createShowcaseScene,
  type ShowcaseController,
} from "@/src/scenes/LumiScenes";

const ANIMATIONS: { id: AnimationName; label: string }[] = [
  { id: "idle", label: "待つ" },
  { id: "walk", label: "歩く" },
  { id: "run", label: "走る" },
  { id: "talk", label: "話す" },
  { id: "interact", label: "調べる" },
  { id: "pickup", label: "拾う" },
  { id: "happy", label: "よろこぶ" },
  { id: "surprised", label: "おどろく" },
];

export function CharacterShowcase({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controllerRef = useRef<ShowcaseController | null>(null);
  const [selected, setSelected] = useState(0);
  const [animation, setAnimation] = useState<AnimationName>("idle");
  const [time, setTime] = useState<"day" | "night">("day");
  const [fps, setFps] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;
    const controller = createShowcaseScene(canvasRef.current, setFps);
    controllerRef.current = controller;
    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, []);

  const chooseCharacter = (index: number) => {
    setSelected(index);
    controllerRef.current?.selectCharacter(index);
  };

  const chooseAnimation = (next: AnimationName) => {
    setAnimation(next);
    controllerRef.current?.setAnimation(next);
  };

  const chooseTime = (next: "day" | "night") => {
    setTime(next);
    controllerRef.current?.setTime(next);
  };

  return (
    <main className={`showcase-screen showcase-screen--${time}`}>
      <header className="showcase-header">
        <button className="quiet-button" onClick={onBack}>
          ← タイトルへ
        </button>
        <div>
          <p className="eyebrow">CHARACTER SHOWCASE</p>
          <h1>島で出会う、4人</h1>
        </div>
        <div className="showcase-metrics" aria-label="表示情報">
          <span>{fps || "—"} FPS</span>
          <span>材質 7</span>
          <span>造形 18K以下</span>
        </div>
      </header>

      <section className="showcase-stage">
        <canvas
          ref={canvasRef}
          aria-label={`${CHARACTERS[selected].name}の3Dキャラクター展示`}
        />
        <div className="showcase-character-copy">
          <span>{String(selected + 1).padStart(2, "0")} / 04</span>
          <h2>{CHARACTERS[selected].name}</h2>
          <p>{CHARACTERS[selected].role}</p>
          <small>ドラッグで回転　ホイールで近づく</small>
        </div>
      </section>

      <aside className="showcase-controls" aria-label="キャラクター確認操作">
        <div className="showcase-control-group">
          <span className="control-label">人物</span>
          <div className="segmented-row">
            {CHARACTERS.map((character, index) => (
              <button
                key={character.id}
                className={selected === index ? "is-active" : ""}
                onClick={() => chooseCharacter(index)}
              >
                {character.name}
              </button>
            ))}
          </div>
        </div>
        <div className="showcase-control-group">
          <span className="control-label">動き</span>
          <div className="segmented-row segmented-row--wrap">
            {ANIMATIONS.map((item) => (
              <button
                key={item.id}
                className={animation === item.id ? "is-active" : ""}
                onClick={() => chooseAnimation(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="showcase-control-group">
          <span className="control-label">光</span>
          <div className="segmented-row">
            <button
              className={time === "day" ? "is-active" : ""}
              onClick={() => chooseTime("day")}
            >
              昼
            </button>
            <button
              className={time === "night" ? "is-active" : ""}
              onClick={() => chooseTime("night")}
            >
              夜
            </button>
          </div>
        </div>
      </aside>
    </main>
  );
}
