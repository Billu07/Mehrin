import { useEffect, useRef } from "react";

const TRAIL_LENGTH = 14;

interface TrailPoint {
  x: number;
  y: number;
  life: number;
}

export function MagicalCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const pointsRef = useRef<TrailPoint[]>([]);
  const targetRef = useRef({ x: -120, y: -120 });
  const currentRef = useRef({ x: -120, y: -120 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (window.matchMedia("(pointer: coarse)").matches) return undefined;

    const cursor = cursorRef.current;
    const glow = glowRef.current;
    if (!cursor || !glow) return undefined;

    const onPointerMove = (event: PointerEvent) => {
      targetRef.current.x = event.clientX;
      targetRef.current.y = event.clientY;
      pointsRef.current.unshift({ x: event.clientX, y: event.clientY, life: 1 });
      pointsRef.current = pointsRef.current.slice(0, TRAIL_LENGTH);
    };

    const onPointerDown = () => {
      cursor.classList.add("is-clicking");
    };

    const onPointerUp = () => {
      cursor.classList.remove("is-clicking");
    };

    const tick = () => {
      const current = currentRef.current;
      const target = targetRef.current;

      current.x += (target.x - current.x) * 0.22;
      current.y += (target.y - current.y) * 0.22;

      cursor.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      glow.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;

      const trail = pointsRef.current;
      for (let i = 0; i < trail.length; i += 1) {
        trail[i].life -= 0.025;
      }
      pointsRef.current = trail.filter((point) => point.life > 0);

      const trailMarkup = pointsRef.current
        .map((point, index) => {
          const opacity = Math.max(0, point.life * (1 - index / TRAIL_LENGTH));
          const size = 14 - index * 0.8;
          return `<span class="wand-trail-point" style="left:${point.x}px;top:${point.y}px;opacity:${opacity};width:${size}px;height:${size}px"></span>`;
        })
        .join("");

      glow.innerHTML = trailMarkup;
      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <div className="wand-trail-layer" ref={glowRef} aria-hidden="true" />
      <div className="wand-cursor" ref={cursorRef} aria-hidden="true">
        <span className="wand-core" />
        <span className="wand-ring" />
      </div>
    </>
  );
}
