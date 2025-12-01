export interface SectionConfig {
  id: string;
}

export interface SectionContext {
  docHeight: number;
  elementsById: Map<string, HTMLElement>;
}

/**
 * Build a reusable context for active-section calculations.
 * Returns null when we should skip (e.g., Karma, no DOM, or no layout).
 */
export function buildSectionContext(
  sections: SectionConfig[],
  win: typeof window = window,
  doc: Document = document,
): SectionContext | null {
  const isKarma = (win as typeof window & { __karma__?: boolean }).__karma__;
  if (isKarma) {
    return null;
  }

  const elementsById = new Map<string, HTMLElement>();
  sections.forEach((section) => {
    const el = doc.getElementById(section.id);
    if (el) {
      elementsById.set(section.id, el);
    }
  });

  if (elementsById.size === 0) {
    return null;
  }

  const docHeight = doc.documentElement.scrollHeight;
  if (!docHeight) {
    return null;
  }

  const allAtTop = Array.from(elementsById.values()).every(
    (el) => el.offsetTop === 0,
  );
  if (allAtTop && win.scrollY === 0) {
    return null;
  }

  return { docHeight, elementsById };
}
