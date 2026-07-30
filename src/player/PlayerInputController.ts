export function sendGameKey(code: string, pressed: boolean): void {
  window.dispatchEvent(
    new KeyboardEvent(pressed ? "keydown" : "keyup", {
      code,
      bubbles: true,
    }),
  );
}

export function tapGameKey(code: string, releaseAfterMs = 170): void {
  sendGameKey(code, true);
  window.setTimeout(() => sendGameKey(code, false), releaseAfterMs);
}
