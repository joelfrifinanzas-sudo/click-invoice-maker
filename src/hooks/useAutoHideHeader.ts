import { MutableRefObject, useEffect } from "react";

// Global API Types
declare global {
  interface Window {
    HeaderUX: {
      show: () => void;
      hide: () => void;
      lock: () => void;
      unlock: () => void;
    };
  }
}

interface Options {
  containerRef?: MutableRefObject<HTMLElement | null>;
  threshold?: number; // pixels
  throttleMs?: number; // ms
}

function isInputFocused() {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || el.getAttribute("role") === "combobox";
}

function isModalOpen() {
  // Check common modal patterns (Radix, native dialogs, aria-modal)
  return Boolean(
    document.querySelector(
      '[role="dialog"][data-state="open"], [aria-modal="true"], [data-radix-portal] [data-state="open"], dialog[open]'
    ) || (document.body && getComputedStyle(document.body).overflow === "hidden")
  );
}

function getScrollTop(target: Window | HTMLElement) {
  if (target === window) {
    return Math.max(window.pageYOffset, document.documentElement.scrollTop, document.body.scrollTop);
  }
  return (target as HTMLElement).scrollTop;
}

function clampTop(y: number) {
  return y < 0 ? 0 : y;
}

export function useAutoHideHeader({ containerRef, threshold = 10, throttleMs = 100 }: Options = {}) {
  useEffect(() => {
    let locked = false;
    let visible = true;
    let lastYWindow = 0;
    let lastYContainer = 0;
    let lastRun = 0;

    const headerEl = document.querySelector('[data-app-header="true"]') as HTMLElement | null;
    const ensureClass = (show: boolean) => {
      if (!headerEl) return;
      if (show) {
        headerEl.classList.add("header--visible");
        headerEl.classList.remove("header--hidden");
      } else {
        headerEl.classList.add("header--hidden");
        headerEl.classList.remove("header--visible");
      }
    };

    const show = () => {
      visible = true;
      ensureClass(true);
    };
    const hide = () => {
      visible = false;
      ensureClass(false);
    };

    const compute = (target: Window | HTMLElement) => {
      if (!headerEl) return;
      // Guard rails
      if (locked || isInputFocused() || isModalOpen()) {
        show();
        return;
      }

      const now = performance.now();
      if (now - lastRun < throttleMs) return; // throttle
      lastRun = now;

      const currYRaw = getScrollTop(target);
      const currY = clampTop(currYRaw);

      if (currY <= 1) {
        show();
        if (target === window) lastYWindow = currY;
        else lastYContainer = currY;
        return;
      }

      const lastY = target === window ? lastYWindow : lastYContainer;
      const delta = currY - lastY;

      if (Math.abs(delta) < threshold) return; // under movement threshold

      if (delta > 0) {
        // scrolling down
        hide();
      } else {
        // scrolling up
        show();
      }

      if (target === window) lastYWindow = currY;
      else lastYContainer = currY;
    };

    const onWindowScroll = () => compute(window);
    const onContainerScroll = () => containerRef?.current && compute(containerRef.current);

    // Focus in/out: keep header visible when typing
    const onFocusIn = () => show();
    const onFocusOut = () => {
      // No action; next scroll will decide
    };

    // Expose global API
    window.HeaderUX = {
      show: () => {
        locked = false;
        show();
      },
      hide: () => {
        locked = false;
        hide();
      },
      lock: () => {
        locked = true;
        show();
      },
      unlock: () => {
        locked = false;
      },
    };

    // Initial state
    show();

    // Listeners
    window.addEventListener("scroll", onWindowScroll, { passive: true });
    window.addEventListener("focusin", onFocusIn, { passive: true } as any);
    window.addEventListener("focusout", onFocusOut, { passive: true } as any);
    window.addEventListener("resize", onWindowScroll, { passive: true });
    window.addEventListener("orientationchange", onWindowScroll, { passive: true } as any);

    const container = containerRef?.current;
    if (container) {
      container.addEventListener("scroll", onContainerScroll, { passive: true });
    }

    return () => {
      window.removeEventListener("scroll", onWindowScroll as any);
      window.removeEventListener("focusin", onFocusIn as any);
      window.removeEventListener("focusout", onFocusOut as any);
      window.removeEventListener("resize", onWindowScroll as any);
      window.removeEventListener("orientationchange", onWindowScroll as any);
      if (container) container.removeEventListener("scroll", onContainerScroll as any);
    };
  }, [containerRef, threshold, throttleMs]);
}
