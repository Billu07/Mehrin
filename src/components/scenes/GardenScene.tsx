import { useCallback } from "react";
import type { Graphics as PixiGraphics } from "pixi.js";
import { usePixiTextures } from "../../hooks/usePixiTextures";
import type { SceneConfig } from "../../types/diary";
import { shouldUseLiteRenderMode } from "../../utils/renderMode";
import { InteractiveHotspot } from "./InteractiveHotspot";

const gardenTextureSources = {
  field: "/watercolor/garden-field.svg",
  path: "/watercolor/garden-path.svg",
  bloom: "/watercolor/garden-bloom.svg",
} as const;

interface GardenSceneProps {
  scene: SceneConfig;
  width: number;
  height: number;
}

export function GardenScene({ scene, width, height }: GardenSceneProps) {
  const textures = usePixiTextures(gardenTextureSources, !shouldUseLiteRenderMode());

  const drawBackdrop = useCallback(
    (graphics: PixiGraphics) => {
      const horizonY = height * 0.55;

      graphics.clear();
      graphics
        .rect(0, 0, width, height)
        .fill({ color: scene.palette.sky, alpha: 1 });
      graphics
        .rect(0, horizonY, width, height - horizonY)
        .fill({ color: scene.palette.ground, alpha: 1 });

      graphics
        .circle(width * 0.15, height * 0.2, Math.min(width, height) * 0.08)
        .fill({ color: scene.palette.glow, alpha: 0.42 });

      graphics
        .roundRect(width * 0.12, height * 0.44, width * 0.76, height * 0.09, 18)
        .fill({ color: 0xb6cfa8, alpha: 0.82 });
      graphics
        .roundRect(width * 0.21, height * 0.38, width * 0.1, height * 0.16, 16)
        .fill({ color: 0x89ab72, alpha: 0.85 });
      graphics
        .roundRect(width * 0.67, height * 0.35, width * 0.11, height * 0.19, 16)
        .fill({ color: 0x88a96f, alpha: 0.85 });
    },
    [height, scene.palette.glow, scene.palette.ground, scene.palette.sky, width],
  );

  return (
    <pixiContainer>
      <pixiGraphics draw={drawBackdrop} />
      {textures.field ? (
        <pixiSprite texture={textures.field} width={width} height={height} alpha={0.88} />
      ) : null}

      {textures.path ? (
        <pixiSprite
          texture={textures.path}
          position={{ x: width * 0.18, y: height * 0.44 }}
          width={width * 0.66}
          height={height * 0.22}
          alpha={0.82}
        />
      ) : null}

      {textures.bloom ? (
        <>
          <pixiSprite
            texture={textures.bloom}
            position={{ x: width * 0.66, y: height * 0.52 }}
            width={width * 0.11}
            height={height * 0.16}
            alpha={0.75}
          />
          <pixiSprite
            texture={textures.bloom}
            position={{ x: width * 0.2, y: height * 0.56 }}
            width={width * 0.08}
            height={height * 0.12}
            alpha={0.68}
          />
        </>
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
