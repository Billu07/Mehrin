export const referenceAssets = {
  cover: new URL("../../inspiration/cover_page_desktop.png", import.meta.url).href,
  opening: new URL("../../inspiration/opening_spread_desktop.png", import.meta.url).href,
  index: new URL("../../inspiration/index_page_desktop.png", import.meta.url).href,
  chapter: new URL("../../inspiration/chapter_page_desktop.png", import.meta.url).href,
  notes: new URL("../../inspiration/mid_page_desktop.png", import.meta.url).href,
  finale: new URL("../../inspiration/finale_page_desktop.png", import.meta.url).href,
} as const;

export type ReferenceAssetKey = keyof typeof referenceAssets;
