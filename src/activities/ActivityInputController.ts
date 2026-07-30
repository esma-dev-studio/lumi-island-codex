export type ActivityInputIntent =
  | "cancel"
  | "previous"
  | "next"
  | "primary"
  | "confirm"
  | "tab"
  | null;

export function activityInputIntent(
  code: string,
  repeat = false,
): ActivityInputIntent {
  if (repeat && (code === "KeyE" || code === "Space" || code === "Enter")) {
    return null;
  }
  if (code === "Escape") return "cancel";
  if (code === "ArrowLeft" || code === "ArrowUp") return "previous";
  if (code === "ArrowRight" || code === "ArrowDown") return "next";
  if (code === "KeyE" || code === "Space") return "primary";
  if (code === "Enter") return "confirm";
  if (code === "Tab") return "tab";
  return null;
}

export function nextChoiceIndex(
  current: number,
  direction: "previous" | "next",
  count: number,
): number {
  if (count <= 0) return -1;
  const offset = direction === "next" ? 1 : -1;
  return (current + offset + count) % count;
}
