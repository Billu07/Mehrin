export type DiaryLanguage = "en" | "bn";

export type SceneId = "nursery" | "garden";

export type MemoryId =
  | "crib"
  | "window"
  | "bear"
  | "garden-promise"
  | "sun-path";

export type MemoryBodyKey = `memories.${MemoryId}.body`;

export interface SceneHotspot {
  id: MemoryId;
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
  icon: string;
  labelKey: string;
  titleKey: string;
  bodyKey: MemoryBodyKey;
}

export interface SceneConfig {
  id: SceneId;
  nameKey: string;
  descriptionKey: string;
  palette: {
    sky: number;
    ground: number;
    glow: number;
  };
  hotspots: SceneHotspot[];
}
