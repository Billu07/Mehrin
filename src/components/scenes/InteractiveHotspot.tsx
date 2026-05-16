import { useCallback, useState } from "react";
import type { Graphics as PixiGraphics } from "pixi.js";
import { useDiaryStore } from "../../store/useDiaryStore";
import type { SceneHotspot } from "../../types/diary";

interface InteractiveHotspotProps {
  hotspot: SceneHotspot;
  stageWidth: number;
  stageHeight: number;
}

export function InteractiveHotspot({
  hotspot,
  stageWidth,
  stageHeight,
}: InteractiveHotspotProps) {
  const openMemory = useDiaryStore((state) => state.openMemory);
  const setHoveredMemory = useDiaryStore((state) => state.setHoveredMemory);
  const isUnlocked = useDiaryStore((state) =>
    state.unlockedMemories.includes(hotspot.id),
  );
  const [isHovered, setIsHovered] = useState(false);

  const centerX = hotspot.x * stageWidth;
  const centerY = hotspot.y * stageHeight;

  const drawHotspot = useCallback(
    (graphics: PixiGraphics) => {
      graphics.clear();
      graphics
        .roundRect(
          -hotspot.width / 2,
          -hotspot.height / 2,
          hotspot.width,
          hotspot.height,
          22,
        )
        .fill({
          color: hotspot.color,
          alpha: isHovered ? 0.85 : 0.68,
        })
        .stroke({
          color: isUnlocked ? 0x0f766e : 0xffffff,
          width: isHovered ? 4 : 2,
          alpha: isHovered ? 0.8 : isUnlocked ? 0.7 : 0.4,
        });
    },
    [hotspot.color, hotspot.height, hotspot.width, isHovered, isUnlocked],
  );

  return (
    <pixiContainer
      position={{ x: centerX, y: centerY }}
      eventMode="static"
      cursor="pointer"
      onPointerOver={() => {
        setIsHovered(true);
        setHoveredMemory(hotspot.id);
      }}
      onPointerOut={() => {
        setIsHovered(false);
        setHoveredMemory(null);
      }}
      onPointerTap={() => {
        setHoveredMemory(null);
        openMemory(hotspot.id);
      }}
    >
      <pixiGraphics draw={drawHotspot} />
    </pixiContainer>
  );
}
