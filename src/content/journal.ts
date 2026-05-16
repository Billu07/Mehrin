import { sceneSequence, scenes } from "./scenes";
import type { MemoryId, SceneId } from "../types/diary";

export interface JournalPage {
  id: string;
  sceneId: SceneId;
  titleKey: string;
  bodyKey: string;
  chapterKey: string;
  memoryId: MemoryId | null;
}

export const journalPages: JournalPage[] = [
  {
    id: "intro",
    sceneId: "nursery",
    titleKey: "journal.intro.title",
    bodyKey: "journal.intro.body",
    chapterKey: "journal.intro.chapter",
    memoryId: null,
  },
  ...sceneSequence.flatMap((sceneId) => {
    const scene = scenes[sceneId];
    return scene.hotspots.map((hotspot) => ({
      id: `memory-${hotspot.id}`,
      sceneId,
      titleKey: hotspot.titleKey,
      bodyKey: hotspot.bodyKey,
      chapterKey: scene.nameKey,
      memoryId: hotspot.id,
    }));
  }),
  {
    id: "outro",
    sceneId: "garden",
    titleKey: "journal.outro.title",
    bodyKey: "journal.outro.body",
    chapterKey: "journal.outro.chapter",
    memoryId: null,
  },
];
