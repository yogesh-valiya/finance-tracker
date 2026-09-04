"use client";

import * as React from "react";

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  maxVerticalRatio?: number; // slope threshold (tan(30°) ≈ 0.577)
}

/**
 * Direction-locked swipe gesture hook that disambiguates horizontal swipe from vertical scroll.
 * Ignores any gesture with angle > 30° from horizontal (Rule 012 / Task 8.2.1).
 */
export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  maxVerticalRatio = 0.577, // tan(30°)
}: SwipeOptions) {
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = React.useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const onTouchEnd = React.useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current || e.changedTouches.length !== 1) return;
      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
      touchStartRef.current = null;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX < threshold) return;

      // Disambiguate slope: vertical ratio must be <= tan(30°)
      if (absY / absX > maxVerticalRatio) {
        return; // Vertical scroll motion, not a swipe
      }

      if (deltaX < 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    },
    [onSwipeLeft, onSwipeRight, threshold, maxVerticalRatio]
  );

  return { onTouchStart, onTouchEnd };
}
