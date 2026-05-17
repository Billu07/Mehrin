import { useState, type Dispatch, type SetStateAction } from "react";
import { DEFAULT_PAGE_CHROME, createLayoutElements, type BookPage, type BookSpecialNote } from "../content/magicalBook";

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function createBlankPage(order: number): BookPage {
  const base: BookPage = {
    id: uid(`page-${order}`),
    layoutTemplate: "classic-split",
    chapter: { en: `Chapter ${order}`, bn: `Chapter ${order}` },
    title: { en: `New Page ${order}`, bn: `New Page ${order}` },
    subtitle: { en: "Add subtitle in page editor", bn: "Add subtitle in page editor" },
    narrative: { en: "Edit this page directly in the reading view editor.", bn: "Edit this page directly in the reading view editor." },
    dateLabel: "Date",
    palette: {
      ink: "#3f2f29",
      paper: "#fff8ea",
      glow: "#f5d8a8",
    },
    elements: [],
    artifacts: [],
    specialNotes: [],
    surpriseElements: [],
    chrome: JSON.parse(JSON.stringify(DEFAULT_PAGE_CHROME)) as typeof DEFAULT_PAGE_CHROME,
  };

  return { ...base, elements: createLayoutElements(base) };
}

function createBlankNote(): BookSpecialNote {
  return {
    id: uid("note"),
    author: "Family",
    relation: "Relative",
    date: new Date().toISOString().slice(0, 10),
    style: "letter",
    message: {
      en: "Write a dated note for the Notes tab.",
      bn: "Write a dated note for the Notes tab.",
    },
  };
}

interface AdminPanelProps {
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

export function AdminPanel({
  pages,
  setPages,
  resetPages,
  savePages,
  undoPages,
  redoPages,
  revertToSaved,
  canUndo,
  canRedo,
  hasUnsavedChanges,
  lastSavedAt,
}: AdminPanelProps) {
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const safeSelectedPageIndex = Math.min(selectedPageIndex, Math.max(0, pages.length - 1));
  const selectedPage = pages[safeSelectedPageIndex];
  const savedLabel = hasUnsavedChanges
    ? "Unsaved changes"
    : lastSavedAt
      ? `Saved ${new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(lastSavedAt)}`
      : "Not saved yet";

  const updateSelectedPage = (updater: (page: BookPage) => BookPage) => {
    setPages((current) =>
      current.map((page, index) => (index === safeSelectedPageIndex ? updater(page) : page)),
    );
  };

  const addPage = () => {
    setPages((current) => [...current, createBlankPage(current.length + 1)]);
    setSelectedPageIndex(pages.length);
  };

  const deletePage = () => {
    if (pages.length <= 1) return;
    setPages((current) => current.filter((_, index) => index !== safeSelectedPageIndex));
    setSelectedPageIndex((current) => Math.max(0, current - 1));
  };

  const movePage = (direction: -1 | 1) => {
    const target = safeSelectedPageIndex + direction;
    if (target < 0 || target >= pages.length) return;
    setPages((current) => {
      const next = [...current];
      const temp = next[safeSelectedPageIndex];
      next[safeSelectedPageIndex] = next[target];
      next[target] = temp;
      return next;
    });
    setSelectedPageIndex(target);
  };

  const addNote = () => {
    updateSelectedPage((page) => ({
      ...page,
      specialNotes: [...page.specialNotes, createBlankNote()],
    }));
  };

  const updateNote = (
    noteIndex: number,
    updater: (note: BookSpecialNote) => BookSpecialNote,
  ) => {
    updateSelectedPage((page) => ({
      ...page,
      specialNotes: page.specialNotes.map((note, index) =>
        index === noteIndex ? updater(note) : note,
      ),
    }));
  };

  const removeNote = (noteIndex: number) => {
    updateSelectedPage((page) => ({
      ...page,
      specialNotes: page.specialNotes.filter((_, index) => index !== noteIndex),
    }));
  };

  if (!selectedPage) return null;

  return (
    <main className="admin-app">
      <header className="admin-header">
        <div>
          <p>Mehrin Memory Lane</p>
          <h1>Admin: Order and Notes</h1>
        </div>
        <div className="admin-header-actions">
          <a href="/" className="admin-link">
            Open Diary
          </a>
          <button type="button" onClick={undoPages} disabled={!canUndo}>
            Undo
          </button>
          <button type="button" onClick={redoPages} disabled={!canRedo}>
            Redo
          </button>
          <button type="button" onClick={revertToSaved} disabled={!hasUnsavedChanges}>
            Revert
          </button>
          <button type="button" className={hasUnsavedChanges ? "active" : ""} onClick={savePages} disabled={!hasUnsavedChanges}>
            Save
          </button>
          <button type="button" onClick={resetPages}>
            Reset Default
          </button>
          <span className={`admin-save-status ${hasUnsavedChanges ? "unsaved" : "saved"}`}>{savedLabel}</span>
        </div>
      </header>

      <section className="admin-grid">
        <aside className="admin-sidebar">
          <div className="sidebar-actions">
            <button type="button" onClick={addPage}>
              Add Page
            </button>
            <button type="button" onClick={deletePage}>
              Delete
            </button>
          </div>
          <div className="sidebar-actions">
            <button type="button" onClick={() => movePage(-1)}>
              Move Up
            </button>
            <button type="button" onClick={() => movePage(1)}>
              Move Down
            </button>
          </div>
          <div className="page-list">
            {pages.map((page, index) => (
              <button
                key={page.id}
                type="button"
                className={index === safeSelectedPageIndex ? "active" : ""}
                onClick={() => setSelectedPageIndex(index)}
              >
                {index + 1}. {page.title.en}
              </button>
            ))}
          </div>
        </aside>

        <section className="admin-editor">
          <h2>Page Order Context</h2>
          <div className="editor-grid">
            <label>
              Page ID
              <input value={selectedPage.id} readOnly />
            </label>
            <label>
              Layout
              <input value={selectedPage.layoutTemplate} readOnly />
            </label>
            <label>
              Chapter (EN)
              <input value={selectedPage.chapter.en} readOnly />
            </label>
            <label>
              Title (EN)
              <input value={selectedPage.title.en} readOnly />
            </label>
          </div>
          <p className="admin-help">
            Content/layout editing now happens directly inside the page editor in the reading view.
          </p>

          <div className="subeditor">
            <div className="subeditor-head">
              <h3>Notes Tab Entries</h3>
              <button type="button" onClick={addNote}>
                Add Note
              </button>
            </div>
            {selectedPage.specialNotes.map((note, noteIndex) => (
              <article key={note.id} className="subcard">
                <div className="subcard-grid">
                  <label>
                    Author
                    <input
                      value={note.author}
                      onChange={(event) =>
                        updateNote(noteIndex, (item) => ({ ...item, author: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Relation
                    <input
                      value={note.relation}
                      onChange={(event) =>
                        updateNote(noteIndex, (item) => ({ ...item, relation: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Date
                    <input
                      value={note.date}
                      onChange={(event) =>
                        updateNote(noteIndex, (item) => ({ ...item, date: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Style
                    <select
                      value={note.style}
                      onChange={(event) =>
                        updateNote(noteIndex, (item) => ({
                          ...item,
                          style: event.target.value as BookSpecialNote["style"],
                        }))
                      }
                    >
                      <option value="letter">letter</option>
                      <option value="star">star</option>
                      <option value="ribbon">ribbon</option>
                    </select>
                  </label>
                  <button type="button" onClick={() => removeNote(noteIndex)}>
                    Remove
                  </button>
                </div>
                <div className="subcard-grid">
                  <label className="span-2">
                    Message (EN)
                    <textarea
                      rows={2}
                      value={note.message.en}
                      onChange={(event) =>
                        updateNote(noteIndex, (item) => ({
                          ...item,
                          message: { ...item.message, en: event.target.value },
                        }))
                      }
                    />
                  </label>
                  <label className="span-2">
                    Message (BN)
                    <textarea
                      rows={2}
                      value={note.message.bn}
                      onChange={(event) =>
                        updateNote(noteIndex, (item) => ({
                          ...item,
                          message: { ...item.message, bn: event.target.value },
                        }))
                      }
                    />
                  </label>
                </div>
              </article>
            ))}
          </div>

        </section>
      </section>
    </main>
  );
}
