import { useEffect, useState } from "react";
import {
  createLayoutElements,
  magicalBookPages,
  normalizePageChrome,
  type BookPage,
  type BookPageLayout,
} from "../content/magicalBook";

const STORAGE_KEY = "mehrin_magical_book_pages_v1";

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
    const elements = Array.isArray(page.elements) && page.elements.length > 0
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

function loadPages(): BookPage[] {
  if (typeof window === "undefined") {
    return clonePages(magicalBookPages);
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return clonePages(magicalBookPages);

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return clonePages(magicalBookPages);

    return normalizePages(parsed as BookPage[]);
  } catch {
    return clonePages(magicalBookPages);
  }
}

export function useBookPages() {
  const [pages, setPages] = useState<BookPage[]>(() => loadPages());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
  }, [pages]);

  const resetPages = () => {
    setPages(clonePages(magicalBookPages));
  };

  return {
    pages,
    setPages,
    resetPages,
  };
}
