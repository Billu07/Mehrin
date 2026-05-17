import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  createLayoutElements,
  magicalBookPages,
  normalizePageChrome,
  type BookPage,
  type BookPageLayout,
} from "../content/magicalBook";

const STORAGE_KEY = "mehrin_magical_book_pages_v1";
const STORAGE_SAVED_AT_KEY = "mehrin_magical_book_saved_at_v1";
const HISTORY_LIMIT = 120;

function clonePages(pages: BookPage[]): BookPage[] {
  return JSON.parse(JSON.stringify(pages)) as BookPage[];
}

function normalizeLayout(value: unknown): BookPageLayout {
  const allowed: BookPageLayout[] = [
    "chapter-divider",
    "classic-split",
    "ornate-media",
    "scrapbook-collage",
    "letter-notes",
  ];
  if (typeof value === "string" && allowed.includes(value as BookPageLayout)) {
    return value as BookPageLayout;
  }
  return "classic-split";
}

function normalizePages(pages: BookPage[]): BookPage[] {
  return pages.map((page) => {
    const layoutTemplate = normalizeLayout((page as Partial<BookPage>).layoutTemplate);
    const normalized = {
      ...page,
      layoutTemplate,
    };
    const elements =
      Array.isArray(page.elements) && page.elements.length > 0
        ? page.elements
        : createLayoutElements(normalized);

    return {
      ...normalized,
      elements,
      chrome: normalizePageChrome(normalized.chrome),
      specialNotes: (normalized.specialNotes ?? []).map((note) => ({
        ...note,
        date: typeof note.date === "string" && note.date.length > 0 ? note.date : "2026-05-16",
      })),
    };
  });
}

function pagesSignature(pages: BookPage[]): string {
  return JSON.stringify(pages);
}

function loadPages(): BookPage[] {
  if (typeof window === "undefined") {
    return normalizePages(clonePages(magicalBookPages));
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return normalizePages(clonePages(magicalBookPages));

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return normalizePages(clonePages(magicalBookPages));

    return normalizePages(parsed as BookPage[]);
  } catch {
    return normalizePages(clonePages(magicalBookPages));
  }
}

function loadSavedTimestamp(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_SAVED_AT_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function persistPages(pages: BookPage[]): number {
  const now = Date.now();
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
    window.localStorage.setItem(STORAGE_SAVED_AT_KEY, String(now));
  }
  return now;
}

function withPast(past: BookPage[][], snapshot: BookPage[]): BookPage[][] {
  const next = [...past, clonePages(snapshot)];
  if (next.length > HISTORY_LIMIT) {
    next.shift();
  }
  return next;
}

interface BookPagesState {
  pages: BookPage[];
  savedPages: BookPage[];
  past: BookPage[][];
  future: BookPage[][];
  lastSavedAt: number | null;
}

interface UseBookPagesResult {
  pages: BookPage[];
  setPages: Dispatch<SetStateAction<BookPage[]>>;
  resetPages: () => void;
  savePages: () => void;
  undoPages: () => void;
  redoPages: () => void;
  revertToSaved: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasUnsavedChanges: boolean;
  lastSavedAt: number | null;
}

export function useBookPages(): UseBookPagesResult {
  const [state, setState] = useState<BookPagesState>(() => {
    const loaded = loadPages();
    return {
      pages: clonePages(loaded),
      savedPages: clonePages(loaded),
      past: [],
      future: [],
      lastSavedAt: loadSavedTimestamp(),
    };
  });

  const hasUnsavedChanges = useMemo(
    () => pagesSignature(state.pages) !== pagesSignature(state.savedPages),
    [state.pages, state.savedPages],
  );

  const setPages: Dispatch<SetStateAction<BookPage[]>> = useCallback((updater) => {
    setState((current) => {
      const nextValue =
        typeof updater === "function"
          ? (updater as (currentValue: BookPage[]) => BookPage[])(current.pages)
          : updater;
      const normalized = normalizePages(clonePages(nextValue));
      if (pagesSignature(normalized) === pagesSignature(current.pages)) {
        return current;
      }
      return {
        ...current,
        pages: normalized,
        past: withPast(current.past, current.pages),
        future: [],
      };
    });
  }, []);

  const savePages = useCallback(() => {
    setState((current) => {
      const normalized = normalizePages(clonePages(current.pages));
      const savedAt = persistPages(normalized);
      return {
        ...current,
        pages: normalized,
        savedPages: clonePages(normalized),
        lastSavedAt: savedAt,
      };
    });
  }, []);

  const undoPages = useCallback(() => {
    setState((current) => {
      if (current.past.length === 0) return current;
      const previous = current.past[current.past.length - 1];
      return {
        ...current,
        pages: clonePages(previous),
        past: current.past.slice(0, -1),
        future: [...current.future, clonePages(current.pages)],
      };
    });
  }, []);

  const redoPages = useCallback(() => {
    setState((current) => {
      if (current.future.length === 0) return current;
      const next = current.future[current.future.length - 1];
      return {
        ...current,
        pages: clonePages(next),
        past: withPast(current.past, current.pages),
        future: current.future.slice(0, -1),
      };
    });
  }, []);

  const revertToSaved = useCallback(() => {
    setState((current) => {
      if (pagesSignature(current.pages) === pagesSignature(current.savedPages)) {
        return current;
      }
      return {
        ...current,
        pages: clonePages(current.savedPages),
        past: withPast(current.past, current.pages),
        future: [],
      };
    });
  }, []);

  const resetPages = useCallback(() => {
    setState((current) => {
      const defaults = normalizePages(clonePages(magicalBookPages));
      if (pagesSignature(current.pages) === pagesSignature(defaults)) {
        return current;
      }
      return {
        ...current,
        pages: defaults,
        past: withPast(current.past, current.pages),
        future: [],
      };
    });
  }, []);

  return {
    pages: state.pages,
    setPages,
    resetPages,
    savePages,
    undoPages,
    redoPages,
    revertToSaved,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    hasUnsavedChanges,
    lastSavedAt: state.lastSavedAt,
  };
}
