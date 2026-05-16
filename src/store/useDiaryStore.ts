import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { DiaryLanguage, MemoryId, SceneId } from "../types/diary";

interface DiaryState {
  language: DiaryLanguage;
  sceneId: SceneId;
  selectedMemoryId: MemoryId | null;
  hoveredMemoryId: MemoryId | null;
  unlockedMemories: MemoryId[];
  setLanguage: (language: DiaryLanguage) => void;
  setScene: (sceneId: SceneId) => void;
  setHoveredMemory: (memoryId: MemoryId | null) => void;
  openMemory: (memoryId: MemoryId) => void;
  closeMemory: () => void;
}

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set) => ({
      language: "bn",
      sceneId: "nursery",
      selectedMemoryId: null,
      hoveredMemoryId: null,
      unlockedMemories: [],
      setLanguage: (language) => set({ language }),
      setScene: (sceneId) =>
        set({ sceneId, selectedMemoryId: null, hoveredMemoryId: null }),
      setHoveredMemory: (memoryId) => set({ hoveredMemoryId: memoryId }),
      openMemory: (memoryId) =>
        set((state) => ({
          selectedMemoryId: memoryId,
          unlockedMemories: state.unlockedMemories.includes(memoryId)
            ? state.unlockedMemories
            : [...state.unlockedMemories, memoryId],
        })),
      closeMemory: () => set({ selectedMemoryId: null, hoveredMemoryId: null }),
    }),
    {
      name: "mehrin-memory-lane-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        language: state.language,
        sceneId: state.sceneId,
        unlockedMemories: state.unlockedMemories,
      }),
    },
  ),
);
