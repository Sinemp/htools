import {
  KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState
} from "react";
import {
  isEventInsideElement,
  useOutsideInteractionDismiss
} from "./useOutsideInteractionDismiss";

export function useUtilityMenuKeyboard<Menu extends string>(scope: string) {
  const [openMenu, setOpenMenu] = useState<Menu | null>(null);
  const activeTriggerRef = useRef<HTMLButtonElement>(null);
  const focusTargetRef = useRef<"first" | "last" | null>(null);

  function getMenuId(menu: Menu) {
    return `${scope}:${menu}`;
  }

  function getMenuItems(menu: Menu) {
    const menuElement = document.querySelector<HTMLElement>(
      `[data-utility-menu="${getMenuId(menu)}"]`
    );

    return Array.from(
      menuElement?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitemradio"]'
      ) ?? []
    );
  }

  function focusMenuItem(menu: Menu, target: "first" | "last") {
    const items = getMenuItems(menu);
    items[target === "first" ? 0 : items.length - 1]?.focus();
  }

  function closeMenu(restoreFocus = false) {
    const trigger = activeTriggerRef.current;
    setOpenMenu(null);

    if (restoreFocus && trigger) {
      window.requestAnimationFrame(() => trigger.focus());
    }
  }

  function toggleMenu(menu: Menu, trigger: HTMLButtonElement) {
    activeTriggerRef.current = trigger;
    focusTargetRef.current = null;
    setOpenMenu((value) => (value === menu ? null : menu));
  }

  function handleTriggerKeyDown(
    menu: Menu,
    event: ReactKeyboardEvent<HTMLButtonElement>
  ) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
      return;
    }

    event.preventDefault();
    activeTriggerRef.current = event.currentTarget;
    const target = event.key === "ArrowDown" ? "first" : "last";

    if (openMenu === menu) {
      focusMenuItem(menu, target);
      return;
    }

    focusTargetRef.current = target;
    setOpenMenu(menu);
  }

  function handleMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="menuitemradio"]'
      )
    );
    const currentIndex = items.indexOf(
      document.activeElement as HTMLButtonElement
    );

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeMenu(true);
      return;
    }

    if (event.key === "Tab") {
      setOpenMenu(null);
      return;
    }

    let nextIndex = -1;

    if (event.key === "ArrowDown") {
      nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
    } else if (event.key === "ArrowUp") {
      nextIndex =
        currentIndex < 0
          ? items.length - 1
          : (currentIndex - 1 + items.length) % items.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = items.length - 1;
    }

    if (nextIndex >= 0) {
      event.preventDefault();
      items[nextIndex]?.focus();
    }
  }

  useEffect(() => {
    if (!openMenu || !focusTargetRef.current) {
      return;
    }

    const menu = openMenu;
    const target = focusTargetRef.current;
    focusTargetRef.current = null;
    const frame = window.requestAnimationFrame(() => {
      focusMenuItem(menu, target);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [openMenu]);

  useOutsideInteractionDismiss({
    active: Boolean(openMenu),
    isInside: (event) => {
      if (!openMenu) return false;
      const menu = document.querySelector<HTMLElement>(
        `[data-utility-menu="${getMenuId(openMenu)}"]`
      );

      return [activeTriggerRef.current, menu].some((element) =>
        isEventInsideElement(event, element)
      );
    },
    onDismiss: () => setOpenMenu(null)
  });

  useEffect(() => {
    if (!openMenu) return;

    function handleDocumentKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
      }
    }

    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [openMenu]);

  return {
    closeMenu,
    getMenuId,
    handleMenuKeyDown,
    handleTriggerKeyDown,
    openMenu,
    setOpenMenu,
    toggleMenu
  };
}
