const en = {
  app: {
    title: "Mehrin's Memory Lane",
    subtitle:
      "A watercolor diary where tiny objects hold big beginnings, and every click opens a warm family memory.",
    instructions: "Point, click, and let each memory bloom.",
  },
  ui: {
    language: "Language",
    scene: "Scene",
    close: "Close",
    nextScene: "Go to {{scene}}",
    unlockedCount: "{{count}} of {{total}} memories discovered in this scene",
    unlockedTag: "Unlocked",
    discovered: "Discovered Pages",
    overallUnlocked: "{{count}} total memories opened",
    progress: "Progress",
    hoverHint: "Hover over the glowing cards to preview each keepsake.",
    previousPage: "Previous Page",
    nextPage: "Next Page",
    pageOf: "Page {{current}} of {{total}}",
    chapter: "Chapter",
    revealMoment: "Reveal This Moment",
  },
  scenes: {
    nursery: {
      name: "The Nursery",
      description: "Soft curtains, pale moonlight, and quiet lullabies.",
    },
    garden: {
      name: "The Garden",
      description: "A future chapter where morning leaves remember her steps.",
    },
  },
  memories: {
    crib: {
      label: "Moon Crib",
      title: "The First Night",
      body: "On May 13, 2026, the room grew still and luminous. Mehrin slept in her little crib as if she had already forgiven the world for all its noise.",
    },
    window: {
      label: "Nursery Window",
      title: "Dawn at the Window",
      body: "At sunrise, the glass held a shy gold. We whispered promises to the morning: grow gently, laugh often, and keep wonder close.",
    },
    bear: {
      label: "Toy Bear",
      title: "The Patient Guardian",
      body: "A stitched bear waited by her blanket, serious and kind. It became the first guard of her dreams, never asking for rest.",
    },
    "garden-promise": {
      label: "Garden Promise",
      title: "A Path Not Yet Walked",
      body: "One day she will chase light under mango leaves. We keep this corner ready for that laughter, like a bookmark in a beloved story.",
    },
    "sun-path": {
      label: "Sun Path",
      title: "A Morning Trail",
      body: "A line of sunlight falls across the grass each dawn. We imagine her tiny steps claiming that bright trail as her first map.",
    },
  },
  journal: {
    intro: {
      chapter: "Opening",
      title: "A Diary Begins",
      body: "This is not a gallery. It is a small book of firsts, kept for Mehrin so she may one day touch these days again, softly, like turning fragile paper.",
    },
    outro: {
      chapter: "Promise",
      title: "The Pages Ahead",
      body: "These pages are only the beginning. Her story will keep growing in light, laughter, and ordinary afternoons that later become precious.",
    },
  },
} as const;

export default en;
