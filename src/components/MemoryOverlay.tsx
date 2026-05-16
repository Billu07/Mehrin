import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { memoriesById } from "../content/memoryIndex";
import { useDiaryStore } from "../store/useDiaryStore";

export function MemoryOverlay() {
  const { t } = useTranslation();
  const selectedMemoryId = useDiaryStore((state) => state.selectedMemoryId);
  const closeMemory = useDiaryStore((state) => state.closeMemory);

  const selectedMemory = useMemo(() => {
    if (!selectedMemoryId) return null;
    return memoriesById[selectedMemoryId];
  }, [selectedMemoryId]);

  if (!selectedMemory) {
    return null;
  }

  return (
    <section className="pointer-events-auto absolute inset-0 z-40 flex items-end justify-center bg-slate-900/28 p-4 md:items-center md:p-6">
      <article className="w-full max-w-2xl rounded-3xl border border-white/50 bg-white/90 p-5 shadow-2xl shadow-slate-700/20 backdrop-blur-xl md:p-7">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
          {t(selectedMemory.labelKey)}
        </p>
        <h2 className="font-story mt-2 text-3xl leading-tight text-slate-900 md:text-4xl">
          {t(selectedMemory.titleKey)}
        </h2>
        <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-slate-700 md:text-lg">
          {t(selectedMemory.bodyKey)}
        </p>
        <button
          type="button"
          onClick={closeMemory}
          className="mt-6 rounded-full bg-slate-900 px-5 py-2 text-sm text-white transition hover:bg-slate-800"
        >
          {t("ui.close")}
        </button>
      </article>
    </section>
  );
}
