import { useCallback } from "react";
import type { Graphics as PixiGraphics } from "pixi.js";
import { usePixiTextures } from "../../hooks/usePixiTextures";
import type { SceneConfig } from "../../types/diary";
import { shouldUseLiteRenderMode } from "../../utils/renderMode";
import { InteractiveHotspot } from "./InteractiveHotspot";

const nurseryTextureSources = {
  paper: "/watercolor/nursery-paper.svg",
  crib: "/watercolor/nursery-crib.svg",
  window: "/watercolor/nursery-window.svg",
  bear: "/watercolor/nursery-bear.svg",
} as const;

interface NurserySceneProps {
  scene: SceneConfig;
  width: number;
  height: number;
}

export function NurseryScene({ scene, width, height }: NurserySceneProps) {
  const textures = usePixiTextures(nurseryTextureSources, !shouldUseLiteRenderMode());

  const drawBackdrop = useCallback(
    (graphics: PixiGraphics) => {
      const horizonY = height * 0.6;

      graphics.clear();
      graphics
        .rect(0, 0, width, height)
        .fill({ color: scene.palette.sky, alpha: 1 });
      graphics
        .rect(0, horizonY, width, height - horizonY)
        .fill({ color: scene.palette.ground, alpha: 1 });

      graphics
        .circle(width * 0.82, height * 0.18, Math.min(width, height) * 0.12)
        .fill({ color: scene.palette.glow, alpha: 0.34 });

      graphics
        .roundRect(width * 0.08, height * 0.28, width * 0.18, height * 0.4, 24)
        .fill({ color: 0xf4ece0, alpha: 0.52 })
        .stroke({ color: 0xffffff, width: 2, alpha: 0.22 });

      graphics
        .roundRect(width * 0.73, height * 0.22, width * 0.18, height * 0.36, 22)
        .fill({ color: 0xe3edf4, alpha: 0.6 })
        .stroke({ color: 0xffffff, width: 2, alpha: 0.36 });
    },
    [height, scene.palette.glow, scene.palette.ground, scene.palette.sky, width],
  );

  return (
    <pixiContainer>
      <pixiGraphics draw={drawBackdrop} />
      {textures.paper ? (
        <pixiSprite texture={textures.paper} width={width} height={height} alpha={0.9} />
      ) : null}

      {textures.crib ? (
        <pixiSprite
          texture={textures.crib}
          position={{ x: width * 0.145, y: height * 0.57 }}
          width={width * 0.24}
          height={height * 0.2}
          alpha={0.78}
        />
      ) : null}

      {textures.window ? (
        <pixiSprite
          texture={textures.window}
          position={{ x: width * 0.72, y: height * 0.18 }}
          width={width * 0.17}
          height={height * 0.3}
          alpha={0.82}
        />
      ) : null}

      {textures.bear ? (
        <pixiSprite
          texture={textures.bear}
          position={{ x: width * 0.47, y: height * 0.52 }}
          width={width * 0.13}
          height={height * 0.22}
          alpha={0.8}
        />
      ) : null}

      {scene.hotspots.map((hotspot) => (
        <InteractiveHotspot
          key={hotspot.id}
          hotspot={hotspot}
          stageWidth={width}
          stageHeight={height}
        />
      ))}
    </pixiContainer>
  );
}
