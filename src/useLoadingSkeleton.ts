import { useEffect, useRef, useState } from "react";

const SKELETON_DELAY_MS = 500;
const SKELETON_MIN_DURATION_MS = 320;

export function useLoadingSkeleton(
  isLoading: boolean,
  delay = SKELETON_DELAY_MS,
  minDuration = SKELETON_MIN_DURATION_MS
) {
  const [visible, setVisible] = useState(() => isLoading && delay <= 0);
  const shownAtRef = useRef(visible ? Date.now() : 0);

  useEffect(() => {
    if (isLoading) {
      if (visible) return;
      const timer = window.setTimeout(() => {
        shownAtRef.current = Date.now();
        setVisible(true);
      }, delay);
      return () => window.clearTimeout(timer);
    }

    if (!visible) return;
    const remaining = shownAtRef.current + minDuration - Date.now();
    if (remaining <= 0) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setVisible(false), remaining);
    return () => window.clearTimeout(timer);
  }, [delay, isLoading, minDuration, visible]);

  return visible;
}
