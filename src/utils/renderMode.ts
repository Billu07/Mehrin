function getDeviceMemory(): number | null {
  const browserNavigator = navigator as Navigator & { deviceMemory?: number };
  if (typeof browserNavigator.deviceMemory === "number") {
    return browserNavigator.deviceMemory;
  }
  return null;
}

export function shouldUseLiteRenderMode(): boolean {
  if (typeof window === "undefined") return false;

  const query = new URLSearchParams(window.location.search);
  if (query.get("lite") === "1") {
    return true;
  }

  const memory = getDeviceMemory();
  if (memory !== null && memory <= 4) {
    return true;
  }

  return false;
}

export function shouldDisableCanvasCompletely(): boolean {
  if (typeof window === "undefined") return false;

  const query = new URLSearchParams(window.location.search);
  if (query.get("safe") === "1") {
    return true;
  }

  if (query.get("visual") === "1") {
    return false;
  }

  // Stability-first default. Canvas can be enabled explicitly via ?visual=1.
  return true;
}
