"use client";

import { useCallback } from "react";

type ViewTransitionStarter = (callback: () => void) => void;

const hasViewTransitionSupport = (): boolean => {
  if (typeof document === "undefined") return false;
  return "startViewTransition" in document;
};

export const useViewTransitions = () => {
  const startViewTransition = useCallback<ViewTransitionStarter>((callback) => {
    if (hasViewTransitionSupport()) {
      const doc = document as Document & {
        startViewTransition?: (cb: () => void) => void;
      };
      doc.startViewTransition?.(callback);
      return;
    }
    callback();
  }, []);

  return {
    startViewTransition,
    isSupported: hasViewTransitionSupport(),
  };
};
