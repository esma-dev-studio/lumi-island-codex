import type { ResourceDefinition } from "@/src/resources/ResourceDefinitions";

export function isNightMinute(dayMinute: number): boolean {
  const minute = ((dayMinute % 1440) + 1440) % 1440;
  return minute >= 19 * 60 || minute < 5 * 60;
}

export function resourceIsAvailableAtTime(
  definition: ResourceDefinition,
  dayMinute: number,
): boolean {
  return definition.timeWindow !== "night" || isNightMinute(dayMinute);
}

export function nightGardenStatus(dayMinute: number): string {
  return isNightMinute(dayMinute)
    ? "花が ひらいているよ"
    : "夜になると 花がひらくよ";
}