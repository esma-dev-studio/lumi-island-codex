"use client";

import { useEffect, useRef } from "react";
import {
  createIslandScene,
  type InteractionHint,
  type IslandController,
  type TutorialGuideTarget,
} from "@/src/scenes/IslandScene";
import type { GameState } from "@/src/game/types";
import type {
  PlacementMode,
  PlacementPreview,
} from "@/src/placement/PlacementController";
import type { ActivityRequest } from "@/src/ui/minigames/ActivityOverlayPhase21";
import type { ActivityResult } from "@/src/activities/ActivityResult";

interface GameCanvasProps {
  state: GameState;
  paused: boolean;
  placementMode: PlacementMode | null;
  tutorialGuideTarget: TutorialGuideTarget | null;
  pendingActivityResult: ActivityResult | null;
  cameraResetToken: number;
  onHint: (hint: InteractionHint | null) => void;
  onActivity: (activity: ActivityRequest) => void;
  onActivitySettled: (result: ActivityResult) => void;
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
  tutorialGuideTarget,
  pendingActivityResult,
  cameraResetToken,
  onHint,
  onActivity,
  onActivitySettled,
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
    onActivity,
    onActivitySettled,
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
      onActivity,
      onActivitySettled,
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
    onActivity,
    onActivitySettled,
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
        onActivity: (activity) =>
          callbackRef.current.onActivity(activity),
        onActivitySettled: (result) =>
          callbackRef.current.onActivitySettled(result),
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
    controllerRef.current?.setProgression({
      islandRank: state.islandLevel,
      groveRepairs: state.groveRepairs,
      collectionMilestones: state.collectionMilestones,
      bridgeRepaired: state.bridgeRepaired,
      nollaFriendship: state.residentFriendship["ノラ"],
    });
  }, [
    state.bridgeRepaired,
    state.collectionMilestones,
    state.groveRepairs,
    state.islandLevel,
    state.residentFriendship,
  ]);

  useEffect(() => {
    controllerRef.current?.syncFurniture(state.placedFurniture);
  }, [state.placedFurniture]);

  useEffect(() => {
    controllerRef.current?.syncResourceStates(state.resourceStates);
  }, [state.resourceStates]);

  useEffect(() => {
    if (pendingActivityResult) controllerRef.current?.resolveActivity(pendingActivityResult);
  }, [pendingActivityResult]);

  useEffect(() => {
    controllerRef.current?.setPlacementMode(placementMode);
  }, [placementMode]);

  useEffect(() => {
    controllerRef.current?.setTutorialGuide(tutorialGuideTarget);
  }, [tutorialGuideTarget]);

  useEffect(() => {
    if (cameraResetToken > 0) controllerRef.current?.resetCamera();
  }, [cameraResetToken]);

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      aria-label="Lumi Islandの3Dゲーム画面"
      data-debug-fishing-catch-counts={
        process.env.NODE_ENV !== "production"
          ? JSON.stringify(state.fishingCatchCounts)
          : undefined
      }
      data-debug-day-minute={
        process.env.NODE_ENV !== "production" ? state.dayMinute : undefined
      }
      tabIndex={0}
    />
  );
}
