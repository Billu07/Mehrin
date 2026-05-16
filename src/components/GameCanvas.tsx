import { Application } from "@pixi/react";
import { useEffect, useMemo, useState } from "react";
import { useDiaryStore } from "../store/useDiaryStore";
import "../pixi/pixiSetup";
import { SceneRenderer } from "./SceneRenderer";

interface Viewport {
  width: number;
  height: number;
}

function getViewport(): Viewport {
  if (typeof window === "undefined") {
    return { width: 1280, height: 720 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

export function GameCanvas() {
  const sceneId = useDiaryStore((state) => state.sceneId);
  const [viewport, setViewport] = useState<Viewport>(() => getViewport());

  useEffect(() => {
    const onResize = () => setViewport(getViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const resolution = useMemo(() => {
    if (typeof window === "undefined") return 1;
    return Math.min(window.devicePixelRatio || 1, 2);
  }, []);

  return (
    <div className="absolute inset-0">
      <Application
        width={viewport.width}
        height={viewport.height}
        resolution={resolution}
        autoDensity
        antialias
        preference="webgl"
        manageImports={false}
        backgroundAlpha={0}
      >
        <SceneRenderer
          sceneId={sceneId}
          width={viewport.width}
          height={viewport.height}
        />
      </Application>
    </div>
  );
}
