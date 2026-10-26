export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Read a CSS custom property off :root (theme-aware colours for canvas work). */
export const cssVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** Swap text with a short fade-in so it doesn't just teleport. Instant for reduced motion. */
export const swapText = (el: Element, text: string) => {
  if (el.textContent === text) return;
  el.textContent = text;
  if (reducedMotion()) return;
  (el as HTMLElement).animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: 180,
    easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
  });
};
