import { useTranslation } from "react-i18next";
import { scenes } from "../content/scenes";
import { useDiaryStore } from "../store/useDiaryStore";
import type { SceneId } from "../types/diary";

interface SceneHotspotHintsProps {
  sceneId: SceneId;
}

export function SceneHotspotHints({ sceneId }: SceneHotspotHintsProps) {
  const { t } = useTranslation();
  const hoveredMemoryId = useDiaryStore((state) => state.hoveredMemoryId);
  const selectedMemoryId = useDiaryStore((state) => state.selectedMemoryId);
  const unlockedMemories = useDiaryStore((state) => state.unlockedMemories);
  const scene = scenes[sceneId];

  if (selectedMemoryId) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {scene.hotspots.map((hotspot) => {
        const isHovered = hoveredMemoryId === hotspot.id;
        const isUnlocked = unlockedMemories.includes(hotspot.id);

        return (
          <div
            key={hotspot.id}
            style={{ left: `${hotspot.x * 100}%`, top: `${hotspot.y * 100}%` }}
            className={`absolute -translate-x-1/2 -translate-y-[130%] rounded-2xl border px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] transition duration-200 md:text-xs ${
              isHovered
                ? "border-slate-50 bg-white/95 text-slate-900 shadow-lg shadow-slate-800/20"
                : isUnlocked
                  ? "border-emerald-100 bg-emerald-50/95 text-emerald-800 shadow-md shadow-emerald-900/10"
                  : "border-white/50 bg-white/65 text-slate-700"
            }`}
          >
            <span className="font-semibold">{hotspot.icon}</span>
            <span className="ml-2 hidden md:inline">{t(hotspot.labelKey)}</span>
          </div>
        );
      })}

      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/55 bg-white/70 px-4 py-1 text-[11px] tracking-[0.08em] text-slate-700 backdrop-blur md:bottom-6 md:text-xs">
        {t("ui.hoverHint")}
      </p>
    </div>
  );
}
