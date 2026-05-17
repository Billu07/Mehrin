export type BookLanguage = "en" | "bn";
export type BookPageLayout =
  | "chapter-divider"
  | "classic-split"
  | "ornate-media"
  | "scrapbook-collage"
  | "letter-notes";

interface LocalizedText {
  en: string;
  bn: string;
}

export type BookPageElementType = "text" | "image" | "video" | "audio" | "secret" | "sticker";
export type BookPageElementFrameStyle = "card" | "none" | "gold" | "ink" | "tape";

export interface BookPageElement {
  id: string;
  type: BookPageElementType;
  label: LocalizedText;
  text?: LocalizedText;
  revealText?: LocalizedText;
  src?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  rounded?: boolean;
  opacity?: number;
  frameStyle?: BookPageElementFrameStyle;
  fillColor?: string;
  strokeColor?: string;
  textColor?: string;
}

export interface PageActionControl {
  visible: boolean;
  x: number;
  y: number;
}

export interface PageChromeControls {
  home: PageActionControl;
  notes: PageActionControl;
}

export const DEFAULT_PAGE_CHROME: PageChromeControls = {
  home: {
    visible: true,
    x: 90,
    y: 19,
  },
  notes: {
    visible: true,
    x: 90,
    y: 25,
  },
};

export function normalizePageChrome(
  chrome?: Partial<PageChromeControls> | null,
): PageChromeControls {
  return {
    home: {
      visible: chrome?.home?.visible ?? DEFAULT_PAGE_CHROME.home.visible,
      x: chrome?.home?.x ?? DEFAULT_PAGE_CHROME.home.x,
      y: chrome?.home?.y ?? DEFAULT_PAGE_CHROME.home.y,
    },
    notes: {
      visible: chrome?.notes?.visible ?? DEFAULT_PAGE_CHROME.notes.visible,
      x: chrome?.notes?.x ?? DEFAULT_PAGE_CHROME.notes.x,
      y: chrome?.notes?.y ?? DEFAULT_PAGE_CHROME.notes.y,
    },
  };
}

export interface BookArtifact {
  id: string;
  type: "photo" | "video" | "moment";
  title: LocalizedText;
  caption: LocalizedText;
  imageSrc?: string;
  videoSrc?: string;
}

export interface BookSpecialNote {
  id: string;
  author: string;
  relation: string;
  date: string;
  style: "letter" | "star" | "ribbon";
  message: LocalizedText;
}

export interface BookSurpriseElement {
  id: string;
  icon: string;
  label: LocalizedText;
  detail: LocalizedText;
}

export interface BookPage {
  id: string;
  layoutTemplate: BookPageLayout;
  chapter: LocalizedText;
  title: LocalizedText;
  subtitle: LocalizedText;
  narrative: LocalizedText;
  dateLabel: string;
  palette: {
    ink: string;
    paper: string;
    glow: string;
  };
  elements: BookPageElement[];
  artifacts: BookArtifact[];
  specialNotes: BookSpecialNote[];
  surpriseElements: BookSurpriseElement[];
  chrome?: PageChromeControls;
}

export const LAYOUT_OPTIONS: Array<{ value: BookPageLayout; label: string }> = [
  { value: "chapter-divider", label: "Chapter Divider" },
  { value: "classic-split", label: "Classic Split" },
  { value: "ornate-media", label: "Ornate Media" },
  { value: "scrapbook-collage", label: "Scrapbook Collage" },
  { value: "letter-notes", label: "Letter Notes" },
];

function chapterTitleElements(page: Pick<BookPage, "chapter" | "title" | "subtitle">): BookPageElement[] {
  return [
    {
      id: "chapter-chip",
      type: "text",
      label: { en: "Chapter Label", bn: "অধ্যায়ের লেবেল" },
      text: page.chapter,
      x: 36,
      y: 22,
      width: 28,
      height: 10,
      rotation: 0,
      zIndex: 1,
    },
    {
      id: "chapter-title",
      type: "text",
      label: { en: "Chapter Title", bn: "অধ্যায়ের শিরোনাম" },
      text: page.title,
      x: 14,
      y: 38,
      width: 72,
      height: 16,
      rotation: 0,
      zIndex: 2,
    },
    {
      id: "chapter-subtitle",
      type: "text",
      label: { en: "Chapter Subtitle", bn: "অধ্যায়ের সাবটাইটেল" },
      text: page.subtitle,
      x: 20,
      y: 58,
      width: 60,
      height: 12,
      rotation: 0,
      zIndex: 2,
    },
    {
      id: "chapter-secret",
      type: "secret",
      label: { en: "Hidden Seal", bn: "গোপন সিল" },
      revealText: {
        en: "A hidden promise waits in this chapter.",
        bn: "এই অধ্যায়ে একটি গোপন প্রতিশ্রুতি আছে।",
      },
      x: 78,
      y: 68,
      width: 12,
      height: 18,
      rotation: -6,
      zIndex: 4,
      rounded: true,
    },
  ];
}

function classicElements(page: Pick<BookPage, "narrative" | "artifacts" | "title">): BookPageElement[] {
  const firstImage = page.artifacts.find((item) => item.imageSrc)?.imageSrc;
  const firstVideo = page.artifacts.find((item) => item.videoSrc)?.videoSrc;
  return [
    {
      id: "narrative",
      type: "text",
      label: { en: "Narrative", bn: "গল্প" },
      text: page.narrative,
      x: 7,
      y: 16,
      width: 46,
      height: 66,
      rotation: -0.8,
      zIndex: 2,
    },
    {
      id: "image-slot",
      type: "image",
      label: { en: "Main Image", bn: "মূল ছবি" },
      src: firstImage,
      x: 58,
      y: 18,
      width: 34,
      height: 34,
      rotation: 1.2,
      zIndex: 3,
      rounded: true,
    },
    {
      id: "video-slot",
      type: "video",
      label: { en: "Video Memory", bn: "ভিডিও স্মৃতি" },
      src: firstVideo,
      x: 56,
      y: 56,
      width: 36,
      height: 28,
      rotation: -1.8,
      zIndex: 3,
      rounded: true,
    },
    {
      id: "stamp",
      type: "sticker",
      label: { en: "Memory Stamp", bn: "স্মৃতি স্ট্যাম্প" },
      text: page.title,
      x: 72,
      y: 7,
      width: 14,
      height: 10,
      rotation: 4,
      zIndex: 4,
      opacity: 0.9,
    },
  ];
}

function ornateMediaElements(page: Pick<BookPage, "narrative" | "artifacts">): BookPageElement[] {
  const imageA = page.artifacts[0]?.imageSrc;
  const imageB = page.artifacts[1]?.imageSrc;
  const video = page.artifacts.find((item) => item.videoSrc)?.videoSrc;
  return [
    {
      id: "narrative",
      type: "text",
      label: { en: "Narrative", bn: "গল্প" },
      text: page.narrative,
      x: 8,
      y: 14,
      width: 38,
      height: 72,
      rotation: -0.8,
      zIndex: 2,
    },
    {
      id: "image-a",
      type: "image",
      label: { en: "Gallery A", bn: "গ্যালারি A" },
      src: imageA,
      x: 52,
      y: 14,
      width: 38,
      height: 28,
      rotation: 1.8,
      zIndex: 3,
      rounded: true,
    },
    {
      id: "image-b",
      type: "image",
      label: { en: "Gallery B", bn: "গ্যালারি B" },
      src: imageB,
      x: 56,
      y: 46,
      width: 32,
      height: 24,
      rotation: -2.2,
      zIndex: 3,
      rounded: true,
    },
    {
      id: "video-slot",
      type: "video",
      label: { en: "Video", bn: "ভিডিও" },
      src: video,
      x: 48,
      y: 72,
      width: 44,
      height: 16,
      rotation: 0.4,
      zIndex: 3,
      rounded: true,
    },
  ];
}

function scrapbookElements(page: Pick<BookPage, "narrative" | "artifacts">): BookPageElement[] {
  return [
    {
      id: "narrative",
      type: "text",
      label: { en: "Narrative", bn: "গল্প" },
      text: page.narrative,
      x: 10,
      y: 12,
      width: 42,
      height: 70,
      rotation: -1.3,
      zIndex: 2,
    },
    {
      id: "image-a",
      type: "image",
      label: { en: "Photo A", bn: "ছবি A" },
      src: page.artifacts[0]?.imageSrc,
      x: 56,
      y: 14,
      width: 30,
      height: 26,
      rotation: 3.2,
      zIndex: 3,
      rounded: true,
    },
    {
      id: "image-b",
      type: "image",
      label: { en: "Photo B", bn: "ছবি B" },
      src: page.artifacts[1]?.imageSrc,
      x: 61,
      y: 44,
      width: 30,
      height: 22,
      rotation: -4.3,
      zIndex: 3,
      rounded: true,
    },
    {
      id: "secret-tag",
      type: "secret",
      label: { en: "Secret Ticket", bn: "গোপন টিকিট" },
      revealText: {
        en: "You found a hidden family discovery.",
        bn: "তুমি একটি গোপন পারিবারিক আবিষ্কার পেয়েছ।",
      },
      x: 70,
      y: 70,
      width: 20,
      height: 12,
      rotation: 7,
      zIndex: 4,
    },
  ];
}

function letterElements(page: Pick<BookPage, "narrative" | "title">): BookPageElement[] {
  return [
    {
      id: "narrative",
      type: "text",
      label: { en: "Letter Body", bn: "চিঠির লেখা" },
      text: page.narrative,
      x: 11,
      y: 16,
      width: 46,
      height: 68,
      rotation: -0.4,
      zIndex: 2,
    },
    {
      id: "letter-note",
      type: "text",
      label: { en: "Pinned Note", bn: "পিন করা নোট" },
      text: page.title,
      x: 60,
      y: 22,
      width: 28,
      height: 20,
      rotation: 2.6,
      zIndex: 3,
      rounded: true,
    },
    {
      id: "memory-image",
      type: "image",
      label: { en: "Memory Image", bn: "স্মৃতির ছবি" },
      src: "/watercolor/garden-bloom.svg",
      x: 59,
      y: 49,
      width: 30,
      height: 30,
      rotation: -1.8,
      zIndex: 3,
      rounded: true,
    },
  ];
}

export function createLayoutElements(page: Pick<BookPage, "layoutTemplate" | "chapter" | "title" | "subtitle" | "narrative" | "artifacts">): BookPageElement[] {
  if (page.layoutTemplate === "chapter-divider") {
    return chapterTitleElements(page);
  }
  if (page.layoutTemplate === "ornate-media") {
    return ornateMediaElements(page);
  }
  if (page.layoutTemplate === "scrapbook-collage") {
    return scrapbookElements(page);
  }
  if (page.layoutTemplate === "letter-notes") {
    return letterElements(page);
  }
  return classicElements(page);
}

const basePalette = {
  ink: "#3f2f29",
  paper: "#fff8ea",
  glow: "#f5d8a8",
};

export const magicalBookPages: BookPage[] = [
  {
    id: "chapter-1",
    layoutTemplate: "chapter-divider",
    chapter: { en: "Chapter 1", bn: "অধ্যায় ১" },
    title: { en: "First Dreams", bn: "প্রথম স্বপ্ন" },
    subtitle: { en: "A cradle full of starlight", bn: "তারাভরা দোলনা" },
    narrative: { en: "", bn: "" },
    dateLabel: "May 2026",
    palette: basePalette,
    artifacts: [],
    specialNotes: [],
    surpriseElements: [],
    elements: [],
  },
  {
    id: "page-intro",
    layoutTemplate: "classic-split",
    chapter: { en: "Chapter 1", bn: "অধ্যায় ১" },
    title: { en: "When The Lantern Lit", bn: "যখন প্রদীপ জ্বলে উঠল" },
    subtitle: { en: "The beginning of Mehrin's first sky", bn: "মেহরিনের প্রথম আকাশের শুরু" },
    narrative: {
      en: "That night, the house did not sleep. It listened. A tiny heartbeat arrived, and every wall became soft with wonder.",
      bn: "সেই রাতে ঘর ঘুমায়নি। শুধু শুনেছিল। একটি ছোট্ট হৃদস্পন্দন এসে পৌঁছালো।",
    },
    dateLabel: "May 13, 2026",
    palette: basePalette,
    artifacts: [
      {
        id: "intro-photo",
        type: "photo",
        title: { en: "First Blanket", bn: "প্রথম কম্বল" },
        caption: { en: "A small fold of cotton, warm as a prayer.", bn: "তুলোর ছোট্ট ভাঁজ।" },
        imageSrc: "/watercolor/nursery-crib.svg",
      },
    ],
    specialNotes: [
      {
        id: "note-intro-1",
        author: "Amatullah",
        relation: "Mother",
        date: "2026-05-13",
        style: "letter",
        message: {
          en: "I held her, and time became a whisper.",
          bn: "তাকে বুকে নিতেই সময় ফিসফিসে হয়ে গেল।",
        },
      },
    ],
    surpriseElements: [],
    elements: [],
  },
  {
    id: "chapter-2",
    layoutTemplate: "chapter-divider",
    chapter: { en: "Chapter 2", bn: "অধ্যায় ২" },
    title: { en: "Little Beginnings", bn: "ছোট্ট শুরু" },
    subtitle: { en: "Milk-light and moon-dust", bn: "দুধসাদা আলো আর চাঁদের ধুলো" },
    narrative: { en: "", bn: "" },
    dateLabel: "May 2026",
    palette: basePalette,
    artifacts: [],
    specialNotes: [],
    surpriseElements: [],
    elements: [],
  },
  {
    id: "page-window",
    layoutTemplate: "ornate-media",
    chapter: { en: "Chapter 2", bn: "অধ্যায় ২" },
    title: { en: "The Window Learned Her Name", bn: "জানালাও শিখে নিল তার নাম" },
    subtitle: { en: "A room of milk-light and moon-dust", bn: "দুধসাদা আলো আর চাঁদের ধুলোর ঘর" },
    narrative: {
      en: "Morning touched the glass and turned to gold. We watched the light lean in, as if it had come to greet her.",
      bn: "সকালের আলো কাঁচে লেগে সোনালি হয়ে উঠল।",
    },
    dateLabel: "May 14, 2026",
    palette: { ink: "#2f3f52", paper: "#f6fbff", glow: "#d9ecff" },
    artifacts: [
      {
        id: "window-photo",
        type: "photo",
        title: { en: "Nursery Light", bn: "নার্সারির আলো" },
        caption: { en: "A pale morning folded into the curtains.", bn: "পাতলা পর্দায় বসে থাকা সকাল।" },
        imageSrc: "/watercolor/nursery-window.svg",
      },
      {
        id: "window-video",
        type: "video",
        title: { en: "Motion Memory", bn: "চলমান স্মৃতি" },
        caption: { en: "A quiet moving memory from a gentle morning.", bn: "নরম সকালের ভিডিও স্মৃতি।" },
        videoSrc: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      },
    ],
    specialNotes: [
      {
        id: "note-window-1",
        author: "Nanu",
        relation: "Grandmother",
        date: "2026-05-14",
        style: "star",
        message: {
          en: "The morning light looked at her the way we do, with wonder.",
          bn: "সকালের আলোও তাকে আমাদের মতো বিস্ময়ে দেখছিল।",
        },
      },
    ],
    surpriseElements: [],
    elements: [],
  },
  {
    id: "chapter-3",
    layoutTemplate: "chapter-divider",
    chapter: { en: "Chapter 3", bn: "অধ্যায় ৩" },
    title: { en: "Always With Me", bn: "সবসময় আমার সাথে" },
    subtitle: { en: "Dream guardians and stitched patience", bn: "স্বপ্ন পাহারাদার" },
    narrative: { en: "", bn: "" },
    dateLabel: "May 2026",
    palette: basePalette,
    artifacts: [],
    specialNotes: [],
    surpriseElements: [],
    elements: [],
  },
  {
    id: "page-bear",
    layoutTemplate: "scrapbook-collage",
    chapter: { en: "Chapter 3", bn: "অধ্যায় ৩" },
    title: { en: "The Bear That Stayed Awake", bn: "যে ভালুকটি জেগে থাকত" },
    subtitle: { en: "Dream guardians and stitched patience", bn: "স্বপ্ন পাহারাদার" },
    narrative: {
      en: "A teddy sat by her pillow, serious and kind. In that tiny kingdom, it was enough to keep fear outside the door.",
      bn: "একটি টেডি বালিশের পাশে বসে পাহারা দিত।",
    },
    dateLabel: "May 18, 2026",
    palette: { ink: "#4b3627", paper: "#fff3e7", glow: "#f0c79d" },
    artifacts: [
      {
        id: "bear-photo",
        type: "photo",
        title: { en: "Dream Guard", bn: "স্বপ্নের পাহারাদার" },
        caption: { en: "Soft stitches. Steady watch.", bn: "নরম সেলাই, স্থির পাহারা।" },
        imageSrc: "/watercolor/nursery-bear.svg",
      },
    ],
    specialNotes: [
      {
        id: "note-bear-1",
        author: "Uncle",
        relation: "Guardian",
        date: "2026-05-18",
        style: "ribbon",
        message: {
          en: "Her dreams already have loyal companions.",
          bn: "তার স্বপ্নের ইতিমধ্যেই বিশ্বস্ত সঙ্গী আছে।",
        },
      },
    ],
    surpriseElements: [],
    elements: [],
  },
  {
    id: "chapter-4",
    layoutTemplate: "chapter-divider",
    chapter: { en: "Chapter 4", bn: "অধ্যায় ৪" },
    title: { en: "Growing and Glowing", bn: "বড় হওয়া আর ঝলমলে হওয়া" },
    subtitle: { en: "Sunlit leaves and tomorrow's laughter", bn: "রোদে ভেজা পাতা" },
    narrative: { en: "", bn: "" },
    dateLabel: "Future",
    palette: basePalette,
    artifacts: [],
    specialNotes: [],
    surpriseElements: [],
    elements: [],
  },
  {
    id: "page-garden",
    layoutTemplate: "letter-notes",
    chapter: { en: "Chapter 4", bn: "অধ্যায় ৪" },
    title: { en: "A Path Waiting For Her Feet", bn: "তার পায়ের অপেক্ষায় এক পথ" },
    subtitle: { en: "Sunlit leaves and tomorrow's laughter", bn: "রোদে ভেজা পাতা" },
    narrative: {
      en: "One day she will run under green light and call the wind by name. These pages will remember that first sprint.",
      bn: "একদিন সে সবুজ আলোর নিচে দৌড়াবে।",
    },
    dateLabel: "For The Days Ahead",
    palette: { ink: "#2d4a35", paper: "#f3fbe8", glow: "#d8eab8" },
    artifacts: [],
    specialNotes: [
      {
        id: "note-garden-1",
        author: "Family",
        relation: "Circle",
        date: "2026-05-19",
        style: "letter",
        message: {
          en: "We are waiting for her footsteps between leaves and laughter.",
          bn: "পাতা আর হাসির ফাঁকে তার পায়ের শব্দের অপেক্ষায় আমরা আছি।",
        },
      },
    ],
    surpriseElements: [],
    elements: [],
  },
];

for (const page of magicalBookPages) {
  page.elements = createLayoutElements(page);
}
