import {
  Check,
  Languages,
  Sun
} from "lucide-react";
import {
  KeyboardEvent as ReactKeyboardEvent,
  type ReactNode
} from "react";
import { localeOptions, type Locale, type Messages } from "../i18n";
import type { ThemeMode } from "../admin-helpers";

type UtilityMenuName = "locale" | "theme";

export type UtilityMenuController = {
  closeMenu: (restoreFocus?: boolean) => void;
  getMenuId: (menu: UtilityMenuName) => string;
  handleMenuKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  handleTriggerKeyDown: (
    menu: UtilityMenuName,
    event: ReactKeyboardEvent<HTMLButtonElement>
  ) => void;
  openMenu: UtilityMenuName | null;
  toggleMenu: (menu: UtilityMenuName, trigger: HTMLButtonElement) => void;
};

export default function UtilityMenuControls({
  className = "",
  controller,
  iconSize = 17,
  locale,
  localeControlClassName = "",
  onLocaleChange,
  onThemeChange,
  showMenus = true,
  t,
  themeControlClassName = "",
  themeMode
}: {
  className?: string;
  controller: UtilityMenuController;
  iconSize?: number;
  locale: Locale;
  localeControlClassName?: string;
  onLocaleChange: (locale: Locale) => void;
  onThemeChange: (themeMode: ThemeMode) => void;
  showMenus?: boolean;
  t: Messages;
  themeControlClassName?: string;
  themeMode: ThemeMode;
}) {
  const {
    closeMenu,
    getMenuId,
    handleMenuKeyDown,
    handleTriggerKeyDown,
    openMenu,
    toggleMenu
  } = controller;

  function renderMenu(menu: UtilityMenuName): ReactNode {
    if (!showMenus || openMenu !== menu) return null;

    const isLocaleMenu = menu === "locale";
    return (
      <div
        className={`floating-menu ${isLocaleMenu ? "language-menu" : "theme-menu"}`}
        role="menu"
        data-utility-menu={getMenuId(menu)}
        onKeyDown={handleMenuKeyDown}
      >
        {isLocaleMenu
          ? localeOptions.map((option) => (
              <button
                className="menu-option"
                key={option.code}
                type="button"
                role="menuitemradio"
                aria-checked={option.code === locale}
                onClick={(event) => {
                  onLocaleChange(option.code);
                  closeMenu(event.detail === 0);
                }}
              >
                <span>{option.label}</span>
                {option.code === locale ? <Check size={16} /> : null}
              </button>
            ))
          : [
              { label: t.theme.light, value: "light" as const },
              { label: t.theme.dark, value: "dark" as const },
              { label: t.theme.system, value: "system" as const }
            ].map((option) => (
              <button
                className="menu-option"
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={option.value === themeMode}
                onClick={(event) => {
                  onThemeChange(option.value);
                  closeMenu(event.detail === 0);
                }}
              >
                <span>{option.label}</span>
                {option.value === themeMode ? <Check size={16} /> : null}
              </button>
            ))}
      </div>
    );
  }

  function renderControl(menu: UtilityMenuName) {
    const isLocaleMenu = menu === "locale";
    const controlClassName = isLocaleMenu
      ? localeControlClassName
      : themeControlClassName;
    const label = isLocaleMenu
      ? t.actions.toggleLanguage
      : t.actions.toggleTheme;

    return (
      <div className={`menu-control ${controlClassName}`.trim()} key={menu}>
        <button
          className={`icon-button ${isLocaleMenu ? "locale-button" : ""}`.trim()}
          type="button"
          aria-label={label}
          aria-expanded={openMenu === menu}
          aria-haspopup="menu"
          onClick={(event) => toggleMenu(menu, event.currentTarget)}
          onKeyDown={(event) => handleTriggerKeyDown(menu, event)}
        >
          {isLocaleMenu ? <Languages size={iconSize} /> : <Sun size={iconSize} />}
        </button>
        {renderMenu(menu)}
      </div>
    );
  }

  return (
    <div className={className}>
      {renderControl("locale")}
      {renderControl("theme")}
    </div>
  );
}
