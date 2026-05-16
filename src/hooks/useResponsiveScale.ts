import { useEffect, useMemo, useState } from "react";

interface ScaleState {
  frameWidth: number;
  frameHeight: number;
  scale: number;
  isPortrait: boolean;
}

const LANDSCAPE = {
  width: 1600,
  height: 1000,
};

const PORTRAIT = {
  width: 900,
  height: 1600,
};

function calculateScale(): ScaleState {
  if (typeof window === "undefined") {
    return {
      frameWidth: LANDSCAPE.width,
      frameHeight: LANDSCAPE.height,
      scale: 1,
      isPortrait: false,
    };
  }

  const isPortrait = window.innerHeight > window.innerWidth;
  const frame = isPortrait ? PORTRAIT : LANDSCAPE;
  const scale = Math.min(window.innerWidth / frame.width, window.innerHeight / frame.height);

  return {
    frameWidth: frame.width,
    frameHeight: frame.height,
    scale: Number.isFinite(scale) ? Math.max(scale, 0.1) : 1,
    isPortrait,
  };
}

export function useResponsiveScale() {
  const [scaleState, setScaleState] = useState<ScaleState>(() => calculateScale());

  useEffect(() => {
    let frame = 0;
    const onResize = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScaleState(calculateScale()));
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const stageStyle = useMemo(
    () => ({
      width: `${scaleState.frameWidth}px`,
      height: `${scaleState.frameHeight}px`,
      transform: `translate(-50%, -50%) scale(${scaleState.scale})`,
    }),
    [scaleState.frameHeight, scaleState.frameWidth, scaleState.scale],
  );

  return {
    ...scaleState,
    stageStyle,
  };
}
