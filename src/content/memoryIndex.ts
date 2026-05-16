import { scenes } from "./scenes";
import type { MemoryId, SceneHotspot } from "../types/diary";

export const memoriesById = Object.values(scenes)
  .flatMap((scene) => scene.hotspots)
  .reduce<Record<MemoryId, SceneHotspot>>(
    (accumulator, hotspot) => ({
      ...accumulator,
      [hotspot.id]: hotspot,
    }),
    {} as Record<MemoryId, SceneHotspot>,
  );
