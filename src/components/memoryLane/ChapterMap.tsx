import { motion } from "framer-motion";

interface ChapterSummary {
  id: string;
  pageIndex: number;
  chapter: string;
  title: string;
}

interface ChapterMapProps {
  chapters: ChapterSummary[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onOpenChapter: (pageIndex: number) => void;
}

export function ChapterMap({
  chapters,
  activeIndex,
  onActiveIndexChange,
  onOpenChapter,
}: ChapterMapProps) {
  return (
    <section className="chapter-map-shell chapter-map-shell-soothing">
      <div className="chapter-map-copy">
        <p className="map-kicker">Mehrin&apos;s Memory Lane</p>
        <h2>Chapter Index</h2>
        <p>
          Every chapter card is clickable. Insert a chapter divider page and this index updates automatically.
        </p>
      </div>

      <div className="chapter-map-flow" role="list" aria-label="Chapter index list">
        {chapters.map((chapter, index) => {
          const isActive = index === activeIndex;
          const isUnlocked = index <= activeIndex;
          return (
            <div key={chapter.id} className="map-step" role="listitem">
              <motion.button
                type="button"
                className={`map-step-button ${isActive ? "active" : ""}`}
                onMouseEnter={() => onActiveIndexChange(index)}
                onFocus={() => onActiveIndexChange(index)}
                onClick={() => onOpenChapter(chapter.pageIndex)}
                animate={{ y: [0, -3, 0] }}
                transition={{
                  duration: 3.8,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: index * 0.1,
                }}
              >
                <span className="map-step-badge">{String(index + 1).padStart(2, "0")}</span>
                <span className="map-step-text">
                  <small>{chapter.chapter}</small>
                  <strong>{chapter.title}</strong>
                </span>
                <span className={`map-step-status ${isUnlocked ? "is-open" : "is-awaiting"}`}>
                  {isUnlocked ? "Open" : "Awaiting"}
                </span>
              </motion.button>
              {index < chapters.length - 1 ? (
                <span className={`map-step-connector ${isUnlocked ? "is-lit" : ""}`} aria-hidden="true" />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
