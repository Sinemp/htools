import { useEffect } from "react";

export function isEventInsideElement(event: Event, element: Element | null) {
  if (!element) return false;

  const path = event.composedPath();
  const target = event.target;

  return (
    path.includes(element) ||
    (target instanceof Node && element.contains(target))
  );
}

export function useOutsideInteractionDismiss({
  active,
  isInside,
  onDismiss
}: {
  active: boolean;
  isInside: (event: Event) => boolean;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!active) return;

    function handleOutsideInteraction(event: Event) {
      if (!isInside(event)) onDismiss();
    }

    document.addEventListener("pointerdown", handleOutsideInteraction, true);
    document.addEventListener("click", handleOutsideInteraction, true);
    document.addEventListener("focusin", handleOutsideInteraction, true);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideInteraction, true);
      document.removeEventListener("click", handleOutsideInteraction, true);
      document.removeEventListener("focusin", handleOutsideInteraction, true);
    };
  }, [active, isInside, onDismiss]);
}
