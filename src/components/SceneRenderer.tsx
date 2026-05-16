import { Suspense, lazy } from "react";
import { scenes } from "../content/scenes";
import type { SceneId } from "../types/diary";
import { NurseryScene } from "./scenes/NurseryScene";

const GardenSceneLazy = lazy(async () => {
  const module = await import("./scenes/GardenScene");
  return { default: module.GardenScene };
});

interface SceneRendererProps {
  sceneId: SceneId;
  width: number;
  height: number;
}

export function SceneRenderer({ sceneId, width, height }: SceneRendererProps) {
  const scene = scenes[sceneId];

  if (sceneId === "garden") {
    return (
      <Suspense fallback={null}>
        <GardenSceneLazy scene={scene} width={width} height={height} />
      </Suspense>
    );
  }

  return <NurseryScene scene={scene} width={width} height={height} />;
}
