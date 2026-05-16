import { scenes } from "../content/scenes";
import type { MemoryId, SceneId } from "../types/diary";

export function getSceneUnlockedCount(
  sceneId: SceneId,
  unlockedMemories: MemoryId[],
): number {
  const memorySet = new Set(unlockedMemories);
  return scenes[sceneId].hotspots.filter((hotspot) => memorySet.has(hotspot.id)).length;
}

export function getTotalMemoryCount(): number {
  return Object.values(scenes).reduce(
    (sum, scene) => sum + scene.hotspots.length,
    0,
  );
}
