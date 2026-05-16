import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import gsap from "gsap";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminPanel } from "./components/AdminPanel";
import { ChapterMap } from "./components/memoryLane/ChapterMap";
import { MagicalCursor } from "./components/memoryLane/MagicalCursor";
import {
  DEFAULT_PAGE_CHROME,
  LAYOUT_OPTIONS,
  createLayoutElements,
  magicalBookPages,
  normalizePageChrome,
  type BookLanguage,
  type BookPage,
  type BookPageElement,
  type BookPageElementType,
  type BookPageLayout,
  type BookSpecialNote,
} from "./content/magicalBook";
import { useBookPages } from "./hooks/useBookPages";
import { useResponsiveScale } from "./hooks/useResponsiveScale";
import {
  canUserEdit,
  getEditorAllowedEmails,
  isSupabaseEditorAuthEnabled,
  supabaseClient,
} from "./lib/editorAccess";
import { isCloudinaryUploadEnabled, uploadToCloudinary } from "./lib/cloudinary";
import type { User } from "@supabase/supabase-js";

type MemoryLaneScene = "cover" | "opening" | "index" | "chapter" | "notes" | "finale";

const DUST_PARTICLE_COUNT = 34;
const EDITOR_ACCESS_KEY = "memory_lane_editor_access_v1";
const EDITOR_PASSPHRASE = "mehrin-lane-admin";
const VIEWER_ACCESS_KEY = "memory_lane_viewer_access_v1";
const VIEWER_ACCESS_PASSWORD = (import.meta.env.VITE_VIEWER_ACCESS_PASSWORD as string | undefined)?.trim() ?? "";
const IS_VIEWER_GATE_ENABLED = VIEWER_ACCESS_PASSWORD.length > 0;

const SCENE_SEQUENCE: Array<{ id: MemoryLaneScene; label: string }> = [
  { id: "cover", label: "Cover" },
  { id: "opening", label: "Opening" },
  { id: "index", label: "Map" },
  { id: "chapter", label: "Page" },
  { id: "notes", label: "Notes" },
  { id: "finale", label: "Finale" },
];

function getLocalizedText(language: BookLanguage, text: { en: string; bn: string }): string {
  return text[language];
}

function isAdminPath(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname.replace(/\/+$/, "").endsWith("/admin");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function createElementId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeLocalizedCopy(value: string): { en: string; bn: string } {
  return { en: value, bn: value };
}

function createElement(type: BookPageElementType, language: BookLanguage): BookPageElement {
  const base: BookPageElement = {
    id: createElementId(type),
    type,
    label: makeLocalizedCopy(type),
    x: 26,
    y: 26,
    width: 30,
    height: 20,
    rotation: 0,
    zIndex: 3,
    rounded: true,
  };

  if (type === "text") {
    return {
      ...base,
      label: makeLocalizedCopy("Text"),
      text: makeLocalizedCopy(language === "bn" ? "Notun lekha" : "New text"),
      width: 36,
      height: 22,
    };
  }

  if (type === "image") {
    return {
      ...base,
      label: makeLocalizedCopy("Image"),
      src: "/watercolor/nursery-window.svg",
      width: 30,
      height: 26,
    };
  }

  if (type === "video") {
    return {
      ...base,
      label: makeLocalizedCopy("Video"),
      src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      width: 34,
      height: 24,
    };
  }

  if (type === "audio") {
    return {
      ...base,
      label: makeLocalizedCopy("Audio"),
      src: "",
      width: 34,
      height: 18,
    };
  }

  if (type === "secret") {
    return {
      ...base,
      label: makeLocalizedCopy("Secret"),
      revealText: makeLocalizedCopy(language === "bn" ? "Gopon note" : "Hidden note"),
      width: 20,
      height: 12,
      rotation: -4,
    };
  }

  return {
    ...base,
    label: makeLocalizedCopy("Sticker"),
    text: makeLocalizedCopy("*"),
    width: 14,
    height: 10,
    rotation: 4,
    opacity: 0.9,
  };
}

function App() {
  const { pages, setPages, resetPages } = useBookPages();
  const adminPath = isAdminPath();
  const safePages = pages.length > 0 ? pages : magicalBookPages;
  const editorAllowedEmails = getEditorAllowedEmails();

  const [scene, setScene] = useState<MemoryLaneScene>("cover");
  const [language, setLanguage] = useState<BookLanguage>("en");
  const [chapterIndex, setChapterIndex] = useState(0);
  const [mapHoverIndex, setMapHoverIndex] = useState(0);
  const [hasPasscodeAccess, setHasPasscodeAccess] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem(EDITOR_ACCESS_KEY) === "1",
  );
  const [hasViewerAccess, setHasViewerAccess] = useState(
    () => !IS_VIEWER_GATE_ENABLED || (typeof window !== "undefined" && window.localStorage.getItem(VIEWER_ACCESS_KEY) === "1"),
  );
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(() => isSupabaseEditorAuthEnabled);
  const [adminViewerPreview, setAdminViewerPreview] = useState(false);
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [openedSecrets, setOpenedSecrets] = useState<Record<string, boolean>>({});
  const [uploadingElementId, setUploadingElementId] = useState<string | null>(null);
  const [adminLoginEmail, setAdminLoginEmail] = useState(() => editorAllowedEmails[0] ?? "");
  const [adminPasscode, setAdminPasscode] = useState("");
  const [adminAuthMessage, setAdminAuthMessage] = useState<string>("");
  const [viewerPasswordInput, setViewerPasswordInput] = useState("");
  const [viewerAuthMessage, setViewerAuthMessage] = useState<string>("");
  const enableMagicalCursor = false;

  const { stageStyle, isPortrait } = useResponsiveScale();
  const transitionOverlayRef = useRef<HTMLDivElement | null>(null);
  const coverArtworkRef = useRef<HTMLDivElement | null>(null);
  const chapterFrameRef = useRef<HTMLDivElement | null>(null);
  const chapterCanvasRef = useRef<HTMLDivElement | null>(null);
  const isTransitioningRef = useRef(false);

  const normalizedChapterIndex = safePages.length > 0 ? clamp(chapterIndex, 0, safePages.length - 1) : 0;
  const activePage = safePages[normalizedChapterIndex];
  const activeElements = activePage?.elements ?? [];
  const selectedElement = activeElements.find((item) => item.id === selectedElementId) ?? null;
  const activePageChrome = normalizePageChrome(activePage?.chrome ?? DEFAULT_PAGE_CHROME);
  const hasEditorAccess = isSupabaseEditorAuthEnabled ? canUserEdit(authUser) : hasPasscodeAccess;
  const canUseEditorTools = hasEditorAccess && !adminViewerPreview;

  const chapterNodes = useMemo(() => {
    const dividerNodes = safePages.flatMap((page, pageIndex) =>
      page.layoutTemplate === "chapter-divider"
        ? [
            {
              id: page.id,
              pageIndex,
              chapter: getLocalizedText(language, page.chapter),
              title: getLocalizedText(language, page.title),
            },
          ]
        : [],
    );

    if (dividerNodes.length > 0) return dividerNodes;

    return safePages.map((page, pageIndex) => ({
      id: page.id,
      pageIndex,
      chapter: getLocalizedText(language, page.chapter),
      title: getLocalizedText(language, page.title),
    }));
  }, [language, safePages]);

  const findNodeIndexByPage = useCallback(
    (pageIndex: number): number => {
      const exact = chapterNodes.findIndex((node) => node.pageIndex === pageIndex);
      if (exact >= 0) return exact;
      let nearest = 0;
      for (let index = 0; index < chapterNodes.length; index += 1) {
        if (chapterNodes[index].pageIndex <= pageIndex) nearest = index;
      }
      return nearest;
    },
    [chapterNodes],
  );
  const nodeIndexForPage = chapterNodes.length > 0 ? findNodeIndexByPage(normalizedChapterIndex) : 0;
  const normalizedMapIndex =
    chapterNodes.length > 0
      ? clamp(scene === "index" ? mapHoverIndex : nodeIndexForPage, 0, chapterNodes.length - 1)
      : 0;
  const noteEntries = useMemo(
    () =>
      safePages.flatMap((page, pageIndex) =>
        page.specialNotes.map((note, noteIndex) => ({
          page,
          pageIndex,
          note,
          noteIndex,
        })),
      ),
    [safePages],
  );

  useEffect(() => {
    if (!isSupabaseEditorAuthEnabled || !supabaseClient) return undefined;

    let isMounted = true;
    void supabaseClient.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setAuthUser(data.session?.user ?? null);
      setIsAuthLoading(false);
    });

    const { data: listener } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const runMagicalTransition = useCallback(
    (nextScene: MemoryLaneScene, beforeSwitch?: () => void) => {
      if (isTransitioningRef.current) return;

      const overlay = transitionOverlayRef.current;
      if (!overlay) {
        beforeSwitch?.();
        setScene(nextScene);
        return;
      }

      const particles = Array.from(overlay.querySelectorAll<HTMLSpanElement>(".transition-dust"));
      isTransitioningRef.current = true;
      gsap.killTweensOf([overlay, ...particles]);

      const timeline = gsap.timeline({
        onComplete: () => {
          isTransitioningRef.current = false;
          gsap.set(overlay, { pointerEvents: "none" });
        },
      });

      timeline
        .set(overlay, { pointerEvents: "auto", autoAlpha: 0 })
        .set(particles, { autoAlpha: 0, scale: 0.2, x: 0, y: 0 })
        .to(overlay, { autoAlpha: 1, duration: 0.36, ease: "power2.out" })
        .to(
          particles,
          {
            autoAlpha: 0.95,
            scale: 1,
            x: () => gsap.utils.random(-300, 300),
            y: () => gsap.utils.random(-180, 180),
            duration: 0.55,
            ease: "power2.out",
            stagger: { each: 0.015, from: "random" },
          },
          0,
        )
        .add(() => {
          beforeSwitch?.();
          setScene(nextScene);
        }, 0.42)
        .to(
          particles,
          {
            autoAlpha: 0,
            scale: 0.1,
            duration: 0.46,
            ease: "power2.in",
            stagger: { each: 0.012, from: "random" },
          },
          0.52,
        )
        .to(overlay, { autoAlpha: 0, duration: 0.42, ease: "power2.inOut" }, 0.66);
    },
    [],
  );

  useEffect(() => {
    if (scene !== "cover") return undefined;
    const artwork = coverArtworkRef.current;
    if (!artwork) return undefined;

    const breathe = gsap.timeline({ repeat: -1, yoyo: true });
    breathe
      .to(artwork, { scale: 1.02, rotateZ: -0.45, duration: 4.2, ease: "sine.inOut" })
      .to(artwork, { scale: 1, rotateZ: 0.38, duration: 4.2, ease: "sine.inOut" });

    const tiltX = gsap.quickTo(artwork, "rotationY", { duration: 0.8, ease: "power3.out" });
    const tiltY = gsap.quickTo(artwork, "rotationX", { duration: 0.8, ease: "power3.out" });
    const onPointerMove = (event: PointerEvent) => {
      const offsetX = (event.clientX / window.innerWidth - 0.5) * 6;
      const offsetY = (event.clientY / window.innerHeight - 0.5) * 4;
      tiltX(offsetX);
      tiltY(-offsetY);
    };

    window.addEventListener("pointermove", onPointerMove);
    return () => {
      breathe.kill();
      window.removeEventListener("pointermove", onPointerMove);
      gsap.killTweensOf(artwork);
      gsap.set(artwork, { rotationX: 0, rotationY: 0, scale: 1, rotateZ: 0 });
    };
  }, [scene]);

  useEffect(() => {
    if (!chapterFrameRef.current || scene !== "chapter") return undefined;
    const frame = chapterFrameRef.current;
    const onMove = (event: PointerEvent) => {
      const horizontal = (event.clientX / window.innerWidth - 0.5) * 18;
      const vertical = (event.clientY / window.innerHeight - 0.5) * 12;
      gsap.to(frame, {
        "--pointer-x": `${50 + horizontal}%`,
        "--pointer-y": `${50 + vertical}%`,
        duration: 0.5,
        ease: "power3.out",
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [scene]);

  const openScene = (nextScene: MemoryLaneScene) => runMagicalTransition(nextScene);

  const updatePageAt = useCallback(
    (pageIndex: number, updater: (page: BookPage) => BookPage) => {
      setPages((current) => {
        const source = current.length > 0 ? current : magicalBookPages;
        return source.map((page, index) => (index === pageIndex ? updater(page) : page));
      });
    },
    [setPages],
  );

  const goToPage = useCallback(
    (index: number) => {
      if (safePages.length === 0) return;
      const normalized = ((index % safePages.length) + safePages.length) % safePages.length;
      runMagicalTransition("chapter", () => {
        setChapterIndex(normalized);
        setMapHoverIndex(findNodeIndexByPage(normalized));
        setSelectedElementId(null);
      });
    },
    [findNodeIndexByPage, runMagicalTransition, safePages.length],
  );

  const openChapterFromMap = (pageIndex: number) => {
    goToPage(pageIndex);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && scene !== "cover") {
        runMagicalTransition("index");
      }

      if (scene === "cover" && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        runMagicalTransition("opening");
      }

      if (scene === "opening" && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        runMagicalTransition("index");
      }

      if (scene === "chapter" && safePages.length > 0) {
        if (event.key === "ArrowRight") {
          goToPage(normalizedChapterIndex + 1);
        }
        if (event.key === "ArrowLeft") {
          goToPage(normalizedChapterIndex - 1);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goToPage, normalizedChapterIndex, runMagicalTransition, safePages.length, scene]);

  const requestEditorAccess = async (credentials?: { email?: string; passcode?: string }) => {
    if (typeof window === "undefined") return;

    if (isSupabaseEditorAuthEnabled && supabaseClient) {
      if (authUser && !hasEditorAccess) {
        const allowText =
          editorAllowedEmails.length > 0
            ? `Allowed emails: ${editorAllowedEmails.join(", ")}`
            : "No allowlist found. Assign user role in Supabase app_metadata as admin/editor.";
        setAdminAuthMessage(`Signed in but editor permission is missing. ${allowText}`);
        return;
      }

      if (authUser) {
        await supabaseClient.auth.signOut();
        setIsEditorMode(false);
        setAdminViewerPreview(false);
        setAdminAuthMessage("Signed out.");
        return;
      }

      const email = credentials?.email?.trim();
      if (!email) return;

      const redirectTo = `${window.location.origin}/admin`;
      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) {
        setAdminAuthMessage(`Sign-in failed: ${error.message}`);
        return;
      }
      setAdminAuthMessage("Magic link sent. Open the email and continue to /admin.");
      return;
    }

    if (hasPasscodeAccess) {
      setHasPasscodeAccess(false);
      setIsEditorMode(false);
      setAdminViewerPreview(false);
      window.localStorage.removeItem(EDITOR_ACCESS_KEY);
      return;
    }

    const pin = credentials?.passcode?.trim();
    if (!pin) return;
    if (pin !== EDITOR_PASSPHRASE) {
      setAdminAuthMessage("Passcode is incorrect.");
      return;
    }
    window.localStorage.setItem(EDITOR_ACCESS_KEY, "1");
    setHasPasscodeAccess(true);
    setAdminAuthMessage("Access granted.");
  };

  const signOutEditorSession = async () => {
    if (isSupabaseEditorAuthEnabled && supabaseClient && authUser) {
      await supabaseClient.auth.signOut();
      setIsEditorMode(false);
      setAdminViewerPreview(false);
      setAdminAuthMessage("Signed out.");
      return;
    }
    if (!isSupabaseEditorAuthEnabled && hasPasscodeAccess) {
      setHasPasscodeAccess(false);
      setIsEditorMode(false);
      setAdminViewerPreview(false);
      window.localStorage.removeItem(EDITOR_ACCESS_KEY);
      setAdminAuthMessage("Signed out.");
    }
  };

  const submitAdminLogin = async () => {
    setAdminAuthMessage("");
    if (isSupabaseEditorAuthEnabled) {
      if (!adminLoginEmail.trim()) {
        setAdminAuthMessage("Enter an allowed editor email.");
        return;
      }
      await requestEditorAccess({ email: adminLoginEmail.trim() });
      return;
    }
    if (!adminPasscode.trim()) {
      setAdminAuthMessage("Enter editor passcode.");
      return;
    }
    await requestEditorAccess({ passcode: adminPasscode.trim() });
  };

  const submitViewerAccess = () => {
    if (!IS_VIEWER_GATE_ENABLED) {
      setHasViewerAccess(true);
      return;
    }

    if (viewerPasswordInput.trim() !== VIEWER_ACCESS_PASSWORD) {
      setViewerAuthMessage("Incorrect access password.");
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(VIEWER_ACCESS_KEY, "1");
    }
    setHasViewerAccess(true);
    setViewerAuthMessage("");
    setViewerPasswordInput("");
  };

  const toggleAdminViewerPreview = () => {
    setAdminViewerPreview((current) => {
      const next = !current;
      if (next) setIsEditorMode(false);
      return next;
    });
  };

  const updateActivePageField = <T extends keyof BookPage>(key: T, value: BookPage[T]) => {
    updatePageAt(normalizedChapterIndex, (page) => ({ ...page, [key]: value }));
  };

  const updateLocalizedPageField = (
    key: "chapter" | "title" | "subtitle" | "narrative",
    value: string,
  ) => {
    if (!activePage) return;
    updateActivePageField(key, {
      ...activePage[key],
      [language]: value,
    });
  };

  const updateElement = (elementId: string, updater: (element: BookPageElement) => BookPageElement) => {
    updatePageAt(normalizedChapterIndex, (page) => ({
      ...page,
      elements: page.elements.map((element) => (element.id === elementId ? updater(element) : element)),
    }));
  };

  const updatePageChromeControl = (
    control: "home" | "notes",
    updater: (current: { visible: boolean; x: number; y: number }) => { visible: boolean; x: number; y: number },
  ) => {
    updatePageAt(normalizedChapterIndex, (page) => {
      const chrome = normalizePageChrome(page.chrome);
      return {
        ...page,
        chrome: {
          ...chrome,
          [control]: updater(chrome[control]),
        },
      };
    });
  };

  const updateSpecialNote = (
    pageIndex: number,
    noteId: string,
    updater: (note: BookSpecialNote) => BookSpecialNote,
  ) => {
    updatePageAt(pageIndex, (page) => ({
      ...page,
      specialNotes: page.specialNotes.map((note) => (note.id === noteId ? updater(note) : note)),
    }));
  };

  const addSpecialNote = (pageIndex: number) => {
    const note: BookSpecialNote = {
      id: createElementId("note"),
      author: "Family",
      relation: "Relative",
      date: new Date().toISOString().slice(0, 10),
      style: "letter",
      message: makeLocalizedCopy("Write a heartfelt dated note."),
    };
    updatePageAt(pageIndex, (page) => ({
      ...page,
      specialNotes: [...page.specialNotes, note],
    }));
  };

  const removeSpecialNote = (pageIndex: number, noteId: string) => {
    updatePageAt(pageIndex, (page) => ({
      ...page,
      specialNotes: page.specialNotes.filter((note) => note.id !== noteId),
    }));
  };

  const deleteSelectedElement = () => {
    if (!selectedElementId) return;
    updatePageAt(normalizedChapterIndex, (page) => ({
      ...page,
      elements: page.elements.filter((element) => element.id !== selectedElementId),
    }));
    setSelectedElementId(null);
  };

  const duplicateSelectedElement = () => {
    if (!selectedElement) return;
    const duplicate = {
      ...selectedElement,
      id: createElementId(selectedElement.type),
      x: clamp(selectedElement.x + 2, 0, 100 - selectedElement.width),
      y: clamp(selectedElement.y + 2, 0, 100 - selectedElement.height),
      zIndex: selectedElement.zIndex + 1,
    };
    updatePageAt(normalizedChapterIndex, (page) => ({
      ...page,
      elements: [...page.elements, duplicate],
    }));
    setSelectedElementId(duplicate.id);
  };

  const addElement = (type: BookPageElementType) => {
    const element = createElement(type, language);
    updatePageAt(normalizedChapterIndex, (page) => ({
      ...page,
      elements: [...page.elements, element],
    }));
    setSelectedElementId(element.id);
  };

  const uploadElementAsset = async (elementId: string, file: File) => {
    if (!isCloudinaryUploadEnabled) {
      window.alert("Cloudinary upload is not configured yet.");
      return;
    }

    try {
      setUploadingElementId(elementId);
      const url = await uploadToCloudinary(file);
      updateElement(elementId, (element) => ({
        ...element,
        src: url,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed.";
      window.alert(message);
    } finally {
      setUploadingElementId(null);
    }
  };

  const applyLayoutPreset = (nextLayout: BookPageLayout) => {
    const shouldReset = window.confirm("Switch layout and reset page slots?");
    if (!shouldReset) {
      updateActivePageField("layoutTemplate", nextLayout);
      return;
    }
    updatePageAt(normalizedChapterIndex, (page) => {
      const updated = { ...page, layoutTemplate: nextLayout };
      return {
        ...updated,
        elements: createLayoutElements(updated),
      };
    });
    setSelectedElementId(null);
  };

  const moveElementByOffset = (element: BookPageElement, info: PanInfo) => {
    const container = chapterCanvasRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const deltaX = (info.offset.x / rect.width) * 100;
    const deltaY = (info.offset.y / rect.height) * 100;
    const nextX = clamp(element.x + deltaX, 0, 100 - element.width);
    const nextY = clamp(element.y + deltaY, 0, 100 - element.height);
    updateElement(element.id, (current) => ({ ...current, x: nextX, y: nextY }));
  };

  const movePageControlByOffset = (control: "home" | "notes", info: PanInfo) => {
    const container = chapterCanvasRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const current = activePageChrome[control];
    const deltaX = (info.offset.x / rect.width) * 100;
    const deltaY = (info.offset.y / rect.height) * 100;
    const nextX = clamp(current.x + deltaX, 0, 100);
    const nextY = clamp(current.y + deltaY, 0, 100);
    updatePageChromeControl(control, (item) => ({
      ...item,
      x: nextX,
      y: nextY,
    }));
  };

  const renderElementBody = (element: BookPageElement) => {
    if (element.type === "image") {
      return element.src ? <img src={element.src} alt={getLocalizedText(language, element.label)} /> : <div className="empty-slot">Image slot</div>;
    }
    if (element.type === "video") {
      return element.src ? (
        <video controls preload="metadata" playsInline>
          <source src={element.src} />
        </video>
      ) : (
        <div className="empty-slot">Video slot</div>
      );
    }
    if (element.type === "audio") {
      return element.src ? (
        <audio controls preload="metadata">
          <source src={element.src} />
        </audio>
      ) : (
        <div className="empty-slot">Audio slot</div>
      );
    }
    if (element.type === "secret") {
      const secretKey = `${activePage.id}-${element.id}`;
      const visible = openedSecrets[secretKey];
      return (
        <button
          type="button"
          className={`secret-seal ${visible ? "revealed" : ""}`}
          onClick={() =>
            setOpenedSecrets((current) => ({
              ...current,
              [secretKey]: !current[secretKey],
            }))
          }
        >
          <span>Secret</span>
          {visible && element.revealText ? <p>{getLocalizedText(language, element.revealText)}</p> : null}
        </button>
      );
    }
    if (element.type === "sticker") {
      return <p className="sticker-text">{element.text ? getLocalizedText(language, element.text) : "*"}</p>;
    }

    return <p>{element.text ? getLocalizedText(language, element.text) : "Text"}</p>;
  };

  if (adminPath) {
    if (isSupabaseEditorAuthEnabled && isAuthLoading) {
      return (
        <main className="admin-app">
          <section className="admin-header">
            <div>
              <p>Mehrin Memory Lane</p>
              <h1>Checking Admin Access...</h1>
            </div>
          </section>
        </main>
      );
    }

    if (!hasEditorAccess) {
      return (
        <main className="admin-app">
          <section className="admin-header">
            <div>
              <p>Mehrin Memory Lane</p>
              <h1>Admin Login</h1>
            </div>
            <div className="admin-header-actions">
              <a href="/" className="admin-link">
                Back To Book
              </a>
            </div>
          </section>
          <section className="admin-editor" style={{ marginTop: "0.9rem", maxWidth: "720px" }}>
            <h2>Restricted Access</h2>
            <p className="admin-help">Only allowed editor emails can access admin and page editing controls.</p>
            {isSupabaseEditorAuthEnabled ? (
              <div className="editor-grid">
                <label>
                  Editor Email
                  <input
                    type="email"
                    value={adminLoginEmail}
                    onChange={(event) => setAdminLoginEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </label>
                <label>
                  Current Session
                  <input value={authUser?.email ?? "Not signed in"} readOnly />
                </label>
              </div>
            ) : (
              <div className="editor-grid">
                <label>
                  Editor Passcode
                  <input
                    type="password"
                    value={adminPasscode}
                    onChange={(event) => setAdminPasscode(event.target.value)}
                    placeholder="Enter passcode"
                  />
                </label>
              </div>
            )}
            <div className="admin-header-actions" style={{ marginTop: "0.8rem", justifyContent: "flex-start" }}>
              <button type="button" onClick={() => void submitAdminLogin()}>
                {isSupabaseEditorAuthEnabled ? "Send Magic Link" : "Unlock Admin"}
              </button>
              {authUser ? (
                <button type="button" onClick={() => void signOutEditorSession()}>
                  Sign Out Current Session
                </button>
              ) : null}
            </div>
            {adminAuthMessage ? <p className="admin-help">{adminAuthMessage}</p> : null}
          </section>
        </main>
      );
    }
    return <AdminPanel pages={pages} setPages={setPages} resetPages={resetPages} />;
  }

  if (IS_VIEWER_GATE_ENABLED && !hasViewerAccess && !hasEditorAccess) {
    if (isSupabaseEditorAuthEnabled && isAuthLoading) {
      return (
        <main className="admin-app">
          <section className="admin-header">
            <div>
              <p>Mehrin Memory Lane</p>
              <h1>Checking Access...</h1>
            </div>
          </section>
        </main>
      );
    }

    return (
      <main className="admin-app">
        <section className="admin-header">
          <div>
            <p>Mehrin Memory Lane</p>
            <h1>Viewer Access</h1>
          </div>
          <div className="admin-header-actions">
            <a href="/admin" className="admin-link">
              Admin Login
            </a>
          </div>
        </section>
        <section className="admin-editor" style={{ marginTop: "0.9rem", maxWidth: "720px" }}>
          <h2>Enter Viewing Password</h2>
          <p className="admin-help">This scrapbook is protected. Enter the viewer password to continue.</p>
          <div className="editor-grid">
            <label>
              Access Password
              <input
                type="password"
                value={viewerPasswordInput}
                onChange={(event) => setViewerPasswordInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void submitViewerAccess();
                }}
                placeholder="Enter viewer password"
              />
            </label>
          </div>
          <div className="admin-header-actions" style={{ marginTop: "0.8rem", justifyContent: "flex-start" }}>
            <button type="button" onClick={() => void submitViewerAccess()}>
              Enter Memory Lane
            </button>
          </div>
          {viewerAuthMessage ? <p className="admin-help">{viewerAuthMessage}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className={`memory-lane-root ${isPortrait ? "is-portrait" : ""} ${enableMagicalCursor ? "has-magical-cursor" : "no-magical-cursor"}`}>
      <div className="book-stage-shell">
        <div className="book-stage" style={stageStyle}>
          {scene !== "cover" && scene !== "opening" ? (
            <header className="stage-topbar layer-foreground">
              <div className="topbar-left">
                <p>Magical Family Heirloom</p>
                <h1>Mehrin&apos;s Memory Lane</h1>
              </div>
              <div className="topbar-actions">
                <button type="button" className={language === "bn" ? "active" : ""} onClick={() => setLanguage("bn")}>
                  Bangla
                </button>
                <button type="button" className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>
                  English
                </button>
                {hasEditorAccess ? (
                  <button type="button" className={adminViewerPreview ? "active" : ""} onClick={toggleAdminViewerPreview}>
                    {adminViewerPreview ? "Editor View" : "Viewer View"}
                  </button>
                ) : null}
                {hasEditorAccess ? <span className="editor-session">{authUser?.email ?? "Editor unlocked"}</span> : null}
                {hasEditorAccess ? (
                  <button type="button" onClick={() => void signOutEditorSession()}>
                    Sign Out
                  </button>
                ) : null}
                <a href="/admin">Admin Portal</a>
              </div>
            </header>
          ) : null}

          <div className="scene-stack" role="application" aria-label="Mehrin's Memory Lane interactive scrapbook">
            <AnimatePresence mode="wait">
              {scene === "cover" ? (
                <motion.section key="cover" className="scene-frame" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div ref={coverArtworkRef} className="layer-background scene-artwork scene-bg-cover cover-artboard">
                    <div className="cover-spine" />
                    <div className="cover-gild-frame" />
                    <div className="cover-corner top-left" />
                    <div className="cover-corner top-right" />
                    <div className="cover-corner bottom-left" />
                    <div className="cover-corner bottom-right" />
                    <div className="cover-center-crest" aria-hidden="true">
                      <span>M</span>
                    </div>
                    <div className="cover-lock-plate" aria-hidden="true">
                      <span />
                    </div>
                  </div>
                  <div className="layer-midground scene-vignette scene-vignette-cover" />
                  <div className="layer-content cover-content">
                    <p className="cover-kicker">Mehrin&apos;s Memory Lane</p>
                    <p className="cover-subtitle">Touch the monogram or brass lock to open the heirloom.</p>
                    <button type="button" className="cover-open-button" onClick={() => openScene("opening")}>
                      Begin Journey
                    </button>
                  </div>
                  <div className="layer-interactive cover-interactions">
                    <button type="button" className="insignia-button cover-hotspot" aria-label="Open the magical book" onClick={() => openScene("opening")} />
                    <button type="button" className="lock-button cover-hotspot" aria-label="Unlock and open" onClick={() => openScene("opening")} />
                  </div>
                </motion.section>
              ) : null}

              {scene === "opening" ? (
                <motion.section key="opening" className="scene-frame" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                  <div className="layer-background scene-artwork scene-bg-opening" />
                  <div className="layer-midground scene-vignette" />
                  <div className="layer-content opening-copy">
                    <h2>Dedicated to Mehrin</h2>
                    <p>Every memory is a star in your story. Collect them all, and the story shines forever.</p>
                  </div>
                  <div className="layer-interactive opening-actions">
                    <button type="button" className="begin-journey-button" onClick={() => openScene("index")}>
                      Begin Journey
                    </button>
                  </div>
                </motion.section>
              ) : null}

              {scene === "index" ? (
                <motion.section key="index" className="scene-frame" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}>
                  <div className="layer-background scene-artwork scene-bg-index scene-map-backdrop" />
                  <div className="layer-midground scene-vignette scene-vignette-night" />
                  <div className="layer-content map-frame">
                    <ChapterMap
                      chapters={chapterNodes}
                      activeIndex={normalizedMapIndex}
                      onActiveIndexChange={setMapHoverIndex}
                      onOpenChapter={openChapterFromMap}
                    />
                  </div>
                  <div className="layer-interactive map-actions">
                    <button type="button" onClick={() => openScene("notes")} aria-label="Open family notes">
                      Journal
                    </button>
                    <button type="button" onClick={() => openScene("chapter")} aria-label="Continue reading pages">
                      Continue
                    </button>
                  </div>
                </motion.section>
              ) : null}

              {scene === "chapter" && activePage ? (
                <motion.section key={`chapter-${activePage.id}`} className="scene-frame" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <div ref={chapterFrameRef} className="layer-background scene-artwork scene-artwork-dynamic scene-bg-chapter" />
                  <div className="layer-midground scene-vignette scene-vignette-paper" />

                  <div className={`layer-content page-canvas-shell ${canUseEditorTools && isEditorMode ? "is-editor has-inspector" : ""}`}>
                    {canUseEditorTools ? (
                      <div className="page-editor-toolbar">
                        <button type="button" className={isEditorMode ? "active" : ""} onClick={() => setIsEditorMode((state) => !state)}>
                          {isEditorMode ? "Editing On" : "Editing Off"}
                        </button>
                        <select
                          value={activePage.layoutTemplate}
                          onChange={(event) => applyLayoutPreset(event.target.value as BookPageLayout)}
                        >
                          {LAYOUT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {isEditorMode ? (
                          <>
                            <button type="button" onClick={() => addElement("text")}>+ Text</button>
                            <button type="button" onClick={() => addElement("image")}>+ Image</button>
                            <button type="button" onClick={() => addElement("video")}>+ Video</button>
                            <button type="button" onClick={() => addElement("audio")}>+ Audio</button>
                            <button type="button" onClick={() => addElement("secret")}>+ Secret</button>
                            <button type="button" onClick={() => addElement("sticker")}>+ Sticker</button>
                            <button type="button" onClick={duplicateSelectedElement} disabled={!selectedElement}>
                              Duplicate
                            </button>
                            <button type="button" onClick={deleteSelectedElement} disabled={!selectedElement}>
                              Delete
                            </button>
                          </>
                        ) : null}
                      </div>
                    ) : null}

                    <div ref={chapterCanvasRef} className={`page-canvas ${activePage.layoutTemplate === "chapter-divider" ? "is-divider" : ""}`}>
                      <p className="page-date">{activePage.dateLabel}</p>
                      {activeElements.map((element) => (
                        <motion.div
                          key={element.id}
                          className={`page-element type-${element.type} ${selectedElementId === element.id ? "selected" : ""}`}
                          style={{
                            left: `${element.x}%`,
                            top: `${element.y}%`,
                            width: `${element.width}%`,
                            height: `${element.height}%`,
                            rotate: element.rotation,
                            zIndex: element.zIndex,
                            opacity: element.opacity ?? 1,
                          }}
                          drag={canUseEditorTools && isEditorMode}
                          dragMomentum={false}
                          dragElastic={0}
                          onDragEnd={(_, info) => moveElementByOffset(element, info)}
                          onPointerDown={() => {
                            if (!canUseEditorTools || !isEditorMode) return;
                            setSelectedElementId(element.id);
                          }}
                        >
                          {renderElementBody(element)}
                        </motion.div>
                      ))}
                    </div>

                    {canUseEditorTools && isEditorMode ? (
                      <aside className="element-inspector">
                        <section className="inspector-section">
                          <h4>Page Settings</h4>
                          <div className="inspector-grid-two">
                            <label>
                              Chapter
                              <input
                                value={getLocalizedText(language, activePage.chapter)}
                                onChange={(event) => updateLocalizedPageField("chapter", event.target.value)}
                              />
                            </label>
                            <label>
                              Title
                              <input
                                value={getLocalizedText(language, activePage.title)}
                                onChange={(event) => updateLocalizedPageField("title", event.target.value)}
                              />
                            </label>
                            <label>
                              Subtitle
                              <input
                                value={getLocalizedText(language, activePage.subtitle)}
                                onChange={(event) => updateLocalizedPageField("subtitle", event.target.value)}
                              />
                            </label>
                            <label>
                              Date
                              <input
                                value={activePage.dateLabel}
                                onChange={(event) => updateActivePageField("dateLabel", event.target.value)}
                              />
                            </label>
                          </div>
                          <label>
                            Narrative
                            <textarea
                              rows={3}
                              value={getLocalizedText(language, activePage.narrative)}
                              onChange={(event) => updateLocalizedPageField("narrative", event.target.value)}
                            />
                          </label>
                        </section>

                        <section className="inspector-section">
                          <h4>Page Navigation Buttons</h4>
                          <div className="inspector-inline">
                            <label className="toggle-control">
                              <input
                                type="checkbox"
                                checked={activePageChrome.home.visible}
                                onChange={(event) =>
                                  updatePageChromeControl("home", (current) => ({ ...current, visible: event.target.checked }))
                                }
                              />
                              <span>Show Home Button</span>
                            </label>
                            <div className="inspector-grid-two">
                              <label>
                                Home X%
                                <input
                                  type="number"
                                  value={activePageChrome.home.x}
                                  onChange={(event) =>
                                    updatePageChromeControl("home", (current) => ({
                                      ...current,
                                      x: clamp(Number(event.target.value), 0, 100),
                                    }))
                                  }
                                />
                              </label>
                              <label>
                                Home Y%
                                <input
                                  type="number"
                                  value={activePageChrome.home.y}
                                  onChange={(event) =>
                                    updatePageChromeControl("home", (current) => ({
                                      ...current,
                                      y: clamp(Number(event.target.value), 0, 100),
                                    }))
                                  }
                                />
                              </label>
                            </div>
                          </div>
                          <div className="inspector-inline">
                            <label className="toggle-control">
                              <input
                                type="checkbox"
                                checked={activePageChrome.notes.visible}
                                onChange={(event) =>
                                  updatePageChromeControl("notes", (current) => ({ ...current, visible: event.target.checked }))
                                }
                              />
                              <span>Show Notes Button</span>
                            </label>
                            <div className="inspector-grid-two">
                              <label>
                                Notes X%
                                <input
                                  type="number"
                                  value={activePageChrome.notes.x}
                                  onChange={(event) =>
                                    updatePageChromeControl("notes", (current) => ({
                                      ...current,
                                      x: clamp(Number(event.target.value), 0, 100),
                                    }))
                                  }
                                />
                              </label>
                              <label>
                                Notes Y%
                                <input
                                  type="number"
                                  value={activePageChrome.notes.y}
                                  onChange={(event) =>
                                    updatePageChromeControl("notes", (current) => ({
                                      ...current,
                                      y: clamp(Number(event.target.value), 0, 100),
                                    }))
                                  }
                                />
                              </label>
                            </div>
                          </div>
                        </section>

                        <section className="inspector-section">
                          <h4>Selected Element</h4>
                          {selectedElement ? <p>{selectedElement.type}</p> : <p>Select an element to edit its slot.</p>}
                          {selectedElement ? (
                            <>
                              <div className="inspector-grid-two">
                                <label>
                                  X
                                  <input
                                    type="number"
                                    value={selectedElement.x}
                                    onChange={(event) =>
                                      updateElement(selectedElement.id, (element) => ({
                                        ...element,
                                        x: clamp(Number(event.target.value), 0, 100 - element.width),
                                      }))
                                    }
                                  />
                                </label>
                                <label>
                                  Y
                                  <input
                                    type="number"
                                    value={selectedElement.y}
                                    onChange={(event) =>
                                      updateElement(selectedElement.id, (element) => ({
                                        ...element,
                                        y: clamp(Number(event.target.value), 0, 100 - element.height),
                                      }))
                                    }
                                  />
                                </label>
                                <label>
                                  Width
                                  <input
                                    type="number"
                                    value={selectedElement.width}
                                    onChange={(event) =>
                                      updateElement(selectedElement.id, (element) => ({
                                        ...element,
                                        width: clamp(Number(event.target.value), 8, 100),
                                        x: clamp(element.x, 0, 100 - clamp(Number(event.target.value), 8, 100)),
                                      }))
                                    }
                                  />
                                </label>
                                <label>
                                  Height
                                  <input
                                    type="number"
                                    value={selectedElement.height}
                                    onChange={(event) =>
                                      updateElement(selectedElement.id, (element) => ({
                                        ...element,
                                        height: clamp(Number(event.target.value), 6, 100),
                                        y: clamp(element.y, 0, 100 - clamp(Number(event.target.value), 6, 100)),
                                      }))
                                    }
                                  />
                                </label>
                                <label>
                                  Rotation
                                  <input
                                    type="number"
                                    value={selectedElement.rotation}
                                    onChange={(event) =>
                                      updateElement(selectedElement.id, (element) => ({
                                        ...element,
                                        rotation: Number(event.target.value),
                                      }))
                                    }
                                  />
                                </label>
                                <label>
                                  Z Index
                                  <input
                                    type="number"
                                    value={selectedElement.zIndex}
                                    onChange={(event) =>
                                      updateElement(selectedElement.id, (element) => ({
                                        ...element,
                                        zIndex: Number(event.target.value),
                                      }))
                                    }
                                  />
                                </label>
                              </div>
                              {selectedElement.type === "text" || selectedElement.type === "sticker" ? (
                                <label>
                                  Text
                                  <textarea
                                    rows={2}
                                    value={selectedElement.text ? getLocalizedText(language, selectedElement.text) : ""}
                                    onChange={(event) =>
                                      updateElement(selectedElement.id, (element) => ({
                                        ...element,
                                        text: makeLocalizedCopy(event.target.value),
                                      }))
                                    }
                                  />
                                </label>
                              ) : null}
                              {selectedElement.type === "secret" ? (
                                <label>
                                  Secret Message
                                  <textarea
                                    rows={2}
                                    value={selectedElement.revealText ? getLocalizedText(language, selectedElement.revealText) : ""}
                                    onChange={(event) =>
                                      updateElement(selectedElement.id, (element) => ({
                                        ...element,
                                        revealText: makeLocalizedCopy(event.target.value),
                                      }))
                                    }
                                  />
                                </label>
                              ) : null}
                              {selectedElement.type === "image" ||
                              selectedElement.type === "video" ||
                              selectedElement.type === "audio" ? (
                                <label>
                                  Source URL
                                  <input
                                    value={selectedElement.src ?? ""}
                                    onChange={(event) =>
                                      updateElement(selectedElement.id, (element) => ({
                                        ...element,
                                        src: event.target.value,
                                      }))
                                    }
                                  />
                                  <input
                                    type="file"
                                    accept={
                                      selectedElement.type === "video"
                                        ? "video/*"
                                        : selectedElement.type === "audio"
                                          ? "audio/*"
                                          : "image/*"
                                    }
                                    onChange={(event) => {
                                      const file = event.target.files?.[0];
                                      if (!file) return;
                                      void uploadElementAsset(selectedElement.id, file);
                                      event.currentTarget.value = "";
                                    }}
                                  />
                                  <small>
                                    {uploadingElementId === selectedElement.id
                                      ? "Uploading to Cloudinary..."
                                      : isCloudinaryUploadEnabled
                                        ? "Cloudinary upload enabled"
                                        : "Set Cloudinary env keys to enable direct upload"}
                                  </small>
                                </label>
                              ) : null}
                            </>
                          ) : null}
                        </section>
                      </aside>
                    ) : null}
                  </div>

                  <div className="layer-interactive chapter-interactions">
                    {activePageChrome.home.visible ? (
                      <motion.button
                        type="button"
                        className="chapter-floating-button chapter-home-button"
                        style={{
                          left: `${activePageChrome.home.x}%`,
                          top: `${activePageChrome.home.y}%`,
                        }}
                        drag={canUseEditorTools && isEditorMode}
                        dragMomentum={false}
                        dragElastic={0}
                        onDragEnd={(_, info) => movePageControlByOffset("home", info)}
                        onClick={() => openScene("index")}
                      >
                        Home
                      </motion.button>
                    ) : null}
                    {activePageChrome.notes.visible ? (
                      <motion.button
                        type="button"
                        className="chapter-floating-button chapter-notes-button"
                        style={{
                          left: `${activePageChrome.notes.x}%`,
                          top: `${activePageChrome.notes.y}%`,
                        }}
                        drag={canUseEditorTools && isEditorMode}
                        dragMomentum={false}
                        dragElastic={0}
                        onDragEnd={(_, info) => movePageControlByOffset("notes", info)}
                        onClick={() => openScene("notes")}
                      >
                        Notes
                      </motion.button>
                    ) : null}
                    <button type="button" className="chapter-prev-button" onClick={() => goToPage(normalizedChapterIndex - 1)}>
                      Previous page
                    </button>
                    <button type="button" className="chapter-next-button" onClick={() => goToPage(normalizedChapterIndex + 1)}>
                      Next page
                    </button>
                  </div>
                </motion.section>
              ) : null}

              {scene === "notes" ? (
                <motion.section key="notes" className="scene-frame scene-notes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: 0.8 }}>
                  <div className="layer-background scene-artwork scene-bg-notes" />
                  <div className="layer-midground scene-vignette scene-vignette-soft" />
                  <div className="layer-content notes-content">
                    <h2>Notes From Family</h2>
                    <p>Each note is linked to the page where it was written and keeps date, author, and relation.</p>
                    {canUseEditorTools ? (
                      <div className="notes-editor-actions">
                        <button type="button" className={isEditorMode ? "active" : ""} onClick={() => setIsEditorMode((state) => !state)}>
                          {isEditorMode ? "Notes Editing On" : "Notes Editing Off"}
                        </button>
                        {isEditorMode ? (
                          <button type="button" onClick={() => addSpecialNote(normalizedChapterIndex)}>
                            Add Note To Current Page
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="notes-grid">
                      {noteEntries.length === 0 ? <p className="notes-empty">No notes yet. Add one from editor mode.</p> : null}
                      {noteEntries.map(({ page, pageIndex, note }) => (
                        <article key={`${page.id}-${note.id}`} className={`memory-note-card style-${note.style}`}>
                          <p className="note-source">
                            Source: Page {pageIndex + 1} - {getLocalizedText(language, page.chapter)} - {getLocalizedText(language, page.title)}
                          </p>
                          {canUseEditorTools && isEditorMode ? (
                            <div className="note-edit-grid">
                              <label>
                                Author
                                <input
                                  value={note.author}
                                  onChange={(event) =>
                                    updateSpecialNote(pageIndex, note.id, (current) => ({ ...current, author: event.target.value }))
                                  }
                                />
                              </label>
                              <label>
                                Relation
                                <input
                                  value={note.relation}
                                  onChange={(event) =>
                                    updateSpecialNote(pageIndex, note.id, (current) => ({ ...current, relation: event.target.value }))
                                  }
                                />
                              </label>
                              <label>
                                Date
                                <input
                                  value={note.date}
                                  onChange={(event) =>
                                    updateSpecialNote(pageIndex, note.id, (current) => ({ ...current, date: event.target.value }))
                                  }
                                />
                              </label>
                              <label>
                                Style
                                <select
                                  value={note.style}
                                  onChange={(event) =>
                                    updateSpecialNote(pageIndex, note.id, (current) => ({
                                      ...current,
                                      style: event.target.value as BookSpecialNote["style"],
                                    }))
                                  }
                                >
                                  <option value="letter">letter</option>
                                  <option value="star">star</option>
                                  <option value="ribbon">ribbon</option>
                                </select>
                              </label>
                              <label className="span-2">
                                Message
                                <textarea
                                  rows={3}
                                  value={getLocalizedText(language, note.message)}
                                  onChange={(event) =>
                                    updateSpecialNote(pageIndex, note.id, (current) => ({
                                      ...current,
                                      message: makeLocalizedCopy(event.target.value),
                                    }))
                                  }
                                />
                              </label>
                              <button type="button" className="note-delete" onClick={() => removeSpecialNote(pageIndex, note.id)}>
                                Remove Note
                              </button>
                            </div>
                          ) : (
                            <>
                              <p className="note-author">
                                {note.author} - {note.relation} - {note.date}
                              </p>
                              <p>{getLocalizedText(language, note.message)}</p>
                            </>
                          )}
                        </article>
                      ))}
                    </div>
                  </div>
                  <div className="layer-interactive notes-actions">
                    <button type="button" onClick={() => openScene("index")}>
                      Back to map
                    </button>
                    <button type="button" onClick={() => openScene("chapter")}>
                      Continue
                    </button>
                  </div>
                </motion.section>
              ) : null}

              {scene === "finale" ? (
                <motion.section key="finale" className="scene-frame" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}>
                  <div className="layer-background scene-artwork scene-bg-finale" />
                  <div className="layer-midground scene-vignette scene-vignette-sunrise" />
                  <div className="layer-content finale-content">
                    <h2>The Story Continues</h2>
                    <p>Every page is now editable in place. Add, move, rotate, hide, and discover as memories grow.</p>
                    <div className="finale-actions">
                      <button type="button" onClick={() => openScene("index")}>
                        Revisit Map
                      </button>
                      <button type="button" onClick={() => openScene("cover")}>
                        Close Book
                      </button>
                    </div>
                  </div>
                </motion.section>
              ) : null}
            </AnimatePresence>
          </div>

          {scene !== "cover" && scene !== "opening" && scene !== "chapter" && scene !== "index" ? (
            <footer className="stage-footer layer-foreground">
              <div className="footer-status">
                <p>
                  Scene: <span>{scene}</span>
                </p>
                <p>
                  Page: <span>{normalizedChapterIndex + 1}</span> / {safePages.length}
                </p>
              </div>
              <nav className="scene-nav" aria-label="Scene Navigation">
                {SCENE_SEQUENCE.map((entry) => (
                  <button key={entry.id} type="button" className={scene === entry.id ? "active" : ""} onClick={() => openScene(entry.id)}>
                    {entry.label}
                  </button>
                ))}
              </nav>
            </footer>
          ) : null}
        </div>
      </div>

      <div className="magical-transition-overlay" ref={transitionOverlayRef} aria-hidden="true">
        <div className="transition-glow" />
        {Array.from({ length: DUST_PARTICLE_COUNT }).map((_, index) => (
          <span key={`dust-${index}`} className="transition-dust" />
        ))}
      </div>
      {enableMagicalCursor ? <MagicalCursor /> : null}
    </main>
  );
}

export default App;

