import { useEffect } from "react";

type PointerFocusableControl = HTMLButtonElement | HTMLAnchorElement;
let lastInputModality: "pointer" | "keyboard" = "pointer";

export function getLastInputModality() {
  return lastInputModality;
}

function getPointerControl(event: PointerEvent) {
  return (
    event
      .composedPath()
      .find((target): target is PointerFocusableControl =>
        target instanceof HTMLButtonElement || target instanceof HTMLAnchorElement
      ) ?? null
  );
}

export function usePointerFocusRelease() {
  useEffect(() => {
    const pointerControls = new Map<number, PointerFocusableControl>();

    function blurActiveControl(except: PointerFocusableControl | null = null) {
      const activeElement = document.activeElement;

      if (
        (activeElement instanceof HTMLButtonElement ||
          activeElement instanceof HTMLAnchorElement) &&
        activeElement !== except
      ) {
        activeElement.blur();
      }
    }

    function handlePointerDown(event: PointerEvent) {
      lastInputModality = "pointer";
      const control = getPointerControl(event);
      blurActiveControl(control);

      if (
        !control ||
        (control instanceof HTMLButtonElement && control.disabled)
      ) {
        return;
      }

      pointerControls.set(event.pointerId, control);
      if (event.pointerType === "touch" && control instanceof HTMLButtonElement) {
        control.classList.add("is-touch-pressing");
      }
    }

    function handlePointerEnd(event: PointerEvent) {
      const control = pointerControls.get(event.pointerId);
      if (!control) return;

      pointerControls.delete(event.pointerId);
      control.classList.remove("is-touch-pressing");
      window.requestAnimationFrame(() => {
        if (document.activeElement === control) control.blur();
      });
    }

    function handleKeyDown() {
      lastInputModality = "keyboard";
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("pointerup", handlePointerEnd, true);
    document.addEventListener("pointercancel", handlePointerEnd, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("pointerup", handlePointerEnd, true);
      document.removeEventListener("pointercancel", handlePointerEnd, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      pointerControls.forEach((control) =>
        control.classList.remove("is-touch-pressing")
      );
    };
  }, []);
}
