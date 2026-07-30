"use client";

import { useEffect, useRef } from "react";
import {
  createIslandScene,
  type InteractionHint,
  type IslandController,
} from "@/src/scenes/LumiScenes";
import type { GameState, ResourceId } from "@/src/game/types";
import type {
  PlacementMode,
  PlacementPreview,
} from "@/src/placement/PlacementController";

interface GameCanvasProps {
  state: GameState;
  paused: boolean;
  placementMode: PlacementMode | null;
  cameraResetToken: number;
  onHint: (hint: InteractionHint | null) => void;
  onGather: (item: ResourceId) => void;
  onTalk: (resident: "ノラ" | "カイ" | "セラ") => void;
  onEditFurniture: (id: string) => void;
  onPlacementPreview: (preview: PlacementPreview | null) => void;
  onPlacementConfirm: (preview: PlacementPreview) => void;
  onPlacementRotate: () => void;
  onPlacementRemove: (id: string) => void;
  onPlayerMove: (position: { x: number; z: number }) => void;
  onFps: (fps: number) => void;
}

export function GameCanvas({
  state,
  paused,
  placementMode,
  cameraResetToken,
  onHint,
  onGather,
  onTalk,
  onEditFurniture,
  onPlacementPreview,
  onPlacementConfirm,
  onPlacementRotate,
  onPlacementRemove,
  onPlayerMove,
  onFps,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controllerRef = useRef<IslandController | null>(null);
  const callbackRef = useRef({
    onHint,
    onGather,
    onTalk,
    onEditFurniture,
    onPlacementPreview,
    onPlacementConfirm,
    onPlacementRotate,
    onPlacementRemove,
    onPlayerMove,
    onFps,
  });

  useEffect(() => {
    callbackRef.current = {
      onHint,
      onGather,
      onTalk,
      onEditFurniture,
      onPlacementPreview,
      onPlacementConfirm,
      onPlacementRotate,
      onPlacementRemove,
      onPlayerMove,
      onFps,
    };
  }, [
    onEditFurniture,
    onFps,
    onGather,
    onHint,
    onPlacementConfirm,
    onPlacementPreview,
    onPlacementRemove,
    onPlacementRotate,
    onPlayerMove,
    onTalk,
  ]);

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
        onEditFurniture: (id) =>
          callbackRef.current.onEditFurniture(id),
        onPlacementPreview: (preview) =>
          callbackRef.current.onPlacementPreview(preview),
        onPlacementConfirm: (preview) =>
          callbackRef.current.onPlacementConfirm(preview),
        onPlacementRotate: () =>
          callbackRef.current.onPlacementRotate(),
        onPlacementRemove: (id) =>
          callbackRef.current.onPlacementRemove(id),
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

  useEffect(() => {
    controllerRef.current?.setPlacementMode(placementMode);
  }, [placementMode]);

  useEffect(() => {
    if (cameraResetToken > 0) controllerRef.current?.resetCamera();
  }, [cameraResetToken]);

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      aria-label="Lumi Islandの3Dゲーム画面"
      tabIndex={0}
    />
  );
}
