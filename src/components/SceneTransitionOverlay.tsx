import { useEffect, useRef, useState } from "react";
import { useDiaryStore } from "../store/useDiaryStore";

export function SceneTransitionOverlay() {
  const sceneId = useDiaryStore((state) => state.sceneId);
  const [isVisible, setIsVisible] = useState(false);
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    setIsVisible(true);
    const timeout = window.setTimeout(() => {
      setIsVisible(false);
    }, 420);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [sceneId]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-[25] transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="h-full w-full bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.18),_rgba(148,163,184,0.22))]" />
    </div>
  );
}
