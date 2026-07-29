"use client";

import { useEffect, useRef } from "react";
import {
  createIslandScene,
  type InteractionHint,
  type IslandController,
} from "@/src/scenes/LumiScenes";
import type { GameState, ResourceId } from "@/src/game/types";

interface GameCanvasProps {
  state: GameState;
  paused: boolean;
  onHint: (hint: InteractionHint | null) => void;
  onGather: (item: ResourceId) => void;
  onTalk: (resident: "ノラ" | "カイ" | "セラ") => void;
  onPlayerMove: (position: { x: number; z: number }) => void;
  onFps: (fps: number) => void;
}

export function GameCanvas({
  state,
  paused,
  onHint,
  onGather,
  onTalk,
  onPlayerMove,
  onFps,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controllerRef = useRef<IslandController | null>(null);
  const callbackRef = useRef({
    onHint,
    onGather,
    onTalk,
    onPlayerMove,
    onFps,
  });

  useEffect(() => {
    callbackRef.current = {
      onHint,
      onGather,
      onTalk,
      onPlayerMove,
      onFps,
    };
  }, [onFps, onGather, onHint, onPlayerMove, onTalk]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const controller = createIslandScene(
      canvas,
      state.playerPosition,
      state.placedFurniture,
      {
        onHint: (hint) => callbackRef.current.onHint(hint),
        onGather: (item) => callbackRef.current.onGather(item),
        onTalk: (resident) => callbackRef.current.onTalk(resident),
        onPlayerMove: (position) =>
          callbackRef.current.onPlayerMove(position),
        onFps: (fps) => callbackRef.current.onFps(fps),
      },
    );
    controllerRef.current = controller;
    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
    // The scene owns the initial values. Live values are synchronized below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    controllerRef.current?.setPaused(paused);
  }, [paused]);

  useEffect(() => {
    controllerRef.current?.setDayMinute(state.dayMinute);
  }, [state.dayMinute]);

  useEffect(() => {
    controllerRef.current?.syncFurniture(state.placedFurniture);
  }, [state.placedFurniture]);

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      aria-label="Lumi Islandの3Dゲーム画面"
      tabIndex={0}
    />
  );
}
