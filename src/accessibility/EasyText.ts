export function easyText(
  easyMode: boolean,
  normal: string,
  easy: string,
): string {
  return easyMode ? easy : normal;
}
