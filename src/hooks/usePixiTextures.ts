import { useEffect, useMemo, useState } from "react";
import { Assets, type Texture } from "pixi.js";

type TextureMap<TKey extends string> = Record<TKey, Texture | null>;

export function usePixiTextures<TKey extends string>(
  sources: Record<TKey, string>,
  enabled = true,
): TextureMap<TKey> {
  const sourceEntries = useMemo(
    () => Object.entries(sources) as [TKey, string][],
    [sources],
  );
  const [textures, setTextures] = useState<TextureMap<TKey>>(() => {
    const initial = {} as TextureMap<TKey>;
    sourceEntries.forEach(([key]) => {
      initial[key] = null;
    });
    return initial;
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let isMounted = true;

    const load = async () => {
      const loadedEntries = await Promise.all(
        sourceEntries.map(async ([key, source]) => {
          const texture = await Assets.load(source);
          return [key, texture] as const;
        }),
      );

      if (!isMounted) return;

      setTextures((current) => {
        const next = { ...current };
        loadedEntries.forEach(([key, texture]) => {
          next[key] = texture;
        });
        return next;
      });
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [enabled, sourceEntries]);

  const fallbackTextures = useMemo(() => {
    const next = {} as TextureMap<TKey>;
    sourceEntries.forEach(([key]) => {
      next[key] = null;
    });
    return next;
  }, [sourceEntries]);

  return enabled ? textures : fallbackTextures;
}
