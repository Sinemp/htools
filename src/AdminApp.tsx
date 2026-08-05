import { ArrowDownUp, ArrowRightLeft, ArrowUp, ArrowUpRight, CheckCircle2, ChevronDown, ChevronRight, Circle, Eraser, FileText, Github, LogOut, PanelLeft, Plus, RefreshCw, Rss, Search, Send, Settings, ShieldCheck, Star, SquarePen, Tags, Trash2, Upload, Wand2, Wrench, X } from "lucide-react";
import { ChangeEvent, CSSProperties, FormEvent, KeyboardEvent as ReactKeyboardEvent, ReactNode, createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { applyAdminCategoryAction, checkLinks, createArticle, createContentSource, createTool, deleteArticle, deleteContentSource, deleteTelegramPush, deleteTool, exportBackupData, exportToolSourceData, importTools, loadAdminArticle, loadAdminArticles, loadAdminAuthConfig, loadAdminCategorySettings, loadAdminSecuritySettings, loadAdminTools, loadContentItems, loadContentSources, loadGitHubSettings, loadProxySettings, loadSiteConfiguration, loadSiteSettings, loadSourceSettings, loadTelegramMessage, loadTelegramPushRecords, loadTelegramSettings, loadTelegramSource, loadTurnstileSettings, loadUmamiSettings, login, patchSiteSettings, recoverTelegramMessage, resetFactorySettings, restoreBackupData, saveAdminCategorySettings, saveGitHubSettings, saveProxySettings, saveSourceSettings, saveTelegramMessage, saveTelegramSettings, saveTurnstileSettings, saveUmamiSettings, sendTelegramMessage, syncContentSource, testTelegramSettings, updateArticle, updateArticlePublished, updateAdminPassword, updateContentSource, convertContentItemToArticle, previewContentSource, updateTelegramMessage, updateTool, type AdminAuthConfig } from "./admin-api";
import { translations, type Locale, type Messages } from "./i18n";
import { normalizeProxyBaseUrl, normalizeProxyMode, normalizeProxyScope, proxifyUrl } from "./proxy";
import type { AdminCategoryAction, AdminCategoryScope, AdminCategorySettings, AdminSecuritySettings, Article, ArticleInput, ArticleSummary, ContentItemSummary, ContentSource, ContentSourceInput, FeedPreview, FooterSettings, GitHubSettings, GitHubSettingsInput, HomeHeroContent, LinkCheckResult, ProxySettings, HtoolsBackup, SiteSettings, SourceSettings, TelegramConnection, TelegramMessage, TelegramPushRecord, TelegramResourceType, TelegramSettings, TurnstileSettings, Tool, ToolImportMode, ToolInput, UmamiSettings } from "./types";
import { DEFAULT_FOOTER_SETTINGS, DEFAULT_HOME_HERO_SETTINGS, DEFAULT_SITE_SETTINGS, formatFooterJson, getEditableSiteSettings, getFooterFormValues, getHomeHeroSettings, getLocalizedErrorMessage, getSiteDisplayName, getSiteFooterSettings, getSourceErrorMessage, readSiteIconFile } from "./site-helpers";
import {
  cleanArticleDisplayText,
  getArticleDisplayTitle,
  getArticleText,
  getCategoryIcon,
  isChineseLocaleText
} from "./article-helpers";
import {
  applyGitHubMetadataToForm,
  applyGitHubMetadataToFields,
  createAdminIconFromUrl,
  createArticleBrowseHref,
  createContentItemPreviewHref,
  getContentItemPreviewImage,
  getGitHubMetadataDetailText,
  isGitHubUrl,
  normalizeSlugInput
} from "./admin-display";
import {
  createImageFromUrl,
  formatTagInputText,
  getCategoryLabel,
  getToolInitials,
  isGitHubRepoUrl,
  isValidHttpUrl,
  normalizeHttpUrlInput,
  normalizeTagInputText,
  parseArticleTagsInput
} from "./tool-helpers";
import {
  CompactTagRow,
  SiteBrandIdentity,
  SkeletonLayoutMask,
  SkeletonVisibility,
  addSiteIconRetryParam,
  isSiteIconDataUrl
} from "./shared-ui";
import { useLoadingSkeleton } from "./useLoadingSkeleton";
import { useOverlayFocusManagement } from "./useOverlayFocusManagement";
import { useVisualViewportKeyboard } from "./useVisualViewportKeyboard";
import { useUtilityMenuKeyboard } from "./useUtilityMenuKeyboard";
import {
  isEventInsideElement,
  useOutsideInteractionDismiss
} from "./useOutsideInteractionDismiss";
import {
  getLastInputModality,
  usePointerFocusRelease
} from "./usePointerFocusRelease";
import { hasCompleteUmamiSettings, normalizeUmamiScriptUrl, normalizeUmamiWebsiteId } from "./umami";
import { useAdminGitHubMetadata } from "./useAdminGitHubMetadata";
import { buildTelegramPreviewMarkdown, countTelegramMessageCharacters, createDefaultTelegramBody, createTelegramArticleResource, createTelegramContentResource, createTelegramCustomBodyExample, createTelegramResourceMediaUrl, createTelegramToolResource, escapeTelegramPreviewHashtags, getTelegramText, readTelegramBodyFields, syncTelegramBodyField, TELEGRAM_MESSAGE_LIMIT, type TelegramPushResource } from "./telegram";
import { getAdminMaintenanceText, getAdminWorkspaceText, getContentFlowText } from "./admin-text";
import AdminMarkdownEditor from "./components/AdminMarkdownEditor";
import {
  AdminGitHubMetadataButton,
  AdminGitHubMetadataCard
} from "./components/AdminGitHubMetadata";
import { AdminTagsField, AdminTextField, AdminTextareaField, AdminUrlField } from "./components/AdminResourceFields";
import UtilityMenuControls from "./components/UtilityMenuControls";
import { TELEGRAM_MARKDOWN_EDITOR_ACTIONS, type MarkdownEditorMode } from "./markdown-editor";
import MarkdownContent from "./components/MarkdownContent";
import TurnstileWidget from "./components/TurnstileWidget";
import {
  createCsv,
  createDatedExportFilename,
  createSourcePreview,
  downloadTextFile,
  fetchToolSource,
  readBackupPayload,
  validateBackupFileSize
} from "./admin-maintenance";
import {
  ADMIN_ARTICLE_PAGE_SIZE,
  ADMIN_FEATURED_CATEGORY,
  ADMIN_SYSTEM_SETTINGS_GROUP_PATHS,
  ADMIN_SYSTEM_SETTINGS_GROUPS,
  CONTENT_ITEM_PAGE_SIZE,
  DEFAULT_SOURCE_URL,
  EDGEONE_PROXY_PROJECT_URL,
  SITE_ICON_UPLOAD_ACCEPT,
  SOURCE_PREVIEW_ERROR_LIMIT,
  addAdminCategorySetting,
  buildFailedLinkCheckResults,
  buildLinkCheckTargets,
  clampInteger,
  datetimeLocalToIso,
  formatAdminDate,
  getAdminCategoryDisplayLabel,
  getAdminCategoryLabelWidth,
  getAdminPath,
  getAdminSystemSettingsGroupFromPath,
  getErrorMessage,
  getInitialAdminView,
  initialAdminCategorySettings,
  initialArticleForm,
  initialContentSourceForm,
  initialForm,
  isAllCategoryValue,
  isFeaturedCategoryValue,
  isPersistableAdminCategory,
  moveAdminCategoryInList,
  normalizeAdminCategoryValue,
  normalizeArticleForm,
  normalizeContentSourceForm,
  normalizeForm,
  normalizeSourceUrl,
  normalizeUrlForImport,
  sortCategoriesBySettings,
  type AdminView,
  type AdminSystemSettingsGroup,
  type ConvertPublishMode,
  type PendingAdminCategoryAction,
  type ThemeMode,
  type ToastInput
} from "./admin-helpers";

function getContentFeedErrorMessage(
  error: unknown,
  contentText: ReturnType<typeof getContentFlowText>,
  fallback: string
) {
  const message = error instanceof Error ? error.message : "";
  if (message === "Feed URL is not allowed." || message.includes("url must be a valid URL")) {
    return contentText.feedUrlNotAllowed;
  }
  if (message === "Feed redirect URL is not allowed.") {
    return contentText.feedRedirectNotAllowed;
  }
  if (message === "Feed request timed out.") return contentText.feedTimeout;
  if (message === "Feed response is too large.") return contentText.feedTooLarge;
  if (message === "Feed redirected too many times.") {
    return contentText.feedTooManyRedirects;
  }
  if (message === "Feed response type is not supported.") {
    return contentText.feedTypeUnsupported;
  }
  if (message === "Feed response body is empty.") return contentText.feedEmpty;
  if (message === "No feed items found.") return contentText.feedNoItems;
  const status = message.match(/^Feed request failed with status (\d+)\.$/)?.[1];
  if (status) return contentText.feedRequestFailed(status);
  return message || fallback;
}

function formatAdminDocumentTitle(
  pageTitle: string,
  siteName: string,
  adminLabel: string
) {
  return `${pageTitle} · ${siteName} ${adminLabel}`;
}

type AdminSortMode = "latest" | "oldest";
type AdminWriteEntityScope =
  | "tool"
  | "article"
  | "custom"
  | "content-source"
  | "content-item";
const TELEGRAM_PUSH_PAGE_SIZE = 30;
const TELEGRAM_PUSH_TOOL_FILTER = "__telegram_tool__";
const TELEGRAM_PUSH_ARTICLE_FILTER = "__telegram_article__";
const TELEGRAM_PUSH_CONTENT_FILTER = "__telegram_content__";
const TELEGRAM_PUSH_FIXED_FILTERS = [
  "All",
  TELEGRAM_PUSH_TOOL_FILTER,
  TELEGRAM_PUSH_ARTICLE_FILTER,
  TELEGRAM_PUSH_CONTENT_FILTER
];

function isTelegramPushSourceFilter(value: string) {
  return value === TELEGRAM_PUSH_TOOL_FILTER ||
    value === TELEGRAM_PUSH_ARTICLE_FILTER ||
    value === TELEGRAM_PUSH_CONTENT_FILTER;
}

function getTelegramPushDefaultFilter(resourceType: TelegramResourceType) {
  if (resourceType === "tool") return TELEGRAM_PUSH_TOOL_FILTER;
  if (resourceType === "article") return TELEGRAM_PUSH_ARTICLE_FILTER;
  if (resourceType === "content") return TELEGRAM_PUSH_CONTENT_FILTER;
  return "";
}

function getTelegramWriteEntityScope(
  resourceType: TelegramResourceType
): AdminWriteEntityScope {
  return resourceType === "content" ? "content-item" : resourceType;
}

function getTelegramStoredCategory(value: string) {
  const normalized = normalizeAdminCategoryValue(value);
  return isAllCategoryValue(normalized) || isTelegramPushSourceFilter(normalized)
    ? ""
    : normalized;
}

function getTelegramDisplayCategory(
  resourceType: TelegramResourceType,
  value: string
) {
  const stored = getTelegramStoredCategory(value);
  return stored || getTelegramPushDefaultFilter(resourceType);
}

function getTelegramPushCategoryLabel(
  category: string,
  telegramText: ReturnType<typeof getTelegramText>,
  t: Messages
) {
  if (category === TELEGRAM_PUSH_TOOL_FILTER) {
    return telegramText.management.typeTool;
  }
  if (category === TELEGRAM_PUSH_ARTICLE_FILTER) {
    return telegramText.management.typeArticle;
  }
  if (category === TELEGRAM_PUSH_CONTENT_FILTER) {
    return telegramText.management.typeContent;
  }
  return getCategoryLabel(category, t);
}

function uniqueAdminCategories(categories: string[]) {
  return Array.from(
    new Map(
      categories
        .map(normalizeAdminCategoryValue)
        .filter(Boolean)
        .map((category) => [category.toLocaleLowerCase(), category] as const)
    ).values()
  );
}
type TelegramMessageErrorCode =
  | "TELEGRAM_MESSAGE_NOT_FOUND"
  | "TELEGRAM_PERMISSION_DENIED"
  | "TELEGRAM_TARGET_CHANGED"
  | "";

function getTelegramMessageErrorCode(error: unknown): TelegramMessageErrorCode {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "TELEGRAM_MESSAGE_NOT_FOUND" ||
      error.code === "TELEGRAM_TARGET_CHANGED" ||
      error.code === "TELEGRAM_PERMISSION_DENIED")
  ) {
    return error.code;
  }
  return "";
}

function getAdminWriteEntityKey(scope: AdminWriteEntityScope, id?: string | null) {
  return `${scope}:${id || "new"}`;
}

const ADMIN_VIEW_STATE_STORAGE_KEYS = {
  tools: {
    category: "htools_admin_tool_category",
    search: "htools_admin_tool_search",
    sort: "htools_admin_tool_sort"
  },
  articles: {
    category: "htools_admin_article_category",
    search: "htools_admin_article_search",
    sort: "htools_admin_article_sort"
  },
  content: {
    category: "htools_admin_content_category",
    search: "htools_admin_content_search",
    sort: "htools_admin_content_sort",
    source: "htools_admin_content_source"
  },
  telegram: {
    sort: "htools_admin_telegram_push_sort"
  }
} as const;

function getStoredAdminSortMode(key: string): AdminSortMode {
  return localStorage.getItem(key) === "oldest" ? "oldest" : "latest";
}

function getStoredAdminFilter(key: string, fallback: string) {
  return localStorage.getItem(key) ?? fallback;
}

function AdminSortButton({
  mode,
  onChange,
  t
}: {
  mode: AdminSortMode;
  onChange: (mode: AdminSortMode) => void;
  t: Messages;
}) {
  const label = mode === "latest" ? t.admin.sortLatest : t.admin.sortOldest;
  const shortLabel =
    mode === "latest" ? t.admin.sortLatestShort : t.admin.sortOldestShort;

  return (
    <button
      className="ghost-button admin-sort-button"
      type="button"
      aria-label={label}
      title={label}
      onClick={() => onChange(mode === "latest" ? "oldest" : "latest")}
    >
      <ArrowDownUp size={16} />
      <span className="admin-sort-label admin-sort-label-full">{label}</span>
      <span className="admin-sort-label admin-sort-label-compact" aria-hidden="true">
        {shortLabel}
      </span>
    </button>
  );
}

function AdminEmptyState({
  action,
  className = "",
  description,
  title
}: {
  action?: { label: string; onClick: () => void; tone?: "primary" | "ghost" };
  className?: string;
  description: string;
  title: string;
}) {
  return (
    <section className={`admin-empty-state ${className}`.trim()}>
      <div className="empty-state-title">
        <h2>{title}</h2>
      </div>
      <p>{description}</p>
      {action ? (
        <button
          className={`${
            action.tone === "ghost" ? "ghost-button" : "primary-button"
          } empty-state-action`}
          type="button"
          onClick={action.onClick}
        >
          {action.label}
          {action.tone === "ghost" ? null : <ArrowUpRight size={15} />}
        </button>
      ) : null}
    </section>
  );
}

function AdminFilterBar({
  categoryControl,
  clearLabel,
  hasActiveFilter,
  onClear,
  onSearchChange,
  searchPlaceholder,
  searchValue
}: {
  categoryControl: ReactNode;
  clearLabel: string;
  hasActiveFilter: boolean;
  onClear: () => void;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchValue: string;
}) {
  const searchFieldRef = useRef<HTMLLabelElement>(null);

  useEffect(() => {
    function releaseSearchFocus(event: PointerEvent) {
      if (event.pointerType !== "touch") return;
      const searchField = searchFieldRef.current;
      const input = searchField?.querySelector<HTMLInputElement>("input");
      if (
        input &&
        document.activeElement === input &&
        !searchField?.contains(event.target as Node)
      ) {
        input.blur();
      }
    }

    document.addEventListener("pointerdown", releaseSearchFocus, true);
    return () => document.removeEventListener("pointerdown", releaseSearchFocus, true);
  }, []);

  return (
    <div className="admin-filter-row">
      {categoryControl}
      <div className="admin-search-row">
        <label className="admin-search-field" ref={searchFieldRef}>
          <Search size={16} />
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </label>
        <button
          className="ghost-button admin-clear-filter"
          disabled={!hasActiveFilter}
          type="button"
          onClick={onClear}
        >
          <Eraser size={16} />
          <span>{clearLabel}</span>
        </button>
      </div>
    </div>
  );
}

function EditorTopActions({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`tool-editor-top-actions ${className}`.trim()}>{children}</div>
  );
}

function PublishModeField({
  disabled = false,
  draftLabel,
  label,
  onChange,
  publishedLabel,
  value
}: {
  disabled?: boolean;
  draftLabel: string;
  label: string;
  onChange: (value: ConvertPublishMode) => void;
  publishedLabel: string;
  value: ConvertPublishMode;
}) {
  return (
    <div className="tool-form-field article-publish-mode-field">
      <span className="tool-form-label">{label}</span>
      <div
        className="admin-segmented-toggle"
        role="group"
      >
        {(["published", "draft"] as const).map((mode) => {
          const selected = value === mode;
          return (
            <button
              aria-pressed={selected}
              className={`admin-segmented-toggle-option ${
                selected ? "is-active" : ""
              }`}
              disabled={disabled}
              key={mode}
              type="button"
              onClick={() => onChange(mode)}
            >
              <span>{mode === "published" ? publishedLabel : draftLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BooleanSegmentedToggle({
  className = "",
  disabled = false,
  disabledLabel,
  enabledLabel,
  onChange,
  value
}: {
  className?: string;
  disabled?: boolean;
  disabledLabel: string;
  enabledLabel: string;
  onChange: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <div
      className={`admin-segmented-toggle ${className}`.trim()}
      role="group"
    >
      {([true, false] as const).map((enabled) => {
        const selected = value === enabled;
        return (
          <button
            aria-pressed={selected}
            className={`admin-segmented-toggle-option ${
              selected ? "is-active" : ""
            }`}
            disabled={disabled}
            key={String(enabled)}
            type="button"
            onClick={() => onChange(enabled)}
          >
            <span>{enabled ? enabledLabel : disabledLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

const DialogCloseContext = createContext<(() => void) | null>(null);

function AdminDialogActions({
  closeLabel,
  disabled = false,
  formId,
  leading,
  onClose,
  onPrimary,
  primaryLabel
}: {
  closeLabel?: string;
  disabled?: boolean;
  formId?: string;
  leading?: ReactNode;
  onClose?: () => void;
  onPrimary?: () => void;
  primaryLabel: string;
}) {
  const dialogRequestClose = useContext(DialogCloseContext);
  const handleClose = dialogRequestClose ?? onClose;

  return (
    <>
      {leading}
      {closeLabel ? (
        <button className="ghost-button" disabled={disabled} type="button" onClick={handleClose}>
          {closeLabel}
        </button>
      ) : null}
      <button
        className="primary-button"
        disabled={disabled}
        form={formId}
        type={formId ? "submit" : "button"}
        onClick={onPrimary}
      >
        {primaryLabel}
      </button>
    </>
  );
}

function AdminConfirmDialog({
  cancelLabel,
  closeLabel,
  confirmLabel,
  description,
  descriptionId,
  disabled = false,
  onCancel,
  onConfirm,
  title
}: {
  cancelLabel: string;
  closeLabel?: string;
  confirmLabel: string;
  description: string;
  descriptionId: string;
  disabled?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}) {
  return (
    <Dialog
      closeDisabled={disabled}
      closeLabel={closeLabel ?? cancelLabel}
      description={description}
      descriptionId={descriptionId}
      onClose={onCancel}
      panelClassName="tool-editor-dialog admin-action-dialog admin-confirm-dialog"
      title={title}
      footer={
        <AdminDialogActions
          closeLabel={cancelLabel}
          disabled={disabled}
          onClose={onCancel}
          onPrimary={onConfirm}
          primaryLabel={confirmLabel}
        />
      }
    />
  );
}

export default function AdminApp({
  locale,
  onBackHome,
  onLocaleChange,
  onNotify,
  onProxySettingsChange,
  onSiteSettingsChange,
  onUmamiSettingsChange,
  onThemeChange,
  proxySettings,
  proxySettingsLoadError,
  proxySettingsReady,
  siteSettings,
  siteSettingsLoadError,
  siteSettingsReady,
  t,
  themeMode
}: {
  locale: Locale;
  onBackHome: () => void;
  onLocaleChange: (locale: Locale) => void;
  onNotify: (toast: ToastInput) => void;
  onProxySettingsChange: (settings: ProxySettings) => void;
  onSiteSettingsChange: (settings: SiteSettings) => void;
  onUmamiSettingsChange: (settings: UmamiSettings) => void;
  onThemeChange: (themeMode: ThemeMode) => void;
  proxySettings: ProxySettings;
  proxySettingsLoadError: unknown;
  proxySettingsReady: boolean;
  siteSettings: SiteSettings;
  siteSettingsLoadError: unknown;
  siteSettingsReady: boolean;
  t: Messages;
  themeMode: ThemeMode;
}) {
  usePointerFocusRelease();
  const {
    closeMenu: closeAdminMenu,
    getMenuId: getAdminMenuId,
    handleMenuKeyDown: handleAdminMenuKeyDown,
    handleTriggerKeyDown: handleAdminMenuTriggerKeyDown,
    openMenu: openAdminMenu,
    setOpenMenu: setOpenAdminMenu,
    toggleMenu: toggleAdminMenu
  } = useUtilityMenuKeyboard<"locale" | "theme">("admin");
  const adminUtilityMenuController = {
    closeMenu: closeAdminMenu,
    getMenuId: getAdminMenuId,
    handleMenuKeyDown: handleAdminMenuKeyDown,
    handleTriggerKeyDown: handleAdminMenuTriggerKeyDown,
    openMenu: openAdminMenu,
    toggleMenu: toggleAdminMenu
  };
  const [token, setToken] = useState(() => localStorage.getItem("htools_token") ?? "");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authConfig, setAuthConfig] = useState<AdminAuthConfig | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [adminArticles, setAdminArticles] = useState<ArticleSummary[]>([]);
  const [adminArticlesHasMore, setAdminArticlesHasMore] = useState(false);
  const [adminArticlesTotal, setAdminArticlesTotal] = useState(0);
  const [adminArticleCategoryCounts, setAdminArticleCategoryCounts] =
    useState<Record<string, number>>({});
  const [contentSources, setContentSources] = useState<ContentSource[]>([]);
  const [contentItems, setContentItems] = useState<ContentItemSummary[]>([]);
  const [contentItemsHasMore, setContentItemsHasMore] = useState(false);
  const [contentItemsTotal, setContentItemsTotal] = useState(0);
  const [contentSourceCounts, setContentSourceCounts] = useState<Record<string, number>>({});
  const [contentCategoryCounts, setContentCategoryCounts] =
    useState<Record<string, number>>({});
  const [adminCategorySettings, setAdminCategorySettings] =
    useState<AdminCategorySettings>(initialAdminCategorySettings);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings>({
    available: false,
    enabled: false,
    target: "",
    footerMarkdown: ""
  });
  const [telegramSettingsLoading, setTelegramSettingsLoading] = useState(
    Boolean(token)
  );
  const [telegramSettingsLoadError, setTelegramSettingsLoadError] =
    useState<unknown>(null);
  const [telegramPushRecords, setTelegramPushRecords] = useState<TelegramPushRecord[]>([]);
  const [telegramPushCategoryOptions, setTelegramPushCategoryOptions] = useState<string[]>([]);
  const [telegramPushCategory, setTelegramPushCategory] = useState("All");
  const [telegramPushSearch, setTelegramPushSearch] = useState("");
  const [telegramPushSortMode, setTelegramPushSortMode] = useState<AdminSortMode>(() =>
    getStoredAdminSortMode(ADMIN_VIEW_STATE_STORAGE_KEYS.telegram.sort)
  );
  const [debouncedTelegramPushSearch, setDebouncedTelegramPushSearch] = useState("");
  const [telegramPushHasMore, setTelegramPushHasMore] = useState(false);
  const [isLoadingTelegramPushes, setIsLoadingTelegramPushes] = useState(false);
  const [isLoadingMoreTelegramPushes, setIsLoadingMoreTelegramPushes] = useState(false);
  const [hasLoadedTelegramPushes, setHasLoadedTelegramPushes] = useState(false);
  const [telegramPushLoadError, setTelegramPushLoadError] = useState<string | null>(null);
  const [viewingTelegramPush, setViewingTelegramPush] =
    useState<TelegramPushRecord | null>(null);
  const [pendingDeleteTelegramPush, setPendingDeleteTelegramPush] =
    useState<TelegramPushRecord | null>(null);
  const [isDeletingTelegramPush, setIsDeletingTelegramPush] = useState(false);
  const [pendingPushTelegramRecord, setPendingPushTelegramRecord] =
    useState<TelegramPushRecord | null>(null);
  const [isPushingTelegramRecord, setIsPushingTelegramRecord] = useState(false);
  const [telegramResource, setTelegramResource] = useState<TelegramPushResource | null>(null);
  const [telegramMessage, setTelegramMessage] = useState<TelegramMessage | null>(null);
  const [isCreatingTelegramPush, setIsCreatingTelegramPush] = useState(false);
  const [telegramQuickResource, setTelegramQuickResource] =
    useState<TelegramPushResource | null>(null);
  const [telegramQuickMessage, setTelegramQuickMessage] =
    useState<TelegramMessage | null>(null);
  const [telegramQuickMode, setTelegramQuickMode] =
    useState<ConvertPublishMode>("published");
  const [telegramQuickCategory, setTelegramQuickCategory] = useState("");
  const [telegramQuickLoading, setTelegramQuickLoading] = useState(false);
  const [telegramQuickSaving, setTelegramQuickSaving] = useState(false);
  const [telegramCustomTitle, setTelegramCustomTitle] = useState("");
  const [telegramDescription, setTelegramDescription] = useState("");
  const [telegramUrl, setTelegramUrl] = useState("");
  const [telegramDemoUrl, setTelegramDemoUrl] = useState("");
  const [telegramImage, setTelegramImage] = useState("");
  const [telegramCategory, setTelegramCategory] = useState("");
  const [telegramTagText, setTelegramTagText] = useState("");
  const [telegramSourceLoading, setTelegramSourceLoading] = useState(false);
  const [telegramBodyMarkdown, setTelegramBodyMarkdown] = useState("");
  const [telegramMediaEnabled, setTelegramMediaEnabled] = useState(false);
  const [telegramMediaUrl, setTelegramMediaUrl] = useState("");
  const [telegramMarkdownEditorMode, setTelegramMarkdownEditorMode] =
    useState<MarkdownEditorMode>();
  const [telegramMessageLoading, setTelegramMessageLoading] = useState(false);
  const [telegramMessageSaving, setTelegramMessageSaving] = useState(false);
  const [telegramMessageErrorCode, setTelegramMessageErrorCode] =
    useState<TelegramMessageErrorCode>("");
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editingContentSource, setEditingContentSource] =
    useState<ContentSource | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [articleFormOpen, setArticleFormOpen] = useState(false);
  const [contentSourceFormOpen, setContentSourceFormOpen] = useState(false);
  const toolEditorCloseRequestRef = useRef<(() => void) | null>(null);
  const articleEditorCloseRequestRef = useRef<(() => void) | null>(null);
  const contentSourceEditorCloseRequestRef = useRef<(() => void) | null>(null);
  const contentConvertCloseRequestRef = useRef<(() => void) | null>(null);
  const [adminView, setAdminView] = useState<AdminView>(() => getInitialAdminView());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("htools_admin_sidebar") === "collapsed"
  );
  const [adminSearch, setAdminSearch] = useState(() =>
    getStoredAdminFilter(ADMIN_VIEW_STATE_STORAGE_KEYS.tools.search, "")
  );
  const [articleSearch, setArticleSearch] = useState(() =>
    getStoredAdminFilter(ADMIN_VIEW_STATE_STORAGE_KEYS.articles.search, "")
  );
  const [debouncedArticleSearch, setDebouncedArticleSearch] = useState(() =>
    getStoredAdminFilter(ADMIN_VIEW_STATE_STORAGE_KEYS.articles.search, "").trim()
  );
  const [articleCategoryFilter, setArticleCategoryFilter] = useState(() =>
    normalizeAdminCategoryValue(
      getStoredAdminFilter(ADMIN_VIEW_STATE_STORAGE_KEYS.articles.category, "All")
    )
  );
  const [contentSearch, setContentSearch] = useState(() =>
    getStoredAdminFilter(ADMIN_VIEW_STATE_STORAGE_KEYS.content.search, "")
  );
  const [debouncedContentSearch, setDebouncedContentSearch] = useState(() =>
    getStoredAdminFilter(ADMIN_VIEW_STATE_STORAGE_KEYS.content.search, "").trim()
  );
  const [contentCategoryFilter, setContentCategoryFilter] = useState(() =>
    normalizeAdminCategoryValue(
      getStoredAdminFilter(ADMIN_VIEW_STATE_STORAGE_KEYS.content.category, "All")
    )
  );
  const [contentSourceFilter, setContentSourceFilter] = useState(() =>
    getStoredAdminFilter(ADMIN_VIEW_STATE_STORAGE_KEYS.content.source, "all")
  );
  const [adminCategory, setAdminCategory] = useState(() =>
    normalizeAdminCategoryValue(
      getStoredAdminFilter(ADMIN_VIEW_STATE_STORAGE_KEYS.tools.category, "All")
    )
  );
  const [toolSortMode, setToolSortMode] = useState<AdminSortMode>(() =>
    getStoredAdminSortMode(ADMIN_VIEW_STATE_STORAGE_KEYS.tools.sort)
  );
  const [articleSortMode, setArticleSortMode] = useState<AdminSortMode>(() =>
    getStoredAdminSortMode(ADMIN_VIEW_STATE_STORAGE_KEYS.articles.sort)
  );
  const [contentSortMode, setContentSortMode] = useState<AdminSortMode>(() =>
    getStoredAdminSortMode(ADMIN_VIEW_STATE_STORAGE_KEYS.content.sort)
  );
  const [form, setForm] = useState<ToolInput>(initialForm);
  const [toolTagText, setToolTagText] = useState(() =>
    formatTagInputText(initialForm.tags)
  );
  const [articleForm, setArticleForm] = useState<ArticleInput>(initialArticleForm);
  const [articleTagText, setArticleTagText] = useState(() =>
    formatTagInputText(initialArticleForm.tags)
  );
  const [contentSourceForm, setContentSourceForm] = useState<ContentSourceInput>(
    initialContentSourceForm
  );
  const [contentSourceTagText, setContentSourceTagText] = useState(() =>
    formatTagInputText(initialContentSourceForm.tags)
  );
  const [contentPreview, setContentPreview] = useState<FeedPreview | null>(null);
  const contentPreviewRef = useRef<HTMLDivElement>(null);
  const contentPreviewAbortRef = useRef<AbortController | null>(null);
  const contentPreviewRequestRef = useRef(0);
  const adminContentScrollRef = useRef<HTMLDivElement>(null);
  const [status, setStatusEvent] = useState<{ id: number; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isArticleSaving, setIsArticleSaving] = useState(false);
  const [isContentSourceSaving, setIsContentSourceSaving] = useState(false);
  const [isContentPreviewing, setIsContentPreviewing] = useState(false);
  const [pendingDeleteTool, setPendingDeleteTool] = useState<Tool | null>(null);
  const [pendingDeleteArticle, setPendingDeleteArticle] =
    useState<ArticleSummary | null>(null);
  const [pendingFeaturedTool, setPendingFeaturedTool] = useState<Tool | null>(null);
  const [pendingPublishedArticle, setPendingPublishedArticle] =
    useState<ArticleSummary | null>(null);
  const [pendingDeleteContentSource, setPendingDeleteContentSource] =
    useState<ContentSource | null>(null);
  const [pendingCategoryAction, setPendingCategoryAction] =
    useState<PendingAdminCategoryAction | null>(null);
  const [pendingConvertItem, setPendingConvertItem] =
    useState<ContentItemSummary | null>(null);
  const [convertArticleCategory, setConvertArticleCategory] = useState("");
  const [convertPublishMode, setConvertPublishMode] =
    useState<ConvertPublishMode>("published");
  const [categoryActionTarget, setCategoryActionTarget] = useState("");
  const [isDeletingTool, setIsDeletingTool] = useState(false);
  const [isDeletingArticle, setIsDeletingArticle] = useState(false);
  const [isDeletingContentSource, setIsDeletingContentSource] = useState(false);
  const [isApplyingCategoryAction, setIsApplyingCategoryAction] = useState(false);
  const [isLoadingTools, setIsLoadingTools] = useState(Boolean(token));
  const [isLoadingArticles, setIsLoadingArticles] = useState(Boolean(token));
  const [isLoadingMoreArticles, setIsLoadingMoreArticles] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(Boolean(token));
  const [isLoadingMoreContent, setIsLoadingMoreContent] = useState(false);
  const [hasLoadedTools, setHasLoadedTools] = useState(false);
  const [hasLoadedArticles, setHasLoadedArticles] = useState(false);
  const [hasLoadedContent, setHasLoadedContent] = useState(false);
  const [toolsLoadError, setToolsLoadError] = useState<string | null>(null);
  const [articlesLoadError, setArticlesLoadError] = useState<string | null>(null);
  const [contentLoadError, setContentLoadError] = useState<string | null>(null);
  const [writeLockedEntityKeys, setWriteLockedEntityKeys] = useState<Set<string>>(
    () => new Set()
  );
  const [sidebarAnimating, setSidebarAnimating] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const mobileSidebarRef = useRef<HTMLElement>(null);
  const mobileSidebarCloseRef = useRef<HTMLButtonElement>(null);
  const sidebarToggleRef = useRef<HTMLButtonElement>(null);
  const writeActionLocksRef = useRef(new Set<string>());
  const adminCategorySettingsRef = useRef(adminCategorySettings);
  const adminCategoryLoadRequestRef = useRef(0);
  const adminCategorySaveGenerationRef = useRef<Record<AdminCategoryScope, number>>({
    tools: 0,
    articles: 0,
    push: 0,
    content: 0
  });
  const adminCategorySavePendingRef = useRef(new Set<AdminCategoryScope>());
  const adminCategorySaveRunningRef = useRef(false);
  const adminCategoryRollbackRef = useRef<Partial<Record<AdminCategoryScope, string[]>>>({});
  const adminToolsRequestGenerationRef = useRef(0);
  const adminArticlesRequestGenerationRef = useRef(0);
  const adminArticlesNextCursorRef = useRef<string | null>(null);
  const adminArticlesLoadingCursorRef = useRef<string | null>(null);
  const articleEditorLoadRequestRef = useRef(0);
  const contentItemsRequestGenerationRef = useRef(0);
  const contentItemsNextCursorRef = useRef<string | null>(null);
  const contentItemsLoadingCursorRef = useRef<string | null>(null);
  const contentSourcesLoadedRef = useRef(false);
  const mutationRefreshGenerationRef = useRef(0);
  const telegramSettingsLoadRequestRef = useRef(0);
  const telegramSettingsLoadAbortRef = useRef<AbortController | null>(null);
  const telegramPushRequestGenerationRef = useRef(0);
  const telegramPushNextCursorRef = useRef<string | null>(null);
  const telegramPushLoadingCursorRef = useRef<string | null>(null);
  const sidebarAnimationTimer = useRef<number | null>(null);
  const adminStatusTimer = useRef<number | null>(null);
  const adminStatusSequence = useRef(0);
  const adminStatusCurrentRef = useRef("");
  const mobileSidebarFocus = useOverlayFocusManagement({
    active: mobileSidebarOpen,
    containerRef: mobileSidebarRef,
    initialFocusRef: mobileSidebarCloseRef,
    onEscape: closeMobileSidebar,
    returnFocusRef: sidebarToggleRef
  });
  const telegramGitHub = useAdminGitHubMetadata({
    active: Boolean(
      telegramResource?.type === "custom" && isCreatingTelegramPush
    ),
    autoApply: true,
    autoLoad: true,
    onError: (error) => setStatus(getLocalizedErrorMessage(error, t)),
    getSnapshot: () => ({
      name: telegramCustomTitle,
      description: telegramDescription,
      url: telegramUrl,
      demoUrl: telegramDemoUrl,
      image: telegramImage,
      tags: parseArticleTagsInput(telegramTagText)
    }),
    onMetadata: (
      metadata,
      normalizedUrl,
      previousMetadata,
      overwrite,
      requestSnapshot
    ) => {
      const nextFields = applyGitHubMetadataToFields(
        {
          name: telegramCustomTitle,
          description: telegramDescription,
          url: telegramUrl,
          demoUrl: telegramDemoUrl,
          image: telegramImage,
          tags: parseArticleTagsInput(telegramTagText)
        },
        metadata,
        normalizedUrl,
        previousMetadata,
        overwrite,
        requestSnapshot
      );
      setTelegramCustomTitle(nextFields.name);
      setTelegramDescription(nextFields.description);
      setTelegramUrl(nextFields.url);
      setTelegramDemoUrl(nextFields.demoUrl);
      setTelegramImage(nextFields.image);
      setTelegramTagText(formatTagInputText(nextFields.tags));
      setTelegramBodyMarkdown((current) => {
        let next = current;
        next = syncTelegramBodyField(
          next,
          { title: nextFields.name },
          telegramSettings.footerMarkdown,
          locale
        );
        next = syncTelegramBodyField(
          next,
          { description: nextFields.description },
          telegramSettings.footerMarkdown,
          locale
        );
        next = syncTelegramBodyField(
          next,
          { url: nextFields.url, resourceType: "custom" },
          telegramSettings.footerMarkdown,
          locale
        );
        next = syncTelegramBodyField(
          next,
          { demoUrl: nextFields.demoUrl },
          telegramSettings.footerMarkdown,
          locale
        );
        return syncTelegramBodyField(
          next,
          { tags: nextFields.tags },
          telegramSettings.footerMarkdown,
          locale
        );
      });
    },
    onSuccess: () => setStatus(t.status.githubMetadataApplied),
    sourceUrl: telegramUrl,
    token
  });
  const toolGitHub = useAdminGitHubMetadata({
    active: formOpen,
    autoApply: !editingTool,
    autoLoad: true,
    getSnapshot: () => ({
      name: form.name,
      description: form.description,
      url: form.url,
      demoUrl: form.demoUrl,
      image: form.image,
      tags: form.tags
    }),
    onError: (error) => setStatus(getLocalizedErrorMessage(error, t)),
    onMetadata: (metadata, normalizedUrl, previousMetadata, overwrite, requestSnapshot) => {
      setForm((current) => applyGitHubMetadataToForm(
        current,
        metadata,
        normalizedUrl,
        previousMetadata,
        overwrite,
        requestSnapshot
      ));
    },
    onSuccess: () => setStatus(t.status.githubMetadataApplied),
    sourceUrl: form.url,
    token
  });
  const siteName = getSiteDisplayName(siteSettings);
  const maintenanceText = getAdminMaintenanceText(locale);
  const workspaceText = getAdminWorkspaceText(locale);
  const categoryText = workspaceText.category;
  const articleText = getArticleText(locale);
  const telegramText = getTelegramText(locale);

  function closeMobileSidebar() {
    setOpenAdminMenu(null);
    setMobileSidebarOpen(false);
  }

  function commitAdminCategorySettings(settings: AdminCategorySettings) {
    adminCategorySettingsRef.current = settings;
    setAdminCategorySettings(settings);
  }

  async function flushAdminCategorySaves() {
    if (adminCategorySaveRunningRef.current) return;
    adminCategorySaveRunningRef.current = true;

    try {
      while (adminCategorySavePendingRef.current.size > 0) {
        const scope = adminCategorySavePendingRef.current.values().next()
          .value as AdminCategoryScope;
        adminCategorySavePendingRef.current.delete(scope);
        const generation = adminCategorySaveGenerationRef.current[scope];
        const nextCategories = [...adminCategorySettingsRef.current[scope]];

        try {
          const saved = await saveAdminCategorySettings(
            { [scope]: nextCategories },
            token
          );
          if (adminCategorySaveGenerationRef.current[scope] === generation) {
            commitAdminCategorySettings({
              ...adminCategorySettingsRef.current,
              [scope]: saved[scope]
            });
            delete adminCategoryRollbackRef.current[scope];
          }
        } catch (error) {
          if (adminCategorySaveGenerationRef.current[scope] === generation) {
            const previousCategories = adminCategoryRollbackRef.current[scope];
            if (previousCategories) {
              commitAdminCategorySettings({
                ...adminCategorySettingsRef.current,
                [scope]: previousCategories
              });
            }
            delete adminCategoryRollbackRef.current[scope];
            setStatus(getLocalizedErrorMessage(error, t));
          }
        }
      }
    } finally {
      adminCategorySaveRunningRef.current = false;
      if (adminCategorySavePendingRef.current.size > 0) {
        void flushAdminCategorySaves();
      }
    }
  }

  function persistAdminCategoryScope(
    scope: AdminCategoryScope,
    nextCategories: string[],
    previousCategories: string[]
  ) {
    const generation = adminCategorySaveGenerationRef.current[scope] + 1;
    adminCategorySaveGenerationRef.current[scope] = generation;
    if (!adminCategoryRollbackRef.current[scope]) {
      adminCategoryRollbackRef.current[scope] = [...previousCategories];
    }
    const optimisticSettings = {
      ...adminCategorySettingsRef.current,
      [scope]: nextCategories
    };
    commitAdminCategorySettings(optimisticSettings);
    adminCategorySavePendingRef.current.add(scope);
    void flushAdminCategorySaves();
  }

  async function waitForAdminCategorySaves() {
    while (
      adminCategorySaveRunningRef.current ||
      adminCategorySavePendingRef.current.size > 0
    ) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 20));
    }
  }

  function acquireWriteAction(key: string) {
    if (writeActionLocksRef.current.has(key)) return false;
    writeActionLocksRef.current.add(key);
    setWriteLockedEntityKeys((current) => {
      const next = new Set(current);
      next.add(key);
      return next;
    });
    return true;
  }

  function releaseWriteAction(key: string) {
    writeActionLocksRef.current.delete(key);
    setWriteLockedEntityKeys((current) => {
      if (!current.has(key)) return current;
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }

  function isWriteEntityLocked(scope: AdminWriteEntityScope, id: string) {
    return writeActionLocksRef.current.has(getAdminWriteEntityKey(scope, id));
  }

  const contentText = getContentFlowText(locale);
  const telegramPreviewMarkdown = telegramResource
    ? telegramBodyMarkdown
    : "";
  const telegramEditedResource = telegramResource ? {
    ...telegramResource,
    title: telegramCustomTitle.trim(),
    description: telegramDescription.trim(),
    url: telegramUrl.trim(),
    demoUrl: telegramDemoUrl.trim(),
    image: telegramImage.trim(),
    category: getTelegramStoredCategory(telegramCategory),
    tags: parseArticleTagsInput(telegramTagText)
  } : null;
  const telegramPreviewLength = countTelegramMessageCharacters(
    telegramPreviewMarkdown
  );
  const telegramCustomTitleMissing =
    Boolean(telegramResource) && !telegramCustomTitle.trim();
  const normalizedTelegramMediaUrl = normalizeHttpUrlInput(telegramMediaUrl);
  const telegramMediaValid = !telegramMediaEnabled || (
    Boolean(normalizedTelegramMediaUrl) &&
    isValidHttpUrl(normalizedTelegramMediaUrl)
  );
  const telegramEditorDirty = Boolean(telegramMessage && (
    telegramBodyMarkdown !== telegramMessage.bodyMarkdown ||
    telegramMediaEnabled !== telegramMessage.mediaEnabled ||
    telegramMediaUrl !== telegramMessage.mediaUrl ||
    JSON.stringify(telegramEditedResource) !== JSON.stringify(telegramMessage.resource)
  ));
  const telegramPushNeeded = Boolean(telegramMessage && (
    !telegramMessage.exists ||
    telegramEditorDirty ||
    telegramMessage.syncStatus !== "synced"
  ));
  const activeTitle =
    adminView === "articles"
      ? articleText.adminNav
      : adminView === "content"
        ? contentText.nav
        : adminView === "push"
          ? telegramText.management.nav
        : adminView === "import-export"
          ? maintenanceText.importExportTab
          : adminView === "link-check"
            ? maintenanceText.linkCheckTab
            : adminView === "system"
              ? maintenanceText.systemTitle
              : t.admin.toolLibrary;
  const activeDocumentTitle =
    adminView === "system"
      ? getAdminSystemSettingsGroupTitle(
          getInitialAdminSystemSettingsGroup(),
          maintenanceText
        )
      : activeTitle;
  const isConvertingContentItem = pendingConvertItem
    ? writeLockedEntityKeys.has(
        getAdminWriteEntityKey("content-item", pendingConvertItem.id)
      )
    : false;
  const showAdminToolSkeletons = useLoadingSkeleton(isLoadingTools && !hasLoadedTools);
  const showAdminArticleSkeletons = useLoadingSkeleton(
    isLoadingArticles && !hasLoadedArticles
  );
  const showAdminContentSkeletons = useLoadingSkeleton(
    isLoadingContent && !hasLoadedContent
  );
  const isInitialTelegramPushLoad =
    adminView === "push" && !hasLoadedTelegramPushes;
  const showTelegramPushSkeletons = isInitialTelegramPushLoad;
  const canFillGitHubMetadata = toolGitHub.canLoad;
  const githubMetadataDetailText = getGitHubMetadataDetailText(locale);

  const setStatus = useCallback((message: string) => {
    if (!message) {
      adminStatusCurrentRef.current = "";
      setStatusEvent(null);
      return;
    }

    if (adminStatusCurrentRef.current === message) {
      return;
    }

    adminStatusCurrentRef.current = message;
    adminStatusSequence.current += 1;
    setStatusEvent({
      id: adminStatusSequence.current,
      message
    });
  }, []);

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken("");
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken("");
  }, []);

  const handleTurnstileLoadError = useCallback(() => {
    setTurnstileToken("");
  }, []);

  const handleTurnstileTokenChange = useCallback((nextToken: string) => {
    setTurnstileToken(nextToken);
  }, []);

  useEffect(() => {
    if (token) return;

    let active = true;
    setAuthConfig(null);
    setTurnstileToken("");

    void loadAdminAuthConfig()
      .then((config) => {
        if (active) setAuthConfig(config);
      })
      .catch((error) => {
        if (!active) return;
        setStatus(getLocalizedErrorMessage(error, t));
      });

    return () => {
      active = false;
    };
  }, [setStatus, t, token]);

  useEffect(() => {
    function handleUnauthorized() {
      localStorage.removeItem("htools_token");
      adminStatusSequence.current += 1;
      setStatusEvent({
        id: adminStatusSequence.current,
        message: t.status.sessionExpired
      });
      adminStatusCurrentRef.current = t.status.sessionExpired;
      setPassword("");
      setIsLoggingIn(false);
      setMobileSidebarOpen(false);
      setOpenAdminMenu(null);
      setToken("");

      window.requestAnimationFrame(() => passwordInputRef.current?.focus());
    }

    window.addEventListener("htools:admin-unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("htools:admin-unauthorized", handleUnauthorized);
    };
  }, [t.status.sessionExpired]);

  useEffect(() => {
    localStorage.setItem(ADMIN_VIEW_STATE_STORAGE_KEYS.tools.sort, toolSortMode);
  }, [toolSortMode]);

  useEffect(() => {
    localStorage.setItem(ADMIN_VIEW_STATE_STORAGE_KEYS.articles.sort, articleSortMode);
  }, [articleSortMode]);

  useEffect(() => {
    localStorage.setItem(ADMIN_VIEW_STATE_STORAGE_KEYS.content.sort, contentSortMode);
  }, [contentSortMode]);

  useEffect(() => {
    localStorage.setItem(
      ADMIN_VIEW_STATE_STORAGE_KEYS.telegram.sort,
      telegramPushSortMode
    );
  }, [telegramPushSortMode]);

  useEffect(() => {
    localStorage.setItem(ADMIN_VIEW_STATE_STORAGE_KEYS.tools.search, adminSearch);
    localStorage.setItem(ADMIN_VIEW_STATE_STORAGE_KEYS.tools.category, adminCategory);
  }, [adminCategory, adminSearch]);

  useEffect(() => {
    localStorage.setItem(ADMIN_VIEW_STATE_STORAGE_KEYS.articles.search, articleSearch);
    localStorage.setItem(ADMIN_VIEW_STATE_STORAGE_KEYS.articles.category, articleCategoryFilter);
  }, [articleCategoryFilter, articleSearch]);

  useEffect(() => {
    localStorage.setItem(ADMIN_VIEW_STATE_STORAGE_KEYS.content.search, contentSearch);
    localStorage.setItem(ADMIN_VIEW_STATE_STORAGE_KEYS.content.category, contentCategoryFilter);
    localStorage.setItem(ADMIN_VIEW_STATE_STORAGE_KEYS.content.source, contentSourceFilter);
  }, [contentCategoryFilter, contentSearch, contentSourceFilter]);

  function moveGitHubUrlFromName(value: string) {
    const normalizedUrl = normalizeHttpUrlInput(value);

    if (!isGitHubRepoUrl(normalizedUrl)) return false;

    toolGitHub.reset(normalizedUrl);
    setForm((current) => ({
      ...current,
      name: "",
      url: normalizedUrl
    }));

    return true;
  }

  async function refreshAdminCategories() {
    const requestId = adminCategoryLoadRequestRef.current + 1;
    adminCategoryLoadRequestRef.current = requestId;
    const generations = { ...adminCategorySaveGenerationRef.current };
    try {
      const settings = await loadAdminCategorySettings(token);
      if (
        adminCategoryLoadRequestRef.current !== requestId ||
        (Object.keys(generations) as AdminCategoryScope[]).some(
          (scope) =>
            adminCategorySaveGenerationRef.current[scope] !== generations[scope]
        )
      ) {
        return;
      }
      commitAdminCategorySettings(settings);
    } catch (error) {
      if (
        adminCategoryLoadRequestRef.current === requestId &&
        (Object.keys(generations) as AdminCategoryScope[]).every(
          (scope) =>
            adminCategorySaveGenerationRef.current[scope] === generations[scope]
        )
      ) {
        setStatus(categoryText.loadFailed);
      }
    }
  }

  async function rememberAdminCategory(
    scope: AdminCategoryScope,
    category: string
  ) {
    const currentSettings = adminCategorySettingsRef.current;
    const nextSettings = addAdminCategorySetting(
      currentSettings,
      scope,
      category
    );

    if (nextSettings === currentSettings) {
      return;
    }

    await persistAdminCategoryScope(
      scope,
      nextSettings[scope],
      currentSettings[scope]
    );
  }

  async function moveAdminCategory(
    scope: AdminCategoryScope,
    category: string
  ) {
    if (scope === "push" && TELEGRAM_PUSH_FIXED_FILTERS.includes(normalizeAdminCategoryValue(category))) {
      return;
    }
    const currentSettings = adminCategorySettingsRef.current;
    const currentCategories =
      scope === "tools"
        ? adminFilterCategories
        : scope === "articles"
          ? articleFilterCategories
          : scope === "push"
            ? pushExistingCategories
            : contentFilterCategories;
    const nextOrder = moveAdminCategoryInList(
      currentCategories,
      category
    );

    if (
      nextOrder.length === currentSettings[scope].length &&
      nextOrder.every((item, index) => item === currentSettings[scope][index])
    ) {
      return;
    }

    await persistAdminCategoryScope(
      scope,
      nextOrder,
      currentSettings[scope]
    );
  }

  async function deleteAdminCategory(
    scope: AdminCategoryScope,
    category: string
  ) {
    const normalized = normalizeAdminCategoryValue(category);

    if (scope === "push" && TELEGRAM_PUSH_FIXED_FILTERS.includes(normalized)) {
      return;
    }

    if (isAllCategoryValue(normalized)) {
      setPendingCategoryAction({
        category: normalized,
        contentCount: getAdminCategoryContentCount(scope, normalized),
        scope
      });
      setCategoryActionTarget("");
      return;
    }

    if (scope === "tools" && isFeaturedCategoryValue(normalized)) {
      await applyCategoryAction(scope, normalized, "delete", "");
      return;
    }

    if (!isPersistableAdminCategory(normalized)) {
      return;
    }

    const contentCount = getAdminCategoryContentCount(scope, normalized);

    if (contentCount > 0) {
      setPendingCategoryAction({
        category: normalized,
        contentCount,
        scope
      });
      setCategoryActionTarget(getDefaultCategoryActionTarget(scope, normalized));
      return;
    }

    await applyCategoryAction(scope, normalized, "delete", "");
  }

  function getAdminCategoryContentCount(
    scope: AdminCategoryScope,
    category: string
  ) {
    const normalized = normalizeAdminCategoryValue(category);

    if (isAllCategoryValue(normalized)) {
      if (scope === "tools") {
        return tools.length;
      }

      if (scope === "articles") {
        return Object.values(adminArticleCategoryCounts).reduce(
          (total, count) => total + count,
          0
        );
      }

      if (scope === "push") return telegramPushRecords.length;

      return (
        contentSources.length +
        Object.values(contentCategoryCounts).reduce(
          (total, count) => total + count,
          0
        )
      );
    }

    if (scope === "tools") {
      if (isFeaturedCategoryValue(normalized)) {
        return tools.filter((tool) => tool.featured).length;
      }

      return tools.filter(
        (tool) => normalizeAdminCategoryValue(tool.category) === normalized
      ).length;
    }

    if (scope === "articles") {
      return Object.entries(adminArticleCategoryCounts).reduce(
        (total, [name, count]) =>
          normalizeAdminCategoryValue(name) === normalized ? total + count : total,
        0
      );
    }

    if (scope === "push") {
      return telegramPushRecords.filter((record) =>
        normalizeAdminCategoryValue(record.resource?.category ?? "") === normalized
      ).length;
    }

    const sourceCount = contentSources.filter(
      (source) => normalizeAdminCategoryValue(source.category) === normalized
    ).length;
    const itemCount = Object.entries(contentCategoryCounts).reduce(
      (total, [name, count]) =>
        normalizeAdminCategoryValue(name) === normalized ? total + count : total,
      0
    );

    return sourceCount + itemCount;
  }

  function getCategoryActionOptions(
    scope: AdminCategoryScope,
    category: string
  ) {
    const normalized = normalizeAdminCategoryValue(category);

    if (isAllCategoryValue(normalized)) {
      return [];
    }

    const categories =
      scope === "tools"
        ? adminFilterCategories
        : scope === "articles"
          ? articleExistingCategories
          : scope === "push"
            ? pushExistingCategories
            : contentExistingCategories;

    return categories.filter((item) => {
      const next = normalizeAdminCategoryValue(item);

      return (
        next &&
        next !== normalized &&
        next !== "All" &&
        next !== ADMIN_FEATURED_CATEGORY
      );
    });
  }

  function getDefaultCategoryActionTarget(
    scope: AdminCategoryScope,
    category: string
  ) {
    return getCategoryActionOptions(scope, category)[0] ?? "";
  }

  function syncCategoryStateAfterAction(
    scope: AdminCategoryScope,
    category: string,
    targetCategory: string
  ) {
    const normalized = normalizeAdminCategoryValue(category);
    const replacement = targetCategory
      ? normalizeAdminCategoryValue(targetCategory)
      : "";

    if (scope === "tools") {
      if (normalizeAdminCategoryValue(adminCategory) === normalized) {
        setAdminCategory(replacement || "All");
      }

      if (normalizeAdminCategoryValue(form.category) === normalized) {
        setForm((current) => ({ ...current, category: replacement }));
      }

      return;
    }

    if (scope === "articles") {
      if (normalizeAdminCategoryValue(articleCategoryFilter) === normalized) {
        setArticleCategoryFilter(replacement || "All");
      }

      if (normalizeAdminCategoryValue(articleForm.category) === normalized) {
        setArticleForm((current) => ({ ...current, category: replacement }));
      }

      if (normalizeAdminCategoryValue(convertArticleCategory) === normalized) {
        setConvertArticleCategory(replacement);
      }

      return;
    }

    if (scope === "push") {
      if (normalizeAdminCategoryValue(telegramPushCategory) === normalized) {
        setTelegramPushCategory(replacement || "All");
      }
      if (normalizeAdminCategoryValue(telegramCategory) === normalized) {
        setTelegramCategory(replacement);
      }
      if (normalizeAdminCategoryValue(telegramQuickCategory) === normalized) {
        setTelegramQuickCategory(replacement);
      }
      return;
    }

    if (normalizeAdminCategoryValue(contentCategoryFilter) === normalized) {
      setContentCategoryFilter(replacement || "All");
      setContentSourceFilter("all");
    }

    if (normalizeAdminCategoryValue(contentSourceForm.category) === normalized) {
      setContentSourceForm((current) => ({
        ...current,
        category: replacement
      }));
    }
  }

  async function applyCategoryAction(
    scope: AdminCategoryScope,
    category: string,
    action: AdminCategoryAction,
    targetCategory: string
  ) {
    const normalized = normalizeAdminCategoryValue(category);
    const target = targetCategory ? normalizeAdminCategoryValue(targetCategory) : "";

    if (action === "migrate") {
      if (!target || target === normalized || !isPersistableAdminCategory(target)) {
        setStatus(categoryText.migrationTargetRequired);
        return;
      }
    }

    setIsApplyingCategoryAction(true);

    try {
      await waitForAdminCategorySaves();
      const result = await applyAdminCategoryAction(
        scope,
        normalized,
        action,
        target,
        token
      );

      adminCategorySaveGenerationRef.current[scope] += 1;
      commitAdminCategorySettings(result.settings);
      syncCategoryStateAfterAction(
        scope,
        normalized,
        action === "migrate" ? target : ""
      );
      setPendingCategoryAction(null);
      setCategoryActionTarget("");

      if (scope === "tools") {
        await refreshAfterMutation(refresh);
      } else if (scope === "articles") {
        await refreshAfterMutation(async () => {
          await refreshArticles();
          await refreshContent();
        });
      } else if (scope === "push") {
        await refreshAfterMutation(refreshTelegramPushRecords);
      } else {
        await refreshAfterMutation(() => refreshContent());
      }

      setStatus(
        action === "migrate"
          ? getAdminCategoryMigratedText(categoryText, t, normalized, target, result.affected)
          : getAdminCategoryDeletedText(categoryText, t, normalized, scope)
      );
    } catch (error) {
      setStatus(categoryText.updateFailed);
    } finally {
      setIsApplyingCategoryAction(false);
    }
  }

  const adminFilterCategories = useMemo(() => {
    const names = sortCategoriesBySettings(
      [
        ...adminCategorySettings.tools,
        ...tools.map((tool) => tool.category),
        adminCategory
      ],
      adminCategorySettings.tools,
      t
    );

    return ["All", ADMIN_FEATURED_CATEGORY, ...names];
  }, [adminCategory, adminCategorySettings.tools, t, tools]);
  useEffect(() => {
    const normalizedAdminCategory = normalizeAdminCategoryValue(adminCategory);

    if (adminCategory !== normalizedAdminCategory) {
      setAdminCategory(normalizedAdminCategory);
      return;
    }

    if (!adminFilterCategories.includes(normalizedAdminCategory)) {
      setAdminCategory("All");
    }
  }, [adminCategory, adminFilterCategories]);
  useEffect(() => {
    localStorage.setItem(
      "htools_admin_sidebar",
      sidebarCollapsed ? "collapsed" : "expanded"
    );
  }, [sidebarCollapsed]);
  const visibleTools = useMemo(() => {
    const query = adminSearch.trim().toLowerCase();
    const filtered = tools.filter((tool) => {
      const matchesCategory =
        isAllCategoryValue(adminCategory) ||
        (isFeaturedCategoryValue(adminCategory)
          ? tool.featured
          : tool.category === adminCategory);
      const matchesQuery =
        !query ||
          [
            tool.name,
            tool.description,
            tool.url,
            tool.demoUrl,
            tool.category,
            ...tool.tags
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);

      return matchesCategory && matchesQuery;
    });

    return filtered.sort((left, right) => {
      if (toolSortMode === "oldest") {
        return (left.created_at ?? "").localeCompare(right.created_at ?? "");
      }

      return (right.created_at ?? "").localeCompare(left.created_at ?? "");
    });
  }, [adminCategory, adminSearch, toolSortMode, tools]);
  const articleExistingCategories = useMemo(() => {
    const names = sortCategoriesBySettings(
      [
        ...adminCategorySettings.articles,
        ...Object.keys(adminArticleCategoryCounts),
        ...adminArticles.map((article) => article.category)
      ],
      adminCategorySettings.articles,
      t
    );

    return names;
  }, [adminArticleCategoryCounts, adminArticles, adminCategorySettings.articles, t]);
  const pushExistingCategories = useMemo(
    () => uniqueAdminCategories(sortCategoriesBySettings(
      [
        ...adminCategorySettings.push,
        ...telegramPushCategoryOptions,
        ...telegramPushRecords.map((record) => record.resource?.category ?? "")
      ],
      adminCategorySettings.push,
      t
    )),
    [adminCategorySettings.push, t, telegramPushCategoryOptions, telegramPushRecords]
  );
  const pushCategoryOptions = useMemo(
    () => uniqueAdminCategories(sortCategoriesBySettings(
      [...pushExistingCategories, telegramCategory],
      adminCategorySettings.push,
      t
    )),
    [adminCategorySettings.push, pushExistingCategories, t, telegramCategory]
  );
  const telegramEditorCategoryOptions = useMemo(
    () => uniqueAdminCategories([
      getTelegramPushDefaultFilter(telegramResource?.type ?? "custom"),
      ...pushCategoryOptions
    ]),
    [pushCategoryOptions, telegramResource?.type]
  );
  const pushFilterCategories = useMemo(
    () =>
      Array.from(
        new Set(
          [...TELEGRAM_PUSH_FIXED_FILTERS, ...pushExistingCategories]
            .map(normalizeAdminCategoryValue)
            .filter(Boolean)
        )
      ),
    [pushExistingCategories]
  );
  const articleFilterCategories = useMemo(
    () =>
      Array.from(
        new Set(
          ["All", ...articleExistingCategories, articleCategoryFilter]
            .map(normalizeAdminCategoryValue)
            .filter(Boolean)
        )
      ),
    [articleCategoryFilter, articleExistingCategories]
  );
  const articleCategoryOptions = useMemo(
    () =>
      sortCategoriesBySettings(
        [
          ...articleExistingCategories,
          articleCategoryFilter,
          articleForm.category,
          convertArticleCategory
        ],
        adminCategorySettings.articles,
        t
      ),
    [
      adminCategorySettings.articles,
      articleCategoryFilter,
      articleExistingCategories,
      articleForm.category,
      convertArticleCategory,
      t
    ]
  );
  const visibleArticles = adminArticles;
  const hasActiveArticleFilter =
    !isAllCategoryValue(articleCategoryFilter) || Boolean(debouncedArticleSearch.trim());
  useEffect(() => {
    const normalizedArticleCategory =
      normalizeAdminCategoryValue(articleCategoryFilter);

    if (articleCategoryFilter !== normalizedArticleCategory) {
      setArticleCategoryFilter(normalizedArticleCategory);
      return;
    }

    if (!articleFilterCategories.includes(normalizedArticleCategory)) {
      setArticleCategoryFilter("All");
    }
  }, [articleCategoryFilter, articleFilterCategories]);
  const contentExistingCategories = useMemo(() => {
    const names = sortCategoriesBySettings(
      [
        ...adminCategorySettings.content,
        ...Object.keys(contentCategoryCounts),
        ...contentSources.map((source) => source.category),
        ...contentItems.map((item) => item.category)
      ],
      adminCategorySettings.content,
      t
    );

    return names;
  }, [adminCategorySettings.content, contentCategoryCounts, contentItems, contentSources, t]);
  const contentCategoryOptions = useMemo(
    () =>
      sortCategoriesBySettings(
        [
          ...contentExistingCategories,
          contentCategoryFilter,
          contentSourceForm.category
        ],
        adminCategorySettings.content,
        t
      ),
    [
      adminCategorySettings.content,
      contentCategoryFilter,
      contentExistingCategories,
      contentSourceForm.category,
      t
    ]
  );
  const contentFilterCategories = useMemo(
    () =>
      Array.from(
        new Set(
          ["All", ...contentExistingCategories, contentCategoryFilter]
            .map(normalizeAdminCategoryValue)
            .filter(Boolean)
        )
      ),
    [contentCategoryFilter, contentExistingCategories]
  );
  const visibleContentSources = useMemo(() => {
    if (isAllCategoryValue(contentCategoryFilter)) {
      return contentSources;
    }

    return contentSources.filter(
      (source) =>
        normalizeAdminCategoryValue(source.category) === contentCategoryFilter
    );
  }, [contentCategoryFilter, contentSources]);
  const visibleContentItems = contentItems;
  useEffect(() => {
    const normalizedContentCategory =
      normalizeAdminCategoryValue(contentCategoryFilter);

    if (contentCategoryFilter !== normalizedContentCategory) {
      setContentCategoryFilter(normalizedContentCategory);
      return;
    }

    if (!contentFilterCategories.includes(normalizedContentCategory)) {
      setContentCategoryFilter("All");
    }
  }, [contentCategoryFilter, contentFilterCategories]);
  useEffect(() => {
    if (!contentSourcesLoadedRef.current) {
      return;
    }
    if (
      contentSourceFilter !== "all" &&
      !visibleContentSources.some((source) => source.id === contentSourceFilter)
    ) {
      setContentSourceFilter("all");
    }
  }, [contentSourceFilter, visibleContentSources]);
  const adminCategoryOptions = useMemo(
    () =>
      sortCategoriesBySettings(
        [
          ...adminFilterCategories,
          form.category,
          initialForm.category
        ],
        adminCategorySettings.tools,
        t
      ),
    [adminCategorySettings.tools, adminFilterCategories, form.category, t]
  );

  async function refresh() {
    const generation = adminToolsRequestGenerationRef.current + 1;
    adminToolsRequestGenerationRef.current = generation;
    setIsLoadingTools(true);
    setToolsLoadError(null);

    try {
      const nextTools = await loadAdminTools(token);
      if (adminToolsRequestGenerationRef.current !== generation) return;
      setTools(nextTools);
      setToolsLoadError(null);
    } catch (error) {
      if (adminToolsRequestGenerationRef.current === generation) {
        const message = getLocalizedErrorMessage(error, t);
        setToolsLoadError(message);
        setStatus(message);
      }
    } finally {
      if (adminToolsRequestGenerationRef.current === generation) {
        setHasLoadedTools(true);
        setIsLoadingTools(false);
      }
    }
  }

  function getAdminArticleRequestParams(cursor?: string) {
    return {
      category: isAllCategoryValue(articleCategoryFilter)
        ? undefined
        : normalizeAdminCategoryValue(articleCategoryFilter),
      query: debouncedArticleSearch.trim() || undefined,
      sort: articleSortMode,
      limit: ADMIN_ARTICLE_PAGE_SIZE,
      cursor
    };
  }

  async function refreshArticles() {
    const generation = adminArticlesRequestGenerationRef.current + 1;
    adminArticlesRequestGenerationRef.current = generation;
    adminArticlesNextCursorRef.current = null;
    adminArticlesLoadingCursorRef.current = null;
    setIsLoadingArticles(true);
    setIsLoadingMoreArticles(false);
    setAdminArticlesHasMore(false);
    setArticlesLoadError(null);

    try {
      const nextPage = await loadAdminArticles(
        token,
        getAdminArticleRequestParams()
      );
      if (adminArticlesRequestGenerationRef.current !== generation) return;
      setAdminArticles(nextPage.articles);
      setAdminArticlesHasMore(nextPage.hasMore);
      setAdminArticlesTotal(nextPage.total);
      setAdminArticleCategoryCounts(nextPage.categoryCounts);
      adminArticlesNextCursorRef.current = nextPage.nextCursor;
      setArticlesLoadError(null);
    } catch (error) {
      if (adminArticlesRequestGenerationRef.current === generation) {
        const message = getLocalizedErrorMessage(error, t);
        setArticlesLoadError(message);
        setStatus(message);
      }
    } finally {
      if (adminArticlesRequestGenerationRef.current === generation) {
        setHasLoadedArticles(true);
        setIsLoadingArticles(false);
      }
    }
  }

  async function loadMoreAdminArticles() {
    const cursor = adminArticlesNextCursorRef.current;
    if (adminArticlesLoadingCursorRef.current || !adminArticlesHasMore || !cursor) {
      return;
    }

    const generation = adminArticlesRequestGenerationRef.current;
    adminArticlesLoadingCursorRef.current = cursor;
    setIsLoadingMoreArticles(true);

    try {
      const nextPage = await loadAdminArticles(
        token,
        getAdminArticleRequestParams(cursor)
      );
      if (
        adminArticlesRequestGenerationRef.current !== generation ||
        adminArticlesLoadingCursorRef.current !== cursor
      ) {
        return;
      }
      setAdminArticles((current) => {
        const articlesById = new Map(current.map((article) => [article.id, article]));
        nextPage.articles.forEach((article) => articlesById.set(article.id, article));
        return Array.from(articlesById.values());
      });
      setAdminArticlesHasMore(nextPage.hasMore);
      setAdminArticlesTotal(nextPage.total);
      setAdminArticleCategoryCounts(nextPage.categoryCounts);
      adminArticlesNextCursorRef.current = nextPage.nextCursor;
    } catch (error) {
      if (
        adminArticlesRequestGenerationRef.current === generation &&
        adminArticlesLoadingCursorRef.current === cursor
      ) {
        setStatus(getLocalizedErrorMessage(error, t));
      }
    } finally {
      if (
        adminArticlesRequestGenerationRef.current === generation &&
        adminArticlesLoadingCursorRef.current === cursor
      ) {
        adminArticlesLoadingCursorRef.current = null;
        setIsLoadingMoreArticles(false);
      }
    }
  }

  function getContentItemRequestParams(cursor?: string) {
    return {
      sourceId: contentSourceFilter === "all" ? undefined : contentSourceFilter,
      category: isAllCategoryValue(contentCategoryFilter)
        ? undefined
        : normalizeAdminCategoryValue(contentCategoryFilter),
      query: debouncedContentSearch.trim() || undefined,
      sort: contentSortMode,
      limit: CONTENT_ITEM_PAGE_SIZE,
      cursor
    };
  }

  async function refreshContent(options: { reloadSources?: boolean } = {}) {
    const generation = contentItemsRequestGenerationRef.current + 1;
    contentItemsRequestGenerationRef.current = generation;
    contentItemsNextCursorRef.current = null;
    contentItemsLoadingCursorRef.current = null;
    setIsLoadingContent(true);
    setIsLoadingMoreContent(false);
    setContentItemsHasMore(false);
    setContentLoadError(null);

    const shouldReloadSources =
      options.reloadSources !== false || !contentSourcesLoadedRef.current;
    const sourcesRequest = shouldReloadSources
      ? loadContentSources(token)
      : Promise.resolve(null);
    const itemsRequest = loadContentItems(token, getContentItemRequestParams());

    try {
      const [sourcesResult, itemsResult] = await Promise.allSettled([
        sourcesRequest,
        itemsRequest
      ]);

      if (contentItemsRequestGenerationRef.current !== generation) return;

      if (sourcesResult.status === "fulfilled" && sourcesResult.value) {
        setContentSources(sourcesResult.value);
        contentSourcesLoadedRef.current = true;
      } else if (sourcesResult.status === "rejected") {
        setStatus(getLocalizedErrorMessage(sourcesResult.reason, t));
      }

      if (itemsResult.status === "fulfilled") {
        const nextPage = itemsResult.value;
        setContentItems(nextPage.items);
        setContentItemsHasMore(nextPage.hasMore);
        contentItemsNextCursorRef.current = nextPage.nextCursor;
        setContentItemsTotal(nextPage.total);
        setContentSourceCounts(nextPage.sourceCounts);
        setContentCategoryCounts(nextPage.categoryCounts);
        setContentLoadError(null);
      } else {
        const message = getLocalizedErrorMessage(itemsResult.reason, t);
        setContentLoadError(message);
        setStatus(message);
      }
    } finally {
      if (contentItemsRequestGenerationRef.current === generation) {
        setHasLoadedContent(true);
        setIsLoadingContent(false);
      }
    }
  }

  async function loadMoreContentItems() {
    const cursor = contentItemsNextCursorRef.current;
    if (
      contentItemsLoadingCursorRef.current ||
      !contentItemsHasMore ||
      !cursor
    ) {
      return;
    }

    const generation = contentItemsRequestGenerationRef.current;
    contentItemsLoadingCursorRef.current = cursor;
    setIsLoadingMoreContent(true);

    try {
      const nextPage = await loadContentItems(
        token,
        getContentItemRequestParams(cursor)
      );

      if (
        contentItemsRequestGenerationRef.current !== generation ||
        contentItemsLoadingCursorRef.current !== cursor
      ) {
        return;
      }

      setContentItems((current) => {
        const itemsById = new Map(current.map((item) => [item.id, item]));
        nextPage.items.forEach((item) => itemsById.set(item.id, item));
        return Array.from(itemsById.values());
      });
      setContentItemsHasMore(nextPage.hasMore);
      contentItemsNextCursorRef.current = nextPage.nextCursor;
      setContentItemsTotal(nextPage.total);
      setContentSourceCounts(nextPage.sourceCounts);
      setContentCategoryCounts(nextPage.categoryCounts);
    } catch (error) {
      if (
        contentItemsRequestGenerationRef.current === generation &&
        contentItemsLoadingCursorRef.current === cursor
      ) {
        setStatus(getLocalizedErrorMessage(error, t));
      }
    } finally {
      if (
        contentItemsRequestGenerationRef.current === generation &&
        contentItemsLoadingCursorRef.current === cursor
      ) {
        contentItemsLoadingCursorRef.current = null;
        setIsLoadingMoreContent(false);
      }
    }
  }

  function getTelegramPushRequestParams(cursor?: string) {
    const sourceType: TelegramResourceType | undefined = telegramPushCategory === TELEGRAM_PUSH_TOOL_FILTER
      ? "tool"
      : telegramPushCategory === TELEGRAM_PUSH_ARTICLE_FILTER
        ? "article"
        : telegramPushCategory === TELEGRAM_PUSH_CONTENT_FILTER
          ? "content"
          : undefined;
    return {
      cursor,
      limit: TELEGRAM_PUSH_PAGE_SIZE,
      query: debouncedTelegramPushSearch.trim() || undefined,
      category: isAllCategoryValue(telegramPushCategory) || sourceType
        ? undefined
        : telegramPushCategory,
      resourceType: sourceType,
      sort: telegramPushSortMode
    };
  }

  async function refreshTelegramPushRecords() {
    const generation = telegramPushRequestGenerationRef.current + 1;
    telegramPushRequestGenerationRef.current = generation;
    telegramPushNextCursorRef.current = null;
    telegramPushLoadingCursorRef.current = null;
    setIsLoadingTelegramPushes(true);
    setIsLoadingMoreTelegramPushes(false);
    setTelegramPushHasMore(false);
    setTelegramPushLoadError(null);

    try {
      const page = await loadTelegramPushRecords(
        token,
        getTelegramPushRequestParams()
      );
      if (telegramPushRequestGenerationRef.current !== generation) return;
      setTelegramPushRecords(page.records);
      setTelegramPushCategoryOptions(page.categoryOptions);
      setTelegramPushHasMore(page.hasMore);
      telegramPushNextCursorRef.current = page.nextCursor;
    } catch (error) {
      if (telegramPushRequestGenerationRef.current === generation) {
        const message = getLocalizedErrorMessage(error, t);
        setTelegramPushLoadError(message);
        setStatus(message);
      }
    } finally {
      if (telegramPushRequestGenerationRef.current === generation) {
        setHasLoadedTelegramPushes(true);
        setIsLoadingTelegramPushes(false);
      }
    }
  }

  async function loadMoreTelegramPushRecords() {
    const cursor = telegramPushNextCursorRef.current;
    if (
      telegramPushLoadingCursorRef.current ||
      !telegramPushHasMore ||
      !cursor
    ) {
      return;
    }

    const generation = telegramPushRequestGenerationRef.current;
    telegramPushLoadingCursorRef.current = cursor;
    setIsLoadingMoreTelegramPushes(true);
    try {
      const page = await loadTelegramPushRecords(
        token,
        getTelegramPushRequestParams(cursor)
      );
      if (
        telegramPushRequestGenerationRef.current !== generation ||
        telegramPushLoadingCursorRef.current !== cursor
      ) {
        return;
      }
      setTelegramPushRecords((current) => {
        const recordsById = new Map(current.map((record) => [record.id, record]));
        page.records.forEach((record) => recordsById.set(record.id, record));
        return Array.from(recordsById.values());
      });
      setTelegramPushCategoryOptions(page.categoryOptions);
      setTelegramPushHasMore(page.hasMore);
      telegramPushNextCursorRef.current = page.nextCursor;
    } catch (error) {
      if (
        telegramPushRequestGenerationRef.current === generation &&
        telegramPushLoadingCursorRef.current === cursor
      ) {
        setStatus(getLocalizedErrorMessage(error, t));
      }
    } finally {
      if (
        telegramPushRequestGenerationRef.current === generation &&
        telegramPushLoadingCursorRef.current === cursor
      ) {
        telegramPushLoadingCursorRef.current = null;
        setIsLoadingMoreTelegramPushes(false);
      }
    }
  }

  async function refreshAfterMutation(refreshAction: () => Promise<void>) {
    const generation = mutationRefreshGenerationRef.current + 1;
    mutationRefreshGenerationRef.current = generation;
    const scrollContainer = adminContentScrollRef.current;
    const scrollTop = scrollContainer?.scrollTop ?? 0;

    try {
      await refreshAction();
    } catch (error) {
      if (mutationRefreshGenerationRef.current === generation) {
        setStatus(getLocalizedErrorMessage(error, t, t.errors.requestFailed));
      }
      return;
    }

    if (mutationRefreshGenerationRef.current !== generation) return;

    window.requestAnimationFrame(() => {
      if (mutationRefreshGenerationRef.current === generation) {
        scrollContainer?.scrollTo({ top: scrollTop, behavior: "auto" });
      }
    });
  }

  async function refreshTelegramSettings() {
    if (!token) return;

    const requestId = ++telegramSettingsLoadRequestRef.current;
    telegramSettingsLoadAbortRef.current?.abort();
    const controller = new AbortController();
    telegramSettingsLoadAbortRef.current = controller;
    setTelegramSettingsLoading(true);
    setTelegramSettingsLoadError(null);

    try {
      const settings = await loadTelegramSettings(token, {
        signal: controller.signal
      });
      if (telegramSettingsLoadRequestRef.current !== requestId) return;
      setTelegramSettings(settings);
    } catch (error) {
      if (
        telegramSettingsLoadRequestRef.current === requestId &&
        !controller.signal.aborted
      ) {
        setTelegramSettings({ available: false, enabled: false, target: "", footerMarkdown: "" });
        setTelegramSettingsLoadError(error);
      }
    } finally {
      if (telegramSettingsLoadRequestRef.current === requestId) {
        setTelegramSettingsLoading(false);
        if (telegramSettingsLoadAbortRef.current === controller) {
          telegramSettingsLoadAbortRef.current = null;
        }
      }
    }
  }

  function applyTelegramSettings(settings: TelegramSettings) {
    setTelegramSettings(settings);
    setTelegramSettingsLoadError(null);
    setTelegramSettingsLoading(false);
  }

  useEffect(() => {
    if (!token) {
      writeActionLocksRef.current.clear();
      adminCategoryLoadRequestRef.current += 1;
      mutationRefreshGenerationRef.current += 1;
      articleEditorLoadRequestRef.current += 1;
      toolGitHub.reset();
      invalidateContentPreview();
      adminCategorySavePendingRef.current.clear();
      adminCategoryRollbackRef.current = {};
      adminCategorySaveGenerationRef.current.tools += 1;
      adminCategorySaveGenerationRef.current.articles += 1;
      adminCategorySaveGenerationRef.current.push += 1;
      adminCategorySaveGenerationRef.current.content += 1;
      setWriteLockedEntityKeys(new Set());
      setTools([]);
      setToolsLoadError(null);
      adminToolsRequestGenerationRef.current += 1;
      setAdminArticles([]);
      setArticlesLoadError(null);
      setAdminArticlesHasMore(false);
      setAdminArticlesTotal(0);
      setAdminArticleCategoryCounts({});
      setIsLoadingMoreArticles(false);
      adminArticlesRequestGenerationRef.current += 1;
      adminArticlesNextCursorRef.current = null;
      adminArticlesLoadingCursorRef.current = null;
      setContentSources([]);
      setContentItems([]);
      setContentLoadError(null);
      setContentItemsHasMore(false);
      setContentItemsTotal(0);
      setContentSourceCounts({});
      setContentCategoryCounts({});
      setIsLoadingMoreContent(false);
      contentItemsRequestGenerationRef.current += 1;
      contentItemsNextCursorRef.current = null;
      contentItemsLoadingCursorRef.current = null;
      contentSourcesLoadedRef.current = false;
      commitAdminCategorySettings(initialAdminCategorySettings);
      setIsLoadingTools(false);
      setIsLoadingArticles(false);
      setIsLoadingContent(false);
      setHasLoadedTools(false);
      setHasLoadedArticles(false);
      setHasLoadedContent(false);
      setTelegramSettings({ available: false, enabled: false, target: "", footerMarkdown: "" });
      setTelegramSettingsLoading(false);
      setTelegramSettingsLoadError(null);
      telegramPushRequestGenerationRef.current += 1;
      telegramPushNextCursorRef.current = null;
      telegramPushLoadingCursorRef.current = null;
      setTelegramPushRecords([]);
      setTelegramPushCategoryOptions([]);
      setTelegramPushHasMore(false);
      setIsLoadingTelegramPushes(false);
      setIsLoadingMoreTelegramPushes(false);
      setHasLoadedTelegramPushes(false);
      setTelegramPushLoadError(null);
      setViewingTelegramPush(null);
      setPendingDeleteTelegramPush(null);
      setTelegramResource(null);
      setTelegramMessage(null);
      setIsCreatingTelegramPush(false);
      return;
    }

    setHasLoadedTools(false);
    setHasLoadedArticles(false);
    setHasLoadedContent(false);
    void refreshAdminCategories();
  }, [token]);

  useEffect(() => {
    if (!token) return;

    void refreshTelegramSettings();

    return () => {
      telegramSettingsLoadAbortRef.current?.abort();
      telegramSettingsLoadAbortRef.current = null;
      telegramSettingsLoadRequestRef.current += 1;
    };
  }, [token]);

  useEffect(() => {
    if (
      token &&
      (adminView === "tools" ||
        adminView === "import-export" ||
        adminView === "link-check") &&
      !hasLoadedTools
    ) {
      void refresh();
    }
  }, [adminView, hasLoadedTools, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedArticleSearch(articleSearch.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [articleSearch]);

  useEffect(() => {
    if (!token || adminView !== "articles") return;
    void refreshArticles();
  }, [
    token,
    adminView,
    articleCategoryFilter,
    debouncedArticleSearch,
    articleSortMode
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedContentSearch(contentSearch.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [contentSearch]);

  useEffect(() => {
    if (!token || adminView !== "content") {
      return;
    }

    void refreshContent({ reloadSources: !contentSourcesLoadedRef.current });
  }, [
    token,
    adminView,
    contentCategoryFilter,
    contentSourceFilter,
    debouncedContentSearch,
    contentSortMode
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedTelegramPushSearch(telegramPushSearch.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [telegramPushSearch]);

  useEffect(() => {
    if (!token || adminView !== "push") return;
    void refreshTelegramPushRecords();
  }, [
    token,
    adminView,
    telegramPushCategory,
    debouncedTelegramPushSearch,
    telegramPushSortMode
  ]);

  useLayoutEffect(() => {
    document.documentElement.classList.add("admin-route");

    return () => {
      document.documentElement.classList.remove("admin-route");
    };
  }, []);

  useEffect(() => {
    document.title = formatAdminDocumentTitle(
      activeDocumentTitle,
      siteName,
      t.nav.admin
    );
  }, [activeDocumentTitle, siteName, t.nav.admin]);

  useEffect(() => {
    const currentPathIsSettingsGroup =
      adminView === "system" &&
      Boolean(getAdminSystemSettingsGroupFromPath(window.location.pathname));
    const nextPath = currentPathIsSettingsGroup
      ? window.location.pathname
      : getAdminPath(adminView);
    const nextSearch = "";

    if (
      window.location.pathname !== nextPath ||
      window.location.search !== nextSearch
    ) {
      window.history.replaceState(
        null,
        "",
        `${nextPath}${nextSearch}${window.location.hash}`
      );
    }
  }, []);

  useEffect(() => {
    function handlePopState() {
      setAdminView(getInitialAdminView());
      closeMobileSidebar();
      window.requestAnimationFrame(() => {
        adminContentScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
      });
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (sidebarAnimationTimer.current) {
        window.clearTimeout(sidebarAnimationTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!mobileSidebarOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !openAdminMenu) {
        closeMobileSidebar();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileSidebarOpen, openAdminMenu]);

  useEffect(() => {
    if (!token || !status) {
      return;
    }

    if (adminStatusTimer.current) {
      window.clearTimeout(adminStatusTimer.current);
    }

    adminStatusTimer.current = window.setTimeout(() => {
      adminStatusCurrentRef.current = "";
      setStatusEvent(null);
      adminStatusTimer.current = null;
    }, 3200);

    return () => {
      if (adminStatusTimer.current) {
        window.clearTimeout(adminStatusTimer.current);
        adminStatusTimer.current = null;
      }
    };
  }, [status?.id, token]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoggingIn) return;

    const normalizedPassword = password.trim();
    if (!normalizedPassword) {
      setPassword("");
      setPasswordError(t.admin.passwordRequired);
      passwordInputRef.current?.focus();
      return;
    }
    if (!authConfig) return;
    if (authConfig.turnstileEnabled && !turnstileToken) {
      return;
    }

    setIsLoggingIn(true);
    setStatus("");

    try {
      const nextToken = await login(normalizedPassword, turnstileToken);
      localStorage.setItem("htools_token", nextToken);
      setToken(nextToken);
      setPassword("");
      setPasswordError("");
    } catch (error) {
      const errorCode =
        typeof error === "object" && error !== null && "code" in error
        && typeof error.code === "string"
          ? error.code
          : "";
      if ([
        "TURNSTILE_CONFIG_ERROR",
        "TURNSTILE_FAILED",
        "TURNSTILE_REQUIRED",
        "TURNSTILE_UNAVAILABLE"
      ].includes(errorCode)) {
        setStatus("");
      } else if (errorCode === "INVALID_PASSWORD") {
        setPassword("");
        setPasswordError(getLocalizedErrorMessage(error, t));
        setStatus("");
      } else {
        setStatus(getLocalizedErrorMessage(error, t));
      }
      if (authConfig.turnstileEnabled) {
        setTurnstileToken("");
        setTurnstileResetKey((value) => value + 1);
      }
      window.requestAnimationFrame(() => {
        passwordInputRef.current?.focus();
        passwordInputRef.current?.select();
      });
    } finally {
      setIsLoggingIn(false);
    }
  }

  function toggleSidebar() {
    if (window.matchMedia("(max-width: 920px)").matches) {
      if (mobileSidebarOpen) {
        closeMobileSidebar();
      } else {
        setMobileSidebarOpen(true);
      }
      return;
    }

    setSidebarCollapsed((collapsed) => !collapsed);
    setSidebarAnimating(true);

    if (sidebarAnimationTimer.current) {
      window.clearTimeout(sidebarAnimationTimer.current);
    }

    sidebarAnimationTimer.current = window.setTimeout(() => {
      setSidebarAnimating(false);
      sidebarAnimationTimer.current = null;
    }, 320);
  }

  function selectAdminView(nextView: AdminView) {
    const nextPath = getAdminPath(nextView);

    if (window.location.pathname !== nextPath || window.location.search) {
      window.history.pushState(null, "", nextPath);
    }

    setAdminView(nextView);
    closeMobileSidebar();
    adminContentScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }

  function openServiceSettings() {
    const nextPath = ADMIN_SYSTEM_SETTINGS_GROUP_PATHS.services;

    if (window.location.pathname !== nextPath || window.location.search) {
      window.history.pushState(null, "", nextPath);
    }

    setAdminView("system");
    closeMobileSidebar();
    adminContentScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }

  function openCreate() {
    const category =
      isAllCategoryValue(adminCategory) || isFeaturedCategoryValue(adminCategory)
        ? initialForm.category
        : adminCategory;

    setEditingTool(null);
    setForm({ ...initialForm, category });
    setToolTagText(formatTagInputText(initialForm.tags));
    toolGitHub.reset();
    setFormOpen(true);
  }

  function openEdit(tool: Tool) {
    if (isWriteEntityLocked("tool", tool.id)) return;
    const nextForm = normalizeForm(tool);

    setEditingTool(tool);
    setForm(nextForm);
    setToolTagText(formatTagInputText(nextForm.tags));
    toolGitHub.reset(tool.url);
    setFormOpen(true);
  }

  function closeToolEditor() {
    toolGitHub.reset();
    setFormOpen(false);
  }

  function requestToolEditorClose() {
    toolEditorCloseRequestRef.current?.() ?? closeToolEditor();
  }

  function closeTelegramMessageDialog() {
    if (telegramMessageSaving) return;
    telegramGitHub.reset();
    setTelegramResource(null);
    setTelegramMessage(null);
    setIsCreatingTelegramPush(false);
    setTelegramBodyMarkdown("");
    setTelegramDescription("");
    setTelegramUrl("");
    setTelegramDemoUrl("");
    setTelegramImage("");
    setTelegramCategory("");
    setTelegramTagText("");
    setTelegramSourceLoading(false);
    setTelegramMediaEnabled(false);
    setTelegramMediaUrl("");
    setTelegramMarkdownEditorMode(undefined);
    setTelegramMessageLoading(false);
    setTelegramMessageErrorCode("");
  }

  async function confirmPushTelegramRecord() {
    const record = pendingPushTelegramRecord;
    if (!record || isPushingTelegramRecord) return;

    const actionKey = getAdminWriteEntityKey(
      getTelegramWriteEntityScope(record.resourceType),
      record.resourceId
    );
    if (!acquireWriteAction(actionKey)) return;
    setIsPushingTelegramRecord(true);
    setStatus("");

    try {
      await sendTelegramMessage(
        record.resourceType,
        record.resourceId,
        record.messageMarkdown,
        record.mediaEnabled,
        record.mediaUrl,
        locale,
        token,
        {
          category: record.resource?.category ?? "",
          title: record.title,
          resource: record.resource ?? undefined
        }
      );
      setStatus(telegramText.sent);
      setPendingPushTelegramRecord(null);
      void refreshTelegramPushRecords();
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      releaseWriteAction(actionKey);
      setIsPushingTelegramRecord(false);
    }
  }

  function openCreateTelegramPush() {
    const resource: TelegramPushResource = {
      type: "custom",
      id: crypto.randomUUID(),
      title: "",
      description: "",
      url: "",
      demoUrl: "",
      image: "",
      category: "",
      tags: []
    };
    const defaultBody = buildTelegramPreviewMarkdown(
      resource,
      createTelegramCustomBodyExample(locale),
      telegramSettings.footerMarkdown,
      locale
    );
    setTelegramResource(resource);
    telegramGitHub.reset();
    setIsCreatingTelegramPush(true);
    setTelegramCustomTitle("");
    setTelegramMessage({
      exists: false,
      targetChanged: false,
      syncStatus: "not_pushed",
      bodyMarkdown: defaultBody,
      mediaEnabled: false,
      mediaUrl: "",
      defaultBodyMarkdown: defaultBody,
      defaultMediaUrl: "",
      resource,
      resourceExists: true
    });
    setTelegramBodyMarkdown(defaultBody);
    setTelegramMediaEnabled(false);
    setTelegramMediaUrl("");
    setTelegramMarkdownEditorMode(undefined);
    setTelegramMessageLoading(false);
    setTelegramMessageErrorCode("");
    setStatus("");
  }

  async function openTelegramQuickPush(resource: TelegramPushResource) {
    if (isWriteEntityLocked(getTelegramWriteEntityScope(resource.type), resource.id)) return;
    const defaultCategory = getTelegramPushDefaultFilter(resource.type);
    setTelegramQuickResource({ ...resource, category: defaultCategory });
    setTelegramQuickCategory(defaultCategory);
    setTelegramQuickMessage(null);
    setTelegramQuickMode("published");
    setTelegramQuickLoading(true);
    setStatus("");

    try {
      const message = await loadTelegramMessage(
        resource.type,
        resource.id,
        token,
        locale
      );
      setTelegramQuickMessage(message);
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
      setTelegramQuickResource(null);
    } finally {
      setTelegramQuickLoading(false);
    }
  }

  function closeTelegramQuickPush() {
    if (telegramQuickSaving) return;
    setTelegramQuickResource(null);
    setTelegramQuickMessage(null);
    setTelegramQuickCategory("");
  }

  async function confirmTelegramQuickPush() {
    const resource = telegramQuickResource;
    const message = telegramQuickMessage;
    if (!resource || !message || telegramQuickLoading || telegramQuickSaving) return;

    const actionKey = getAdminWriteEntityKey(
      getTelegramWriteEntityScope(resource.type),
      resource.id
    );
    if (!acquireWriteAction(actionKey)) return;
    setTelegramQuickSaving(true);
    setStatus("");
    const storedCategory = getTelegramStoredCategory(telegramQuickCategory);
    const pushResource = { ...resource, category: storedCategory };

    try {
      if (telegramQuickMode === "published") {
        await sendTelegramMessage(
          resource.type,
          resource.id,
          message.bodyMarkdown,
          message.mediaEnabled,
          message.mediaUrl,
          locale,
          token,
          { resource: pushResource, category: storedCategory }
        );
        setStatus(telegramText.sent);
      } else {
        await saveTelegramMessage(
          resource.type,
          resource.id,
          message.bodyMarkdown,
          message.mediaEnabled,
          message.mediaUrl,
          locale,
          token,
          { resource: pushResource, category: storedCategory }
        );
        setStatus(telegramText.saved);
      }
      setTelegramQuickResource(null);
      setTelegramQuickMessage(null);
      setTelegramQuickCategory("");
      if (adminView === "push") void refreshTelegramPushRecords();
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      releaseWriteAction(actionKey);
      setTelegramQuickSaving(false);
    }
  }

  async function openTelegramMessageDialog(resource: TelegramPushResource) {
    if (isWriteEntityLocked(getTelegramWriteEntityScope(resource.type), resource.id)) return;
    setTelegramCustomTitle(resource.title);
    setTelegramDescription(resource.description);
    setTelegramUrl(resource.url);
    setTelegramDemoUrl(resource.demoUrl);
    setTelegramImage(resource.image);
    setTelegramCategory(getTelegramDisplayCategory(resource.type, resource.category));
    setTelegramTagText(formatTagInputText(resource.tags));
    const defaultBody = buildTelegramPreviewMarkdown(
      resource,
      createDefaultTelegramBody(resource),
      telegramSettings.footerMarkdown,
      locale
    );
    const defaultMediaUrl = createTelegramResourceMediaUrl(resource);
    setTelegramResource(resource);
    setIsCreatingTelegramPush(false);
    setTelegramMessage({
      exists: false,
      targetChanged: false,
      syncStatus: "not_pushed",
      bodyMarkdown: defaultBody,
      mediaEnabled: false,
      mediaUrl: defaultMediaUrl,
      defaultBodyMarkdown: defaultBody,
      defaultMediaUrl,
      resource,
      resourceExists: true
    });
    setTelegramBodyMarkdown(defaultBody);
    setTelegramMediaEnabled(false);
    setTelegramMediaUrl(defaultMediaUrl);
    setTelegramMarkdownEditorMode(undefined);
    setTelegramMessageLoading(true);
    setTelegramMessageErrorCode("");
    setStatus("");

    try {
      const message = await loadTelegramMessage(
        resource.type,
        resource.id,
        token,
        locale
      );
      setTelegramMessage(message);
      setTelegramResource(message.resource);
      setTelegramBodyMarkdown(message.bodyMarkdown);
      setTelegramCustomTitle(message.resource.title);
      setTelegramDescription(message.resource.description);
      setTelegramUrl(message.resource.url);
      setTelegramDemoUrl(message.resource.demoUrl);
      setTelegramImage(message.resource.image);
      setTelegramCategory(getTelegramDisplayCategory(message.resource.type, message.resource.category));
      setTelegramTagText(formatTagInputText(message.resource.tags));
      setTelegramMediaEnabled(message.mediaEnabled);
      setTelegramMediaUrl(message.mediaUrl);
      setTelegramMessageErrorCode(
        message.targetChanged ? "TELEGRAM_TARGET_CHANGED" : ""
      );
    } catch (error) {
      setTelegramMessageErrorCode(getTelegramMessageErrorCode(error));
      setStatus(getLocalizedErrorMessage(error, t));
      setTelegramResource(null);
    } finally {
      setTelegramMessageLoading(false);
    }
  }

  async function refreshTelegramSource() {
    if (!telegramResource || telegramResource.type === "custom" || telegramSourceLoading) return;
    setTelegramSourceLoading(true);
    try {
      const source = await loadTelegramSource(telegramResource.type, telegramResource.id, token, locale);
      const refreshedResource = {
        ...source.resource,
        category: getTelegramStoredCategory(telegramCategory)
      };
      setTelegramResource(refreshedResource);
      setTelegramMessage((current) => current ? {
        ...current,
        resource: refreshedResource,
        defaultBodyMarkdown: source.bodyMarkdown,
        defaultMediaUrl: source.mediaUrl
      } : current);
      setTelegramCustomTitle(source.resource.title);
      setTelegramDescription(source.resource.description);
      setTelegramUrl(source.resource.url);
      setTelegramDemoUrl(source.resource.demoUrl);
      setTelegramImage(source.resource.image);
      setTelegramTagText(formatTagInputText(source.resource.tags));
      setTelegramBodyMarkdown(source.bodyMarkdown);
      setTelegramMediaUrl(source.mediaUrl);
      setTelegramMediaEnabled(false);
      setStatus(locale === "zh" ? "已读取最新信息。" : "Latest information loaded.");
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      setTelegramSourceLoading(false);
    }
  }

  function handleTelegramMediaEnabledChange(enabled: boolean) {
    setTelegramMediaEnabled(enabled);
    if (enabled) setTelegramMarkdownEditorMode("preview");
  }

  async function saveTelegramMessageChanges() {
    if (
      !telegramResource ||
      !telegramMessage ||
      telegramMessageSaving ||
      !telegramEditorDirty ||
      !telegramBodyMarkdown.trim() ||
      telegramCustomTitleMissing ||
      !telegramMediaValid ||
      telegramPreviewLength > TELEGRAM_MESSAGE_LIMIT
    ) {
      return;
    }
    const actionKey = getAdminWriteEntityKey(
      getTelegramWriteEntityScope(telegramResource.type),
      telegramResource.id
    );
    if (!acquireWriteAction(actionKey)) return;
    setTelegramMessageSaving(true);
    setTelegramMessageErrorCode("");
    setStatus("");

    try {
      const message = await saveTelegramMessage(
        telegramResource.type,
        telegramResource.id,
        telegramBodyMarkdown,
        telegramMediaEnabled,
        normalizedTelegramMediaUrl,
        locale,
        token,
        {
          category: getTelegramStoredCategory(telegramCategory),
          title: telegramCustomTitle,
          resource: telegramEditedResource ?? undefined
        }
      );
      setTelegramMessage(message);
      setTelegramResource(message.resource);
      setTelegramDescription(message.resource.description);
      setTelegramUrl(message.resource.url);
      setTelegramDemoUrl(message.resource.demoUrl);
      setTelegramImage(message.resource.image);
      setTelegramCategory(getTelegramDisplayCategory(message.resource.type, message.resource.category));
      setTelegramTagText(formatTagInputText(message.resource.tags));
      setTelegramBodyMarkdown(message.bodyMarkdown);
      setTelegramMediaEnabled(message.mediaEnabled);
      setTelegramMediaUrl(message.mediaUrl);
      setTelegramMessageErrorCode(
        message.targetChanged ? "TELEGRAM_TARGET_CHANGED" : ""
      );
      setStatus(telegramText.saved);
      if (adminView === "push") void refreshTelegramPushRecords();
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      releaseWriteAction(actionKey);
      setTelegramMessageSaving(false);
    }
  }

  async function submitTelegramMessage() {
    if (
      !telegramResource ||
      !telegramMessage ||
      telegramMessage.targetChanged ||
      telegramMessageSaving ||
      telegramCustomTitleMissing ||
      !telegramMediaValid ||
      telegramPreviewLength > TELEGRAM_MESSAGE_LIMIT
    ) {
      return;
    }
    const actionKey = getAdminWriteEntityKey(
      getTelegramWriteEntityScope(telegramResource.type),
      telegramResource.id
    );
    if (!acquireWriteAction(actionKey)) return;
    setTelegramMessageSaving(true);
    setTelegramMessageErrorCode("");
    setStatus("");

    try {
      const message = telegramMessage.exists
        ? await updateTelegramMessage(
            telegramResource.type,
            telegramResource.id,
            telegramBodyMarkdown,
            telegramMediaEnabled,
            normalizedTelegramMediaUrl,
            locale,
            token,
            {
              category: getTelegramStoredCategory(telegramCategory),
              title: telegramCustomTitle,
              resource: telegramEditedResource ?? undefined
            }
          )
        : await sendTelegramMessage(
            telegramResource.type,
            telegramResource.id,
            telegramBodyMarkdown,
            telegramMediaEnabled,
            normalizedTelegramMediaUrl,
            locale,
            token,
            {
              category: getTelegramStoredCategory(telegramCategory),
              title: telegramCustomTitle,
              resource: telegramEditedResource ?? undefined
            }
          );
      setTelegramMessage(message);
      setTelegramResource(message.resource);
      setTelegramDescription(message.resource.description);
      setTelegramUrl(message.resource.url);
      setTelegramDemoUrl(message.resource.demoUrl);
      setTelegramImage(message.resource.image);
      setTelegramCategory(getTelegramDisplayCategory(message.resource.type, message.resource.category));
      setTelegramTagText(formatTagInputText(message.resource.tags));
      setStatus(
        telegramMessage.exists ? telegramText.updated : telegramText.sent
      );
      if (adminView === "push") void refreshTelegramPushRecords();
      setTelegramResource(null);
      setTelegramMessage(null);
      setIsCreatingTelegramPush(false);
      setTelegramBodyMarkdown("");
      setTelegramMediaEnabled(false);
      setTelegramMediaUrl("");
    } catch (error) {
      const errorCode = getTelegramMessageErrorCode(error);
      setTelegramMessageErrorCode(errorCode);
      setStatus(errorCode ? "" : getLocalizedErrorMessage(error, t));
    } finally {
      releaseWriteAction(actionKey);
      setTelegramMessageSaving(false);
    }
  }

  async function recoverTelegramPush() {
    if (
      !telegramResource ||
      !telegramMessage?.exists ||
      telegramMessageSaving ||
      ![
        "TELEGRAM_MESSAGE_NOT_FOUND",
        "TELEGRAM_TARGET_CHANGED"
      ].includes(telegramMessageErrorCode) ||
      !telegramBodyMarkdown.trim() ||
      telegramCustomTitleMissing ||
      !telegramMediaValid ||
      telegramPreviewLength > TELEGRAM_MESSAGE_LIMIT
    ) {
      return;
    }
    const actionKey = getAdminWriteEntityKey(
      getTelegramWriteEntityScope(telegramResource.type),
      telegramResource.id
    );
    if (!acquireWriteAction(actionKey)) return;
    setTelegramMessageSaving(true);
    setStatus("");

    try {
      const message = await recoverTelegramMessage(
        telegramResource.type,
        telegramResource.id,
        telegramBodyMarkdown,
        telegramMediaEnabled,
        normalizedTelegramMediaUrl,
        locale,
        token
      );
      setTelegramMessage(message);
      setTelegramBodyMarkdown(message.bodyMarkdown);
      setTelegramMediaEnabled(message.mediaEnabled);
      setTelegramMediaUrl(message.mediaUrl);
      setTelegramMessageErrorCode("");
      setStatus(telegramText.recovered);
      if (adminView === "push") void refreshTelegramPushRecords();
    } catch (error) {
      const errorCode = getTelegramMessageErrorCode(error);
      setTelegramMessageErrorCode(errorCode);
      setStatus(errorCode ? "" : getLocalizedErrorMessage(error, t));
    } finally {
      releaseWriteAction(actionKey);
      setTelegramMessageSaving(false);
    }
  }

  function closeArticleEditor() {
    articleEditorLoadRequestRef.current += 1;
    setArticleFormOpen(false);
  }

  function requestArticleEditorClose() {
    articleEditorCloseRequestRef.current?.() ?? closeArticleEditor();
  }

  function closeContentSourceEditor() {
    invalidateContentPreview();
    setContentSourceFormOpen(false);
  }

  function requestContentSourceEditorClose() {
    contentSourceEditorCloseRequestRef.current?.() ?? closeContentSourceEditor();
  }

  function closeContentConvertDialog() {
    setPendingConvertItem(null);
    setConvertArticleCategory("");
    setConvertPublishMode("published");
  }

  function requestContentConvertClose() {
    contentConvertCloseRequestRef.current?.() ?? closeContentConvertDialog();
  }

  function openCreateArticle() {
    articleEditorLoadRequestRef.current += 1;
    const category = isAllCategoryValue(articleCategoryFilter)
      ? ""
      : articleCategoryFilter;

    setEditingArticle(null);
    setArticleForm({ ...initialArticleForm, category });
    setArticleTagText(formatTagInputText(initialArticleForm.tags));
    setArticleFormOpen(true);
  }

  async function openEditArticle(article: ArticleSummary) {
    const actionKey = getAdminWriteEntityKey("article", article.id);
    if (!acquireWriteAction(actionKey)) return;
    const requestId = articleEditorLoadRequestRef.current + 1;
    articleEditorLoadRequestRef.current = requestId;
    const returnFocusTarget = getDialogReturnFocusTarget(document.activeElement);
    setStatus("");

    try {
      const fullArticle = await loadAdminArticle(article.id, token);
      if (articleEditorLoadRequestRef.current !== requestId) return;
      const nextForm = normalizeArticleForm(fullArticle);
      setEditingArticle(fullArticle);
      setArticleForm(nextForm);
      setArticleTagText(formatTagInputText(nextForm.tags));
      rememberNextDialogReturnFocus(returnFocusTarget);
      setArticleFormOpen(true);
    } catch (error) {
      if (articleEditorLoadRequestRef.current === requestId) {
        setStatus(workspaceText.articleLoadFailed);
      }
    } finally {
      releaseWriteAction(actionKey);
    }
  }

  function openCreateContentSource() {
    invalidateContentPreview();
    const category = isAllCategoryValue(contentCategoryFilter)
      ? ""
      : contentCategoryFilter;

    setEditingContentSource(null);
    setContentSourceForm({ ...initialContentSourceForm, category });
    setContentSourceTagText(formatTagInputText(initialContentSourceForm.tags));
    setContentPreview(null);
    setContentSourceFormOpen(true);
  }

  function openEditContentSource(source: ContentSource) {
    if (isWriteEntityLocked("content-source", source.id)) return;
    invalidateContentPreview();
    const nextForm = normalizeContentSourceForm(source);

    setEditingContentSource(source);
    setContentSourceForm(nextForm);
    setContentSourceTagText(formatTagInputText(nextForm.tags));
    setContentPreview(null);
    setContentSourceFormOpen(true);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const actionKey = getAdminWriteEntityKey("tool", editingTool?.id);
    if (!acquireWriteAction(actionKey)) return;
    toolGitHub.reset();
    setIsSaving(true);
    setStatus("");

    try {
      const normalizedUrl = normalizeHttpUrlInput(form.url);
      const normalizedDemoUrl = normalizeHttpUrlInput(form.demoUrl);
      const normalizedImage = normalizeHttpUrlInput(form.image);
      const tags = parseArticleTagsInput(toolTagText);
      const payload = {
        ...form,
        url: normalizedUrl,
        demoUrl: normalizedDemoUrl,
        image: normalizedImage || createImageFromUrl(normalizedUrl),
        tags
      };

      if (editingTool) {
        await updateTool(editingTool.id, payload, token);
        setStatus(t.status.toolUpdated);
      } else {
        await createTool(payload, token);
        setStatus(t.status.toolCreated);
      }

      requestToolEditorClose();
      await refreshAfterMutation(refresh);
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t, t.status.saveFailed));
    } finally {
      releaseWriteAction(actionKey);
      setIsSaving(false);
    }
  }

  async function handleSaveArticle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const actionKey = getAdminWriteEntityKey("article", editingArticle?.id);
    if (!acquireWriteAction(actionKey)) return;
    setStatus("");

    const category = normalizeAdminCategoryValue(articleForm.category);

    if (!category || isAllCategoryValue(category) || isFeaturedCategoryValue(category)) {
      setStatus(articleText.categoryRequired);
      releaseWriteAction(actionKey);
      return;
    }

    setIsArticleSaving(true);

    try {
      const normalizedCoverImage = normalizeHttpUrlInput(articleForm.coverImage);
      const tags = parseArticleTagsInput(articleTagText);
      const payload = {
        ...articleForm,
        category,
        coverImage: normalizedCoverImage,
        publishedAt: datetimeLocalToIso(articleForm.publishedAt),
        slug: normalizeSlugInput(articleForm.slug),
        tags
      };

      if (editingArticle) {
        await updateArticle(editingArticle.id, payload, token);
        setStatus(articleText.updated);
      } else {
        await createArticle(payload, token);
        setStatus(articleText.created);
      }

      requestArticleEditorClose();
      await refreshAfterMutation(refreshArticles);
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t, t.status.saveFailed));
    } finally {
      releaseWriteAction(actionKey);
      setIsArticleSaving(false);
    }
  }

  function invalidateContentPreview() {
    contentPreviewRequestRef.current += 1;
    contentPreviewAbortRef.current?.abort();
    contentPreviewAbortRef.current = null;
    setIsContentPreviewing(false);
    setContentPreview(null);
  }

  async function handlePreviewContentSource() {
    const requestId = contentPreviewRequestRef.current + 1;
    contentPreviewRequestRef.current = requestId;
    contentPreviewAbortRef.current?.abort();
    const controller = new AbortController();
    contentPreviewAbortRef.current = controller;
    setIsContentPreviewing(true);
    setContentPreview(null);
    setStatus("");

    try {
      const tags = parseArticleTagsInput(contentSourceTagText);
      const payload = {
        ...contentSourceForm,
        url: normalizeHttpUrlInput(contentSourceForm.url),
        tags
      };
      const preview = await previewContentSource(payload, token, {
        signal: controller.signal
      });
      if (
        controller.signal.aborted ||
        contentPreviewRequestRef.current !== requestId
      ) {
        return;
      }
      setContentPreview(preview);
      setStatus(contentText.previewLoaded(preview.items.length));

      setContentSourceForm((current) =>
        current.title.trim()
          ? current
          : {
              ...current,
              title: preview.title
            }
      );

      window.requestAnimationFrame(() => {
        if (contentPreviewRequestRef.current === requestId) {
          contentPreviewRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      });
    } catch (error) {
      if (
        !controller.signal.aborted &&
        contentPreviewRequestRef.current === requestId
      ) {
        setStatus(getContentFeedErrorMessage(error, contentText, t.status.saveFailed));
      }
    } finally {
      if (contentPreviewRequestRef.current === requestId) {
        setIsContentPreviewing(false);
        if (contentPreviewAbortRef.current === controller) {
          contentPreviewAbortRef.current = null;
        }
      }
    }
  }

  async function handleSaveContentSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const actionKey = getAdminWriteEntityKey("content-source", editingContentSource?.id);
    if (!acquireWriteAction(actionKey)) return;
    setStatus("");

    const category = normalizeAdminCategoryValue(contentSourceForm.category);

    if (!category || isAllCategoryValue(category) || isFeaturedCategoryValue(category)) {
      setStatus(contentText.categoryRequired);
      releaseWriteAction(actionKey);
      return;
    }

    setIsContentSourceSaving(true);

    try {
      const tags = parseArticleTagsInput(contentSourceTagText);
      const payload = {
        ...contentSourceForm,
        category,
        url: normalizeHttpUrlInput(contentSourceForm.url),
        tags
      };
      const savedSource = editingContentSource
        ? await updateContentSource(editingContentSource.id, payload, token)
        : await createContentSource(payload, token);

      requestContentSourceEditorClose();

      if (!editingContentSource) {
        try {
          const result = await syncContentSource(savedSource.id, token);
          setStatus(contentText.synced(result.imported, result.updated));
        } catch (error) {
          const syncError = getContentFeedErrorMessage(
            error,
            contentText,
            t.errors.requestFailed
          );
          setStatus(contentText.savedSyncFailed(syncError));
        }
      } else {
        setStatus(contentText.saved);
      }

      await refreshAfterMutation(() => refreshContent());
    } catch (error) {
      setStatus(getContentFeedErrorMessage(error, contentText, t.status.saveFailed));
    } finally {
      releaseWriteAction(actionKey);
      setIsContentSourceSaving(false);
    }
  }

  async function handleSyncContentSource(source: ContentSource) {
    const actionKey = getAdminWriteEntityKey("content-source", source.id);
    if (!acquireWriteAction(actionKey)) return;
    if (!source.category.trim()) {
      setStatus(contentText.categoryRequired);
      releaseWriteAction(actionKey);
      return;
    }

    setStatus("");

    try {
      const result = await syncContentSource(source.id, token);
      setStatus(contentText.synced(result.imported, result.updated));
      await refreshAfterMutation(() => refreshContent());
    } catch (error) {
      setStatus(getContentFeedErrorMessage(error, contentText, t.status.saveFailed));
    } finally {
      releaseWriteAction(actionKey);
    }
  }

  async function handleDelete(tool: Tool) {
    const actionKey = getAdminWriteEntityKey("tool", tool.id);
    if (!acquireWriteAction(actionKey)) {
      setPendingDeleteTool(null);
      return false;
    }
    setIsDeletingTool(true);
    try {
      await deleteTool(tool.id, token);
      setStatus(t.status.toolDeleted);
      setPendingDeleteTool(null);
      await refreshAfterMutation(refresh);
      return true;
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t, t.status.deleteFailed));
      return false;
    } finally {
      releaseWriteAction(actionKey);
      setIsDeletingTool(false);
    }
  }

  async function handleDeleteArticle(article: ArticleSummary) {
    const actionKey = getAdminWriteEntityKey("article", article.id);
    if (!acquireWriteAction(actionKey)) {
      setPendingDeleteArticle(null);
      return false;
    }
    setIsDeletingArticle(true);

    try {
      await deleteArticle(article.id, token);
      setStatus(articleText.deleted);
      setPendingDeleteArticle(null);
      await refreshAfterMutation(async () => {
        await refreshArticles();
        await refreshContent();
      });
      return true;
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t, t.status.deleteFailed));
      return false;
    } finally {
      releaseWriteAction(actionKey);
      setIsDeletingArticle(false);
    }
  }

  async function handleDeleteContentSource(source: ContentSource) {
    const actionKey = getAdminWriteEntityKey("content-source", source.id);
    if (!acquireWriteAction(actionKey)) {
      setPendingDeleteContentSource(null);
      return false;
    }
    setIsDeletingContentSource(true);

    try {
      await deleteContentSource(source.id, token);
      setStatus(contentText.deleted);
      setPendingDeleteContentSource(null);
      setContentSourceFilter((current) => (current === source.id ? "all" : current));
      await refreshAfterMutation(() => refreshContent());
      return true;
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t, t.status.deleteFailed));
      return false;
    } finally {
      releaseWriteAction(actionKey);
      setIsDeletingContentSource(false);
    }
  }

  async function handleDeleteTelegramPush(record: TelegramPushRecord) {
    if (isDeletingTelegramPush) return false;
    setIsDeletingTelegramPush(true);
    setStatus("");

    try {
      await deleteTelegramPush(record.resourceType, record.resourceId, record.id, token);
      setPendingDeleteTelegramPush(null);
      setViewingTelegramPush((current) => current?.id === record.id ? null : current);
      setStatus(telegramText.management.deleted);
      await refreshAfterMutation(refreshTelegramPushRecords);
      return true;
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t, t.status.deleteFailed));
      return false;
    } finally {
      setIsDeletingTelegramPush(false);
    }
  }

  function openConvertContentItem(item: ContentItemSummary) {
    if (isWriteEntityLocked("content-item", item.id)) {
      return;
    }

    const itemCategory = normalizeAdminCategoryValue(item.category);
    const linkedArticleCategory = normalizeAdminCategoryValue(
      item.articleCategory ?? ""
    );
    const initialCategory = linkedArticleCategory
      ? linkedArticleCategory
      : !isAllCategoryValue(articleCategoryFilter)
        ? articleCategoryFilter
        : articleExistingCategories.includes(itemCategory)
          ? itemCategory
          : "";

    setPendingConvertItem(item);
    setConvertArticleCategory(initialCategory);
    setConvertPublishMode(
      item.articleId && item.articlePublished === false ? "draft" : "published"
    );
  }

  async function handleConvertContentItem(
    item: ContentItemSummary,
    categoryValue: string,
    publishMode: ConvertPublishMode
  ) {
    const actionKey = getAdminWriteEntityKey("content-item", item.id);
    if (!acquireWriteAction(actionKey)) return;

    const category = normalizeAdminCategoryValue(categoryValue);

    if (!category || isAllCategoryValue(category) || isFeaturedCategoryValue(category)) {
      setStatus(contentText.convertCategoryRequired);
      releaseWriteAction(actionKey);
      return;
    }

    setStatus("");

    try {
      const shouldPublish = publishMode === "published";
      const article = await convertContentItemToArticle(
        item.id,
        category,
        shouldPublish,
        token
      );
      setContentItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                articleId: article.id,
                articleSlug: article.slug,
                articleCategory: article.category,
                articlePublished: article.published
              }
            : entry
        )
      );
      requestContentConvertClose();
      setStatus(
        item.articleId
          ? shouldPublish
            ? contentText.updatedPublishedDone
            : contentText.updatedDraftDone
          : shouldPublish
            ? contentText.convertedPublishedDone
            : contentText.convertedDraftDone
      );
      await refreshAfterMutation(refreshArticles);
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t, t.status.saveFailed));
    } finally {
      releaseWriteAction(actionKey);
    }
  }

  async function handleToggleFeatured(tool: Tool) {
    const actionKey = getAdminWriteEntityKey("tool", tool.id);
    if (!acquireWriteAction(actionKey)) return;
    const nextFeatured = !tool.featured;
    setStatus("");

    try {
      const updatedTool = await updateTool(
        tool.id,
        {
          ...normalizeForm(tool),
          featured: nextFeatured
        },
        token
      );
      setTools((current) =>
        current.map((item) => (item.id === updatedTool.id ? updatedTool : item))
      );
      setStatus(
        nextFeatured ? t.status.featuredEnabled : t.status.featuredDisabled
      );
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t, t.status.saveFailed));
    } finally {
      releaseWriteAction(actionKey);
    }
  }

  function requestToggleFeatured(tool: Tool) {
    if (isWriteEntityLocked("tool", tool.id)) return;
    setPendingFeaturedTool(tool);
  }

  async function handleToggleArticlePublished(article: ArticleSummary) {
    const actionKey = getAdminWriteEntityKey("article", article.id);
    if (!acquireWriteAction(actionKey)) return;
    const nextPublished = !article.published;
    setStatus("");

    try {
      await updateArticlePublished(article.id, nextPublished, token);
      await refreshAfterMutation(refreshArticles);
      setStatus(
        nextPublished ? articleText.publishedDone : articleText.draftedDone
      );
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t, t.status.saveFailed));
    } finally {
      releaseWriteAction(actionKey);
    }
  }

  function requestToggleArticlePublished(article: ArticleSummary) {
    if (isWriteEntityLocked("article", article.id)) return;
    setPendingPublishedArticle(article);
  }

  function handleLogout() {
    localStorage.removeItem("htools_token");
    closeMobileSidebar();
    setToken("");
  }

  if (!token) {
    return (
      <div className="admin-shell auth-shell">
        <section className="auth-card">
          <div className="auth-card-actions">
            <button
              className="auth-home-brand"
              type="button"
              onClick={onBackHome}
              aria-label={`${t.actions.backHome}: ${siteName}`}
            >
              <SiteBrandIdentity showSubtitle />
            </button>
            <UtilityMenuControls
              className="auth-menu-actions"
              controller={adminUtilityMenuController}
              locale={locale}
              onLocaleChange={onLocaleChange}
              onThemeChange={onThemeChange}
              t={t}
              themeMode={themeMode}
            />
          </div>
          <form className="auth-form" onSubmit={handleLogin}>
            <label>
              <span className="auth-password-label">
                <span>{t.admin.password}</span>
                {status ? <span className="auth-inline-status" role="alert">{status.message}</span> : null}
              </span>
              <input
                ref={passwordInputRef}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (passwordError) setPasswordError("");
                }}
                disabled={isLoggingIn}
                className={passwordError ? "is-invalid" : ""}
                placeholder={passwordError || "ADMIN_PASSWORD"}
                type="password"
              />
            </label>
            {authConfig?.turnstileEnabled ? (
              <TurnstileWidget
                language={locale === "zh" ? "zh-CN" : "en"}
                onError={handleTurnstileError}
                onExpire={handleTurnstileExpire}
                onLoadError={handleTurnstileLoadError}
                onTokenChange={handleTurnstileTokenChange}
                resetKey={turnstileResetKey}
                siteKey={authConfig.turnstileSiteKey}
              />
            ) : null}
            <button
              className="primary-button wide"
              disabled={isLoggingIn || !authConfig}
              type="submit"
            >
              {t.actions.login}
            </button>
          </form>
        </section>
      </div>
    );
  }

  const pendingCategoryIsAll = pendingCategoryAction
    ? isAllCategoryValue(pendingCategoryAction.category)
    : false;

  return (
    <div
      className={`admin-workspace ${sidebarCollapsed ? "is-sidebar-collapsed" : ""} ${
        sidebarAnimating ? "is-sidebar-animating" : ""
      } ${mobileSidebarOpen ? "is-mobile-sidebar-open" : ""}`}
    >
      <aside
        ref={mobileSidebarRef}
        className="admin-sidebar"
        onKeyDown={mobileSidebarFocus.handleKeyDown}
      >
        <div className="admin-sidebar-head">
          <button className="admin-brand" type="button" onClick={onBackHome}>
            <SiteBrandIdentity markClassName="compact-mark" showSubtitle />
          </button>
          <button
            ref={mobileSidebarCloseRef}
            className="admin-mobile-sidebar-close"
            type="button"
            aria-label={t.actions.close}
            onClick={closeMobileSidebar}
          >
            <X size={26} />
          </button>
        </div>

        <nav className="admin-sidebar-nav" aria-label={t.admin.dashboard}>
          <span className="admin-sidebar-section">{t.admin.platform}</span>
          <button
            className={adminView === "tools" ? "is-active" : ""}
            type="button"
            onClick={() => selectAdminView("tools")}
          >
            <Wrench size={18} />
            <span>{t.admin.toolLibrary}</span>
          </button>
          <button
            className={adminView === "articles" ? "is-active" : ""}
            type="button"
            onClick={() => selectAdminView("articles")}
          >
            <FileText size={18} />
            <span>{articleText.adminNav}</span>
          </button>
          <button
            className={adminView === "push" ? "is-active" : ""}
            type="button"
            onClick={() => selectAdminView("push")}
          >
            <Send size={18} />
            <span>{telegramText.management.nav}</span>
          </button>
          <button
            className={adminView === "content" ? "is-active" : ""}
            type="button"
            onClick={() => selectAdminView("content")}
          >
            <Rss size={18} />
            <span>{contentText.nav}</span>
          </button>

          <span className="admin-sidebar-section">{t.admin.settings}</span>
          <button
            className={adminView === "import-export" ? "is-active" : ""}
            type="button"
            onClick={() => selectAdminView("import-export")}
          >
            <ArrowRightLeft size={18} />
            <span>{maintenanceText.importExportTab}</span>
          </button>
          <button
            className={adminView === "link-check" ? "is-active" : ""}
            type="button"
            onClick={() => selectAdminView("link-check")}
          >
            <ShieldCheck size={18} />
            <span>{maintenanceText.linkCheckTab}</span>
          </button>
          <button
            className={adminView === "system" ? "is-active" : ""}
            type="button"
            onClick={() => selectAdminView("system")}
          >
            <Settings size={18} />
            <span>{maintenanceText.systemTitle}</span>
          </button>
        </nav>

        <div className="admin-sidebar-bottom">
          <UtilityMenuControls
            className="admin-sidebar-utility"
            controller={adminUtilityMenuController}
            iconSize={17}
            locale={locale}
            localeControlClassName="admin-utility-menu"
            onLocaleChange={onLocaleChange}
            onThemeChange={onThemeChange}
            t={t}
            themeControlClassName="admin-utility-menu"
            themeMode={themeMode}
          />

          <button
            className="admin-user-card"
            type="button"
            onClick={handleLogout}
            aria-label={t.actions.logout}
          >
            <span className="admin-user-card-copy">
              <strong>{t.admin.rootUser}</strong>
              <small>{t.admin.directoryService}</small>
            </span>
            <span className="icon-button" aria-hidden="true">
              <LogOut size={17} />
            </span>
          </button>
        </div>
      </aside>
      <button
        className="admin-mobile-sidebar-overlay"
        type="button"
        aria-label={t.actions.close}
        onClick={closeMobileSidebar}
      />

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            <button
              ref={sidebarToggleRef}
              className={`admin-sidebar-toggle ${sidebarAnimating ? "is-toggling" : ""}`}
              type="button"
              aria-label={
                sidebarCollapsed ? t.admin.expandSidebar : t.admin.collapseSidebar
              }
              title={sidebarCollapsed ? t.admin.expandSidebar : t.admin.collapseSidebar}
              onClick={toggleSidebar}
            >
              <PanelLeft size={18} />
            </button>
            <span>{t.admin.dashboard}</span>
            <ChevronRight size={15} />
            <strong>{activeTitle}</strong>
          </div>

          <div className="admin-topbar-actions">
            {adminView === "system" ? (
              <div
                className="admin-command-row admin-system-settings-topbar-slot"
                id="admin-system-settings-topbar-slot"
              />
            ) : null}
            {adminView === "tools" ? (
              <div className="admin-command-row">
                <button
                  className="ghost-button admin-create-button"
                  type="button"
                  onClick={openCreate}
                >
                  <Plus size={16} />
                  <span className="admin-create-label-full">{t.actions.addTool}</span>
                  <span className="admin-create-label-compact" aria-hidden="true">
                    {t.actions.add}
                  </span>
                </button>
                <AdminSortButton mode={toolSortMode} onChange={setToolSortMode} t={t} />
              </div>
            ) : null}
            {adminView === "articles" ? (
              <div className="admin-command-row">
                <button
                  className="ghost-button admin-create-button"
                  type="button"
                  onClick={openCreateArticle}
                >
                  <Plus size={16} />
                  <span className="admin-create-label-full">{articleText.addArticle}</span>
                  <span className="admin-create-label-compact" aria-hidden="true">
                    {t.actions.add}
                  </span>
                </button>
                <AdminSortButton
                  mode={articleSortMode}
                  onChange={setArticleSortMode}
                  t={t}
                />
              </div>
            ) : null}
            {adminView === "content" ? (
              <div className="admin-command-row">
                <button
                  className="ghost-button admin-create-button"
                  type="button"
                  onClick={openCreateContentSource}
                >
                  <Plus size={16} />
                  <span className="admin-create-label-full">{contentText.addContent}</span>
                  <span className="admin-create-label-compact" aria-hidden="true">
                    {t.actions.add}
                  </span>
                </button>
                <AdminSortButton
                  mode={contentSortMode}
                  onChange={setContentSortMode}
                  t={t}
                />
              </div>
            ) : null}
            {adminView === "push" ? (
              <div className="admin-command-row">
                <button
                  className="ghost-button admin-create-button"
                  disabled={!telegramSettings.enabled}
                  type="button"
                  onClick={openCreateTelegramPush}
                >
                  <Plus size={16} />
                  <span className="admin-create-label-full">
                    {telegramText.management.addPush}
                  </span>
                  <span className="admin-create-label-compact" aria-hidden="true">
                    {t.actions.add}
                  </span>
                </button>
                <AdminSortButton
                  mode={telegramPushSortMode}
                  onChange={setTelegramPushSortMode}
                  t={t}
                />
              </div>
            ) : null}
            {adminView === "tools" ? (
              <AdminFilterBar
                clearLabel={t.actions.clearFilters}
                hasActiveFilter={
                  !isAllCategoryValue(adminCategory) || Boolean(adminSearch.trim())
                }
                searchPlaceholder={t.admin.searchPlaceholder}
                searchValue={adminSearch}
                onClear={() => {
                  setAdminCategory("All");
                  setAdminSearch("");
                }}
                onSearchChange={setAdminSearch}
                categoryControl={<AdminCategoryFilter
                  allLabel={categoryText.toolLabel}
                  categories={adminFilterCategories}
                  categoryText={categoryText}
                  onDeleteCategory={(category) =>
                    void deleteAdminCategory("tools", category)
                  }
                  onMoveCategory={(category) =>
                    void moveAdminCategory("tools", category)
                  }
                  onChange={(category) => {
                    setAdminCategory(category);
                    void rememberAdminCategory("tools", category);
                  }}
                  t={t}
                  value={adminCategory}
                />}
              />
            ) : null}
            {adminView === "articles" ? (
              <AdminFilterBar
                clearLabel={t.actions.clearFilters}
                hasActiveFilter={
                  !isAllCategoryValue(articleCategoryFilter) || Boolean(articleSearch.trim())
                }
                searchPlaceholder={articleText.searchPlaceholder}
                searchValue={articleSearch}
                onClear={() => {
                  setArticleCategoryFilter("All");
                  setArticleSearch("");
                  setDebouncedArticleSearch("");
                }}
                onSearchChange={setArticleSearch}
                categoryControl={<AdminCategoryFilter
                  allLabel={categoryText.articleLabel}
                  categories={articleFilterCategories}
                  categoryText={categoryText}
                  onDeleteCategory={(category) =>
                    void deleteAdminCategory("articles", category)
                  }
                  onMoveCategory={(category) =>
                    void moveAdminCategory("articles", category)
                  }
                  onChange={(category) => {
                    setArticleCategoryFilter(category);
                    void rememberAdminCategory("articles", category);
                  }}
                  t={t}
                  value={articleCategoryFilter}
                />}
              />
            ) : null}
            {adminView === "content" ? (
              <AdminFilterBar
                clearLabel={t.actions.clearFilters}
                hasActiveFilter={
                  !isAllCategoryValue(contentCategoryFilter) ||
                  contentSourceFilter !== "all" ||
                  Boolean(contentSearch.trim())
                }
                searchPlaceholder={contentText.searchPlaceholder}
                searchValue={contentSearch}
                onClear={() => {
                  setContentCategoryFilter("All");
                  setContentSourceFilter("all");
                  setContentSearch("");
                  setDebouncedContentSearch("");
                }}
                onSearchChange={setContentSearch}
                categoryControl={<AdminCategoryFilter
                  allLabel={categoryText.contentLabel}
                  categories={contentFilterCategories}
                  categoryText={categoryText}
                  onDeleteCategory={(category) =>
                    void deleteAdminCategory("content", category)
                  }
                  onMoveCategory={(category) =>
                    void moveAdminCategory("content", category)
                  }
                  onChange={(category) => {
                    setContentCategoryFilter(category);
                    setContentSourceFilter("all");
                    void rememberAdminCategory("content", category);
                  }}
                  t={t}
                  value={contentCategoryFilter}
                />}
              />
            ) : null}
            {adminView === "push" ? (
              <AdminFilterBar
                categoryControl={<AdminCategoryFilter
                  allLabel={categoryText.pushLabel}
                  fixedCategories={TELEGRAM_PUSH_FIXED_FILTERS}
                  categories={pushFilterCategories}
                  categoryText={categoryText}
                  labelFor={(category) =>
                    getTelegramPushCategoryLabel(category, telegramText, t)
                  }
                  onDeleteCategory={(category) => void deleteAdminCategory("push", category)}
                  onMoveCategory={(category) => void moveAdminCategory("push", category)}
                  onChange={(category) => {
                    setTelegramPushCategory(category);
                    if (!TELEGRAM_PUSH_FIXED_FILTERS.includes(category)) {
                      void rememberAdminCategory("push", category);
                    }
                  }}
                  t={t}
                  value={telegramPushCategory}
                />}
                clearLabel={t.actions.clearFilters}
                hasActiveFilter={
                  !isAllCategoryValue(telegramPushCategory) || Boolean(telegramPushSearch.trim())
                }
                onClear={() => {
                  setTelegramPushCategory("All");
                  setTelegramPushSearch("");
                  setDebouncedTelegramPushSearch("");
                }}
                onSearchChange={setTelegramPushSearch}
                searchPlaceholder={telegramText.management.searchPlaceholder}
                searchValue={telegramPushSearch}
              />
            ) : null}
          </div>
        </header>

        <div
          className={`admin-content-scroll ${
            adminView === "content" ? "is-full-height" : ""
          }`}
          ref={adminContentScrollRef}
        >
          {status ? (
            <div
              aria-atomic="true"
              aria-live="polite"
              className="admin-status"
              id="admin-operation-status"
              key={status.id}
              role="status"
            >
              {status.message}
            </div>
          ) : null}

          {adminView === "tools" && (
            isLoadingTools && !hasLoadedTools ? (
              <SkeletonVisibility visible={showAdminToolSkeletons}>
                <AdminResourceCardSkeletonGrid ariaLabel={t.admin.manageTools} />
              </SkeletonVisibility>
            ) : toolsLoadError && tools.length === 0 ? (
              <AdminInitialLoadError
                message={toolsLoadError}
                onRetry={() => void refresh()}
                t={t}
              />
            ) : visibleTools.length ? (
              <section className="admin-tool-grid" aria-label={t.admin.manageTools}>
                {visibleTools.map((tool) => (
                  <AdminToolCard
                    key={tool.id}
                    isBusy={writeLockedEntityKeys.has(
                      getAdminWriteEntityKey("tool", tool.id)
                    )}
                    onDelete={() => {
                      if (!isWriteEntityLocked("tool", tool.id)) {
                        setPendingDeleteTool(tool);
                      }
                    }}
                    onEdit={() => openEdit(tool)}
                    onTelegram={() =>
                      void openTelegramQuickPush(createTelegramToolResource(tool))
                    }
                    onToggleFeatured={() => requestToggleFeatured(tool)}
                    proxySettings={proxySettings}
                    t={t}
                    telegramEnabled={telegramSettings.enabled}
                    telegramText={telegramText}
                    tool={tool}
                  />
                ))}
              </section>
            ) : (
              <AdminEmptyState
                action={
                  tools.length === 0
                    ? {
                        label: t.empty.libraryAction,
                        onClick: () => selectAdminView("import-export")
                      }
                    : {
                        label: t.actions.clearFilters,
                        onClick: () => {
                          setAdminCategory("All");
                          setAdminSearch("");
                        },
                        tone: "ghost"
                      }
                }
                description={
                  tools.length === 0
                    ? t.empty.libraryDescription
                    : t.admin.emptyDescription
                }
                title={tools.length === 0 ? t.empty.libraryTitle : t.admin.emptyTitle}
              />
            )
          )}

          {adminView === "articles" && (
            isLoadingArticles && !hasLoadedArticles ? (
              <SkeletonVisibility visible={showAdminArticleSkeletons}>
                <AdminResourceCardSkeletonGrid ariaLabel={articleText.adminTitle} />
              </SkeletonVisibility>
            ) : articlesLoadError && adminArticles.length === 0 ? (
              <AdminInitialLoadError
                message={articlesLoadError}
                onRetry={() => void refreshArticles()}
                t={t}
              />
            ) : visibleArticles.length ? (
              <>
                <section className="admin-tool-grid" aria-label={articleText.adminTitle}>
                  {visibleArticles.map((article) => (
                    <AdminArticleCard
                      article={article}
                      articleText={articleText}
                      isBusy={writeLockedEntityKeys.has(
                        getAdminWriteEntityKey("article", article.id)
                      )}
                      key={article.id}
                      onDelete={() => {
                        if (!isWriteEntityLocked("article", article.id)) {
                          setPendingDeleteArticle(article);
                        }
                      }}
                      onEdit={() => void openEditArticle(article)}
                      onTelegram={() =>
                        void openTelegramQuickPush(
                          createTelegramArticleResource(article, window.location.origin)
                        )
                      }
                      onTogglePublished={() => requestToggleArticlePublished(article)}
                      telegramEnabled={telegramSettings.enabled}
                      telegramText={telegramText}
                    />
                  ))}
                </section>
                {adminArticlesHasMore ? (
                  <div className="content-flow-load-more">
                    <button
                      className="ghost-button"
                      disabled={isLoadingMoreArticles}
                      type="button"
                      onClick={() => void loadMoreAdminArticles()}
                    >
                      {articleText.loadMore}
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <AdminEmptyState
                action={
                  !hasActiveArticleFilter && adminArticlesTotal === 0
                    ? { label: articleText.addArticle, onClick: openCreateArticle }
                    : {
                        label: t.actions.clearFilters,
                        onClick: () => {
                          setArticleCategoryFilter("All");
                          setArticleSearch("");
                          setDebouncedArticleSearch("");
                        },
                        tone: "ghost"
                      }
                }
                description={
                  !hasActiveArticleFilter && adminArticlesTotal === 0
                    ? articleText.emptyDescription
                    : articleText.noMatchDescription
                }
                title={
                  !hasActiveArticleFilter && adminArticlesTotal === 0
                    ? articleText.emptyTitle
                    : articleText.noMatchTitle
                }
              />
            )
          )}

          {adminView === "content" ? (
            <AdminContentFlowPanel
              contentSourceCounts={contentSourceCounts}
              clearFiltersLabel={t.actions.clearFilters}
              contentSourceFilter={contentSourceFilter}
              contentSources={visibleContentSources}
              contentText={contentText}
              contentCategoryItemCount={contentItemsTotal}
              hasActiveFilter={
                !isAllCategoryValue(contentCategoryFilter) ||
                contentSourceFilter !== "all" ||
                Boolean(contentSearch.trim())
              }
              hasAnyContentSources={contentSources.length > 0}
              hasExistingContentItems={contentItems.length > 0}
              hasLoadedContent={hasLoadedContent}
              loadError={contentLoadError}
              isLoadingContent={isLoadingContent}
              isLoadingMoreContent={isLoadingMoreContent}
              hasMoreContent={contentItemsHasMore}
              onConvertItem={openConvertContentItem}
              onTelegram={(item) =>
                void openTelegramQuickPush(
                  createTelegramContentResource(item, window.location.origin)
                )
              }
              onDeleteSource={(source) => {
                if (!isWriteEntityLocked("content-source", source.id)) {
                  setPendingDeleteContentSource(source);
                }
              }}
              onEditSource={openEditContentSource}
              onSelectSource={setContentSourceFilter}
              onSyncSource={(source) => void handleSyncContentSource(source)}
              onLoadMore={() => void loadMoreContentItems()}
              onRetry={() => void refreshContent()}
              onClearFilters={() => {
                setContentCategoryFilter("All");
                setContentSourceFilter("all");
                setContentSearch("");
                setDebouncedContentSearch("");
              }}
              proxySettings={proxySettings}
              onAddSource={openCreateContentSource}
              showSkeletons={showAdminContentSkeletons}
              t={t}
              telegramEnabled={telegramSettings.enabled}
              telegramText={telegramText}
              visibleContentItems={visibleContentItems}
              writeLockedEntityKeys={writeLockedEntityKeys}
            />
          ) : null}

          {adminView === "push" ? (
            <AdminTelegramPushPanel
              hasActiveFilter={
                !isAllCategoryValue(telegramPushCategory) || Boolean(debouncedTelegramPushSearch)
              }
              hasMore={telegramPushHasMore}
              isLoading={
                isLoadingTelegramPushes || !hasLoadedTelegramPushes
              }
              isLoadingMore={isLoadingMoreTelegramPushes}
              loadError={telegramPushLoadError}
              onDelete={setPendingDeleteTelegramPush}
              onEdit={(record) => {
                if (record.resource) {
                  void openTelegramMessageDialog(record.resource);
                }
              }}
              onClearFilters={() => {
                setTelegramPushCategory("All");
                setTelegramPushSearch("");
                setDebouncedTelegramPushSearch("");
              }}
              onCreate={openCreateTelegramPush}
              onLoadMore={() => void loadMoreTelegramPushRecords()}
              onOpenSettings={openServiceSettings}
              onPush={setPendingPushTelegramRecord}
              onPushedStatus={() =>
                onNotify({
                  message: telegramText.management.pushedNotice,
                  tone: "info"
                })
              }
              onRetry={() => void refreshTelegramPushRecords()}
              onView={setViewingTelegramPush}
              records={telegramPushRecords}
              serviceEnabled={telegramSettings.enabled}
              settingsLoading={telegramSettingsLoading}
              showSkeletons={showTelegramPushSkeletons}
              t={t}
              text={telegramText.management}
            />
          ) : null}

          {adminView === "import-export" || adminView === "link-check" ? (
            <AdminLinkCheckPanel
              isLoadingTools={isLoadingTools && !hasLoadedTools}
              maintenanceText={maintenanceText}
              onReloadTools={refresh}
              proxySettings={proxySettings}
              setStatus={setStatus}
              t={t}
              token={token}
              tools={tools}
              section={adminView}
            />
          ) : null}

          {adminView === "system" ? (
            <AdminSystemSettingsPanel
              locale={locale}
              maintenanceText={maintenanceText}
              onTokenChange={(nextToken) => {
                localStorage.setItem("htools_token", nextToken);
                setToken(nextToken);
              }}
              onProxySettingsChange={onProxySettingsChange}
              onDataRestored={async () => {
                await Promise.all([
                  refreshAdminCategories(),
                  refresh(),
                  refreshArticles(),
                  refreshContent()
                ]);
              }}
              onSiteSettingsChange={onSiteSettingsChange}
              onTelegramSettingsChange={applyTelegramSettings}
              onUmamiSettingsChange={onUmamiSettingsChange}
              onReloadTelegramSettings={refreshTelegramSettings}
              proxySettings={proxySettings}
              proxySettingsLoadError={proxySettingsLoadError}
              proxySettingsReady={proxySettingsReady}
              setStatus={setStatus}
              siteSettings={siteSettings}
              siteSettingsLoadError={siteSettingsLoadError}
              siteSettingsReady={siteSettingsReady}
              t={t}
              telegramSettings={telegramSettings}
              telegramSettingsLoadError={telegramSettingsLoadError}
              telegramSettingsLoading={telegramSettingsLoading}
              token={token}
            />
          ) : null}
        </div>
      </main>

      {telegramQuickResource ? (
        <Dialog
          closeDisabled={telegramQuickSaving}
          closeLabel={t.actions.close}
          description={
            telegramQuickMessage?.exists
              ? telegramText.quickPush.alreadyPushed
              : telegramText.quickPush.description
          }
          descriptionId="telegram-quick-push-description"
          onClose={closeTelegramQuickPush}
          panelClassName="tool-editor-dialog"
          title={telegramText.title}
          footer={
            <AdminDialogActions
              disabled={
                telegramQuickLoading ||
                telegramQuickSaving ||
                !telegramQuickMessage
              }
              primaryLabel={
                telegramQuickMessage?.exists
                  ? telegramText.quickPush.goManage
                  : telegramQuickMode === "published"
                    ? telegramText.quickPush.sendAction
                    : telegramText.quickPush.draftAction
              }
              onPrimary={() => {
                if (telegramQuickMessage?.exists) {
                  closeTelegramQuickPush();
                  selectAdminView("push");
                  return;
                }
                void confirmTelegramQuickPush();
              }}
            />
          }
        >
          <div className="tool-form article-form">
            {!telegramQuickLoading && !telegramQuickMessage?.exists ? (
              <>
                <PublishModeField
                  disabled={telegramQuickSaving}
                  draftLabel={telegramText.quickPush.draftLabel}
                  label={telegramText.quickPush.modeLabel}
                  onChange={setTelegramQuickMode}
                  publishedLabel={telegramText.quickPush.sendLabel}
                  value={telegramQuickMode}
                />
                <div className="tool-form-field">
                  <span className="tool-form-label">
                    {telegramText.categoryLabel}
                  </span>
                  <AdminCategoryFilter
                    alignToTopOnOpen
                    categories={uniqueAdminCategories([
                      getTelegramPushDefaultFilter(telegramQuickResource.type),
                      ...pushExistingCategories,
                      telegramQuickCategory
                    ])}
                    categoryText={categoryText}
                    className="tool-form-category-filter"
                    fixedCategories={[
                      getTelegramPushDefaultFilter(telegramQuickResource.type)
                    ]}
                    labelFor={(category) =>
                      getTelegramPushCategoryLabel(category, telegramText, t)
                    }
                    onChange={(category) => {
                      setTelegramQuickCategory(category);
                      if (!isTelegramPushSourceFilter(category)) {
                        void rememberAdminCategory("push", category);
                      }
                    }}
                    onDeleteCategory={(category) => void deleteAdminCategory("push", category)}
                    onMoveCategory={(category) => void moveAdminCategory("push", category)}
                    t={t}
                    value={telegramQuickCategory}
                  />
                </div>
              </>
            ) : null}
            <div className="tool-form-field telegram-message-preview-field">
              <span className="tool-form-label">{telegramText.previewTitle}</span>
              <section className="tool-github-detail-card telegram-message-preview">
                {telegramQuickMessage ? (
                  <TelegramMessagePreview
                    content={telegramQuickMessage.bodyMarkdown}
                    mediaEnabled={telegramQuickMessage.mediaEnabled}
                    mediaUrl={telegramQuickMessage.mediaUrl}
                    locale={locale}
                    proxySettings={proxySettings}
                    resource={telegramQuickResource}
                  />
                ) : (
                  <div className="tool-github-detail-placeholder">
                    <Send size={16} />
                    <span>{telegramText.loading}</span>
                  </div>
                )}
              </section>
            </div>
          </div>
        </Dialog>
      ) : null}

      {telegramResource ? (
        <Dialog
          closeDisabled={telegramMessageSaving}
          title={telegramText.title}
          closeLabel={t.actions.close}
          description={
            telegramResource.type === "custom"
              ? telegramText.customDescription
              : telegramText.description
          }
          descriptionId="telegram-message-dialog-description"
          onClose={closeTelegramMessageDialog}
          panelClassName="tool-editor-dialog telegram-message-dialog"
          footer={
            <>
              <button
                className="ghost-button"
                disabled={
                  telegramMessageLoading ||
                  telegramMessageSaving ||
                  !telegramMessage ||
                  !telegramEditorDirty ||
                  !telegramBodyMarkdown.trim() ||
                  telegramCustomTitleMissing ||
                  !telegramMediaValid ||
                  telegramPreviewLength > TELEGRAM_MESSAGE_LIMIT
                }
                type="button"
                onClick={() => void saveTelegramMessageChanges()}
              >
                {telegramText.save}
              </button>
              <button
                className="primary-button"
                disabled={
                  telegramMessageLoading ||
                  telegramMessageSaving ||
                  !telegramMessage ||
                  telegramMessage.targetChanged ||
                  !telegramPushNeeded ||
                  !telegramBodyMarkdown.trim() ||
                  telegramCustomTitleMissing ||
                  !telegramMediaValid ||
                  telegramPreviewLength > TELEGRAM_MESSAGE_LIMIT
                }
                type="button"
                onClick={() => void submitTelegramMessage()}
              >
                {telegramMessage?.exists ? telegramText.update : telegramText.send}
              </button>
            </>
          }
        >
          {!telegramMessage ? (
            <div className="telegram-message-loading tool-form" role="status">
              <div className="tool-form-field telegram-message-preview-field is-placeholder">
                <span className="tool-form-label">{telegramText.previewTitle}</span>
                <section className="tool-github-detail-card telegram-message-preview">
                  <div className="tool-github-detail-placeholder">
                    <Send size={16} />
                    <span>{telegramText.loading}</span>
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <>
              <EditorTopActions>
                {telegramResource.type === "custom" &&
                isCreatingTelegramPush &&
                telegramGitHub.canLoad ? (
                  <AdminGitHubMetadataButton
                    disabled={telegramGitHub.loading}
                    label={t.form.githubMetadata}
                    onClick={() =>
                      void telegramGitHub.load(telegramUrl, {
                        force: true,
                        apply: true,
                        notify: true,
                        overwrite: true
                      })
                    }
                  />
                ) : null}
                {telegramResource.type !== "custom" ? (
                  <button
                    className="ghost-button tool-editor-action-button"
                    disabled={telegramMessageLoading || telegramMessageSaving || telegramSourceLoading}
                    type="button"
                    aria-label={telegramText.syncSourceHint}
                    title={telegramText.syncSourceHint}
                    onClick={() => void refreshTelegramSource()}
                  >
                    <RefreshCw size={16} />
                    <span>{telegramText.syncSource}</span>
                  </button>
                ) : null}
                <BooleanSegmentedToggle
                  className="telegram-media-status-toggle"
                  disabled={telegramMessageLoading || telegramMessageSaving}
                  disabledLabel={telegramText.mediaDisabled}
                  enabledLabel={telegramText.mediaEnabled}
                  onChange={handleTelegramMediaEnabledChange}
                  value={telegramMediaEnabled}
                />
              </EditorTopActions>
              <div className="telegram-message-editor tool-form">
              <AdminTextField
                disabled={telegramMessageLoading || telegramMessageSaving}
                headingAside={
                  <span
                    aria-busy={telegramMessageLoading}
                    aria-live="polite"
                    className={`telegram-message-heading-status source-card-status ${
                      telegramMessageLoading ? "is-loading" : ""
                    }`.trim()}
                  >
                    {telegramText.statuses[telegramMessage.syncStatus]}
                  </span>
                }
                id="telegram-custom-title"
                label={telegramText.customTitleLabel}
                maxLength={120}
                onChange={(nextTitle) => {
                  setTelegramCustomTitle(nextTitle);
                  setTelegramBodyMarkdown((current) =>
                    syncTelegramBodyField(
                      current,
                      { title: nextTitle },
                      telegramSettings.footerMarkdown,
                      locale
                    )
                  );
                }}
                placeholder={t.form.namePlaceholder}
                value={telegramCustomTitle}
              />
              <AdminTextareaField
                disabled={telegramMessageLoading || telegramMessageSaving}
                label={t.form.description}
                onChange={(description) => {
                  setTelegramDescription(description);
                  setTelegramBodyMarkdown((current) =>
                    syncTelegramBodyField(
                      current,
                      { description },
                      telegramSettings.footerMarkdown,
                      locale
                    )
                  );
                }}
                placeholder={t.form.descriptionPlaceholder}
                rows={4}
                value={telegramDescription}
              />
              <AdminUrlField
                disabled={telegramMessageLoading || telegramMessageSaving}
                  label={
                    telegramResource.type === "article"
                      ? (locale === "zh" ? "文章地址" : "Article URL")
                      : telegramResource.type === "content"
                        ? telegramText.contentUrlLabel
                        : t.form.url
                  }
                onChange={(url) => {
                  if (url !== telegramUrl) telegramGitHub.reset(url);
                  setTelegramUrl(url);
                  setTelegramBodyMarkdown((current) =>
                    syncTelegramBodyField(
                      current,
                      { url, resourceType: telegramResource.type },
                      telegramSettings.footerMarkdown,
                      locale
                    )
                  );
                }}
                placeholder={
                  telegramResource.type === "article"
                    ? telegramText.articleUrlPlaceholder
                    : telegramResource.type === "content"
                      ? telegramText.contentUrlPlaceholder
                      : t.form.urlPlaceholder
                }
                value={telegramUrl}
              />
              <AdminUrlField
                disabled={telegramMessageLoading || telegramMessageSaving}
                label={
                  telegramResource.type === "content"
                    ? telegramText.contentOriginalUrlLabel
                    : t.form.demoUrl
                }
                onChange={(demoUrl) => {
                  setTelegramDemoUrl(demoUrl);
                  setTelegramBodyMarkdown((current) =>
                    syncTelegramBodyField(
                      current,
                      { demoUrl, resourceType: telegramResource.type },
                      telegramSettings.footerMarkdown,
                      locale
                    )
                  );
                }}
                placeholder={
                  telegramResource.type === "content"
                    ? telegramText.contentOriginalUrlPlaceholder
                    : t.form.demoUrlPlaceholder
                }
                value={telegramDemoUrl}
              />
              <AdminTagsField
                disabled={telegramMessageLoading || telegramMessageSaving}
                label={t.form.tags}
                onChange={(tagText) => {
                  setTelegramTagText(tagText);
                  setTelegramBodyMarkdown((current) =>
                    syncTelegramBodyField(
                      current,
                      { tags: parseArticleTagsInput(tagText) },
                      telegramSettings.footerMarkdown,
                      locale
                    )
                  );
                }}
                placeholder={t.form.tagsPlaceholder}
                value={telegramTagText}
              />
              <AdminUrlField
                disabled={telegramMessageLoading || telegramMessageSaving}
                label={t.form.image}
                onChange={setTelegramImage}
                placeholder={t.form.imagePlaceholder}
                value={telegramImage}
              />
              <div className="tool-form-field">
                <span className="tool-form-label">{telegramText.categoryLabel}</span>
                <AdminCategoryFilter
                  allowCreate
                  alignToTopOnOpen
                  categories={telegramEditorCategoryOptions}
                  categoryText={categoryText}
                  className="tool-form-category-filter"
                  fixedCategories={[getTelegramPushDefaultFilter(telegramResource.type)].filter(Boolean)}
                  labelFor={(category) =>
                    getTelegramPushCategoryLabel(category, telegramText, t)
                  }
                  onDeleteCategory={(category) => void deleteAdminCategory("push", category)}
                  onChange={(category) => {
                    setTelegramCategory(category);
                    if (!isTelegramPushSourceFilter(category)) {
                      void rememberAdminCategory("push", category);
                    }
                  }}
                  t={t}
                  value={telegramCategory}
                />
              </div>
              <AdminGitHubMetadataCard
                canLoad={
                  telegramResource.type === "custom" &&
                  isCreatingTelegramPush &&
                  telegramGitHub.canLoad
                }
                detailText={githubMetadataDetailText}
                failed={telegramGitHub.failed}
                loading={telegramGitHub.loading}
                metadata={telegramGitHub.metadata}
                previewLoading={telegramGitHub.previewLoading}
              />
              {telegramMessageErrorCode ? (
                <div className="telegram-message-action-error" role="alert">
                  <p>
                    {telegramMessageErrorCode === "TELEGRAM_MESSAGE_NOT_FOUND"
                      ? telegramText.messageNotFound
                      : telegramMessageErrorCode === "TELEGRAM_TARGET_CHANGED"
                        ? telegramText.targetChanged
                        : telegramText.permissionDenied}
                  </p>
                  {telegramMessageErrorCode === "TELEGRAM_MESSAGE_NOT_FOUND" ||
                  telegramMessageErrorCode === "TELEGRAM_TARGET_CHANGED" ? (
                    <button
                      className="ghost-button"
                      disabled={
                        telegramMessageSaving ||
                        telegramMessageLoading ||
                        !telegramBodyMarkdown.trim() ||
                        telegramCustomTitleMissing ||
                        !telegramMediaValid ||
                        telegramPreviewLength > TELEGRAM_MESSAGE_LIMIT
                      }
                      type="button"
                      onClick={() => void recoverTelegramPush()}
                    >
                      {telegramText.recoverMessage}
                    </button>
                  ) : null}
                </div>
              ) : null}
              <AdminUrlField
                className="telegram-media-url-field"
                disabled={telegramMessageLoading || telegramMessageSaving}
                id="telegram-media-url"
                label={telegramText.mediaUrlLabel}
                maxLength={2048}
                onChange={setTelegramMediaUrl}
                placeholder={telegramText.mediaUrlPlaceholder}
                value={telegramMediaUrl}
              >
                <p className="telegram-media-help">{telegramText.mediaHelp}</p>
                {!telegramMediaValid ? (
                  <p className="telegram-media-error" role="alert">
                    {telegramText.mediaInvalid}
                  </p>
                ) : null}
              </AdminUrlField>
              <AdminMarkdownEditor
                actions={TELEGRAM_MARKDOWN_EDITOR_ACTIONS}
                className="telegram-message-body-field"
                disabled={telegramMessageLoading || telegramMessageSaving}
                id="telegram-rich-markdown-body"
                label={telegramText.bodyLabel}
                locale={locale}
                maxLength={TELEGRAM_MESSAGE_LIMIT}
                mode={telegramMarkdownEditorMode}
                onChange={(value) => {
                  setTelegramBodyMarkdown(value);
                  const fields = readTelegramBodyFields(
                    value,
                    telegramSettings.footerMarkdown,
                    locale,
                    isCreatingTelegramPush
                  );
                  if (
                    telegramResource.type === "custom" &&
                    isCreatingTelegramPush &&
                    fields.url !== telegramUrl
                  ) {
                    telegramGitHub.reset(fields.url);
                  }
                  setTelegramCustomTitle(fields.title);
                  setTelegramDescription(fields.description);
                  setTelegramUrl(fields.url);
                  setTelegramDemoUrl(fields.demoUrl);
                  setTelegramTagText(formatTagInputText(fields.tags));
                }}
                onModeChange={setTelegramMarkdownEditorMode}
                preview={
                  telegramMessageLoading ? (
                    <div className="tool-github-detail-placeholder" role="status">
                      <Send size={16} />
                      <span>{telegramText.loading}</span>
                    </div>
                  ) : (
                    <TelegramMessagePreview
                      content={telegramPreviewMarkdown}
                      mediaEnabled={telegramMediaEnabled}
                      mediaUrl={normalizedTelegramMediaUrl}
                      locale={locale}
                      proxySettings={proxySettings}
                      resource={telegramResource}
                    />
                  )
                }
                previewClassName="telegram-message-preview"
                placeholder={telegramText.bodyPlaceholder}
                proxySettings={proxySettings}
                rows={isCreatingTelegramPush ? 11 : 12}
                text={t.markdownEditor}
                value={telegramBodyMarkdown}
              />
              {telegramPreviewLength > TELEGRAM_MESSAGE_LIMIT ? (
                <div className="telegram-message-count" aria-live="polite">
                  <span className="is-invalid">{telegramText.tooLong}</span>
                </div>
              ) : null}
              </div>
            </>
          )}
        </Dialog>
      ) : null}

      {viewingTelegramPush ? (
        <Dialog
          closeLabel={t.actions.close}
          onClose={() => setViewingTelegramPush(null)}
          panelClassName="tool-editor-dialog telegram-message-dialog telegram-push-preview-dialog"
          title={telegramText.management.viewAction}
        >
          <div className="telegram-push-preview-dialog-body">
            {!viewingTelegramPush.resourceExists ? (
              <div className="telegram-push-preview-heading">
                <span className="source-card-status">
                  {telegramText.management.resourceDeleted}
                </span>
              </div>
            ) : null}
            <section className="tool-github-detail-card telegram-message-preview">
              <TelegramMessagePreview
                content={viewingTelegramPush.messageMarkdown}
                mediaEnabled={viewingTelegramPush.mediaEnabled}
                mediaUrl={viewingTelegramPush.mediaUrl}
                locale={locale}
                proxySettings={proxySettings}
                resource={
                  viewingTelegramPush.resource ?? {
                    type: viewingTelegramPush.resourceType,
                    id: viewingTelegramPush.resourceId,
                    title: viewingTelegramPush.title,
                    description: "",
                    url: "",
                    demoUrl: "",
                    image: viewingTelegramPush.mediaUrl,
                    category: "",
                    tags: []
                  }
                }
              />
            </section>
          </div>
        </Dialog>
      ) : null}

      {formOpen ? (
        <Dialog
          closeRequestRef={toolEditorCloseRequestRef}
          closeDisabled={isSaving}
          description={editingTool ? t.form.editDescription : t.form.addDescription}
          descriptionId="tool-editor-dialog-description"
          title={editingTool ? t.admin.editTool : t.actions.addTool}
          closeLabel={t.actions.close}
          onClose={() => {
            closeToolEditor();
          }}
          panelClassName="tool-editor-dialog"
          footer={
            <AdminDialogActions
              disabled={isSaving}
              formId="admin-tool-editor-form"
              primaryLabel={t.form.saveTool}
            />
          }
        >
          <EditorTopActions>
            {canFillGitHubMetadata ? (
              <AdminGitHubMetadataButton
                disabled={toolGitHub.loading}
                label={t.form.githubMetadata}
                onClick={() =>
                  void toolGitHub.load(form.url, {
                    force: true,
                    apply: true,
                    notify: true,
                    overwrite: true
                  })
                }
              />
            ) : null}
            <BooleanSegmentedToggle
              className="tool-featured-status-toggle"
              disabledLabel={t.form.regularTool}
              enabledLabel={t.form.featuredTool}
              onChange={(nextFeatured) => {
                setForm({ ...form, featured: nextFeatured });
                setStatus(
                  nextFeatured
                    ? t.status.featuredDraftEnabled
                    : t.status.featuredDraftDisabled
                );
              }}
              value={form.featured}
            />
          </EditorTopActions>

          <form id="admin-tool-editor-form" className="tool-form" onSubmit={handleSave}>
            <AdminTextField
              label={t.form.name}
              onBlurValue={moveGitHubUrlFromName}
              onChange={(name) => setForm((current) => ({ ...current, name }))}
              onPaste={(event) => {
                  const pastedText = event.clipboardData.getData("text");

                  if (moveGitHubUrlFromName(pastedText)) {
                    event.preventDefault();
                  }
              }}
              placeholder={t.form.namePlaceholder}
              required
              value={form.name}
            />

            <AdminTextareaField
              label={t.form.description}
              onChange={(description) =>
                setForm((current) => ({ ...current, description }))
              }
              placeholder={t.form.descriptionPlaceholder}
              required
              rows={4}
              value={form.description}
            />

            <AdminUrlField
              className="tool-url-field"
              id="admin-tool-url"
              label={t.form.url}
              onChange={(nextUrl) => {
                if (nextUrl !== form.url) toolGitHub.reset(nextUrl);
                setForm((current) => ({ ...current, url: nextUrl }));
              }}
              placeholder={t.form.urlPlaceholder}
              required
              value={form.url}
            />

            <AdminUrlField
              label={t.form.demoUrl}
              onChange={(demoUrl) => setForm((current) => ({ ...current, demoUrl }))}
              placeholder={t.form.demoUrlPlaceholder}
              value={form.demoUrl}
            />

            <AdminTagsField
              label={t.form.tags}
              onChange={setToolTagText}
              placeholder={t.form.tagsPlaceholder}
              value={toolTagText}
            />

            <AdminUrlField
              label={t.form.image}
              onChange={(image) => setForm((current) => ({ ...current, image }))}
              placeholder={t.form.imagePlaceholder}
              value={form.image}
            />

            <div className="tool-form-field">
              <span className="tool-form-label">{t.form.category}</span>
              <AdminCategoryFilter
                allowCreate
                alignToTopOnOpen
                categories={adminCategoryOptions}
                categoryText={categoryText}
                className="tool-form-category-filter"
                onDeleteCategory={(category) =>
                  void deleteAdminCategory("tools", category)
                }
                onChange={(category) => {
                  setForm({ ...form, category });
                  void rememberAdminCategory("tools", category);
                }}
                t={t}
                value={form.category}
              />
            </div>

            <AdminGitHubMetadataCard
              canLoad={canFillGitHubMetadata}
              detailText={githubMetadataDetailText}
              failed={toolGitHub.failed}
              loading={toolGitHub.loading}
              metadata={toolGitHub.metadata}
              previewLoading={toolGitHub.previewLoading}
            />

          </form>
        </Dialog>
      ) : null}

      {articleFormOpen ? (
        <Dialog
          closeRequestRef={articleEditorCloseRequestRef}
          closeDisabled={isArticleSaving}
          description={
            editingArticle
              ? articleText.editArticleDescription
              : articleText.addArticleDescription
          }
          descriptionId="article-editor-dialog-description"
          title={editingArticle ? articleText.editArticle : articleText.addArticle}
          closeLabel={t.actions.close}
          onClose={() => {
            closeArticleEditor();
          }}
          panelClassName="tool-editor-dialog article-editor-dialog"
          footer={
            <AdminDialogActions
              disabled={isArticleSaving}
              formId="admin-article-editor-form"
              primaryLabel={articleText.saveArticle}
            />
          }
        >
          <EditorTopActions className="article-editor-top-actions">
            <PublishModeField
              draftLabel={articleText.draftLabel}
              label={articleText.publishModeLabel}
              publishedLabel={articleText.publishDirectLabel}
              value={articleForm.published ? "published" : "draft"}
              onChange={(mode) => {
                const published = mode === "published";
                setArticleForm((current) => ({ ...current, published }));
                onNotify({
                  message: published
                    ? articleText.publishDraftEnabled
                    : articleText.publishDraftDisabled,
                  tone: "info"
                });
              }}
            />
          </EditorTopActions>

          <form
            id="admin-article-editor-form"
            className="tool-form article-form"
            onSubmit={handleSaveArticle}
          >
            <AdminTextField
              label={articleText.titleLabel}
              onChange={(title) =>
                setArticleForm((current) => ({ ...current, title }))
              }
              placeholder={articleText.titlePlaceholder}
              required
              value={articleForm.title}
            />

            <AdminTextareaField
              label={articleText.summaryLabel}
              onChange={(summary) =>
                setArticleForm((current) => ({ ...current, summary }))
              }
              placeholder={articleText.summaryPlaceholder}
              required
              rows={3}
              value={articleForm.summary}
            />

            <label>
              {articleText.slugLabel}
              <input
                value={articleForm.slug}
                onChange={(event) =>
                  setArticleForm({ ...articleForm, slug: event.target.value })
                }
                onBlur={() =>
                  setArticleForm((current) => ({
                    ...current,
                    slug: normalizeSlugInput(current.slug)
                  }))
                }
                placeholder={articleText.slugPlaceholder}
              />
              <small className="form-field-help">{articleText.slugHelp}</small>
            </label>

            <AdminTagsField
              label={articleText.tagsLabel}
              onChange={setArticleTagText}
              placeholder={articleText.tagsPlaceholder}
              value={articleTagText}
            />

            <AdminUrlField
              label={articleText.coverImageLabel}
              onChange={(coverImage) =>
                setArticleForm((current) => ({ ...current, coverImage }))
              }
              placeholder={articleText.coverImagePlaceholder}
              value={articleForm.coverImage}
            />

            <div className="tool-form-field">
              <span className="tool-form-label">{articleText.categoryLabel}</span>
              <AdminCategoryFilter
                alignToTopOnOpen
                categories={articleCategoryOptions}
                categoryText={categoryText}
                className="tool-form-category-filter"
                disabled={isConvertingContentItem}
                emptyLabel={articleText.categoryEmptyLabel}
                onDeleteCategory={(category) =>
                  void deleteAdminCategory("articles", category)
                }
                onChange={(category) => {
                  setArticleForm({
                    ...articleForm,
                    category
                  });
                  void rememberAdminCategory("articles", category);
                }}
                t={t}
                value={articleForm.category}
              />
              <small className="form-field-help">
                {articleText.categoryPlaceholder}
              </small>
            </div>

            <label>
              {articleText.publishTimeLabel}
              <input
                type="datetime-local"
                value={articleForm.publishedAt}
                onChange={(event) =>
                  setArticleForm({
                    ...articleForm,
                    publishedAt: event.target.value
                  })
                }
              />
              <small className="form-field-help">
                {articleText.publishTimeHelp}
              </small>
            </label>

            <AdminMarkdownEditor
              className="tool-form-field article-markdown-editor"
              disabled={isArticleSaving}
              id="admin-article-content"
              label={articleText.contentLabel}
              locale={locale}
              onChange={(content) => setArticleForm({ ...articleForm, content })}
              placeholder={articleText.contentPlaceholder}
              proxySettings={proxySettings}
              required
              rows={12}
              text={t.markdownEditor}
              textareaClassName="article-content-input"
              value={articleForm.content}
            />
          </form>
        </Dialog>
      ) : null}

      {contentSourceFormOpen ? (
        <Dialog
          closeRequestRef={contentSourceEditorCloseRequestRef}
          closeDisabled={isContentSourceSaving}
          description={
            editingContentSource
              ? contentText.editSourceDescription
              : contentText.addSourceDescription
          }
          descriptionId="content-source-dialog-description"
          title={
            editingContentSource
              ? contentText.editSource
              : contentText.addSource
          }
          closeLabel={t.actions.close}
          onClose={() => {
            closeContentSourceEditor();
          }}
          panelClassName="tool-editor-dialog article-editor-dialog content-source-dialog"
          footer={
            <AdminDialogActions
              disabled={isContentSourceSaving}
              formId="admin-content-source-form"
              primaryLabel={contentText.saveSource}
              leading={
              <button
                className="ghost-button"
                disabled={isContentPreviewing || isContentSourceSaving}
                type="button"
                onClick={() => void handlePreviewContentSource()}
              >
                {contentText.preview}
              </button>
              }
            />
          }
        >
          <EditorTopActions>
            <BooleanSegmentedToggle
              className="content-source-status-toggle"
              disabledLabel={contentText.disabledLabel}
              enabledLabel={contentText.enabledLabel}
              onChange={(nextEnabled) => {
                setContentSourceForm((current) => ({
                  ...current,
                  enabled: nextEnabled
                }));
                setStatus(
                  nextEnabled
                    ? contentText.enabledDraftEnabled
                    : contentText.enabledDraftDisabled
                );
              }}
              value={contentSourceForm.enabled}
            />
          </EditorTopActions>

          <form
            id="admin-content-source-form"
            className="tool-form article-form"
            onSubmit={handleSaveContentSource}
          >
            <label>
              {contentText.sourceUrlLabel}
              <input
                value={contentSourceForm.url}
                onChange={(event) => {
                  if (event.target.value !== contentSourceForm.url) {
                    invalidateContentPreview();
                  }
                  setContentSourceForm({
                    ...contentSourceForm,
                    url: event.target.value
                  });
                }}
                onBlur={() => {
                  const url = normalizeHttpUrlInput(contentSourceForm.url);
                  if (url !== contentSourceForm.url) invalidateContentPreview();
                  setContentSourceForm({ ...contentSourceForm, url });
                }}
                placeholder={contentText.sourceUrlPlaceholder}
                inputMode="url"
                required
              />
            </label>

            <label>
              {contentText.sourceTitleLabel}
              <input
                value={contentSourceForm.title}
                onChange={(event) =>
                  setContentSourceForm({
                    ...contentSourceForm,
                    title: event.target.value
                  })
                }
                placeholder={contentText.sourceTitlePlaceholder}
              />
            </label>

            <div className="tool-form-field">
              <span className="tool-form-label">{contentText.categoryLabel}</span>
              <AdminCategoryFilter
                alignToTopOnOpen
                categories={contentCategoryOptions}
                categoryText={categoryText}
                className="tool-form-category-filter"
                emptyLabel={contentText.categoryEmptyLabel}
                onDeleteCategory={(category) =>
                  void deleteAdminCategory("content", category)
                }
                onChange={(category) => {
                  setContentSourceForm({
                    ...contentSourceForm,
                    category
                  });
                  void rememberAdminCategory("content", category);
                }}
                t={t}
                value={contentSourceForm.category}
              />
              <small className="form-field-help">
                {contentText.categoryPlaceholder}
              </small>
            </div>

            <label>
              {contentText.tagsLabel}
              <input
                value={contentSourceTagText}
                onChange={(event) => setContentSourceTagText(event.target.value)}
                onBlur={(event) => setContentSourceTagText(normalizeTagInputText(event.currentTarget.value))}
                onPaste={(event) => {
                  const text = event.clipboardData.getData("text");

                  if (text.includes("\n") || /^\s*tags\s*:/i.test(text) || /#[^\s#]+/.test(text)) {
                    event.preventDefault();
                    setContentSourceTagText(normalizeTagInputText(text));
                  }
                }}
                placeholder={contentText.tagsPlaceholder}
              />
            </label>

            {contentPreview ? (
              <div className="content-source-preview" ref={contentPreviewRef}>
                <div>
                  <strong>{contentText.previewTitle}</strong>
                  <span>{contentPreview.title}</span>
                </div>
                {contentPreview.items.slice(0, 3).map((item) => (
                  <article key={item.externalId}>
                    <h3>{getArticleDisplayTitle(item)}</h3>
                    <p>{cleanArticleDisplayText(item.summary)}</p>
                  </article>
                ))}
              </div>
            ) : null}
          </form>
        </Dialog>
      ) : null}

      {pendingConvertItem ? (
        <Dialog
          closeRequestRef={contentConvertCloseRequestRef}
          closeDisabled={isConvertingContentItem}
          description={
            pendingConvertItem.articleId
              ? contentText.updateArticleDescription
              : contentText.convertCategoryDescription
          }
          descriptionId="content-convert-dialog-description"
          title={
            pendingConvertItem.articleId
              ? contentText.updateArticleTitle
              : contentText.convertCategoryTitle
          }
          closeLabel={t.actions.close}
          onClose={() => {
            closeContentConvertDialog();
          }}
          panelClassName="tool-editor-dialog article-editor-dialog content-convert-dialog"
          footer={
            <AdminDialogActions
              disabled={isConvertingContentItem}
              primaryLabel={
                pendingConvertItem.articleId
                  ? contentText.updateArticleAction
                  : contentText.convertCategoryAction
              }
              onPrimary={() =>
                void handleConvertContentItem(
                  pendingConvertItem,
                  convertArticleCategory,
                  convertPublishMode
                )
              }
            />
          }
        >
          <div className="tool-form article-form">
            <PublishModeField
              disabled={isConvertingContentItem}
              draftLabel={contentText.convertAsDraft}
              label={contentText.convertPublishLabel}
              publishedLabel={contentText.convertAsPublished}
              value={convertPublishMode}
              onChange={(mode) => {
                setConvertPublishMode(mode);
                onNotify({
                  message:
                    mode === "published"
                      ? contentText.convertPublishPublishedTip
                      : contentText.convertPublishDraftTip,
                  tone: "info"
                });
              }}
            />
            <div className="tool-form-field">
              <span className="tool-form-label">{articleText.categoryLabel}</span>
              <AdminCategoryFilter
                alignToTopOnOpen
                categories={articleCategoryOptions}
                categoryText={categoryText}
                className="tool-form-category-filter"
                emptyLabel={articleText.categoryEmptyLabel}
                onDeleteCategory={(category) =>
                  void deleteAdminCategory("articles", category)
                }
                onChange={(category) => {
                  setConvertArticleCategory(category);
                  void rememberAdminCategory("articles", category);
                }}
                t={t}
                value={convertArticleCategory}
              />
              <small className="form-field-help">
                {articleText.categoryPlaceholder}
              </small>
            </div>
          </div>
        </Dialog>
      ) : null}

      {pendingCategoryAction ? (
        <Dialog
          description={
            pendingCategoryIsAll
              ? categoryText.clearDescription(
                  categoryText.scopeLabel(pendingCategoryAction.scope),
                  pendingCategoryAction.contentCount
                )
              : categoryText.occupiedDescription(
                  pendingCategoryAction.contentCount
                )
          }
          descriptionId="category-action-dialog-description"
          title={
            pendingCategoryIsAll
              ? categoryText.clearTitle(categoryText.scopeLabel(pendingCategoryAction.scope))
              : categoryText.manageTitle(
                  getCategoryLabel(pendingCategoryAction.category, t)
                )
          }
          closeLabel={t.actions.close}
          onClose={() => {
            if (!isApplyingCategoryAction) {
              setPendingCategoryAction(null);
              setCategoryActionTarget("");
            }
          }}
          panelClassName="tool-editor-dialog admin-action-dialog admin-category-action-dialog"
          footer={
            <>
              <button
                className="ghost-button"
                disabled={isApplyingCategoryAction}
                type="button"
                onClick={() => {
                  setPendingCategoryAction(null);
                  setCategoryActionTarget("");
                }}
              >
                {t.status.deleteCancel}
              </button>
              <button
                className={pendingCategoryIsAll ? "primary-button" : "ghost-button"}
                disabled={isApplyingCategoryAction}
                type="button"
                onClick={() =>
                  void applyCategoryAction(
                    pendingCategoryAction.scope,
                    pendingCategoryAction.category,
                    "delete",
                    ""
                  )
                }
              >
                {pendingCategoryIsAll
                  ? categoryText.clearAllAction
                  : categoryText.deleteWithContentAction}
              </button>
              {pendingCategoryIsAll ? null : (
                <button
                  className="primary-button"
                  disabled={isApplyingCategoryAction}
                  type="button"
                  onClick={() =>
                    void applyCategoryAction(
                      pendingCategoryAction.scope,
                      pendingCategoryAction.category,
                      "migrate",
                      categoryActionTarget
                    )
                  }
                >
                  {categoryText.migrateAction}
                </button>
              )}
            </>
          }
        >
          <div className="admin-category-action-body">
            {pendingCategoryIsAll ? null : (
              <div className="admin-category-action-field">
                <div className="admin-category-action-copy">
                  <span className="admin-category-action-label">
                    {categoryText.migrateToLabel}
                  </span>
                  <small className="admin-category-action-help">
                    {categoryText.migrateHelp}
                  </small>
                </div>
                <AdminCategoryFilter
                  categories={getCategoryActionOptions(
                    pendingCategoryAction.scope,
                    pendingCategoryAction.category
                  )}
                  categoryText={categoryText}
                  className="admin-category-action-filter"
                  emptyLabel={categoryText.selectLabel}
                  onChange={setCategoryActionTarget}
                  t={t}
                  value={categoryActionTarget}
                />
              </div>
            )}
          </div>
        </Dialog>
      ) : null}

      {pendingFeaturedTool ? (
        <AdminConfirmDialog
          cancelLabel={t.status.deleteCancel}
          closeLabel={t.actions.close}
          confirmLabel={t.actions.confirm}
          descriptionId="toggle-featured-dialog-description"
          description={t.status.featuredConfirmDescription(!pendingFeaturedTool.featured)}
          title={t.status.featuredConfirmTitle(!pendingFeaturedTool.featured)}
          onCancel={() => setPendingFeaturedTool(null)}
          onConfirm={() => {
            const tool = pendingFeaturedTool;
            setPendingFeaturedTool(null);
            void handleToggleFeatured(tool);
          }}
        />
      ) : null}

      {pendingPublishedArticle ? (
        <AdminConfirmDialog
          cancelLabel={t.status.deleteCancel}
          closeLabel={t.actions.close}
          confirmLabel={t.actions.confirm}
          descriptionId="toggle-published-dialog-description"
          description={t.status.publishedConfirmDescription(!pendingPublishedArticle.published)}
          title={t.status.publishedConfirmTitle(!pendingPublishedArticle.published)}
          onCancel={() => setPendingPublishedArticle(null)}
          onConfirm={() => {
            const article = pendingPublishedArticle;
            setPendingPublishedArticle(null);
            void handleToggleArticlePublished(article);
          }}
        />
      ) : null}

      {pendingDeleteTool ? (
        <AdminConfirmDialog
          cancelLabel={t.status.deleteCancel}
          closeLabel={t.actions.close}
          confirmLabel={t.actions.confirm}
          descriptionId="delete-tool-dialog-description"
          description={t.status.deleteConfirmDescription}
          title={t.status.deleteConfirmTitle}
          disabled={isDeletingTool}
          onCancel={() => {
            if (!isDeletingTool) {
              setPendingDeleteTool(null);
            }
          }}
          onConfirm={() => void handleDelete(pendingDeleteTool)}
        />
      ) : null}

      {pendingPushTelegramRecord ? (
        <AdminConfirmDialog
          cancelLabel={t.status.deleteCancel}
          closeLabel={t.actions.close}
          confirmLabel={t.actions.confirm}
          descriptionId="push-telegram-record-dialog-description"
          description={telegramText.management.pushConfirmDescription}
          disabled={isPushingTelegramRecord}
          onCancel={() => {
            if (!isPushingTelegramRecord) setPendingPushTelegramRecord(null);
          }}
          onConfirm={() => void confirmPushTelegramRecord()}
          title={telegramText.management.pushConfirmTitle}
        />
      ) : null}

      {pendingDeleteTelegramPush ? (
        <AdminConfirmDialog
          cancelLabel={t.status.deleteCancel}
          closeLabel={t.actions.close}
          confirmLabel={t.actions.confirm}
          descriptionId="delete-telegram-push-dialog-description"
          description={telegramText.management.deleteDescription}
          disabled={isDeletingTelegramPush}
          onCancel={() => {
            if (!isDeletingTelegramPush) setPendingDeleteTelegramPush(null);
          }}
          onConfirm={() => void handleDeleteTelegramPush(pendingDeleteTelegramPush)}
          title={telegramText.management.deleteTitle}
        />
      ) : null}

      {pendingDeleteArticle ? (
        <AdminConfirmDialog
          cancelLabel={t.status.deleteCancel}
          closeLabel={t.actions.close}
          confirmLabel={t.actions.confirm}
          descriptionId="delete-article-dialog-description"
          description={articleText.deleteConfirmDescription}
          title={articleText.deleteConfirmTitle}
          disabled={isDeletingArticle}
          onCancel={() => {
            if (!isDeletingArticle) {
              setPendingDeleteArticle(null);
            }
          }}
          onConfirm={() => void handleDeleteArticle(pendingDeleteArticle)}
        />
      ) : null}

      {pendingDeleteContentSource ? (
        <AdminConfirmDialog
          cancelLabel={t.status.deleteCancel}
          closeLabel={t.actions.close}
          confirmLabel={t.actions.confirm}
          descriptionId="delete-content-source-dialog-description"
          description={contentText.deleteConfirmDescription}
          title={contentText.deleteConfirmTitle}
          disabled={isDeletingContentSource}
          onCancel={() => {
            if (!isDeletingContentSource) {
              setPendingDeleteContentSource(null);
            }
          }}
          onConfirm={() =>
            void handleDeleteContentSource(pendingDeleteContentSource)
          }
        />
      ) : null}
    </div>
  );
}

function AdminTelegramPushPanel({
  hasActiveFilter,
  hasMore,
  isLoading,
  isLoadingMore,
  loadError,
  onClearFilters,
  onCreate,
  onDelete,
  onEdit,
  onLoadMore,
  onOpenSettings,
  onPush,
  onPushedStatus,
  onRetry,
  onView,
  records,
  serviceEnabled,
  settingsLoading,
  showSkeletons,
  t,
  text,
}: {
  hasActiveFilter: boolean;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  loadError: string | null;
  onClearFilters: () => void;
  onCreate: () => void;
  onDelete: (record: TelegramPushRecord) => void;
  onEdit: (record: TelegramPushRecord) => void;
  onLoadMore: () => void;
  onOpenSettings: () => void;
  onPush: (record: TelegramPushRecord) => void;
  onPushedStatus: () => void;
  onRetry: () => void;
  onView: (record: TelegramPushRecord) => void;
  records: TelegramPushRecord[];
  serviceEnabled: boolean;
  settingsLoading: boolean;
  showSkeletons: boolean;
  t: Messages;
  text: ReturnType<typeof getTelegramText>["management"];
}) {
  const serviceUnavailable = !settingsLoading && !serviceEnabled;

  return (
    <>
      {serviceUnavailable && records.length > 0 ? (
        <p className="telegram-push-service-note">{text.serviceDisabled}</p>
      ) : null}

      {isLoading && records.length === 0 ? (
        <SkeletonVisibility visible={showSkeletons}>
          <AdminResourceCardSkeletonGrid ariaLabel={text.title} />
        </SkeletonVisibility>
      ) : loadError && records.length === 0 ? (
        <AdminInitialLoadError message={loadError} onRetry={onRetry} t={t} />
      ) : records.length ? (
        <>
          <section className="admin-tool-grid" aria-label={text.title}>
            {records.map((record) => (
              <TelegramPushRecordCard
                key={record.id}
                onDelete={() => onDelete(record)}
                onEdit={() => onEdit(record)}
                onPush={() => onPush(record)}
                onPushedStatus={onPushedStatus}
                onView={() => onView(record)}
                record={record}
                serviceEnabled={serviceEnabled}
                text={text}
              />
            ))}
          </section>
          {hasMore ? (
            <div className="content-flow-load-more">
              <button
                className="ghost-button"
                disabled={isLoadingMore}
                type="button"
                onClick={onLoadMore}
              >
                {text.loadMore}
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <AdminEmptyState
          action={
            serviceUnavailable
              ? { label: text.serviceDisabledAction, onClick: onOpenSettings }
              : hasActiveFilter
                ? {
                    label: t.actions.clearFilters,
                    onClick: onClearFilters,
                    tone: "ghost"
                  }
                : { label: text.addPush, onClick: onCreate }
          }
          description={
            serviceUnavailable
              ? text.serviceDisabledDescription
              : hasActiveFilter
                ? text.noMatchDescription
                : text.emptyDescription
          }
          title={
            serviceUnavailable
              ? text.serviceDisabledTitle
              : hasActiveFilter
                ? text.noMatchTitle
                : text.emptyTitle
          }
        />
      )}
    </>
  );
}

function TelegramPushRecordCard({
  onDelete,
  onEdit,
  onPush,
  onPushedStatus,
  onView,
  record,
  serviceEnabled,
  text
}: {
  onDelete: () => void;
  onEdit: () => void;
  onPush: () => void;
  onPushedStatus: () => void;
  onView: () => void;
  record: TelegramPushRecord;
  serviceEnabled: boolean;
  text: ReturnType<typeof getTelegramText>["management"];
}) {
  const actions = useAdminCardActionMenu(`telegram-push:${record.id}`);
  const pushed = record.syncStatus !== "not_pushed";
  const displayDate = formatAdminDate(record.sentAt || record.updatedAt);
  const summary = cleanArticleDisplayText(
    record.resource?.description || record.messageMarkdown
  );
  const tags = record.resource?.tags ?? [];

  return (
    <article className="admin-tool-card admin-article-card">
      <div className="admin-tool-card-head">
        <div className="admin-tool-title">
          <div className="admin-tool-title-row">
            <h2>{record.title}</h2>
          </div>
          <div className="admin-tool-title-meta">
            {displayDate ? <span>{displayDate}</span> : null}
            <span>
              {record.resourceType === "tool"
                ? text.typeTool
                : record.resourceType === "article"
                  ? text.typeArticle
                  : record.resourceType === "content"
                    ? text.typeContent
                    : text.typeCustom}
            </span>
            {!record.resourceExists ? <span>{text.resourceDeleted}</span> : null}
          </div>
        </div>
        <div className="admin-tool-card-actions" ref={actions.rootRef}>
          <button
            aria-label={pushed ? text.statusPushed : text.pushAction}
            aria-pressed={pushed}
            className={`icon-button admin-article-publish-button ${
              pushed ? "is-active" : ""
            }`}
            disabled={!pushed && !serviceEnabled}
            title={pushed ? text.statusPushed : text.pushAction}
            type="button"
            onClick={() => {
              actions.close();
              if (pushed) {
                onPushedStatus();
              } else {
                onPush();
              }
            }}
          >
            {pushed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
          </button>
          <button
            aria-expanded={actions.open}
            aria-haspopup="menu"
            aria-label={`${record.title} actions`}
            className={`icon-button admin-tool-menu-trigger ${
              actions.open ? "is-active" : ""
            }`}
            ref={actions.triggerRef}
            type="button"
            onClick={() => actions.setOpen((current) => !current)}
            onKeyDown={actions.handleTriggerKeyDown}
          >
            <ChevronDown size={17} />
          </button>
          {actions.open ? (
            <div
              className="admin-tool-action-menu"
              onKeyDown={actions.handleMenuKeyDown}
              role="menu"
            >
              {record.resourceExists ? (
                <button
                  disabled={!serviceEnabled}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    actions.close();
                    onEdit();
                  }}
                >
                  <SquarePen size={17} />
                  <span className="admin-action-label-full">{text.editAction}</span>
                  <span className="admin-action-label-short">{text.editActionShort}</span>
                </button>
              ) : null}
              <button
                className="danger"
                role="menuitem"
                type="button"
                onClick={() => {
                  actions.close();
                  onDelete();
                }}
              >
                <Trash2 size={16} />
                <span className="admin-action-label-full">{text.deleteAction}</span>
                <span className="admin-action-label-short">{text.deleteActionShort}</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <p className="admin-tool-description">{summary}</p>
      <div className="admin-tool-links">
        <div className="admin-tool-link-row" title={text.viewAction}>
          <button
            className="admin-tool-link-text telegram-push-view-link"
            type="button"
            onClick={onView}
          >
            {text.viewAction}
          </button>
        </div>
      </div>
      <div className="admin-tool-card-footer">
        <CompactTagRow tags={tags} />
      </div>
    </article>
  );
}

function AdminContentFlowPanel({
  clearFiltersLabel,
  contentSourceCounts,
  contentSourceFilter,
  contentSources,
  contentText,
  contentCategoryItemCount,
  hasActiveFilter,
  hasAnyContentSources,
  hasExistingContentItems,
  hasLoadedContent,
  hasMoreContent,
  isLoadingContent,
  isLoadingMoreContent,
  loadError,
  onAddSource,
  onConvertItem,
  onDeleteSource,
  onEditSource,
  onLoadMore,
  onRetry,
  onClearFilters,
  onSelectSource,
  onSyncSource,
  onTelegram,
  proxySettings,
  showSkeletons,
  t,
  telegramEnabled,
  telegramText,
  visibleContentItems,
  writeLockedEntityKeys
}: {
  clearFiltersLabel: string;
  contentSourceCounts: Record<string, number>;
  contentSourceFilter: string;
  contentSources: ContentSource[];
  contentText: ReturnType<typeof getContentFlowText>;
  contentCategoryItemCount: number;
  hasActiveFilter: boolean;
  hasAnyContentSources: boolean;
  hasExistingContentItems: boolean;
  hasLoadedContent: boolean;
  hasMoreContent: boolean;
  isLoadingContent: boolean;
  isLoadingMoreContent: boolean;
  loadError: string | null;
  onAddSource: () => void;
  onConvertItem: (item: ContentItemSummary) => void;
  onDeleteSource: (source: ContentSource) => void;
  onEditSource: (source: ContentSource) => void;
  onLoadMore: () => void;
  onRetry: () => void;
  onClearFilters: () => void;
  onSelectSource: (sourceId: string) => void;
  onSyncSource: (source: ContentSource) => void;
  onTelegram: (item: ContentItemSummary) => void;
  proxySettings: ProxySettings;
  showSkeletons: boolean;
  t: Messages;
  telegramEnabled: boolean;
  telegramText: ReturnType<typeof getTelegramText>;
  visibleContentItems: ContentItemSummary[];
  writeLockedEntityKeys: Set<string>;
}) {
  if (isLoadingContent && !hasLoadedContent) {
    return (
      <SkeletonVisibility visible={showSkeletons}>
        <ContentFlowSkeleton contentText={contentText} />
      </SkeletonVisibility>
    );
  }

  if (loadError && !hasExistingContentItems) {
    return <AdminInitialLoadError message={loadError} onRetry={onRetry} t={t} />;
  }

  return (
    <section className="content-flow-layout" aria-label={contentText.title}>
      <aside className="content-flow-rail">
        <div className="content-flow-section-head">
          <h2>{contentText.title}</h2>
          <p>{contentText.description}</p>
        </div>

        <div className="content-source-list">
          {contentSources.map((source) => (
            <ContentSourceButton
              contentText={contentText}
              count={contentSourceCounts[source.id] ?? 0}
              isBusy={writeLockedEntityKeys.has(
                getAdminWriteEntityKey("content-source", source.id)
              )}
              isSelected={contentSourceFilter === source.id}
              key={source.id}
              onDelete={() => onDeleteSource(source)}
              onEdit={() => onEditSource(source)}
              onSelect={() => onSelectSource(source.id)}
              onSync={() => onSyncSource(source)}
              source={source}
            />
          ))}
        </div>
      </aside>

      <div className="content-flow-main">
        {contentSources.length === 0 ? (
          <AdminEmptyState
            action={
              hasAnyContentSources
                ? {
                    label: clearFiltersLabel,
                    onClick: onClearFilters,
                    tone: "ghost"
                  }
                : { label: contentText.addContent, onClick: onAddSource }
            }
            className="content-flow-empty"
            description={
              hasAnyContentSources
                ? contentText.noMatchDescription
                : contentText.sourceEmptyDescription
            }
            title={
              hasAnyContentSources ? contentText.noMatchTitle : contentText.sourceEmptyTitle
            }
          />
        ) : (
          <>
            {visibleContentItems.length ? (
              <div className="content-item-list">
                {visibleContentItems.map((item) => (
                  <ContentItemCard
                    contentText={contentText}
                    isBusy={writeLockedEntityKeys.has(
                      getAdminWriteEntityKey("content-item", item.id)
                    )}
                    item={item}
                    key={item.id}
                    onConvert={() => onConvertItem(item)}
                    onTelegram={() => onTelegram(item)}
                    proxySettings={proxySettings}
                    telegramEnabled={telegramEnabled}
                    telegramText={telegramText}
                  />
                ))}
              </div>
            ) : (
              <AdminEmptyState
                action={
                  hasActiveFilter
                    ? {
                        label: clearFiltersLabel,
                        onClick: onClearFilters,
                        tone: "ghost"
                      }
                    : undefined
                }
                className="content-flow-empty"
                description={
                  !hasActiveFilter && contentCategoryItemCount === 0
                    ? contentText.itemEmptyDescription
                    : contentText.noMatchDescription
                }
                title={
                  !hasActiveFilter && contentCategoryItemCount === 0
                    ? contentText.itemEmptyTitle
                    : contentText.noMatchTitle
                }
              />
            )}
            {hasMoreContent ? (
              <div className="content-flow-load-more">
                <button
                  className="ghost-button"
                  disabled={isLoadingMoreContent}
                  type="button"
                  onClick={onLoadMore}
                >
                  {contentText.loadMore}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

function ContentSourceButton({
  contentText,
  count,
  isBusy,
  isSelected,
  onDelete,
  onEdit,
  onSelect,
  onSync,
  source
}: {
  contentText: ReturnType<typeof getContentFlowText>;
  count: number;
  isBusy: boolean;
  isSelected: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onSelect: () => void;
  onSync: () => void;
  source: ContentSource;
}) {
  return (
    <div className={`content-source-item ${isSelected ? "is-active" : ""}`}>
      <button className="content-source-main" type="button" onClick={onSelect}>
        <span className="content-source-copy">
          <strong>{source.title}</strong>
          <small>{contentText.sourceCount(count)}</small>
        </span>
      </button>
      <div className="content-source-actions">
        <button
          className="icon-button"
          disabled={isBusy}
          type="button"
          title={contentText.syncSource}
          onClick={onSync}
        >
          <RefreshCw size={15} />
        </button>
        <button
          className="icon-button"
          disabled={isBusy}
          type="button"
          title={contentText.editSource}
          onClick={onEdit}
        >
          <SquarePen size={15} />
        </button>
        <button
          className="icon-button"
          disabled={isBusy}
          type="button"
          title={contentText.deleteSource}
          onClick={onDelete}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

function ContentItemCard({
  contentText,
  isBusy,
  item,
  onConvert,
  onTelegram,
  proxySettings,
  telegramEnabled,
  telegramText
}: {
  contentText: ReturnType<typeof getContentFlowText>;
  isBusy: boolean;
  item: ContentItemSummary;
  onConvert: () => void;
  onTelegram: () => void;
  proxySettings: ProxySettings;
  telegramEnabled: boolean;
  telegramText: ReturnType<typeof getTelegramText>;
}) {
  const actions = useAdminCardActionMenu(`content-item:${item.id}`);
  const Icon = getCategoryIcon(item.category);
  const displayDate = formatAdminDate(item.published_at ?? item.updated_at);
  const displayTitle = getArticleDisplayTitle(item);
  const previewImage = getContentItemPreviewImage(item);
  const coverSrc = previewImage
    ? proxifyUrl(previewImage, proxySettings, { resourceType: "image" })
    : "";
  const originalHref = proxifyUrl(item.url, proxySettings);
  const browseHref = item.articleId && item.articleSlug
    ? createArticleBrowseHref(item.articleSlug, item.articlePublished)
    : createContentItemPreviewHref(item.id);
  const [coverFailed, setCoverFailed] = useState(false);
  const showCover = Boolean(coverSrc && !coverFailed);

  useEffect(() => {
    setCoverFailed(false);
  }, [coverSrc]);

  return (
    <article className={`content-item-card ${showCover ? "has-cover" : ""}`}>
      <div className="content-item-head">
        <div className="content-item-meta">
          <span>
            <Icon size={15} />
            {item.sourceTitle || item.category}
          </span>
          {displayDate ? <span>{displayDate}</span> : null}
        </div>
        <div className="admin-tool-card-actions" ref={actions.rootRef}>
          {telegramEnabled ? (
            <AdminTelegramPushButton
              disabled={isBusy}
              label={`${telegramText.action}: ${displayTitle}`}
              onClick={() => {
                actions.close();
                onTelegram();
              }}
            />
          ) : null}
          <button
            aria-label={`${item.articleId ? contentText.updateArticle : contentText.convert}: ${displayTitle}`}
            aria-pressed={Boolean(item.articleId)}
            className={`icon-button admin-article-publish-button ${
              item.articleId ? "is-active" : ""
            }`}
            disabled={isBusy}
            title={item.articleId ? contentText.updateArticle : contentText.convert}
            type="button"
            onClick={() => {
              actions.close();
              onConvert();
            }}
          >
            {item.articleId ? <CheckCircle2 size={16} /> : <Circle size={16} />}
          </button>
          <button
            aria-expanded={actions.open}
            aria-haspopup="menu"
            aria-label={`${displayTitle} actions`}
            className={`icon-button admin-tool-menu-trigger ${
              actions.open ? "is-active" : ""
            }`}
            disabled={isBusy}
            ref={actions.triggerRef}
            type="button"
            onClick={() => actions.setOpen((current) => !current)}
            onKeyDown={actions.handleTriggerKeyDown}
          >
            <ChevronDown size={17} />
          </button>
          {actions.open ? (
            <div
              className="admin-tool-action-menu"
              onKeyDown={actions.handleMenuKeyDown}
              role="menu"
            >
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  actions.close();
                  window.open(originalHref, "_blank", "noopener,noreferrer");
                }}
              >
                <ArrowUpRight size={16} />
                <span className="admin-action-label-full">
                  {contentText.openOriginal}
                </span>
                <span className="admin-action-label-short">
                  {contentText.openOriginalShort}
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <div className="content-item-main">
        <h3>{displayTitle}</h3>
        <p>{cleanArticleDisplayText(item.summary)}</p>
        <div className="admin-tool-links">
          <div className="admin-tool-link-row" title={browseHref}>
            <a
              className="admin-tool-link-text"
              href={browseHref}
              rel="noreferrer"
              target="_blank"
              aria-label={contentText.browseArticle}
            >
              {browseHref}
            </a>
          </div>
        </div>
        <CompactTagRow tags={item.tags} />
      </div>
      {showCover ? (
        <img
          className="content-item-cover"
          src={coverSrc}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setCoverFailed(true)}
        />
      ) : null}
    </article>
  );
}

type AdminCategoryText = ReturnType<typeof getAdminWorkspaceText>["category"];

function getAdminCategoryDeleteLabel(
  categoryText: AdminCategoryText,
  t: Messages,
  category: string
) {
  if (isAllCategoryValue(category)) {
    return categoryText.clearAllAction;
  }

  const label = getCategoryLabel(category, t);
  return categoryText.deleteLabel(label);
}

function getAdminCategoryMoveLabel(
  categoryText: AdminCategoryText,
  t: Messages,
  category: string
) {
  const label = getCategoryLabel(category, t);
  return categoryText.moveLabel(label);
}

function getAdminCategoryDeletedText(
  categoryText: AdminCategoryText,
  t: Messages,
  category: string,
  scope: AdminCategoryScope
) {
  if (isAllCategoryValue(category)) {
    return categoryText.cleared(categoryText.scopeLabel(scope));
  }

  if (scope === "tools" && isFeaturedCategoryValue(category)) {
    return categoryText.featuredCleared;
  }

  const label = getCategoryLabel(category, t);
  return categoryText.removed(label, categoryText.scopeLabel(scope));
}

function getAdminCategoryMigratedText(
  categoryText: AdminCategoryText,
  t: Messages,
  category: string,
  targetCategory: string,
  affected: number
) {
  const label = getCategoryLabel(category, t);
  const targetLabel = getCategoryLabel(targetCategory, t);
  return categoryText.migrated(label, targetLabel, affected);
}

function AdminCategoryFilter({
  allowCreate = true,
  alignToTopOnOpen = false,
  allLabel,
  categories,
  categoryText,
  className = "",
  disabled = false,
  emptyLabel,
  fixedCategories = [],
  labelFor,
  onChange,
  onDeleteCategory,
  onMoveCategory,
  t,
  value
}: {
  allowCreate?: boolean;
  alignToTopOnOpen?: boolean;
  allLabel?: string;
  categories: string[];
  categoryText: AdminCategoryText;
  className?: string;
  disabled?: boolean;
  emptyLabel?: string;
  fixedCategories?: string[];
  labelFor?: (category: string) => string;
  onChange: (category: string) => void;
  onDeleteCategory?: (category: string) => void;
  onMoveCategory?: (category: string) => void;
  t: Messages;
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const focusTargetRef = useRef<"first" | "last" | null>(null);
  const directTouchFocusUntilRef = useRef(0);
  const emptyText = categoryText.empty;
  const normalizedFixedCategories = useMemo(
    () => new Set(fixedCategories.map(normalizeAdminCategoryValue)),
    [fixedCategories]
  );
  const resolveLabel = useCallback(
    (category: string) => labelFor?.(category) ?? getCategoryLabel(category, t),
    [labelFor, t]
  );
  const normalizedValue = normalizeAdminCategoryValue(value);
  const selectedLabel = normalizedValue
    ? isAllCategoryValue(normalizedValue) && allLabel
      ? allLabel
      : resolveLabel(normalizedValue)
    : (emptyLabel ?? getCategoryLabel("All", t));
  const displaySelectedLabel = getAdminCategoryDisplayLabel(selectedLabel);
  const createCategoryName = query.trim();
  const isFilteringCategories = Boolean(query.trim());
  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const uniqueCategories = Array.from(
      new Set(categories.map(normalizeAdminCategoryValue))
    );

    if (!normalizedQuery) {
      return uniqueCategories;
    }

    return uniqueCategories.filter((category) => {
      const label = resolveLabel(category);

      return `${category} ${label}`.toLowerCase().includes(normalizedQuery);
    });
  }, [categories, query, resolveLabel]);
  const canCreateCategory = useMemo(() => {
    const normalizedName = createCategoryName.toLowerCase();

    if (
      !allowCreate ||
      !normalizedName ||
      isAllCategoryValue(createCategoryName) ||
      isFeaturedCategoryValue(createCategoryName)
    ) {
      return false;
    }

    return !categories.some((category) => {
      const label = resolveLabel(category).toLowerCase();

      return (
        normalizeAdminCategoryValue(category).toLowerCase() === normalizedName ||
        label === normalizedName
      );
    });
  }, [allowCreate, categories, createCategoryName, resolveLabel]);
  const categoryWidthChars = useMemo(() => {
    const widthLabel = allLabel ?? emptyLabel ?? categoryText.selectLabel;
    return Math.max(
      getAdminCategoryLabelWidth(categoryText.topLabel),
      getAdminCategoryLabelWidth(widthLabel)
    );
  }, [allLabel, categoryText.selectLabel, categoryText.topLabel, emptyLabel]);
  const categoryFilterStyle = {
    "--admin-category-filter-text-width": `${categoryWidthChars}em`
  } as CSSProperties;

  function getCategoryOptionButtons() {
    return Array.from(
      rootRef.current?.querySelectorAll<HTMLButtonElement>(
        '[data-admin-category-option="true"]:not(:disabled)'
      ) ?? []
    );
  }

  function closeCategoryFilter(restoreFocus = false) {
    setOpen(false);

    if (restoreFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }

  function focusCategoryOption(target: "first" | "last") {
    const options = getCategoryOptionButtons();
    options[target === "first" ? 0 : options.length - 1]?.focus();
  }

  function handleCategoryOptionKeyDown(
    event: ReactKeyboardEvent<HTMLDivElement>
  ) {
    if (!open) {
      return;
    }

    const options = getCategoryOptionButtons();
    const currentIndex = options.indexOf(
      document.activeElement as HTMLButtonElement
    );

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeCategoryFilter(true);
      return;
    }

    if (event.key === "Tab") {
      window.setTimeout(() => {
        if (!rootRef.current?.contains(document.activeElement)) {
          closeCategoryFilter();
        }
      }, 0);
      return;
    }

    let nextIndex = -1;

    if (event.key === "ArrowDown") {
      nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % options.length;
    } else if (event.key === "ArrowUp") {
      nextIndex =
        currentIndex < 0
          ? options.length - 1
          : (currentIndex - 1 + options.length) % options.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = options.length - 1;
    }

    if (nextIndex >= 0) {
      event.preventDefault();
      options[nextIndex]?.focus();
    }
  }

  function selectCategory(category: string, restoreFocus = true) {
    if (disabled) return;
    onChange(normalizeAdminCategoryValue(category));
    closeCategoryFilter(restoreFocus);
  }

  function scrollFilterToDialogTop(behavior: ScrollBehavior = "smooth") {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    const target = root.closest(".tool-form-field") ?? root;
    const scrollContainer = root.closest(".dialog-body") as HTMLElement | null;

    if (!scrollContainer) {
      target.scrollIntoView({
        behavior,
        block: "start"
      });
      return;
    }

    const containerRect = scrollContainer.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const nextTop = scrollContainer.scrollTop + targetRect.top - containerRect.top;

    scrollContainer.scrollTo({
      behavior,
      top: Math.max(0, nextTop)
    });
  }

  useOutsideInteractionDismiss({
    active: open,
    isInside: (event) => isEventInsideElement(event, rootRef.current),
    onDismiss: () => closeCategoryFilter()
  });

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeCategoryFilter(true);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    const hasDirectTouchFocus =
      directTouchFocusUntilRef.current > performance.now();

    if (alignToTopOnOpen && !hasDirectTouchFocus) {
      window.requestAnimationFrame(() => scrollFilterToDialogTop());
      window.setTimeout(() => scrollFilterToDialogTop(), 80);
      window.setTimeout(() => scrollFilterToDialogTop(), 180);
    }

    if (hasDirectTouchFocus) {
      const directFocusTimer = window.setTimeout(() => {
        scrollFilterToDialogTop("auto");
        searchRef.current?.focus({ preventScroll: true });
      }, 120);
      return () => window.clearTimeout(directFocusTimer);
    }

    const focusTimer = window.setTimeout(() => {
      if (focusTargetRef.current) {
        focusCategoryOption(focusTargetRef.current);
        focusTargetRef.current = null;
        return;
      }

      searchRef.current?.focus({ preventScroll: true });
    }, alignToTopOnOpen ? 220 : 0);

    return () => window.clearTimeout(focusTimer);
  }, [alignToTopOnOpen, open]);

  return (
    <div
      className={`admin-category-filter ${className} ${open ? "is-open" : ""}`}
      ref={rootRef}
      style={categoryFilterStyle}
      onKeyDown={handleCategoryOptionKeyDown}
    >
      {open ? (
        <div
          className="admin-category-filter-trigger is-searching"
          role="combobox"
          aria-expanded="true"
          aria-haspopup="listbox"
        >
          <Tags size={16} />
          <span className="admin-category-filter-search">
            <input
              ref={searchRef}
              aria-label={categoryText.inputPlaceholder}
              placeholder={categoryText.inputPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  event.stopPropagation();
                  focusCategoryOption(
                    event.key === "ArrowDown" ? "first" : "last"
                  );
                  return;
                }

                if (event.key === "Enter" && canCreateCategory) {
                  event.preventDefault();
                  event.stopPropagation();
                  selectCategory(createCategoryName, true);
                }
              }}
            />
          </span>
          <button
            className="admin-category-filter-arrow"
            type="button"
            aria-label={t.actions.close}
            onClick={(event) => closeCategoryFilter(event.detail === 0)}
          >
            <ChevronDown size={15} />
          </button>
        </div>
      ) : (
        <button
          ref={triggerRef}
          className="admin-category-filter-trigger"
          disabled={disabled}
          type="button"
          aria-expanded="false"
          aria-haspopup="listbox"
          onPointerDown={(event) => {
            if (
              disabled ||
              !alignToTopOnOpen ||
              event.pointerType !== "touch"
            ) {
              return;
            }

            event.preventDefault();
            directTouchFocusUntilRef.current = performance.now() + 400;
            flushSync(() => setOpen(true));
          }}
          onClick={() => {
            if (!disabled) setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              focusTargetRef.current =
                event.key === "ArrowDown" ? "first" : "last";
              setOpen(true);
            }
          }}
        >
          <Tags size={16} />
          <span className="admin-category-filter-value" title={selectedLabel}>
            {displaySelectedLabel}
          </span>
          <span className="admin-category-filter-arrow admin-category-filter-arrow-indicator">
            <ChevronDown size={15} />
          </span>
        </button>
      )}

      {open ? (
        <div className="admin-category-filter-popover" role="listbox">
          {canCreateCategory ? (
            <button
              className="admin-category-create-option"
              type="button"
              role="option"
              aria-selected="false"
              data-admin-category-option="true"
              onClick={(event) =>
                selectCategory(createCategoryName, event.detail === 0)
              }
            >
              <Plus size={15} />
              <span>{categoryText.createLabel(createCategoryName)}</span>
            </button>
          ) : null}
          {filteredCategories.length > 0 || !canCreateCategory ? (
            <div className="admin-category-filter-list">
              {filteredCategories.length > 0 ? (
              <>
                {filteredCategories.map((category) => {
                  const selected = category === normalizedValue;
                  const fixed = normalizedFixedCategories.has(category);
                  const canDelete = Boolean(onDeleteCategory) && !fixed;
                  const categoryLabel = resolveLabel(category);
                  const displayCategoryLabel =
                    getAdminCategoryDisplayLabel(categoryLabel);
                  const movableCategories = filteredCategories.filter(
                    isPersistableAdminCategory
                  );
                  const canMove =
                    Boolean(onMoveCategory) &&
                    !fixed &&
                    !isFilteringCategories &&
                    isPersistableAdminCategory(category) &&
                    movableCategories.length > 1;

                  return (
                    <div className="admin-category-filter-option" key={category}>
                      <button
                        className={`admin-category-select-option ${
                          selected ? "is-selected" : ""
                        }`}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        data-admin-category-option="true"
                        onClick={(event) =>
                          selectCategory(category, event.detail === 0)
                        }
                      >
                        <span title={categoryLabel}>{displayCategoryLabel}</span>
                      </button>
                      {canMove || canDelete ? (
                        <div className="admin-category-option-actions">
                          {canMove ? (
                            <button
                              className="admin-category-option-action admin-category-move-option"
                              type="button"
                              aria-label={getAdminCategoryMoveLabel(categoryText, t, category)}
                              title={getAdminCategoryMoveLabel(categoryText, t, category)}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                onMoveCategory?.(category);
                              }}
                            >
                              <ArrowUp size={14} />
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button
                              className="admin-category-option-action admin-category-delete-option"
                              type="button"
                              aria-label={getAdminCategoryDeleteLabel(categoryText, t, category)}
                              title={getAdminCategoryDeleteLabel(categoryText, t, category)}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                setOpen(false);
                                onDeleteCategory?.(category);
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="admin-category-filter-empty">
                {emptyText}
              </div>
            )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const ADMIN_CARD_MENU_OPEN_EVENT = "htools:admin-card-menu-open";

function useAdminCardActionMenu(menuKey: string) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const focusTargetRef = useRef<"first" | "last" | null>(null);

  useEffect(() => {
    function handleOtherMenu(event: Event) {
      if ((event as CustomEvent<string>).detail !== menuKey) setOpen(false);
    }
    window.addEventListener(ADMIN_CARD_MENU_OPEN_EVENT, handleOtherMenu);
    return () => window.removeEventListener(ADMIN_CARD_MENU_OPEN_EVENT, handleOtherMenu);
  }, [menuKey]);

  useOutsideInteractionDismiss({
    active: open,
    isInside: (event) => isEventInsideElement(event, rootRef.current),
    onDismiss: () => setOpen(false)
  });

  useEffect(() => {
    if (!open) return;
    window.dispatchEvent(new CustomEvent(ADMIN_CARD_MENU_OPEN_EVENT, { detail: menuKey }));
    const items = rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
    if (focusTargetRef.current && items?.length) {
      items[focusTargetRef.current === "first" ? 0 : items.length - 1].focus();
      focusTargetRef.current = null;
    }
    function closeOnScroll() { setOpen(false); }
    window.addEventListener("scroll", closeOnScroll, true);
    return () => {
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [menuKey, open]);

  function close(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      focusTargetRef.current = event.key === "ArrowDown" ? "first" : "last";
      setOpen(true);
    }
  }

  function handleMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(true); return; }
    if (event.key === "Tab") { setOpen(false); return; }
    let next = -1;
    if (event.key === "ArrowDown") next = (index + 1) % items.length;
    if (event.key === "ArrowUp") next = (index - 1 + items.length) % items.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = items.length - 1;
    if (next >= 0) { event.preventDefault(); items[next]?.focus(); }
  }

  return { close, handleMenuKeyDown, handleTriggerKeyDown, open, rootRef, setOpen, triggerRef };
}

function AdminToolCard({
  isBusy,
  onDelete,
  onEdit,
  onTelegram,
  onToggleFeatured,
  proxySettings,
  t,
  telegramEnabled,
  telegramText,
  tool
}: {
  isBusy: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onTelegram: () => void;
  onToggleFeatured: () => void;
  proxySettings: ProxySettings;
  t: Messages;
  telegramEnabled: boolean;
  telegramText: ReturnType<typeof getTelegramText>;
  tool: Tool;
}) {
  const displayDate = formatAdminDate(tool.created_at ?? tool.updated_at);
  const actions = useAdminCardActionMenu(`tool:${tool.id}`);
  const isGitHubTool = isGitHubUrl(tool.url);
  const toolHref = proxifyUrl(tool.url, proxySettings);

  return (
    <article className="admin-tool-card">
      <div className="admin-tool-card-head">
        <span className={`admin-tool-avatar ${isGitHubTool ? "is-github" : ""}`}>
          {isGitHubTool ? (
            <Github size={25} strokeWidth={2.1} fill="currentColor" />
          ) : (
            <>
              <span>{getToolInitials(tool.name)}</span>
              <img
                src={proxifyUrl(createAdminIconFromUrl(tool.url), proxySettings, {
                  resourceType: "image"
                })}
                alt=""
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </>
          )}
        </span>
        <div className="admin-tool-title">
          <div className="admin-tool-title-row">
            <h2>{tool.name}</h2>
          </div>
          <div className="admin-tool-title-meta">
            {displayDate ? (
              <span>
                {displayDate}
              </span>
            ) : null}
          </div>
        </div>
        <div className="admin-tool-card-actions" ref={actions.rootRef}>
          {telegramEnabled ? (
            <AdminTelegramPushButton
              disabled={isBusy}
              label={`${telegramText.action}: ${tool.name}`}
              onClick={() => {
                actions.close();
                onTelegram();
              }}
            />
          ) : null}
          <button
            className={`icon-button admin-featured-badge ${
              tool.featured ? "is-active" : ""
            }`}
            type="button"
            aria-label={t.form.featuredTool}
            aria-pressed={tool.featured}
            disabled={isBusy}
            onClick={() => {
              actions.close();
              onToggleFeatured();
            }}
          >
            <Star size={16} fill={tool.featured ? "currentColor" : "none"} />
          </button>
          <button
            className={`icon-button admin-tool-menu-trigger ${
              actions.open ? "is-active" : ""
            }`}
            type="button"
            aria-expanded={actions.open}
            aria-haspopup="menu"
            aria-label={`${tool.name} actions`}
            disabled={isBusy}
            ref={actions.triggerRef}
            onKeyDown={actions.handleTriggerKeyDown}
            onClick={() => actions.setOpen((current) => !current)}
          >
            <ChevronDown size={17} />
          </button>
          {actions.open ? (
            <div className="admin-tool-action-menu" role="menu" onKeyDown={actions.handleMenuKeyDown}>
              <button
                disabled={isBusy}
                type="button"
                role="menuitem"
                onClick={() => {
                  actions.close();
                  onEdit();
                }}
              >
                <SquarePen size={18} />
                <span className="admin-action-label-full">{t.admin.editTool}</span>
                <span className="admin-action-label-short">
                  {t.admin.editAction}
                </span>
              </button>
              <button
                className="danger"
                disabled={isBusy}
                type="button"
                role="menuitem"
                onClick={() => {
                  actions.close();
                  onDelete();
                }}
              >
                <Trash2 size={16} />
                <span className="admin-action-label-full">{t.admin.deleteTool}</span>
                <span className="admin-action-label-short">
                  {t.admin.deleteAction}
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <p className="admin-tool-description">{tool.description}</p>

      <div className="admin-tool-links">
        <div className="admin-tool-link-row" title={tool.url}>
          <a
            className="admin-tool-link-text"
            href={toolHref}
            rel="noreferrer"
            target="_blank"
            aria-label={`${t.actions.visit}: ${tool.name}`}
          >
            {tool.url}
          </a>
        </div>
      </div>

      <div className="admin-tool-card-footer">
        <CompactTagRow tags={tool.tags} />
      </div>
    </article>
  );
}

function AdminArticleCard({
  article,
  articleText,
  isBusy,
  onDelete,
  onEdit,
  onTelegram,
  onTogglePublished,
  telegramEnabled,
  telegramText
}: {
  article: ArticleSummary;
  articleText: ReturnType<typeof getArticleText>;
  isBusy: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onTelegram: () => void;
  onTogglePublished: () => void;
  telegramEnabled: boolean;
  telegramText: ReturnType<typeof getTelegramText>;
}) {
  const actions = useAdminCardActionMenu(`article:${article.id}`);
  const displayDate = formatAdminDate(
    article.published_at ?? article.updated_at ?? article.created_at
  );
  const displayTitle = getArticleDisplayTitle(article);
  const articleHref = createArticleBrowseHref(article.slug, article.published);

  return (
    <article className="admin-tool-card admin-article-card">
      <div className="admin-tool-card-head">
        <div className="admin-tool-title">
          <div className="admin-tool-title-row">
            <h2>{displayTitle}</h2>
          </div>
          <div className="admin-tool-title-meta">
            {displayDate ? <span>{displayDate}</span> : null}
            <span>
              {article.published
                ? articleText.statusPublished
                : articleText.statusDraft}
            </span>
          </div>
        </div>
        <div className="admin-tool-card-actions" ref={actions.rootRef}>
          {telegramEnabled ? (
            <AdminTelegramPushButton
              disabled={isBusy}
              label={`${telegramText.action}: ${displayTitle}`}
              onClick={() => {
                actions.close();
                onTelegram();
              }}
            />
          ) : null}
          <button
            className={`icon-button admin-article-publish-button ${
              article.published ? "is-active" : ""
            }`}
            type="button"
            aria-label={
              article.published
                ? articleText.statusPublished
                : articleText.publishedLabel
            }
            aria-pressed={article.published}
            disabled={isBusy}
            onClick={() => {
              actions.close();
              onTogglePublished();
            }}
          >
            {article.published ? (
              <CheckCircle2 size={16} />
            ) : (
              <Circle size={16} />
            )}
          </button>
          <button
            className={`icon-button admin-tool-menu-trigger ${
              actions.open ? "is-active" : ""
            }`}
            type="button"
            aria-expanded={actions.open}
            aria-haspopup="menu"
            aria-label={`${displayTitle} actions`}
            disabled={isBusy}
            ref={actions.triggerRef}
            onKeyDown={actions.handleTriggerKeyDown}
            onClick={() => actions.setOpen((current) => !current)}
          >
            <ChevronDown size={17} />
          </button>
          {actions.open ? (
            <div className="admin-tool-action-menu" role="menu" onKeyDown={actions.handleMenuKeyDown}>
              <button
                disabled={isBusy}
                type="button"
                role="menuitem"
                onClick={() => {
                  actions.close();
                  onEdit();
                }}
              >
                <SquarePen size={18} />
                <span className="admin-action-label-full">
                  {articleText.editArticle}
                </span>
                <span className="admin-action-label-short">
                  {articleText.editAction}
                </span>
              </button>
              <button
                className="danger"
                disabled={isBusy}
                type="button"
                role="menuitem"
                onClick={() => {
                  actions.close();
                  onDelete();
                }}
              >
                <Trash2 size={16} />
                <span className="admin-action-label-full">
                  {articleText.deleteArticle}
                </span>
                <span className="admin-action-label-short">
                  {articleText.deleteAction}
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <p className="admin-tool-description">{cleanArticleDisplayText(article.summary)}</p>

      <div className="admin-tool-links">
        <div className="admin-tool-link-row" title={articleHref}>
          <a
            className="admin-tool-link-text"
            href={articleHref}
            rel="noreferrer"
            target="_blank"
            aria-label={articleHref}
          >
            {articleHref}
          </a>
        </div>
      </div>

      <div className="admin-tool-card-footer">
        <CompactTagRow
          tags={Array.from(new Set([article.category, ...article.tags].filter(Boolean)))}
        />
      </div>
    </article>
  );
}

function AdminTelegramPushButton({
  disabled,
  label,
  onClick
}: {
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="icon-button admin-telegram-button"
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Send size={15} />
    </button>
  );
}

function AdminResourceCardSkeletonGrid({ ariaLabel }: { ariaLabel: string }) {
  return (
    <section className="admin-tool-grid" aria-label={ariaLabel}>
      {Array.from({ length: 8 }).map((_, index) => (
        <AdminResourceCardSkeleton key={index} />
      ))}
    </section>
  );
}

function AdminResourceCardSkeleton() {
  return (
    <article
      aria-hidden="true"
      className="admin-tool-card admin-resource-card-skeleton skeleton-layout-mask"
    >
      <div className="admin-tool-card-head">
        <span className="admin-tool-avatar is-github"><Github size={25} /></span>
        <div className="admin-tool-title">
          <div className="admin-tool-title-row">
            <h2>Resource title placeholder</h2>
          </div>
          <div className="admin-tool-title-meta">
            <span>2026-08-04</span>
          </div>
        </div>
        <div className="admin-tool-card-actions">
          <button className="icon-button" disabled type="button"><Send size={15} /></button>
          <button className="icon-button" disabled type="button"><Star size={16} /></button>
          <button className="icon-button" disabled type="button"><ChevronDown size={17} /></button>
        </div>
      </div>
      <p className="admin-tool-description">Resource description placeholder follows the shared card structure.</p>
      <div className="admin-tool-links">
        <div className="admin-tool-link-row">
          <span className="admin-tool-link-text">https://example.com/resource</span>
        </div>
      </div>
      <div className="admin-tool-card-footer">
        <CompactTagRow tags={["Resource", "Category", "Tag"]} />
      </div>
    </article>
  );
}

function ContentFlowSkeleton({
  contentText
}: {
  contentText: ReturnType<typeof getContentFlowText>;
}) {
  return (
    <section
      className="content-flow-layout content-flow-skeleton skeleton-layout-mask"
      aria-hidden="true"
    >
      <aside className="content-flow-rail">
        <div className="content-flow-section-head">
          <h2>{contentText.title}</h2>
          <p>{contentText.description}</p>
        </div>

        <div className="content-source-list">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="content-source-item" key={index}>
              <button className="content-source-main" disabled type="button">
                <span className="content-source-icon"><Rss size={16} /></span>
                <span className="content-source-copy">
                  <strong>Content source</strong>
                  <small>{contentText.sourceCount(0)}</small>
                </span>
              </button>
              <div className="content-source-actions">
                <button className="icon-button" disabled type="button"><RefreshCw size={15} /></button>
                <button className="icon-button" disabled type="button"><SquarePen size={15} /></button>
                <button className="icon-button" disabled type="button"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="content-flow-main">
        <div className="content-item-list">
          {Array.from({ length: 4 }).map((_, index) => (
            <article className="content-item-card has-cover" key={index}>
              <div className="content-item-head">
                <div className="content-item-meta">
                  <span><Rss size={15} />Content source</span>
                  <span>2026-07-18</span>
                </div>
                <div className="admin-tool-card-actions">
                  <button className="icon-button" disabled type="button">
                    <Send size={15} />
                  </button>
                  <button className="icon-button" disabled type="button">
                    <Circle size={16} />
                  </button>
                  <button className="icon-button" disabled type="button">
                    <ChevronDown size={17} />
                  </button>
                </div>
              </div>
              <div className="content-item-main">
                <h3>Content item title placeholder</h3>
                <p>Content item summary follows the final responsive card structure.</p>
                <div className="admin-tool-links">
                  <div className="admin-tool-link-row">
                    <a className="admin-tool-link-text" href="#">
                      /articles/content-preview?contentItem=content-item
                    </a>
                  </div>
                </div>
                <CompactTagRow tags={["Content", "RSS", "Article"]} />
              </div>
              <span className="content-item-cover content-item-cover-skeleton" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AdminSettingsHeadingSkeleton({
  className = "",
  withStatus = false
}: {
  className?: string;
  withStatus?: boolean;
}) {
  return (
    <div
      className={`admin-settings-heading-skeleton ${className} ${
        withStatus ? "has-status" : ""
      }`.trim()}
    >
      <span className="skeleton-shimmer skeleton-line is-medium" />
      {withStatus ? (
        <span className="skeleton-shimmer settings-status-switch-skeleton" />
      ) : null}
      <span className="skeleton-shimmer skeleton-line is-long" />
    </div>
  );
}

function AdminSettingsFieldSkeleton({
  className = "",
  textareaClassName = ""
}: {
  className?: string;
  textareaClassName?: string;
}) {
  const isTextarea = Boolean(textareaClassName);

  return (
    <div className={`admin-settings-field-skeleton ${className}`.trim()}>
      <span className="skeleton-shimmer skeleton-line is-short" />
      <span
        className={`skeleton-shimmer ${
          isTextarea ? textareaClassName : "admin-settings-input-skeleton"
        }`.trim()}
      />
    </div>
  );
}

function AdminSettingsActionsSkeleton({
  className = "source-public-actions",
  count = 2
}: {
  className?: string;
  count?: number;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <span
          className={`skeleton-shimmer admin-settings-button-skeleton ${
            index > 0 ? "is-secondary" : ""
          }`.trim()}
          key={index}
        />
      ))}
    </div>
  );
}

function AdminStatsSkeleton({
  className,
  labels
}: {
  className: string;
  labels: string[];
}) {
  return (
    <div className={className}>
      {labels.map((label) => (
        <div key={label}>
          <span className="skeleton-shimmer admin-stat-label-skeleton">{label}</span>
          <span className="skeleton-shimmer admin-stat-value-skeleton" />
        </div>
      ))}
    </div>
  );
}

function SettingsStatusBadge({
  ariaDescribedBy,
  disabled = false,
  disabledLabel,
  enabled,
  enabledLabel,
  onChange
}: {
  ariaDescribedBy?: string;
  disabled?: boolean;
  disabledLabel: string;
  enabled: boolean;
  enabledLabel: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      aria-checked={enabled}
      aria-describedby={ariaDescribedBy}
      aria-label={enabled ? enabledLabel : disabledLabel}
      aria-live="polite"
      className={`settings-status-switch ${disabled ? "is-disabled" : ""}`.trim()}
      data-state={enabled ? "enabled" : "disabled"}
      disabled={disabled}
      role="switch"
      type="button"
      onClick={() => onChange(!enabled)}
    >
      <span className="settings-status-switch-label">
        {enabled ? enabledLabel : disabledLabel}
      </span>
      <span aria-hidden="true" className="settings-status-switch-track">
        <span className="settings-status-switch-thumb" />
      </span>
    </button>
  );
}

function AdminSettingsTextMask({ children }: { children: ReactNode }) {
  return (
    <span className="skeleton-shimmer admin-settings-text-mask">
      {children}
    </span>
  );
}

function AdminSettingsCopySkeleton({
  className = "",
  description,
  title,
  withStatus = false,
  wrapTitle = false
}: {
  className?: string;
  description: string;
  title: string;
  withStatus?: boolean;
  wrapTitle?: boolean;
}) {
  const titleNode = (
    <h3><AdminSettingsTextMask>{title}</AdminSettingsTextMask></h3>
  );

  return (
    <div
      className={`admin-settings-copy-skeleton ${className} ${
        withStatus ? "has-status" : ""
      }`.trim()}
    >
      {wrapTitle ? <div>{titleNode}</div> : titleNode}
      {withStatus ? (
        <span className="skeleton-shimmer settings-status-switch-skeleton" />
      ) : null}
      <p><AdminSettingsTextMask>{description}</AdminSettingsTextMask></p>
    </div>
  );
}

function GitHubSettingsForm({
  maintenanceText,
  onDirtyChange,
  onStatus,
  token,
  t
}: {
  maintenanceText: ReturnType<typeof getAdminMaintenanceText>;
  onDirtyChange: (dirty: boolean) => void;
  onStatus: (message: string) => void;
  token: string;
  t: Messages;
}) {
  const [settings, setSettings] = useState<GitHubSettings | null>(null);
  const [form, setForm] = useState<GitHubSettingsInput>({
    enabled: false,
    owner: "",
    repo: "",
    labels: ["tool-submission"]
  });
  const [isSaving, setIsSaving] = useState(false);
  const writeInProgressRef = useRef(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [settingsError, setSettingsError] = useState("");
  const [settingsReloadKey, setSettingsReloadKey] = useState(0);
  const settingsLoadRequestRef = useRef(0);
  const settingsLoadAbortRef = useRef<AbortController | null>(null);
  const showSettingsSkeleton = useLoadingSkeleton(isLoadingSettings, 0);
  const isDirty = Boolean(settings) && (
    form.owner !== settings?.owner ||
    form.repo !== settings?.repo ||
    JSON.stringify(form.labels) !== JSON.stringify(settings?.labels)
  );
  const hasSavedSubmissionConfig = Boolean(
    settings?.owner.trim() && settings.repo.trim()
  );
  const isDirtyRef = useRef(isDirty);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(
    () => () => {
      onDirtyChange(false);
    },
    [onDirtyChange]
  );

  useEffect(() => {
    const requestId = ++settingsLoadRequestRef.current;
    settingsLoadAbortRef.current?.abort();
    const controller = new AbortController();
    settingsLoadAbortRef.current = controller;

    async function loadSettings() {
      setIsLoadingSettings(true);
      setSettingsError("");

      try {
        const loaded = await loadGitHubSettings(token, {
          signal: controller.signal
        });

        if (settingsLoadRequestRef.current !== requestId) return;
        setSettings(loaded);

        if (!isDirtyRef.current) {
          setForm({
            enabled: loaded.enabled,
            owner: loaded.owner,
            repo: loaded.repo,
            labels: loaded.labels
          });
        }
      } catch (error) {
        if (
          settingsLoadRequestRef.current === requestId &&
          !controller.signal.aborted
        ) {
          setSettingsError(getLocalizedErrorMessage(error, t));
        }
      } finally {
        if (settingsLoadRequestRef.current === requestId) {
          setIsLoadingSettings(false);
          if (settingsLoadAbortRef.current === controller) {
            settingsLoadAbortRef.current = null;
          }
        }
      }
    }

    void loadSettings();

    return () => {
      controller.abort();
      if (settingsLoadRequestRef.current === requestId) {
        settingsLoadRequestRef.current += 1;
      }
    };
  }, [settingsReloadKey, t, token]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (writeInProgressRef.current) return;
    writeInProgressRef.current = true;
    setIsSaving(true);
    onStatus("");

    try {
      if (
        form.enabled &&
        (!form.owner.trim() || !form.repo.trim())
      ) {
        onStatus(
          getLocalizedErrorMessage(
            new Error(
              "owner and repo are required when GitHub submissions are enabled."
            ),
            t
          )
        );
        return;
      }

      const saved = await saveGitHubSettings(form, token);
      setSettings(saved);
      setForm({
        enabled: saved.enabled,
        owner: saved.owner,
        repo: saved.repo,
        labels: saved.labels
      });
      onStatus(t.githubSettings.saved);
    } catch (error) {
      onStatus(getLocalizedErrorMessage(error, t));
    } finally {
      writeInProgressRef.current = false;
      setIsSaving(false);
    }
  }

  async function toggleEnabled() {
    if (!settings || writeInProgressRef.current) return;
    writeInProgressRef.current = true;
    setIsSaving(true);
    onStatus(String());

    try {
      const saved = await saveGitHubSettings({
        enabled: !settings.enabled,
        owner: settings.owner,
        repo: settings.repo,
        labels: settings.labels
      }, token);
      setSettings(saved);
      setForm((current) => ({ ...current, enabled: saved.enabled }));
      onStatus(saved.enabled
        ? t.githubSettings.statusEnabled
        : t.githubSettings.statusDisabled);
    } catch (error) {
      onStatus(getLocalizedErrorMessage(error, t));
    } finally {
      writeInProgressRef.current = false;
      setIsSaving(false);
    }
  }

  if (isLoadingSettings) {
    return (
      <SkeletonVisibility visible={showSettingsSkeleton}>
        <GitHubSettingsFormSkeleton maintenanceText={maintenanceText} />
      </SkeletonVisibility>
    );
  }

  if (settingsError) {
    return (
      <div className="settings-card-error" role="alert">
        <h3>{maintenanceText.githubSubmissionTitle}</h3>
        <p>{settingsError}</p>
        <button
          className="ghost-button"
          type="button"
          onClick={() => setSettingsReloadKey((current) => current + 1)}
        >
          {maintenanceText.systemRetry}
        </button>
      </div>
    );
  }

  return (
    <form
      aria-describedby="github-settings-description"
      className="tool-form github-settings-form"
      onSubmit={handleSave}
    >
      <div className="settings-card-heading github-settings-heading">
        <div>
          <h3>{maintenanceText.githubSubmissionTitle}</h3>
        </div>
        <SettingsStatusBadge
          ariaDescribedBy="github-settings-description"
          disabled={isSaving || (!settings?.enabled && !hasSavedSubmissionConfig)}
          disabledLabel={t.githubSettings.statusDisabled}
          enabled={settings?.enabled ?? false}
          enabledLabel={t.githubSettings.statusEnabled}
          onChange={() => void toggleEnabled()}
        />
        <p id="github-settings-description">{maintenanceText.githubSubmissionDescription}</p>
      </div>

      <div className="settings-grid">
        <label>
          {t.githubSettings.owner}
          <input
            value={form.owner}
            onChange={(event) =>
              setForm({ ...form, owner: event.target.value })
            }
            placeholder="owner"
          />
        </label>
        <label>
          {t.githubSettings.repo}
          <input
            value={form.repo}
            onChange={(event) => setForm({ ...form, repo: event.target.value })}
            placeholder="repo"
          />
        </label>
      </div>

      <label>
        {t.githubSettings.labels}
        <input
          value={form.labels.join(", ")}
          onChange={(event) =>
            setForm({
              ...form,
              labels: event.target.value
                .split(",")
                .map((label) => label.trim())
                .filter(Boolean)
            })
          }
          placeholder={t.githubSettings.labelsPlaceholder}
        />
      </label>

      <div className="source-public-actions github-settings-actions">
        <button
          className="ghost-button"
          disabled={isSaving || !isDirty}
          type="submit"
        >
          {t.actions.saveSettings}
        </button>
      </div>
    </form>
  );
}

function AdminInitialLoadError({
  message,
  onRetry,
  t
}: {
  message: string;
  onRetry: () => void;
  t?: Messages;
}) {
  const isChinese = t ? isChineseLocaleText(t) : /[\u3400-\u9fff]/u.test(message);

  return (
    <section className="admin-empty-state" role="alert">
      <div className="empty-state-title">
        <RefreshCw size={28} />
        <h2>{isChinese ? "\u52a0\u8f7d\u5931\u8d25" : "Unable to load"}</h2>
      </div>
      <p>{message}</p>
      <button
        className="ghost-button empty-state-action"
        type="button"
        onClick={onRetry}
      >
        {isChinese ? "\u91cd\u65b0\u52a0\u8f7d" : "Try again"}
      </button>
    </section>
  );
}

function GitHubSettingsFormSkeleton({
  maintenanceText
}: {
  maintenanceText: ReturnType<typeof getAdminMaintenanceText>;
}) {
  return (
    <div className="tool-form github-settings-form" aria-hidden="true">
      <AdminSettingsCopySkeleton
        className="settings-card-heading github-settings-heading"
        description={maintenanceText.githubSubmissionDescription}
        title={maintenanceText.githubSubmissionTitle}
        withStatus
        wrapTitle
      />
      <div className="settings-grid">
        <AdminSettingsFieldSkeleton className="github-owner-skeleton" />
        <AdminSettingsFieldSkeleton className="github-repo-skeleton" />
      </div>
      <AdminSettingsFieldSkeleton className="github-labels-skeleton" />
      <AdminSettingsActionsSkeleton className="github-settings-actions" count={1} />
    </div>
  );
}

function TelegramMessagePreview({
  content,
  mediaEnabled,
  mediaUrl,
  locale,
  proxySettings,
  resource
}: {
  content: string;
  mediaEnabled: boolean;
  mediaUrl: string;
  locale: Locale;
  proxySettings: ProxySettings;
  resource: TelegramPushResource;
}) {
  const source = proxifyUrl(mediaUrl, proxySettings, {
    resourceType: "image"
  });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    setImageFailed(false);
  }, [source]);

  return (
    <div className="telegram-channel-preview">
      <div className="tool-github-detail-repo">
        <Send size={16} />
        <span>Telegram</span>
      </div>
      <div className="telegram-channel-preview-message">
        <MarkdownContent
          content={escapeTelegramPreviewHashtags(content)}
          locale={locale}
          proxySettings={proxySettings}
        />
        {mediaEnabled ? (
          <div className="telegram-channel-link-preview">
            <div className="telegram-channel-link-image">
              {!source || imageFailed ? (
                <span className="telegram-channel-link-fallback">
                  <strong>{getToolInitials(resource.title)}</strong>
                </span>
              ) : (
                <>
                  {!imageLoaded ? (
                    <span
                      className="skeleton-shimmer telegram-channel-link-loading"
                      aria-hidden="true"
                    />
                  ) : null}
                  <img
                    alt=""
                    className={imageLoaded ? "is-loaded" : ""}
                    decoding="async"
                    loading="eager"
                    onError={() => setImageFailed(true)}
                    onLoad={() => setImageLoaded(true)}
                    src={source}
                  />
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TelegramSettingsCard({
  locale,
  maintenanceText,
  onReload,
  onSettingsChange,
  setStatus,
  settings,
  settingsError,
  loading,
  t,
  token
}: {
  locale: Locale;
  maintenanceText: ReturnType<typeof getAdminMaintenanceText>;
  onReload: () => Promise<void>;
  onSettingsChange: (settings: TelegramSettings) => void;
  setStatus: (status: string) => void;
  settings: TelegramSettings;
  settingsError: unknown;
  loading: boolean;
  t: Messages;
  token: string;
}) {
  const [footerMarkdown, setFooterMarkdown] = useState("");
  const [target, setTarget] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connection, setConnection] = useState<TelegramConnection | null>(null);
  const preserveDraftRef = useRef<{ target: string; footerMarkdown: string } | null>(null);
  const testRequestIdRef = useRef(0);
  const showSkeleton = useLoadingSkeleton(loading, 0);
  const dirty = target !== settings.target || footerMarkdown !== settings.footerMarkdown;
  const error = settingsError
    ? getLocalizedErrorMessage(settingsError, t)
    : "";

  useEffect(() => {
    const preservedDraft = preserveDraftRef.current;
    preserveDraftRef.current = null;
    setTarget(preservedDraft?.target ?? settings.target);
    setFooterMarkdown(preservedDraft?.footerMarkdown ?? settings.footerMarkdown);
    setConnection(null);
  }, [settings]);

  async function persist(
    next: { enabled: boolean; target: string; footerMarkdown: string },
    syncForm: boolean
  ) {
    if (saving) return;
    setSaving(true);
    setStatus("");
    try {
      const saved = await saveTelegramSettings(next, token);
      if (syncForm) {
        setTarget(saved.target);
        setFooterMarkdown(saved.footerMarkdown);
      }
      onSettingsChange(saved);
      setStatus(
        next.enabled !== settings.enabled
          ? saved.enabled
            ? maintenanceText.telegramEnabledMessage
            : maintenanceText.telegramDisabledMessage
          : maintenanceText.telegramUpdated
      );
    } catch (saveError) {
      preserveDraftRef.current = null;
      setStatus(getLocalizedErrorMessage(saveError, t));
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    const testedTarget = target.trim();
    if (testing || !testedTarget) return;
    const requestId = testRequestIdRef.current + 1;
    testRequestIdRef.current = requestId;
    setConnection(null);
    setTesting(true);
    setStatus("");
    try {
      const connection = await testTelegramSettings(testedTarget, token);
      if (testRequestIdRef.current !== requestId) return;
      setConnection(connection);
      setStatus(
        maintenanceText.telegramConnected(
          connection.chatTitle,
          connection.botUsername,
          testedTarget !== settings.target
        )
      );
    } catch (testError) {
      if (testRequestIdRef.current !== requestId) return;
      setStatus(getLocalizedErrorMessage(testError, t));
    } finally {
      if (testRequestIdRef.current === requestId) {
        setTesting(false);
      }
    }
  }

  if (loading) {
    return (
      <article className="source-public-card telegram-settings-card">
        <SkeletonVisibility visible={showSkeleton}>
          <div className="admin-settings-card-loading" aria-hidden="true">
            <AdminSettingsCopySkeleton
              className="source-card-heading"
              description={maintenanceText.telegramDescription}
              title={maintenanceText.telegramTitle}
              withStatus
            />
            <div className="turnstile-config-help">
              <AdminSettingsTextMask>
                {`TGTOKEN = ${maintenanceText.telegramTokenLabel}`}
              </AdminSettingsTextMask>
            </div>
            <AdminSettingsFieldSkeleton />
            <AdminSettingsFieldSkeleton />
            <AdminSettingsActionsSkeleton count={2} />
          </div>
        </SkeletonVisibility>
      </article>
    );
  }

  if (error) {
    return (
      <article className="source-public-card telegram-settings-card">
        <div className="settings-card-error" role="alert">
          <h3>{maintenanceText.telegramTitle}</h3>
          <p>{error}</p>
          <button className="ghost-button" type="button" onClick={() => void onReload()}>
            {maintenanceText.systemRetry}
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="source-public-card telegram-settings-card">
      <div className="source-card-heading">
        <h3>{maintenanceText.telegramTitle}</h3>
        <SettingsStatusBadge
          ariaDescribedBy="telegram-settings-description telegram-settings-configuration"
          disabled={saving || testing || !settings.available}
          disabledLabel={settings.available
            ? maintenanceText.telegramDisabled
            : maintenanceText.telegramUnavailable}
          enabled={settings.enabled}
          enabledLabel={maintenanceText.telegramEnabled}
          onChange={(enabled) => {
            if (enabled && dirty) {
              setStatus(maintenanceText.telegramSaveBeforeEnable);
              return;
            }

            if (!enabled && dirty) {
              preserveDraftRef.current = { target, footerMarkdown };
              void persist({
                enabled: false,
                target: settings.target,
                footerMarkdown: settings.footerMarkdown
              }, false);
              return;
            }

            void persist({
              enabled,
              target,
              footerMarkdown
            }, false);
          }}
        />
        <p id="telegram-settings-description">{maintenanceText.telegramDescription}</p>
        <div className="turnstile-config-help" id="telegram-settings-configuration">
          <span><code>TGTOKEN</code>{` = ${maintenanceText.telegramTokenLabel}`}</span>
        </div>
        {!settings.available ? <p>{maintenanceText.telegramNotConfigured}</p> : null}
      </div>
      {connection ? (
        <section className="tool-github-detail-card telegram-connection-details" aria-live="polite">
          <div className="tool-github-detail-grid telegram-connection-detail-grid">
            <div className="tool-github-detail-item">
              <span>{locale === "zh" ? "机器人" : "Bot"}</span>
              <strong>
                {connection.botName || "Telegram Bot"}
                {connection.botUsername ? ` (@${connection.botUsername})` : ""}
              </strong>
            </div>
            <div className="tool-github-detail-item">
              <span>{locale === "zh" ? "发送目标" : "Target"}</span>
              <strong>{connection.chatTitle}</strong>
            </div>
            <div className="tool-github-detail-item">
              <span>{locale === "zh" ? "目标类型" : "Type"}</span>
              <strong>{getTelegramChatTypeLabel(connection.chatType, locale)}</strong>
            </div>
            <div className="tool-github-detail-item">
              <span>{locale === "zh" ? "权限状态" : "Permission"}</span>
              <strong>
                {connection.canSend
                  ? locale === "zh" ? "可以发送消息" : "Can send messages"
                  : locale === "zh" ? "无法发送消息" : "Cannot send messages"}
              </strong>
            </div>
          </div>
        </section>
      ) : null}
      <form
        aria-describedby="telegram-settings-description telegram-settings-configuration"
        className="proxy-settings-form"
        onSubmit={(event) => {
          event.preventDefault();
          void persist({ enabled: settings.enabled, target, footerMarkdown }, true);
        }}
      >
        <label className="source-url-field">
          {maintenanceText.telegramTargetLabel}
          <input
            autoComplete="off"
            disabled={saving}
            maxLength={40}
            onChange={(event) => {
              testRequestIdRef.current += 1;
              setTarget(event.target.value);
              setConnection(null);
              setTesting(false);
              setStatus("");
            }}
            placeholder={maintenanceText.telegramTargetPlaceholder}
            type="text"
            value={target}
          />
        </label>
        <label className="source-url-field telegram-footer-field">
          {maintenanceText.telegramFooterLabel}
          <input
            autoComplete="off"
            disabled={saving}
            maxLength={1000}
            onChange={(event) => setFooterMarkdown(event.target.value)}
            placeholder={maintenanceText.telegramFooterPlaceholder}
            type="text"
            value={footerMarkdown}
          />
        </label>
        <div className="source-public-actions telegram-settings-actions">
          <button
            className="ghost-button"
            disabled={saving || testing || !dirty}
            type="submit"
          >
            {maintenanceText.telegramSave}
          </button>
          <button
            className="ghost-button"
            disabled={saving || testing || !target.trim()}
            type="button"
            onClick={() => void testConnection()}
          >
            {maintenanceText.telegramTest}
          </button>
        </div>
      </form>
    </article>
  );
}

function getTelegramChatTypeLabel(type: string, locale: Locale) {
  const labels = locale === "zh"
    ? { private: "个人账户", group: "群组", supergroup: "超级群组", channel: "频道" }
    : { private: "Private chat", group: "Group", supergroup: "Supergroup", channel: "Channel" };
  return labels[type as keyof typeof labels] ?? type;
}

function SiteSettingsGroupSkeleton() {
  return (
    <>
      <article className="source-public-card site-identity-card admin-settings-card-skeleton">
        <AdminSettingsHeadingSkeleton />
        <div className="proxy-settings-form">
          <div className="settings-grid">
            <AdminSettingsFieldSkeleton />
            <AdminSettingsFieldSkeleton />
          </div>
          <AdminSettingsFieldSkeleton />
          <span className="skeleton-shimmer skeleton-line is-medium admin-settings-help-skeleton" />
          <div className="site-identity-footer">
            <div className="site-identity-preview-shell">
              <div className="site-identity-preview">
                <span className="skeleton-shimmer admin-settings-logo-skeleton" />
                <span className="admin-settings-preview-lines">
                  <span className="skeleton-shimmer skeleton-line is-medium" />
                  <span className="skeleton-shimmer skeleton-line is-short" />
                </span>
              </div>
              <span className="skeleton-shimmer admin-settings-icon-action-skeleton" />
            </div>
            <AdminSettingsActionsSkeleton className="site-identity-actions" />
          </div>
        </div>
      </article>

      <HomeHeroSettingsSkeleton />

      <article className="source-public-card footer-settings-card admin-settings-card-skeleton">
        <AdminSettingsHeadingSkeleton />
        <div className="footer-settings-form">
          <AdminSettingsFieldSkeleton />
          <div className="footer-settings-pair">
            <AdminSettingsFieldSkeleton />
            <AdminSettingsFieldSkeleton />
          </div>
          <AdminSettingsFieldSkeleton
            className="footer-social-links-field"
            textareaClassName="admin-settings-textarea-skeleton"
          />
          <AdminSettingsFieldSkeleton textareaClassName="admin-settings-textarea-skeleton" />
          <span className="skeleton-shimmer skeleton-line is-long admin-settings-help-skeleton" />
          <AdminSettingsActionsSkeleton />
        </div>
      </article>

      {Array.from({ length: 3 }).map((_, index) => (
        <article className="source-public-card legal-settings-card admin-settings-card-skeleton" key={index}>
          <AdminSettingsHeadingSkeleton />
          <div className="legal-settings-form">
            <AdminSettingsFieldSkeleton textareaClassName="admin-settings-textarea-skeleton is-editor" />
            <AdminSettingsFieldSkeleton textareaClassName="admin-settings-textarea-skeleton is-editor" />
            <AdminSettingsActionsSkeleton />
          </div>
        </article>
      ))}
    </>
  );
}

function LegalSettingsCard({
  busy,
  content,
  description,
  dirty,
  englishLabel,
  formId,
  locale,
  onChange,
  onReset,
  onSubmit,
  proxySettings,
  resetLabel,
  saveLabel,
  text,
  title,
  chineseLabel
}: {
  busy: boolean;
  content: { zh: string; en: string };
  description: string;
  dirty: boolean;
  englishLabel: string;
  formId: string;
  locale: Locale;
  onChange: (locale: Locale, value: string) => void;
  onReset: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  proxySettings: ProxySettings;
  resetLabel: string;
  saveLabel: string;
  text: Messages["markdownEditor"];
  title: string;
  chineseLabel: string;
}) {
  const descriptionId = `${formId}-description`;

  return (
    <article className="source-public-card legal-settings-card">
      <div>
        <h3>{title}</h3>
        <p id={descriptionId}>{description}</p>
      </div>
      <form
        aria-describedby={descriptionId}
        className="legal-settings-form"
        onSubmit={onSubmit}
      >
        <AdminMarkdownEditor
          className="source-url-field legal-markdown-editor"
          disabled={busy}
          id={`${formId}-zh-markdown`}
          label={chineseLabel}
          locale={locale}
          onChange={(value) => onChange("zh", value)}
          previewLocale="zh"
          proxySettings={proxySettings}
          rows={12}
          text={text}
          textareaClassName="about-settings-textarea legal-settings-textarea"
          value={content.zh}
        />
        <AdminMarkdownEditor
          className="source-url-field legal-markdown-editor"
          disabled={busy}
          id={`${formId}-en-markdown`}
          label={englishLabel}
          locale={locale}
          onChange={(value) => onChange("en", value)}
          previewLocale="en"
          proxySettings={proxySettings}
          rows={12}
          text={text}
          textareaClassName="about-settings-textarea legal-settings-textarea"
          value={content.en}
        />
        <div className="source-public-actions">
          <button className="primary-button" disabled={busy || !dirty} type="submit">
            {saveLabel}
          </button>
          <button
            className="ghost-button settings-reset-button"
            disabled={busy}
            type="button"
            onClick={onReset}
          >
            {resetLabel}
          </button>
        </div>
      </form>
    </article>
  );
}

function HomeHeroSettingsSkeleton() {
  return (
    <article className="source-public-card home-copy-settings-card admin-settings-card-skeleton">
      <AdminSettingsHeadingSkeleton />
      <div className="home-copy-settings-form">
        {Array.from({ length: 2 }).map((_, index) => (
          <div className="home-copy-language-group" key={index}>
            <span className="skeleton-shimmer skeleton-line is-short" />
            <AdminSettingsFieldSkeleton />
            <AdminSettingsFieldSkeleton />
            <AdminSettingsFieldSkeleton
              className="home-copy-description-field"
              textareaClassName="admin-settings-textarea-skeleton"
            />
          </div>
        ))}
        <AdminSettingsActionsSkeleton />
      </div>
    </article>
  );
}

function ProxySettingsCardSkeleton({
  maintenanceText
}: {
  maintenanceText: ReturnType<typeof getAdminMaintenanceText>;
}) {
  return (
    <div className="admin-settings-card-loading" aria-hidden="true">
      <AdminSettingsCopySkeleton
        className="source-card-heading"
        description={maintenanceText.proxyDescription}
        title={maintenanceText.proxyTitle}
        withStatus
      />
      <div className="proxy-settings-form">
        <AdminSettingsFieldSkeleton />
        <AdminSettingsFieldSkeleton />
        <AdminSettingsFieldSkeleton />
        <span className="skeleton-shimmer skeleton-line is-long admin-settings-help-skeleton" />
        <span className="skeleton-shimmer skeleton-line is-medium admin-settings-help-skeleton" />
        <AdminSettingsActionsSkeleton count={1} />
      </div>
    </div>
  );
}

function FactoryResetCardSkeleton({
  maintenanceText
}: {
  maintenanceText: ReturnType<typeof getAdminMaintenanceText>;
}) {
  return (
    <div className="admin-settings-card-loading" aria-hidden="true">
      <div className="admin-settings-copy-skeleton">
        <h3><AdminSettingsTextMask>{maintenanceText.resetTitle}</AdminSettingsTextMask></h3>
        <p><AdminSettingsTextMask>{maintenanceText.resetDescription}</AdminSettingsTextMask></p>
        <p><AdminSettingsTextMask>{maintenanceText.resetWarning}</AdminSettingsTextMask></p>
      </div>
      <AdminSettingsActionsSkeleton count={1} />
    </div>
  );
}

function BackupRestoreCardSkeleton({
  maintenanceText
}: {
  maintenanceText: ReturnType<typeof getAdminMaintenanceText>;
}) {
  return (
    <div className="admin-settings-card-loading" aria-hidden="true">
      <div className="admin-settings-copy-skeleton">
        <h3><AdminSettingsTextMask>{maintenanceText.backupTitle}</AdminSettingsTextMask></h3>
        <p><AdminSettingsTextMask>{maintenanceText.backupDescription}</AdminSettingsTextMask></p>
        <p><AdminSettingsTextMask>{maintenanceText.backupHelp}</AdminSettingsTextMask></p>
      </div>
      <div className="source-public-actions">
        <span className="skeleton-shimmer admin-settings-button-skeleton" />
        <span className="skeleton-shimmer admin-settings-button-skeleton is-secondary" />
        <span className="skeleton-shimmer admin-settings-button-skeleton is-secondary" />
      </div>
    </div>
  );
}

function AdminLinkCheckSkeleton({
  maintenanceText,
  section,
  t
}: {
  maintenanceText: ReturnType<typeof getAdminMaintenanceText>;
  section: AdminMaintenanceSection;
  t: Messages;
}) {
  return (
    <section className="admin-link-check admin-panel-skeleton" aria-hidden="true">
      {section === "import-export" ? (
        <section className="admin-maintenance-panel">
          <section className="source-import-panel">
          <div className="source-import-main">
            <AdminSettingsHeadingSkeleton className="link-check-heading" />
            <AdminSettingsFieldSkeleton />
            <div className="source-mode-row">
              <span className="skeleton-shimmer skeleton-line is-short" />
              <div className="admin-segmented-toggle admin-segmented-toggle-skeleton">
                <span className="skeleton-shimmer admin-settings-button-skeleton" />
                <span className="skeleton-shimmer admin-settings-button-skeleton" />
              </div>
              <span className="skeleton-shimmer skeleton-line is-long" />
            </div>
            <AdminSettingsActionsSkeleton className="source-action-row" />
            <AdminStatsSkeleton
              className="source-report-grid source-report-grid-skeleton"
              labels={[
                maintenanceText.sourceTotal,
                maintenanceText.sourceValid,
                maintenanceText.sourceDuplicate,
                maintenanceText.sourceExisting,
                maintenanceText.sourceMissing,
                maintenanceText.sourceWillCreate,
                maintenanceText.sourceWillUpdate,
                maintenanceText.sourceWillSkip
              ]}
            />
          </div>

          <div className="source-import-main source-export-card">
            <AdminSettingsHeadingSkeleton className="link-check-heading" />
            <AdminStatsSkeleton
              className="source-report-grid source-export-summary source-report-grid-skeleton"
              labels={[
                maintenanceText.sourceExportCount,
                maintenanceText.sourceExportFormat,
                maintenanceText.sourceExportScope
              ]}
            />
            <AdminSettingsActionsSkeleton className="source-action-row" count={1} />
          </div>
          </section>
        </section>
      ) : (
        <SkeletonLayoutMask className="admin-maintenance-panel admin-maintenance-link-panel">
          <div className="link-check-hero">
            <AdminSettingsHeadingSkeleton className="link-check-heading" />
            <div className="link-check-config">
              <label className="link-check-field">
                <span>{t.linkCheck.timeout}</span>
                <input disabled type="number" value="8" readOnly />
                <small>{t.linkCheck.timeoutHelp}</small>
              </label>
              <label className="link-check-field">
                <span>{t.linkCheck.batchSize}</span>
                <input disabled type="number" value="6" readOnly />
                <small>{t.linkCheck.batchSizeHelp}</small>
              </label>
            </div>
            <div className="link-check-actions">
              {[
                t.linkCheck.start,
                t.linkCheck.stop,
                t.linkCheck.reload,
                t.linkCheck.clear,
                t.linkCheck.exportCsv
              ].map((label, index) => (
                <button
                  className={index === 0 ? "primary-button" : "ghost-button"}
                  disabled
                  key={label}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <AdminStatsSkeleton
            className="link-check-stats"
            labels={[
              t.linkCheck.total,
              t.linkCheck.checked,
              t.linkCheck.normal,
              t.linkCheck.abnormal,
              t.linkCheck.networkError
            ]}
          />

          <section className="link-check-progress">
            <div className="link-check-progress-head">
              <AdminSettingsHeadingSkeleton />
              <span className="skeleton-shimmer link-check-percent-skeleton" />
            </div>
            <div className="link-check-progress-track" aria-hidden="true">
              <span style={{ width: "0%" }} />
            </div>
          </section>

          <section className="link-check-results">
            <div className="link-check-results-head">
              <AdminSettingsHeadingSkeleton />
            </div>
            <div className="link-check-tabs" role="tablist">
              <button disabled type="button">{t.linkCheck.tabsAbnormal(0)}</button>
              <button disabled type="button">{t.linkCheck.tabsStatus(0, 0)}</button>
              <button disabled type="button">{t.linkCheck.tabsAll(0)}</button>
            </div>
            <div className="link-check-empty-state admin-link-empty-skeleton">
              <span className="skeleton-shimmer skeleton-line is-medium" />
            </div>
          </section>
        </SkeletonLayoutMask>
      )}
    </section>
  );
}

function getInitialAdminSystemSettingsGroup(): AdminSystemSettingsGroup {
  if (typeof window === "undefined") {
    return "site";
  }

  return (
    getAdminSystemSettingsGroupFromPath(window.location.pathname) ?? "site"
  );
}

function getAdminSystemSettingsGroupTitle(
  group: AdminSystemSettingsGroup,
  maintenanceText: ReturnType<typeof getAdminMaintenanceText>
) {
  if (group === "services") {
    return maintenanceText.systemGroupIntegrations;
  }

  if (group === "management") {
    return maintenanceText.systemGroupSecurity;
  }

  return maintenanceText.systemGroupGeneral;
}

function AdminSystemSettingsPanel({
  locale,
  maintenanceText,
  onTokenChange,
  onProxySettingsChange,
  onDataRestored,
  onSiteSettingsChange,
  onTelegramSettingsChange,
  onReloadTelegramSettings,
  onUmamiSettingsChange,
  proxySettings,
  proxySettingsLoadError,
  proxySettingsReady,
  setStatus,
  siteSettings,
  siteSettingsLoadError,
  siteSettingsReady,
  t,
  telegramSettings,
  telegramSettingsLoadError,
  telegramSettingsLoading,
  token
}: {
  locale: Locale;
  maintenanceText: ReturnType<typeof getAdminMaintenanceText>;
  onTokenChange: (token: string) => void;
  onProxySettingsChange: (settings: ProxySettings) => void;
  onDataRestored: () => Promise<void>;
  onSiteSettingsChange: (settings: SiteSettings) => void;
  onTelegramSettingsChange: (settings: TelegramSettings) => void;
  onReloadTelegramSettings: () => Promise<void>;
  onUmamiSettingsChange: (settings: UmamiSettings) => void;
  proxySettings: ProxySettings;
  proxySettingsLoadError: unknown;
  proxySettingsReady: boolean;
  setStatus: (status: string) => void;
  siteSettings: SiteSettings;
  siteSettingsLoadError: unknown;
  siteSettingsReady: boolean;
  t: Messages;
  telegramSettings: TelegramSettings;
  telegramSettingsLoadError: unknown;
  telegramSettingsLoading: boolean;
  token: string;
}) {
  const [sourceSettings, setSourceSettings] = useState<SourceSettings | null>(null);
  const [turnstileSettings, setTurnstileSettings] = useState<TurnstileSettings | null>(null);
  const [umamiSettings, setUmamiSettings] = useState<UmamiSettings | null>(null);
  const [securitySettings, setSecuritySettings] =
    useState<AdminSecuritySettings | null>(null);
  const [activeSettingsGroup, setActiveSettingsGroup] =
    useState<AdminSystemSettingsGroup>(getInitialAdminSystemSettingsGroup);
  const [settingsTopbarTarget, setSettingsTopbarTarget] =
    useState<HTMLElement | null>(null);
  const [sourceSettingsLoading, setSourceSettingsLoading] = useState(true);
  const [turnstileSettingsLoading, setTurnstileSettingsLoading] = useState(true);
  const [umamiSettingsLoading, setUmamiSettingsLoading] = useState(true);
  const [securitySettingsLoading, setSecuritySettingsLoading] = useState(true);
  const [siteSettingsLoading, setSiteSettingsLoading] = useState(!siteSettingsReady);
  const [proxySettingsLoading, setProxySettingsLoading] = useState(!proxySettingsReady);
  const [sourceSettingsError, setSourceSettingsError] = useState("");
  const [turnstileSettingsError, setTurnstileSettingsError] = useState("");
  const [umamiSettingsError, setUmamiSettingsError] = useState("");
  const [securitySettingsError, setSecuritySettingsError] = useState("");
  const [siteSettingsError, setSiteSettingsError] = useState("");
  const [proxySettingsError, setProxySettingsError] = useState("");
  const [sourceSettingsSaving, setSourceSettingsSaving] = useState(false);
  const [turnstileSettingsSaving, setTurnstileSettingsSaving] = useState(false);
  const [umamiSettingsSaving, setUmamiSettingsSaving] = useState(false);
  const umamiSettingsSavingRef = useRef(false);
  const [umamiForm, setUmamiForm] = useState<UmamiSettings>({
    enabled: false,
    scriptUrl: "",
    websiteId: ""
  });
  const [githubSettingsDirty, setGitHubSettingsDirty] = useState(false);
  const [proxySaving, setProxySaving] = useState(false);
  const proxySavingRef = useRef(false);
  const [proxyForm, setProxyForm] = useState(proxySettings);
  const [siteForm, setSiteForm] = useState(() =>
    getEditableSiteSettings(siteSettings)
  );
  const [persistedSiteSettings, setPersistedSiteSettings] = useState(() =>
    getEditableSiteSettings(siteSettings)
  );
  const [siteSaving, setSiteSaving] = useState(false);
  const [aboutSaving, setAboutSaving] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [termsSaving, setTermsSaving] = useState(false);
  const [footerSaving, setFooterSaving] = useState(false);
  const [homeSaving, setHomeSaving] = useState(false);
  const [siteResetting, setSiteResetting] = useState(false);
  const [aboutResetting, setAboutResetting] = useState(false);
  const [privacyResetting, setPrivacyResetting] = useState(false);
  const [termsResetting, setTermsResetting] = useState(false);
  const [footerResetting, setFooterResetting] = useState(false);
  const [homeResetting, setHomeResetting] = useState(false);
  const [siteIconFileName, setSiteIconFileName] = useState("");
  const [siteIconFileInvalid, setSiteIconFileInvalid] = useState(false);
  const [sitePreviewFailed, setSitePreviewFailed] = useState(false);
  const [sitePreviewRetryToken, setSitePreviewRetryToken] = useState(0);
  const sitePreviewIconUrl = siteForm.iconUrl.trim();
  const sitePreviewIconSrc = useMemo(
    () => addSiteIconRetryParam(sitePreviewIconUrl, sitePreviewRetryToken),
    [sitePreviewIconUrl, sitePreviewRetryToken]
  );
  const [footerSocialLinksText, setFooterSocialLinksText] = useState(
    formatFooterJson(getSiteFooterSettings(siteSettings).socialLinks)
  );
  const [footerGroupsText, setFooterGroupsText] = useState(
    formatFooterJson(getSiteFooterSettings(siteSettings).groups)
  );
  const [footerInvalidField, setFooterInvalidField] = useState<"social" | "groups" | null>(null);
  const [securitySaving, setSecuritySaving] = useState(false);
  const [securityInvalidField, setSecurityInvalidField] = useState<"current" | "new" | "confirm" | null>(null);
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [backupFileName, setBackupFileName] = useState("");
  const [backupFileInvalid, setBackupFileInvalid] = useState(false);
  const [backupPayload, setBackupPayload] = useState<HtoolsBackup | null>(null);
  const [backupExporting, setBackupExporting] = useState(false);
  const backupExportingRef = useRef(false);
  const [backupRestoring, setBackupRestoring] = useState(false);
  const [factoryResetting, setFactoryResetting] = useState(false);
  const maintenanceMutationRef = useRef(false);
  const [pendingBackupRestore, setPendingBackupRestore] = useState(false);
  const [pendingFactoryReset, setPendingFactoryReset] = useState(false);
  const [pendingDiscardAction, setPendingDiscardAction] = useState<
    "backup" | null
  >(null);
  const siteSettingsMutationQueueRef = useRef<Promise<void>>(Promise.resolve());
  const settingsWriteLocksRef = useRef(new Set<string>());
  const locallyAppliedSiteSettingsSignatureRef = useRef("");
  const settingsGroupTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const sourceSettingsLoadRequestRef = useRef(0);
  const securitySettingsLoadRequestRef = useRef(0);
  const siteSettingsLoadRequestRef = useRef(0);
  const proxySettingsLoadRequestRef = useRef(0);
  const turnstileSettingsLoadRequestRef = useRef(0);
  const umamiSettingsLoadRequestRef = useRef(0);
  const sourceSettingsLoadAbortRef = useRef<AbortController | null>(null);
  const securitySettingsLoadAbortRef = useRef<AbortController | null>(null);
  const siteSettingsLoadAbortRef = useRef<AbortController | null>(null);
  const proxySettingsLoadAbortRef = useRef<AbortController | null>(null);
  const turnstileSettingsLoadAbortRef = useRef<AbortController | null>(null);
  const umamiSettingsLoadAbortRef = useRef<AbortController | null>(null);

  function clearMessage() {
    setStatus("");
  }

  function acquireSettingsWriteLock(key: string) {
    if (settingsWriteLocksRef.current.has(key)) return false;
    settingsWriteLocksRef.current.add(key);
    return true;
  }

  function releaseSettingsWriteLock(key: string) {
    settingsWriteLocksRef.current.delete(key);
  }

  function getSecurityErrorMessage(error: unknown) {
    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof error.code === "string"
        ? error.code
        : "";

    if (errorCode === "INVALID_PASSWORD") {
      return maintenanceText.securityCurrentIncorrect;
    }

    if (errorCode === "PASSWORD_UNCHANGED") {
      return maintenanceText.securityUnchanged;
    }

    const message = getLocalizedErrorMessage(error, t);

    if (message === "currentPassword is required.") {
      return maintenanceText.securityCurrentRequired;
    }

    if (message === "newPassword is required.") {
      return maintenanceText.securityNewRequired;
    }

    if (message === "Current password is incorrect.") {
      return maintenanceText.securityCurrentIncorrect;
    }

    if (message === "New password must be different from the current password.") {
      return maintenanceText.securityUnchanged;
    }

    return message;
  }

  function getSiteSettingsErrorMessage(error: unknown) {
    const message = getLocalizedErrorMessage(error, t);

    if (message === "footer social links JSON is invalid.") {
      return maintenanceText.footerSocialJsonInvalid;
    }

    if (message === "footer groups JSON is invalid.") {
      return maintenanceText.footerGroupsJsonInvalid;
    }

    if (
      message === "site icon URL must be a valid http/https URL." ||
      message === "site icon must be a valid http/https URL or supported image data."
    ) {
      return maintenanceText.siteIconInvalid;
    }

    return message;
  }

  function createSiteSettingsSignature(settings: SiteSettings) {
    return JSON.stringify(getEditableSiteSettings(settings));
  }

  function syncSiteSettingsForm(settings: SiteSettings) {
    const editableSettings = getEditableSiteSettings(settings);
    const footer = getSiteFooterSettings(settings);

    setPersistedSiteSettings(editableSettings);
    setSiteForm(editableSettings);
    setFooterSocialLinksText(formatFooterJson(footer.socialLinks));
    setFooterGroupsText(formatFooterJson(footer.groups));
  }

  function applyUmamiSettingsState(
    settings: UmamiSettings,
    syncForm = true
  ) {
    const normalizedSettings = {
      enabled: settings.enabled,
      scriptUrl: normalizeUmamiScriptUrl(settings.scriptUrl),
      websiteId: normalizeUmamiWebsiteId(settings.websiteId)
    };

    setUmamiSettings(normalizedSettings);
    if (syncForm) setUmamiForm(normalizedSettings);
    onUmamiSettingsChange(normalizedSettings);
  }

  function applySiteSettingsResponse(
    settings: SiteSettings,
    section: "identity" | "about" | "privacy" | "terms" | "home" | "footer"
  ) {
    const editableSettings = getEditableSiteSettings(settings);
    const footer = getSiteFooterSettings(settings);

    setPersistedSiteSettings(editableSettings);
    setSiteForm((current) => {
      if (section === "identity") {
        return {
          ...current,
          name: editableSettings.name,
          subtitle: editableSettings.subtitle,
          iconUrl: editableSettings.iconUrl
        };
      }

      if (section === "about") {
        return {
          ...current,
          aboutContent: editableSettings.aboutContent
        };
      }

      if (section === "privacy") {
        return {
          ...current,
          privacyContent: editableSettings.privacyContent
        };
      }

      if (section === "terms") {
        return {
          ...current,
          termsContent: editableSettings.termsContent
        };
      }

      if (section === "home") {
        return {
          ...current,
          homeHero: editableSettings.homeHero
        };
      }

      return {
        ...current,
        footer: editableSettings.footer
      };
    });

    if (section === "footer") {
      setFooterSocialLinksText(formatFooterJson(footer.socialLinks));
      setFooterGroupsText(formatFooterJson(footer.groups));
    }

    locallyAppliedSiteSettingsSignatureRef.current =
      createSiteSettingsSignature(settings);
    onSiteSettingsChange(settings);
  }

  function enqueueSiteSettingsMutation<T>(mutation: () => Promise<T>) {
    const result = siteSettingsMutationQueueRef.current.then(mutation, mutation);
    siteSettingsMutationQueueRef.current = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }

  useEffect(() => {
    setProxyForm((current) => ({
      ...current,
      baseUrl: proxySettings.baseUrl,
      mode: proxySettings.mode,
      scope: proxySettings.scope
    }));
  }, [proxySettings.baseUrl, proxySettings.mode, proxySettings.scope]);

  useEffect(() => {
    if (!siteSettingsReady) {
      setSiteSettingsLoading(true);
      return;
    }

    setSiteSettingsLoading(false);
    setSiteSettingsError(
      siteSettingsLoadError ? getLocalizedErrorMessage(siteSettingsLoadError, t) : ""
    );
  }, [siteSettingsLoadError, siteSettingsReady, t]);

  useEffect(() => {
    if (!proxySettingsReady) {
      setProxySettingsLoading(true);
      return;
    }

    setProxySettingsLoading(false);
    setProxySettingsError(
      proxySettingsLoadError ? getLocalizedErrorMessage(proxySettingsLoadError, t) : ""
    );
  }, [proxySettingsLoadError, proxySettingsReady, t]);

  useEffect(() => {
    setSettingsTopbarTarget(
      document.getElementById("admin-system-settings-topbar-slot")
    );
  }, []);

  useEffect(() => {
    const signature = createSiteSettingsSignature(siteSettings);

    if (locallyAppliedSiteSettingsSignatureRef.current === signature) {
      locallyAppliedSiteSettingsSignatureRef.current = "";
      return;
    }

    syncSiteSettingsForm(siteSettings);
    setSiteIconFileName("");
  }, [siteSettings]);

  useEffect(() => {
    setSitePreviewFailed(false);
    setSitePreviewRetryToken(0);
  }, [siteForm.iconUrl]);

  function handleSitePreviewError() {
    if (!sitePreviewRetryToken && !isSiteIconDataUrl(sitePreviewIconUrl)) {
      setSitePreviewRetryToken(Date.now());
      return;
    }

    setSitePreviewFailed(true);
  }

  async function loadSourceSettingsCard() {
    const requestId = ++sourceSettingsLoadRequestRef.current;
    sourceSettingsLoadAbortRef.current?.abort();
    const controller = new AbortController();
    sourceSettingsLoadAbortRef.current = controller;
    setSourceSettingsLoading(true);
    setSourceSettingsError("");

    try {
      const settings = await loadSourceSettings(token, {
        signal: controller.signal
      });
      if (sourceSettingsLoadRequestRef.current === requestId) {
        setSourceSettings(settings);
      }
    } catch (error) {
      if (
        sourceSettingsLoadRequestRef.current === requestId &&
        !controller.signal.aborted
      ) {
        setSourceSettingsError(getLocalizedErrorMessage(error, t));
      }
    } finally {
      if (sourceSettingsLoadRequestRef.current === requestId) {
        setSourceSettingsLoading(false);
        if (sourceSettingsLoadAbortRef.current === controller) {
          sourceSettingsLoadAbortRef.current = null;
        }
      }
    }
  }

  async function loadSecuritySettingsCard() {
    const requestId = ++securitySettingsLoadRequestRef.current;
    securitySettingsLoadAbortRef.current?.abort();
    const controller = new AbortController();
    securitySettingsLoadAbortRef.current = controller;
    setSecuritySettingsLoading(true);
    setSecuritySettingsError("");

    try {
      const settings = await loadAdminSecuritySettings(token, {
        signal: controller.signal
      });
      if (securitySettingsLoadRequestRef.current === requestId) {
        setSecuritySettings(settings);
      }
    } catch (error) {
      if (
        securitySettingsLoadRequestRef.current === requestId &&
        !controller.signal.aborted
      ) {
        setSecuritySettingsError(getLocalizedErrorMessage(error, t));
      }
    } finally {
      if (securitySettingsLoadRequestRef.current === requestId) {
        setSecuritySettingsLoading(false);
        if (securitySettingsLoadAbortRef.current === controller) {
          securitySettingsLoadAbortRef.current = null;
        }
      }
    }
  }

  async function loadSiteSettingsCards() {
    const requestId = ++siteSettingsLoadRequestRef.current;
    siteSettingsLoadAbortRef.current?.abort();
    const controller = new AbortController();
    siteSettingsLoadAbortRef.current = controller;
    setSiteSettingsLoading(true);
    setSiteSettingsError("");

    try {
      const settings = await loadSiteSettings({ signal: controller.signal });
      if (siteSettingsLoadRequestRef.current === requestId) {
        syncSiteSettingsForm(settings);
        locallyAppliedSiteSettingsSignatureRef.current =
          createSiteSettingsSignature(settings);
        onSiteSettingsChange(settings);
        setSiteIconFileName("");
      }
    } catch (error) {
      if (
        siteSettingsLoadRequestRef.current === requestId &&
        !controller.signal.aborted
      ) {
        setSiteSettingsError(getLocalizedErrorMessage(error, t));
      }
    } finally {
      if (siteSettingsLoadRequestRef.current === requestId) {
        setSiteSettingsLoading(false);
        if (siteSettingsLoadAbortRef.current === controller) {
          siteSettingsLoadAbortRef.current = null;
        }
      }
    }
  }

  async function loadProxySettingsCard() {
    const requestId = ++proxySettingsLoadRequestRef.current;
    proxySettingsLoadAbortRef.current?.abort();
    const controller = new AbortController();
    proxySettingsLoadAbortRef.current = controller;
    setProxySettingsLoading(true);
    setProxySettingsError("");

    try {
      const settings = await loadProxySettings({ signal: controller.signal });
      const normalizedSettings = {
        enabled: settings.enabled,
        baseUrl: normalizeProxyBaseUrl(settings.baseUrl),
        mode: normalizeProxyMode(settings.mode),
        scope: normalizeProxyScope(settings.scope)
      };

      if (proxySettingsLoadRequestRef.current === requestId) {
        setProxyForm(normalizedSettings);
        onProxySettingsChange(normalizedSettings);
      }
    } catch (error) {
      if (
        proxySettingsLoadRequestRef.current === requestId &&
        !controller.signal.aborted
      ) {
        setProxySettingsError(getLocalizedErrorMessage(error, t));
      }
    } finally {
      if (proxySettingsLoadRequestRef.current === requestId) {
        setProxySettingsLoading(false);
        if (proxySettingsLoadAbortRef.current === controller) {
          proxySettingsLoadAbortRef.current = null;
        }
      }
    }
  }

  async function loadTurnstileSettingsCard() {
    const requestId = ++turnstileSettingsLoadRequestRef.current;
    turnstileSettingsLoadAbortRef.current?.abort();
    const controller = new AbortController();
    turnstileSettingsLoadAbortRef.current = controller;
    setTurnstileSettingsLoading(true);
    setTurnstileSettingsError("");

    try {
      const settings = await loadTurnstileSettings(token, {
        signal: controller.signal
      });
      if (turnstileSettingsLoadRequestRef.current === requestId) {
        setTurnstileSettings(settings);
      }
    } catch (error) {
      if (
        turnstileSettingsLoadRequestRef.current === requestId &&
        !controller.signal.aborted
      ) {
        setTurnstileSettingsError(getLocalizedErrorMessage(error, t));
      }
    } finally {
      if (turnstileSettingsLoadRequestRef.current === requestId) {
        setTurnstileSettingsLoading(false);
        if (turnstileSettingsLoadAbortRef.current === controller) {
          turnstileSettingsLoadAbortRef.current = null;
        }
      }
    }
  }

  async function loadUmamiSettingsCard() {
    const requestId = ++umamiSettingsLoadRequestRef.current;
    umamiSettingsLoadAbortRef.current?.abort();
    const controller = new AbortController();
    umamiSettingsLoadAbortRef.current = controller;
    setUmamiSettingsLoading(true);
    setUmamiSettingsError("");

    try {
      const settings = await loadUmamiSettings(token, {
        signal: controller.signal
      });
      if (umamiSettingsLoadRequestRef.current === requestId) {
        applyUmamiSettingsState(settings);
      }
    } catch (error) {
      if (
        umamiSettingsLoadRequestRef.current === requestId &&
        !controller.signal.aborted
      ) {
        setUmamiSettingsError(getLocalizedErrorMessage(error, t));
      }
    } finally {
      if (umamiSettingsLoadRequestRef.current === requestId) {
        setUmamiSettingsLoading(false);
        if (umamiSettingsLoadAbortRef.current === controller) {
          umamiSettingsLoadAbortRef.current = null;
        }
      }
    }
  }

  useEffect(() => {
    void loadSourceSettingsCard();
    void loadTurnstileSettingsCard();
    void loadSecuritySettingsCard();
    void loadUmamiSettingsCard();

    return () => {
      sourceSettingsLoadAbortRef.current?.abort();
      securitySettingsLoadAbortRef.current?.abort();
      siteSettingsLoadAbortRef.current?.abort();
      proxySettingsLoadAbortRef.current?.abort();
      turnstileSettingsLoadAbortRef.current?.abort();
      umamiSettingsLoadAbortRef.current?.abort();
      sourceSettingsLoadRequestRef.current += 1;
      securitySettingsLoadRequestRef.current += 1;
      siteSettingsLoadRequestRef.current += 1;
      proxySettingsLoadRequestRef.current += 1;
      turnstileSettingsLoadRequestRef.current += 1;
      umamiSettingsLoadRequestRef.current += 1;
    };
  }, [token]);

  useEffect(() => {
    function handlePopState() {
      setActiveSettingsGroup(getInitialAdminSystemSettingsGroup());
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const nextPath = ADMIN_SYSTEM_SETTINGS_GROUP_PATHS[activeSettingsGroup];
    if (window.location.pathname !== nextPath || window.location.search) {
      window.history.replaceState({}, "", nextPath);
    }
  }, [activeSettingsGroup]);

  useEffect(() => {
    document.title = formatAdminDocumentTitle(
      getAdminSystemSettingsGroupTitle(activeSettingsGroup, maintenanceText),
      getSiteDisplayName(siteSettings),
      t.nav.admin
    );
  }, [activeSettingsGroup, maintenanceText, siteSettings, t.nav.admin]);

  function selectSettingsGroup(group: AdminSystemSettingsGroup) {
    setActiveSettingsGroup(group);
    window.history.pushState({}, "", ADMIN_SYSTEM_SETTINGS_GROUP_PATHS[group]);
  }

  function handleSettingsGroupKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    groupIndex: number
  ) {
    let nextIndex = groupIndex;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (groupIndex + 1) % ADMIN_SYSTEM_SETTINGS_GROUPS.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex =
        (groupIndex - 1 + ADMIN_SYSTEM_SETTINGS_GROUPS.length) %
        ADMIN_SYSTEM_SETTINGS_GROUPS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = ADMIN_SYSTEM_SETTINGS_GROUPS.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextGroup = ADMIN_SYSTEM_SETTINGS_GROUPS[nextIndex];
    selectSettingsGroup(nextGroup);
    settingsGroupTabRefs.current[nextIndex]?.focus();
  }

  async function togglePublicSource() {
    if (!acquireSettingsWriteLock(`source`)) return;
    setSourceSettingsSaving(true);
    clearMessage();

    try {
      const settings = await saveSourceSettings(!(sourceSettings?.enabled ?? false), token);
      setSourceSettings(settings);
      setStatus(
        settings.enabled
          ? maintenanceText.publicEnabledMessage
          : maintenanceText.publicDisabledMessage
      );
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      releaseSettingsWriteLock(`source`);
      setSourceSettingsSaving(false);
    }
  }

  async function saveProxy(
    nextSettings: ProxySettings,
    syncFormAfterSave: boolean
  ) {
    if (proxySavingRef.current) {
      return;
    }

    const baseUrl = normalizeProxyBaseUrl(nextSettings.baseUrl);

    if (nextSettings.enabled && !baseUrl) {
      setStatus(
        nextSettings.baseUrl.trim()
          ? maintenanceText.proxyInvalid
          : maintenanceText.proxyRequired
      );
      return;
    }

    proxySavingRef.current = true;
    setProxySaving(true);
    clearMessage();

    try {
      const settings = await saveProxySettings(
        {
          enabled: nextSettings.enabled,
          baseUrl,
          mode: normalizeProxyMode(nextSettings.mode),
          scope: normalizeProxyScope(nextSettings.scope)
        },
        token
      );
      const normalizedSettings = {
        enabled: settings.enabled,
        baseUrl: normalizeProxyBaseUrl(settings.baseUrl),
        mode: normalizeProxyMode(settings.mode),
        scope: normalizeProxyScope(settings.scope)
      };
      if (syncFormAfterSave) {
        setProxyForm(normalizedSettings);
      }
      onProxySettingsChange(normalizedSettings);
      setStatus(maintenanceText.proxyUpdated);
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      proxySavingRef.current = false;
      setProxySaving(false);
    }
  }

  function saveProxyForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void saveProxy(
      {
        enabled: proxySettings.enabled,
        baseUrl: proxyForm.baseUrl,
        mode: proxyForm.mode,
        scope: proxyForm.scope
      },
      true
    );
  }

  async function toggleTurnstile() {
    if (turnstileSettingsSaving || (!turnstileSettings?.available && !turnstileSettings?.enabled)) return;
    if (!acquireSettingsWriteLock(`turnstile`)) return;
    setTurnstileSettingsSaving(true);
    clearMessage();
    try {
      const settings = await saveTurnstileSettings(!turnstileSettings.enabled, token);
      setTurnstileSettings(settings);
      setStatus(settings.enabled
        ? maintenanceText.turnstileEnabledMessage
        : maintenanceText.turnstileDisabledMessage);
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      releaseSettingsWriteLock(`turnstile`);
      setTurnstileSettingsSaving(false);
    }
  }

  function toggleProxy() {
    void saveProxy(
      {
        enabled: !proxySettings.enabled,
        baseUrl: proxySettings.baseUrl,
        mode: proxySettings.mode,
        scope: proxySettings.scope
      },
      false
    );
  }

  async function persistUmamiSettings(
    nextSettings: UmamiSettings,
    syncFormAfterSave: boolean,
    successMessage: string
  ) {
    if (umamiSettingsSavingRef.current) return;

    const rawScriptUrl = nextSettings.scriptUrl.trim();
    const scriptUrl = normalizeUmamiScriptUrl(rawScriptUrl);
    const websiteId = normalizeUmamiWebsiteId(nextSettings.websiteId);

    if (rawScriptUrl && !scriptUrl) {
      setStatus(maintenanceText.umamiInvalidUrl);
      return;
    }

    if (nextSettings.enabled && (!scriptUrl || !websiteId)) {
      setStatus(maintenanceText.umamiRequired);
      return;
    }

    umamiSettingsSavingRef.current = true;
    setUmamiSettingsSaving(true);
    clearMessage();

    try {
      const settings = await saveUmamiSettings(
        { enabled: nextSettings.enabled, scriptUrl, websiteId },
        token
      );
      applyUmamiSettingsState(settings, syncFormAfterSave);
      setStatus(successMessage);
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      umamiSettingsSavingRef.current = false;
      setUmamiSettingsSaving(false);
    }
  }

  function saveUmamiForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void persistUmamiSettings(
      {
        enabled: umamiSettings?.enabled ?? false,
        scriptUrl: umamiForm.scriptUrl,
        websiteId: umamiForm.websiteId
      },
      true,
      maintenanceText.umamiUpdated
    );
  }

  function toggleUmami() {
    if (!umamiSettings) return;
    const enabled = !umamiSettings.enabled;
    void persistUmamiSettings(
      { ...umamiSettings, enabled },
      false,
      enabled
        ? maintenanceText.umamiEnabledMessage
        : maintenanceText.umamiDisabledMessage
    );
  }

  function updateFooterForm(patch: Partial<FooterSettings>) {
    setSiteForm((current) => ({
      ...current,
      footer: {
        ...getFooterFormValues(current),
        ...patch
      }
    }));
  }

  function parseFooterJson<T>(
    value: string,
    fallback: T,
    kind: "social" | "groups"
  ): T {
    if (!value.trim()) {
      return fallback;
    }

    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      throw new Error("footer JSON must be an array.");
    }

    const valid =
      kind === "social"
        ? parsed.every(
            (item) =>
              typeof item === "object" &&
              item !== null &&
              typeof (item as { label?: unknown }).label === "string" &&
              Boolean((item as { label: string }).label.trim()) &&
              typeof (item as { href?: unknown }).href === "string" &&
              Boolean((item as { href: string }).href.trim())
          )
        : parsed.every(
            (item) =>
              typeof item === "object" &&
              item !== null &&
              typeof (item as { title?: unknown }).title === "string" &&
              Boolean((item as { title: string }).title.trim()) &&
              Array.isArray((item as { links?: unknown }).links) &&
              (item as { links: unknown[] }).links.every(
                (link) =>
                  typeof link === "object" &&
                  link !== null &&
                  typeof (link as { label?: unknown }).label === "string" &&
                  Boolean((link as { label: string }).label.trim()) &&
                  typeof (link as { href?: unknown }).href === "string" &&
                  Boolean((link as { href: string }).href.trim())
              )
          );

    if (!valid) {
      throw new Error(
        kind === "social"
          ? "footer social links JSON is invalid."
          : "footer groups JSON is invalid."
      );
    }

    return parsed as T;
  }

  function buildFooterSettingsPayload(): FooterSettings {
    const footer = getSiteFooterSettings(siteForm);

    return {
      ...footer,
      authorName: DEFAULT_FOOTER_SETTINGS.authorName,
      authorUrl: DEFAULT_FOOTER_SETTINGS.authorUrl,
      copyright: DEFAULT_FOOTER_SETTINGS.copyright,
      socialLinks: parseFooterJson(
        footerSocialLinksText,
        DEFAULT_FOOTER_SETTINGS.socialLinks,
        "social"
      ),
      groups: parseFooterJson(
        footerGroupsText,
        DEFAULT_FOOTER_SETTINGS.groups,
        "groups"
      )
    };
  }

  function getHomeHeroFormContent(
    settings: SiteSettings,
    locale: "zh" | "en"
  ): HomeHeroContent {
    const content = getHomeHeroSettings(settings)[locale];
    const defaults = translations[locale].home;

    return {
      titleTop: content.titleTop || defaults.titleTop,
      titleBottom: content.titleBottom || defaults.titleBottom,
      description: content.description || defaults.description
    };
  }

  function updateHomeHeroForm(
    locale: "zh" | "en",
    patch: Partial<HomeHeroContent>
  ) {
    setSiteForm((current) => {
      const homeHero = getHomeHeroSettings(current);

      return {
        ...current,
        homeHero: {
          ...homeHero,
          [locale]: {
            ...homeHero[locale],
            ...patch
          }
        }
      };
    });
  }

  async function saveSiteIdentityForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!acquireSettingsWriteLock(`site-identity`)) return;
    setSiteSaving(true);
    clearMessage();

    try {
      const settings = await enqueueSiteSettingsMutation(() =>
        patchSiteSettings(
          {
            section: "identity",
            name: siteForm.name,
            subtitle: siteForm.subtitle,
            iconUrl: siteForm.iconUrl
          },
          token
        )
      );
      applySiteSettingsResponse(settings, "identity");
      setStatus(maintenanceText.siteUpdated);
    } catch (error) {
      setStatus(getSiteSettingsErrorMessage(error));
    } finally {
      releaseSettingsWriteLock(`site-identity`);
      setSiteSaving(false);
    }
  }

  async function saveAboutPageForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!acquireSettingsWriteLock(`site-about`)) return;
    setAboutSaving(true);
    clearMessage();

    try {
      const settings = await enqueueSiteSettingsMutation(() =>
        patchSiteSettings(
          {
            section: "about",
            aboutContent: siteForm.aboutContent
          },
          token
        )
      );
      applySiteSettingsResponse(settings, "about");
      setStatus(maintenanceText.aboutUpdated);
    } catch (error) {
      setStatus(getSiteSettingsErrorMessage(error));
    } finally {
      releaseSettingsWriteLock(`site-about`);
      setAboutSaving(false);
    }
  }

  async function savePrivacyPageForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!acquireSettingsWriteLock(`site-privacy`)) return;
    setPrivacySaving(true);
    clearMessage();

    try {
      const settings = await enqueueSiteSettingsMutation(() =>
        patchSiteSettings(
          {
            section: "privacy",
            privacyContent: siteForm.privacyContent ?? { zh: "", en: "" }
          },
          token
        )
      );
      applySiteSettingsResponse(settings, "privacy");
      setStatus(maintenanceText.privacyUpdated);
    } catch (error) {
      setStatus(getSiteSettingsErrorMessage(error));
    } finally {
      releaseSettingsWriteLock(`site-privacy`);
      setPrivacySaving(false);
    }
  }

  async function saveTermsPageForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!acquireSettingsWriteLock(`site-terms`)) return;
    setTermsSaving(true);
    clearMessage();

    try {
      const settings = await enqueueSiteSettingsMutation(() =>
        patchSiteSettings(
          {
            section: "terms",
            termsContent: siteForm.termsContent ?? { zh: "", en: "" }
          },
          token
        )
      );
      applySiteSettingsResponse(settings, "terms");
      setStatus(maintenanceText.termsUpdated);
    } catch (error) {
      setStatus(getSiteSettingsErrorMessage(error));
    } finally {
      releaseSettingsWriteLock(`site-terms`);
      setTermsSaving(false);
    }
  }

  async function saveFooterSettingsForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessage();
    setFooterInvalidField(null);

    for (const [field, value, fallback, kind] of [
      ["social", footerSocialLinksText, DEFAULT_FOOTER_SETTINGS.socialLinks, "social"],
      ["groups", footerGroupsText, DEFAULT_FOOTER_SETTINGS.groups, "groups"]
    ] as const) {
      try {
        parseFooterJson(value, fallback, kind);
      } catch {
        setFooterInvalidField(field);
        setStatus(maintenanceText.footerJsonInvalid);
        event.currentTarget
          .querySelector<HTMLTextAreaElement>(`[data-footer-json="${field}"]`)
          ?.focus();
        return;
      }
    }

    if (!acquireSettingsWriteLock(`site-footer`)) return;

    setFooterSaving(true);

    try {
      const footer = buildFooterSettingsPayload();
      const settings = await enqueueSiteSettingsMutation(() =>
        patchSiteSettings(
          {
            section: "footer",
            footer
          },
          token
        )
      );
      applySiteSettingsResponse(settings, "footer");
      setStatus(maintenanceText.footerUpdated);
    } catch (error) {
      setStatus(
        error instanceof SyntaxError
          ? maintenanceText.footerJsonInvalid
          : getSiteSettingsErrorMessage(error)
      );
    } finally {
      releaseSettingsWriteLock(`site-footer`);
      setFooterSaving(false);
    }
  }

  async function saveHomeHeroForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!acquireSettingsWriteLock(`site-home`)) return;
    setHomeSaving(true);
    clearMessage();

    try {
      const settings = await enqueueSiteSettingsMutation(() =>
        patchSiteSettings(
          {
            section: "home",
            homeHero: getHomeHeroSettings(siteForm)
          },
          token
        )
      );
      applySiteSettingsResponse(settings, "home");
      setStatus(maintenanceText.homeUpdated);
    } catch (error) {
      setStatus(getSiteSettingsErrorMessage(error));
    } finally {
      releaseSettingsWriteLock(`site-home`);
      setHomeSaving(false);
    }
  }

  async function resetHomeHeroSettings() {
    if (!acquireSettingsWriteLock(`site-home`)) return;
    setHomeResetting(true);
    clearMessage();

    try {
      const settings = await enqueueSiteSettingsMutation(() =>
        patchSiteSettings(
          {
            section: "home",
            homeHero: DEFAULT_HOME_HERO_SETTINGS
          },
          token
        )
      );
      applySiteSettingsResponse(settings, "home");
      setStatus(maintenanceText.homeResetDone);
    } catch (error) {
      setStatus(getSiteSettingsErrorMessage(error));
    } finally {
      releaseSettingsWriteLock(`site-home`);
      setHomeResetting(false);
    }
  }

  async function resetSiteIdentity() {
    if (!acquireSettingsWriteLock(`site-identity`)) return;
    setSiteResetting(true);
    clearMessage();

    try {
      const settings = await enqueueSiteSettingsMutation(() =>
        patchSiteSettings(
          {
            section: "identity",
            name: DEFAULT_SITE_SETTINGS.name,
            subtitle: DEFAULT_SITE_SETTINGS.subtitle,
            iconUrl: ""
          },
          token
        )
      );
      setSiteIconFileName("");
      setSitePreviewFailed(false);
      applySiteSettingsResponse(settings, "identity");
      setStatus(maintenanceText.siteResetDone);
    } catch (error) {
      setStatus(getSiteSettingsErrorMessage(error));
    } finally {
      releaseSettingsWriteLock(`site-identity`);
      setSiteResetting(false);
    }
  }

  async function resetAboutPage() {
    if (!acquireSettingsWriteLock(`site-about`)) return;
    setAboutResetting(true);
    clearMessage();

    try {
      const settings = await enqueueSiteSettingsMutation(() =>
        patchSiteSettings(
          {
            section: "about",
            aboutContent: { zh: "", en: "" }
          },
          token
        )
      );
      applySiteSettingsResponse(settings, "about");
      setStatus(maintenanceText.aboutResetDone);
    } catch (error) {
      setStatus(getSiteSettingsErrorMessage(error));
    } finally {
      releaseSettingsWriteLock(`site-about`);
      setAboutResetting(false);
    }
  }

  async function resetFooterSettings() {
    if (!acquireSettingsWriteLock(`site-footer`)) return;
    setFooterResetting(true);
    clearMessage();

    try {
      const settings = await enqueueSiteSettingsMutation(() =>
        patchSiteSettings(
          {
            section: "footer",
            footer: DEFAULT_FOOTER_SETTINGS
          },
          token
        )
      );
      applySiteSettingsResponse(settings, "footer");
      setStatus(maintenanceText.footerResetDone);
    } catch (error) {
      setStatus(getSiteSettingsErrorMessage(error));
    } finally {
      releaseSettingsWriteLock(`site-footer`);
      setFooterResetting(false);
    }
  }

  async function handleSiteIconFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setSiteIconFileInvalid(false);

    try {
      const iconUrl = await readSiteIconFile(file);
      setSiteIconFileName(file.name);
      setSitePreviewFailed(false);
      setSiteForm((current) => ({
        ...current,
        iconUrl
      }));
    } catch (error) {
      setSiteIconFileName("");
      setSiteIconFileInvalid(true);
      const message = error instanceof Error ? error.message : "";

      if (message === "site icon file is too large.") {
        setStatus(maintenanceText.siteIconUploadTooLarge);
        return;
      }

      setStatus(maintenanceText.siteIconUploadInvalid);
    }
  }

  async function saveSecuritySettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    clearMessage();
    setSecurityInvalidField(null);

    const rejectSecurityField = (field: "current" | "new" | "confirm", message: string) => {
      setSecurityInvalidField(field);
      setStatus(message);
      form
        .querySelector<HTMLInputElement>(`[data-security-field="${field}"]`)
        ?.focus();
    };

    if (!securityForm.currentPassword.trim()) {
      rejectSecurityField("current", maintenanceText.securityCurrentRequired);
      return;
    }

    if (!securityForm.newPassword.trim()) {
      rejectSecurityField("new", maintenanceText.securityNewRequired);
      return;
    }

    if (!securityForm.confirmPassword.trim()) {
      rejectSecurityField("confirm", maintenanceText.securityConfirmRequired);
      return;
    }

    const currentPassword = securityForm.currentPassword.trim();
    const newPassword = securityForm.newPassword.trim();
    const confirmPassword = securityForm.confirmPassword.trim();

    if (newPassword !== confirmPassword) {
      rejectSecurityField("confirm", maintenanceText.securityMismatch);
      return;
    }

    if (newPassword === currentPassword) {
      rejectSecurityField("new", maintenanceText.securityUnchanged);
      return;
    }

    if (!acquireSettingsWriteLock(`security`)) return;

    setSecuritySaving(true);

    try {
      const result = await updateAdminPassword(
        {
          currentPassword,
          newPassword
        },
        token
      );
      onTokenChange(result.token);
      setSecuritySettings(result.settings);
      setSecurityForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setSecurityInvalidField(null);
      setStatus(maintenanceText.securityUpdated);
    } catch (error) {
      const errorCode =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
          ? error.code
          : "";
      const invalidField = errorCode === "INVALID_PASSWORD"
        ? "current"
        : errorCode === "PASSWORD_UNCHANGED"
          ? "new"
          : null;
      setSecurityInvalidField(invalidField);
      if (invalidField) {
        form
          .querySelector<HTMLInputElement>(`[data-security-field="${invalidField}"]`)
          ?.focus();
      }
      setStatus(getSecurityErrorMessage(error));
    } finally {
      releaseSettingsWriteLock(`security`);
      setSecuritySaving(false);
    }
  }

  async function refreshSettingsAfterMaintenance() {
    const [source, proxy, configuration, umami, telegram] = await Promise.all([
      loadSourceSettings(token),
      loadProxySettings(),
      loadSiteConfiguration(),
      loadUmamiSettings(token),
      loadTelegramSettings(token)
    ]);
    const normalizedProxy = {
      enabled: proxy.enabled,
      baseUrl: normalizeProxyBaseUrl(proxy.baseUrl),
      mode: normalizeProxyMode(proxy.mode),
      scope: normalizeProxyScope(proxy.scope)
    };

    setSourceSettings(source);
    setProxyForm(normalizedProxy);
    onProxySettingsChange(normalizedProxy);
    syncSiteSettingsForm(configuration.settings);
    locallyAppliedSiteSettingsSignatureRef.current =
      createSiteSettingsSignature(configuration.settings);
    onSiteSettingsChange(configuration.settings);
    applyUmamiSettingsState(umami);
    onTelegramSettingsChange(telegram);
  }

  async function factoryReset() {
    if (maintenanceMutationRef.current) {
      return;
    }

    maintenanceMutationRef.current = true;
    setFactoryResetting(true);
    clearMessage();

    try {
      const result = await resetFactorySettings(token);
      await refreshSettingsAfterMaintenance();
      setBackupFileName("");
      setBackupPayload(null);
      await onDataRestored();
      setStatus(maintenanceText.resetDone(result));
      setPendingFactoryReset(false);
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      maintenanceMutationRef.current = false;
      setFactoryResetting(false);
    }
  }

  async function resetPrivacyPage() {
    if (!acquireSettingsWriteLock(`site-privacy`)) return;
    setPrivacyResetting(true);
    clearMessage();

    try {
      const settings = await enqueueSiteSettingsMutation(() =>
        patchSiteSettings(
          {
            section: "privacy",
            privacyContent: { zh: "", en: "" }
          },
          token
        )
      );
      applySiteSettingsResponse(settings, "privacy");
      setStatus(maintenanceText.privacyResetDone);
    } catch (error) {
      setStatus(getSiteSettingsErrorMessage(error));
    } finally {
      releaseSettingsWriteLock(`site-privacy`);
      setPrivacyResetting(false);
    }
  }

  async function resetTermsPage() {
    if (!acquireSettingsWriteLock(`site-terms`)) return;
    setTermsResetting(true);
    clearMessage();

    try {
      const settings = await enqueueSiteSettingsMutation(() =>
        patchSiteSettings(
          {
            section: "terms",
            termsContent: { zh: "", en: "" }
          },
          token
        )
      );
      applySiteSettingsResponse(settings, "terms");
      setStatus(maintenanceText.termsResetDone);
    } catch (error) {
      setStatus(getSiteSettingsErrorMessage(error));
    } finally {
      releaseSettingsWriteLock(`site-terms`);
      setTermsResetting(false);
    }
  }

  async function exportBackup() {
    if (backupExportingRef.current) {
      return;
    }

    backupExportingRef.current = true;
    setBackupExporting(true);
    clearMessage();

    try {
      const backup = readBackupPayload(
        await exportBackupData(token),
        maintenanceText
      );
      downloadTextFile(
        createDatedExportFilename("backup", "json"),
        JSON.stringify(backup, null, 2),
        "application/json;charset=utf-8"
      );
      setStatus(maintenanceText.backupExported(backup.counts));
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      backupExportingRef.current = false;
      setBackupExporting(false);
    }
  }

  async function handleBackupFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setBackupFileInvalid(false);

    try {
      validateBackupFileSize(file, maintenanceText);
      const payload = JSON.parse(await file.text()) as unknown;
      const backup = readBackupPayload(payload, maintenanceText);
      setBackupFileName(file.name);
      setBackupPayload(backup);
      setStatus(maintenanceText.backupReady(file.name, backup.counts));
    } catch (error) {
      setBackupFileName("");
      setBackupPayload(null);
      setBackupFileInvalid(true);
      setStatus(
        error instanceof Error && error.message === maintenanceText.backupTooLarge
          ? maintenanceText.backupTooLarge
          : maintenanceText.backupInvalid
      );
    }
  }

  async function restoreBackup() {
    if (!backupPayload) {
      setStatus(maintenanceText.backupEmpty);
      return;
    }

    if (maintenanceMutationRef.current) {
      return;
    }

    maintenanceMutationRef.current = true;
    setBackupRestoring(true);
    clearMessage();

    try {
      const result = await restoreBackupData(backupPayload, token);
      await refreshSettingsAfterMaintenance();
      await onDataRestored();
      const summary = maintenanceText.backupRestoreSummary(result);
      setStatus(summary);
      setBackupFileName("");
      setBackupPayload(null);
      setPendingBackupRestore(false);
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      maintenanceMutationRef.current = false;
      setBackupRestoring(false);
    }
  }

  const publicSourceEnabled = sourceSettings?.enabled ?? false;
  const publicSourceUrl =
    sourceSettings?.sourceUrl ?? new URL("/api/htools.json", window.location.origin).toString();
  const proxyEnabled = proxySettings.enabled;
  const footerForm = getFooterFormValues(siteForm);
  const persistedFooterForm = getFooterFormValues(persistedSiteSettings);
  const homeHeroForm = {
    zh: getHomeHeroFormContent(siteForm, "zh"),
    en: getHomeHeroFormContent(siteForm, "en")
  };
  const persistedHomeHeroForm = {
    zh: getHomeHeroFormContent(persistedSiteSettings, "zh"),
    en: getHomeHeroFormContent(persistedSiteSettings, "en")
  };
  const privacyForm = siteForm.privacyContent ?? { zh: "", en: "" };
  const termsForm = siteForm.termsContent ?? { zh: "", en: "" };
  const aboutForm = siteForm.aboutContent;
  const persistedFooter = getSiteFooterSettings(persistedSiteSettings);
  const siteIdentityDirty =
    siteForm.name !== persistedSiteSettings.name ||
    siteForm.subtitle !== persistedSiteSettings.subtitle ||
    siteForm.iconUrl !== persistedSiteSettings.iconUrl;
  const aboutPageDirty =
    JSON.stringify(siteForm.aboutContent) !==
    JSON.stringify(persistedSiteSettings.aboutContent);
  const privacyPageDirty =
    JSON.stringify(siteForm.privacyContent) !==
    JSON.stringify(persistedSiteSettings.privacyContent);
  const termsPageDirty =
    JSON.stringify(siteForm.termsContent) !==
    JSON.stringify(persistedSiteSettings.termsContent);
  const footerSettingsDirty =
    JSON.stringify(footerForm) !== JSON.stringify(persistedFooterForm) ||
    footerSocialLinksText !== formatFooterJson(persistedFooter.socialLinks) ||
    footerGroupsText !== formatFooterJson(persistedFooter.groups);
  const homeHeroDirty =
    JSON.stringify(homeHeroForm) !== JSON.stringify(persistedHomeHeroForm);
  const proxySettingsDirty =
    normalizeProxyBaseUrl(proxyForm.baseUrl) !==
      normalizeProxyBaseUrl(proxySettings.baseUrl) ||
    normalizeProxyMode(proxyForm.mode) !== normalizeProxyMode(proxySettings.mode) ||
    normalizeProxyScope(proxyForm.scope) !== normalizeProxyScope(proxySettings.scope);
  const umamiSettingsDirty = Boolean(
    umamiSettings &&
      (umamiForm.scriptUrl.trim() !== umamiSettings.scriptUrl ||
        umamiForm.websiteId.trim() !== umamiSettings.websiteId)
  );
  const securitySettingsDirty = Object.values(securityForm).some((value) =>
    Boolean(value.trim())
  );
  const hasUnsavedSettings =
    siteIdentityDirty ||
    aboutPageDirty ||
    privacyPageDirty ||
    termsPageDirty ||
    homeHeroDirty ||
    footerSettingsDirty ||
    githubSettingsDirty ||
    proxySettingsDirty ||
    umamiSettingsDirty ||
    securitySettingsDirty;

  function requestBackupRestore() {
    if (hasUnsavedSettings) {
      setPendingDiscardAction("backup");
      return;
    }

    setPendingBackupRestore(true);
  }

  function requestFactoryReset() {
    setPendingFactoryReset(true);
  }
  const siteIdentityBusy = siteSaving || siteResetting;
  const aboutPageBusy = aboutSaving || aboutResetting;
  const privacyPageBusy = privacySaving || privacyResetting;
  const termsPageBusy = termsSaving || termsResetting;
  const footerSettingsBusy = footerSaving || footerResetting;
  const homeHeroBusy = homeSaving || homeResetting;
  const showSiteSettingsSkeleton = useLoadingSkeleton(siteSettingsLoading, 0);
  const showProxySettingsSkeleton = useLoadingSkeleton(proxySettingsLoading, 0);
  const showSourceSettingsSkeleton = useLoadingSkeleton(sourceSettingsLoading, 0);
  const showTurnstileSettingsSkeleton = useLoadingSkeleton(turnstileSettingsLoading, 0);
  const showUmamiSettingsSkeleton = useLoadingSkeleton(umamiSettingsLoading, 0);
  const showSecuritySettingsSkeleton = useLoadingSkeleton(securitySettingsLoading, 0);

  const settingsGroups: Array<{
    id: AdminSystemSettingsGroup;
    label: string;
  }> = [
    {
      id: "site",
      label: maintenanceText.systemGroupGeneral
    },
    {
      id: "services",
      label: maintenanceText.systemGroupIntegrations
    },
    {
      id: "management",
      label: maintenanceText.systemGroupSecurity
    }
  ];

  const settingsTabs = (
    <div
      className="admin-segmented-toggle system-settings-tabs"
      role="tablist"
      aria-label={maintenanceText.systemTitle}
    >
      {settingsGroups.map((group, index) => {
        const selected = activeSettingsGroup === group.id;

        return (
          <button
            aria-controls={`system-settings-panel-${group.id}`}
            aria-selected={selected}
            className={`admin-segmented-toggle-option system-settings-tab ${
              selected ? "is-active" : ""
            }`}
            id={`system-settings-tab-${group.id}`}
            key={group.id}
            onClick={() => {
              if (!selected) {
                selectSettingsGroup(group.id);
              }
            }}
            onKeyDown={(event) => handleSettingsGroupKeyDown(event, index)}
            ref={(element) => {
              settingsGroupTabRefs.current[index] = element;
            }}
            role="tab"
            tabIndex={selected ? 0 : -1}
            type="button"
          >
            {group.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {settingsTopbarTarget
        ? createPortal(settingsTabs, settingsTopbarTarget)
        : null}
      <section
        className="admin-system-settings"
        aria-label={maintenanceText.systemTitle}
      >
      <div
        className={`system-settings-grid is-${activeSettingsGroup}`}
      >
        <div
          aria-labelledby="system-settings-tab-site"
          className="system-settings-column system-settings-primary system-settings-group-panel"
          hidden={activeSettingsGroup !== "site"}
          id="system-settings-panel-site"
          role="tabpanel"
        >
          {siteSettingsLoading ? (
            <SkeletonVisibility visible={showSiteSettingsSkeleton}>
              <SiteSettingsGroupSkeleton />
            </SkeletonVisibility>
          ) : siteSettingsError ? (
            <article className="source-public-card settings-load-error-card">
              <div className="settings-card-error" role="alert">
                <h3>{maintenanceText.systemGroupGeneral}</h3>
                <p>{siteSettingsError}</p>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => void loadSiteSettingsCards()}
                >
                  {maintenanceText.systemRetry}
                </button>
              </div>
            </article>
          ) : (
          <>
          <article className="source-public-card site-identity-card">
          <div>
            <h3>{maintenanceText.siteTitle}</h3>
            <p id="site-identity-description">{maintenanceText.siteDescription}</p>
          </div>
          <form aria-describedby="site-identity-description" className="proxy-settings-form" onSubmit={saveSiteIdentityForm}>
            <div className="settings-grid">
              <label className="source-url-field">
                {maintenanceText.siteNameLabel}
                <input
                  disabled={siteIdentityBusy}
                  maxLength={40}
                  onChange={(event) =>
                    setSiteForm({
                      ...siteForm,
                      name: event.target.value
                    })
                  }
                  placeholder={DEFAULT_SITE_SETTINGS.name}
                  value={siteForm.name}
                />
              </label>
              <label className="source-url-field">
                {maintenanceText.siteSubtitleLabel}
                <input
                  disabled={siteIdentityBusy}
                  maxLength={60}
                  onChange={(event) =>
                    setSiteForm({
                      ...siteForm,
                      subtitle: event.target.value
                    })
                  }
                  placeholder={DEFAULT_SITE_SETTINGS.subtitle}
                  value={siteForm.subtitle}
                />
              </label>
            </div>
            <label className="source-url-field">
              {maintenanceText.siteIconLabel}
              <input
                aria-describedby="site-icon-help"
                disabled={siteIdentityBusy}
                inputMode="url"
                onChange={(event) => {
                  setSiteIconFileName("");
                  setSiteIconFileInvalid(false);
                  setSiteForm({
                    ...siteForm,
                    iconUrl: event.target.value
                  });
                }}
                placeholder={maintenanceText.siteIconPlaceholder}
                type="url"
                value={isSiteIconDataUrl(siteForm.iconUrl) ? "" : siteForm.iconUrl}
              />
            </label>
            <p className="site-icon-choice-help" id="site-icon-help">
              {maintenanceText.siteIconChoiceHelp}
            </p>
            <div className="site-identity-footer">
              <div className="site-identity-preview-shell">
                <div className="site-identity-preview">
                  <span
                    className={`brand-mark compact-mark ${
                      sitePreviewIconUrl && !sitePreviewFailed ? "has-site-icon" : ""
                    }`.trim()}
                  >
                    {sitePreviewIconUrl && !sitePreviewFailed ? (
                      <img
                        className="site-brand-icon"
                        src={sitePreviewIconSrc}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        onError={handleSitePreviewError}
                      />
                    ) : (
                      <Wand2 size={25} />
                    )}
                  </span>
                  <span>
                    <strong>{siteForm.name.trim() || DEFAULT_SITE_SETTINGS.name}</strong>
                    <small>{siteForm.subtitle.trim() || DEFAULT_SITE_SETTINGS.subtitle}</small>
                  </span>
                </div>
                <label
                  aria-describedby="site-icon-help site-icon-upload-status admin-operation-status"
                  aria-label={maintenanceText.siteIconUpload}
                  className="icon-button backup-file-picker site-icon-upload-trigger"
                  title={
                    siteIconFileName
                      ? `${maintenanceText.siteIconUploaded}: ${siteIconFileName}`
                      : maintenanceText.siteIconUpload
                  }
                >
                  <Upload size={17} />
                  <input
                    accept={SITE_ICON_UPLOAD_ACCEPT}
                    aria-describedby="site-icon-help site-icon-upload-status admin-operation-status"
                    aria-invalid={siteIconFileInvalid}
                    disabled={siteIdentityBusy}
                    type="file"
                    onChange={handleSiteIconFile}
                  />
                </label>
                <span aria-live="polite" className="visually-hidden" id="site-icon-upload-status">
                  {siteIconFileName
                    ? `${maintenanceText.siteIconUploaded}: ${siteIconFileName}`
                    : ""}
                </span>
              </div>
              <div className="site-identity-actions">
                <button
                  className="primary-button"
                  disabled={siteIdentityBusy || !siteIdentityDirty}
                  type="submit"
                >
                  {maintenanceText.siteSave}
                </button>
                <button
                  className="ghost-button settings-reset-button"
                  disabled={siteIdentityBusy}
                  type="button"
                  onClick={() => void resetSiteIdentity()}
                >
                  {maintenanceText.siteReset}
                </button>
              </div>
            </div>
          </form>
          </article>

          <article className="source-public-card home-copy-settings-card">
          <div>
            <h3>{maintenanceText.homeSettingsTitle}</h3>
            <p id="home-copy-settings-description">{maintenanceText.homeSettingsDescription}</p>
          </div>
          <form aria-describedby="home-copy-settings-description" className="home-copy-settings-form" onSubmit={saveHomeHeroForm}>
            <div className="home-copy-language-group">
              <h4>{maintenanceText.homeChinese}</h4>
              <label className="source-url-field">
                {maintenanceText.homeTitleTop}
                <input
                  disabled={homeHeroBusy}
                  maxLength={80}
                  value={homeHeroForm.zh.titleTop}
                  onChange={(event) =>
                    updateHomeHeroForm("zh", { titleTop: event.target.value })
                  }
                />
              </label>
              <label className="source-url-field">
                {maintenanceText.homeTitleBottom}
                <input
                  disabled={homeHeroBusy}
                  maxLength={80}
                  value={homeHeroForm.zh.titleBottom}
                  onChange={(event) =>
                    updateHomeHeroForm("zh", { titleBottom: event.target.value })
                  }
                />
              </label>
              <label className="source-url-field home-copy-description-field">
                {maintenanceText.homeDescription}
                <textarea
                  disabled={homeHeroBusy}
                  maxLength={240}
                  rows={3}
                  value={homeHeroForm.zh.description}
                  onChange={(event) =>
                    updateHomeHeroForm("zh", { description: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="home-copy-language-group">
              <h4>{maintenanceText.homeEnglish}</h4>
              <label className="source-url-field">
                {maintenanceText.homeTitleTop}
                <input
                  disabled={homeHeroBusy}
                  maxLength={80}
                  value={homeHeroForm.en.titleTop}
                  onChange={(event) =>
                    updateHomeHeroForm("en", { titleTop: event.target.value })
                  }
                />
              </label>
              <label className="source-url-field">
                {maintenanceText.homeTitleBottom}
                <input
                  disabled={homeHeroBusy}
                  maxLength={80}
                  value={homeHeroForm.en.titleBottom}
                  onChange={(event) =>
                    updateHomeHeroForm("en", { titleBottom: event.target.value })
                  }
                />
              </label>
              <label className="source-url-field home-copy-description-field">
                {maintenanceText.homeDescription}
                <textarea
                  disabled={homeHeroBusy}
                  maxLength={240}
                  rows={3}
                  value={homeHeroForm.en.description}
                  onChange={(event) =>
                    updateHomeHeroForm("en", { description: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="source-public-actions">
              <button
                className="primary-button"
                disabled={homeHeroBusy || !homeHeroDirty}
                type="submit"
              >
                {maintenanceText.homeSave}
              </button>
              <button
                className="ghost-button settings-reset-button"
                disabled={homeHeroBusy}
                type="button"
                onClick={() => void resetHomeHeroSettings()}
              >
                {maintenanceText.homeReset}
              </button>
            </div>
          </form>
          </article>

          <article className="source-public-card footer-settings-card">
          <div>
            <h3>{maintenanceText.footerTitle}</h3>
            <p id="footer-settings-description">{maintenanceText.footerDescription}</p>
          </div>
          <form aria-describedby="footer-settings-description footer-json-help" className="footer-settings-form" onSubmit={saveFooterSettingsForm}>
            <label className="source-url-field">
              {maintenanceText.footerIntroLabel}
              <input
                disabled={footerSettingsBusy}
                maxLength={180}
                placeholder={DEFAULT_FOOTER_SETTINGS.description}
                value={footerForm.description}
                onChange={(event) =>
                  updateFooterForm({ description: event.target.value })
                }
              />
            </label>
            <div className="footer-settings-pair">
              <label className="source-url-field">
                {maintenanceText.footerSponsorLabel}
                <input
                  disabled={footerSettingsBusy}
                  maxLength={48}
                  placeholder={DEFAULT_FOOTER_SETTINGS.sponsorLabel}
                  value={footerForm.sponsorLabel}
                  onChange={(event) =>
                    updateFooterForm({ sponsorLabel: event.target.value })
                  }
                />
              </label>
              <label className="source-url-field">
                {maintenanceText.footerSponsorUrl}
                <input
                  disabled={footerSettingsBusy}
                  inputMode="url"
                  placeholder={DEFAULT_FOOTER_SETTINGS.sponsorUrl}
                  value={footerForm.sponsorUrl}
                  onChange={(event) =>
                    updateFooterForm({ sponsorUrl: event.target.value })
                  }
                />
              </label>
            </div>
            <label className="source-url-field footer-social-links-field">
              {maintenanceText.footerSocialLinks}
              <textarea
                aria-describedby={footerInvalidField === "social" ? "footer-json-help admin-operation-status" : "footer-json-help"}
                aria-invalid={footerInvalidField === "social"}
                data-footer-json="social"
                disabled={footerSettingsBusy}
                rows={6}
                value={footerSocialLinksText}
                onChange={(event) => {
                  setFooterSocialLinksText(event.target.value);
                  if (footerInvalidField === "social") setFooterInvalidField(null);
                }}
              />
            </label>
            <label className="source-url-field">
              {maintenanceText.footerGroups}
              <textarea
                aria-describedby={footerInvalidField === "groups" ? "footer-json-help admin-operation-status" : "footer-json-help"}
                aria-invalid={footerInvalidField === "groups"}
                data-footer-json="groups"
                disabled={footerSettingsBusy}
                rows={8}
                value={footerGroupsText}
                onChange={(event) => {
                  setFooterGroupsText(event.target.value);
                  if (footerInvalidField === "groups") setFooterInvalidField(null);
                }}
              />
            </label>
            <p className="site-icon-choice-help" id="footer-json-help">{maintenanceText.footerJsonHelp}</p>
            <div className="source-public-actions">
              <button
                className="primary-button"
                disabled={footerSettingsBusy || !footerSettingsDirty}
                type="submit"
              >
                {maintenanceText.footerSave}
              </button>
              <button
                className="ghost-button settings-reset-button"
                disabled={footerSettingsBusy}
                type="button"
                onClick={() => void resetFooterSettings()}
              >
                {maintenanceText.footerReset}
              </button>
            </div>
          </form>
          </article>
          <LegalSettingsCard
            busy={aboutPageBusy}
            chineseLabel={maintenanceText.legalChinese}
            content={aboutForm}
            description={maintenanceText.aboutSettingsDescription}
            dirty={aboutPageDirty}
            englishLabel={maintenanceText.legalEnglish}
            formId="about-settings"
            locale={locale}
            onChange={(locale, value) =>
              setSiteForm({
                ...siteForm,
                aboutContent: { ...aboutForm, [locale]: value }
              })
            }
            onReset={() => void resetAboutPage()}
            onSubmit={saveAboutPageForm}
            proxySettings={proxySettings}
            resetLabel={maintenanceText.aboutReset}
            saveLabel={maintenanceText.aboutSave}
            text={t.markdownEditor}
            title={maintenanceText.aboutSettingsTitle}
          />

          <LegalSettingsCard
            busy={privacyPageBusy}
            chineseLabel={maintenanceText.legalChinese}
            content={privacyForm}
            description={maintenanceText.privacySettingsDescription}
            dirty={privacyPageDirty}
            englishLabel={maintenanceText.legalEnglish}
            formId="privacy-settings"
            locale={locale}
            onChange={(locale, value) =>
              setSiteForm({
                ...siteForm,
                privacyContent: { ...privacyForm, [locale]: value }
              })
            }
            onReset={() => void resetPrivacyPage()}
            onSubmit={savePrivacyPageForm}
            proxySettings={proxySettings}
            resetLabel={maintenanceText.aboutReset}
            saveLabel={maintenanceText.privacySave}
            text={t.markdownEditor}
            title={maintenanceText.privacySettingsTitle}
          />

          <LegalSettingsCard
            busy={termsPageBusy}
            chineseLabel={maintenanceText.legalChinese}
            content={termsForm}
            description={maintenanceText.termsSettingsDescription}
            dirty={termsPageDirty}
            englishLabel={maintenanceText.legalEnglish}
            formId="terms-settings"
            locale={locale}
            onChange={(locale, value) =>
              setSiteForm({
                ...siteForm,
                termsContent: { ...termsForm, [locale]: value }
              })
            }
            onReset={() => void resetTermsPage()}
            onSubmit={saveTermsPageForm}
            proxySettings={proxySettings}
            resetLabel={maintenanceText.aboutReset}
            saveLabel={maintenanceText.termsSave}
            text={t.markdownEditor}
            title={maintenanceText.termsSettingsTitle}
          />
          </>
          )}
        </div>

        <div
          aria-labelledby="system-settings-tab-services"
          className="system-settings-column system-settings-secondary system-settings-group-panel"
          hidden={activeSettingsGroup !== "services"}
          id="system-settings-panel-services"
          role="tabpanel"
        >
          <div className="integration-settings-stack">
          <article className="source-public-card public-source-card">
          {sourceSettingsLoading ? (
            <SkeletonVisibility visible={showSourceSettingsSkeleton}>
              <div className="admin-settings-card-loading" aria-hidden="true">
                <AdminSettingsCopySkeleton
                  className="source-card-heading"
                  description={maintenanceText.publicDescription}
                  title={maintenanceText.publicTitle}
                  withStatus
                />
                <AdminSettingsFieldSkeleton />
              </div>
            </SkeletonVisibility>
          ) : sourceSettingsError ? (
            <div className="settings-card-error" role="alert">
              <h3>{maintenanceText.publicTitle}</h3>
              <p>{sourceSettingsError}</p>
              <button
                className="ghost-button"
                type="button"
                onClick={() => void loadSourceSettingsCard()}
              >
                {maintenanceText.systemRetry}
              </button>
            </div>
          ) : (
          <>
          <div className="source-card-heading">
            <h3>{maintenanceText.publicTitle}</h3>
            <SettingsStatusBadge
              ariaDescribedBy="public-source-description"
              disabled={sourceSettingsLoading || sourceSettingsSaving}
              disabledLabel={maintenanceText.publicDisabled}
              enabled={publicSourceEnabled}
              enabledLabel={maintenanceText.publicEnabled}
              onChange={() => void togglePublicSource()}
            />
            <p id="public-source-description">{maintenanceText.publicDescription}</p>
          </div>
          <label className="source-url-field">
            <span>{maintenanceText.publicSourceUrlLabel}</span>
            <input
              aria-describedby="public-source-description"
              readOnly
              type="url"
              value={publicSourceUrl}
            />
          </label>
          </>
          )}
          </article>

          <article className="source-public-card github-submission-card">
            <GitHubSettingsForm
              maintenanceText={maintenanceText}
              onDirtyChange={setGitHubSettingsDirty}
              onStatus={setStatus}
              token={token}
              t={t}
            />
          </article>

          <article className="source-public-card umami-settings-card">
          {umamiSettingsLoading ? (
            <SkeletonVisibility visible={showUmamiSettingsSkeleton}>
              <div className="admin-settings-card-loading" aria-hidden="true">
                <AdminSettingsCopySkeleton
                  className="source-card-heading"
                  description={maintenanceText.umamiDescription}
                  title={maintenanceText.umamiTitle}
                  withStatus
                />
                <form className="proxy-settings-form">
                  <AdminSettingsFieldSkeleton />
                  <AdminSettingsFieldSkeleton />
                  <AdminSettingsActionsSkeleton count={1} />
                </form>
              </div>
            </SkeletonVisibility>
          ) : umamiSettingsError ? (
            <div className="settings-card-error" role="alert">
              <h3>{maintenanceText.umamiTitle}</h3>
              <p>{umamiSettingsError}</p>
              <button
                className="ghost-button"
                type="button"
                onClick={() => void loadUmamiSettingsCard()}
              >
                {maintenanceText.systemRetry}
              </button>
            </div>
          ) : (
            <>
              <div className="source-card-heading">
                <h3>{maintenanceText.umamiTitle}</h3>
                <SettingsStatusBadge
                  ariaDescribedBy="umami-settings-description"
                  disabled={
                    umamiSettingsSaving ||
                    (!umamiSettings?.enabled &&
                      !hasCompleteUmamiSettings(
                        umamiSettings ?? { scriptUrl: "", websiteId: "" }
                      ))
                  }
                  disabledLabel={maintenanceText.umamiDisabled}
                  enabled={umamiSettings?.enabled ?? false}
                  enabledLabel={maintenanceText.umamiEnabled}
                  onChange={() => toggleUmami()}
                />
                <p id="umami-settings-description">
                  {maintenanceText.umamiDescription}
                </p>
              </div>
              <form
                aria-describedby="umami-settings-description"
                className="proxy-settings-form"
                onSubmit={saveUmamiForm}
              >
                <label className="source-url-field">
                  {maintenanceText.umamiScriptUrlLabel}
                  <input
                    disabled={umamiSettingsSaving}
                    maxLength={2048}
                    onChange={(event) =>
                      setUmamiForm((current) => ({
                        ...current,
                        scriptUrl: event.target.value
                      }))
                    }
                    placeholder={maintenanceText.umamiScriptUrlPlaceholder}
                    type="url"
                    value={umamiForm.scriptUrl}
                  />
                </label>
                <label className="source-url-field">
                  {maintenanceText.umamiWebsiteIdLabel}
                  <input
                    disabled={umamiSettingsSaving}
                    maxLength={200}
                    onChange={(event) =>
                      setUmamiForm((current) => ({
                        ...current,
                        websiteId: event.target.value
                      }))
                    }
                    placeholder={maintenanceText.umamiWebsiteIdPlaceholder}
                    type="text"
                    value={umamiForm.websiteId}
                  />
                </label>
                <div className="source-public-actions">
                  <button
                    className="ghost-button"
                    disabled={umamiSettingsSaving || !umamiSettingsDirty}
                    type="submit"
                  >
                    {maintenanceText.umamiSave}
                  </button>
                </div>
              </form>
            </>
          )}
          </article>

          </div>

          <div className="integration-settings-proxy">
          <article className="source-public-card turnstile-settings-card">
          {turnstileSettingsLoading ? (
            <SkeletonVisibility visible={showTurnstileSettingsSkeleton}>
              <div className="admin-settings-card-loading" aria-hidden="true">
                <AdminSettingsCopySkeleton
                  className="source-card-heading"
                  description={maintenanceText.turnstileDescription}
                  title={maintenanceText.turnstileTitle}
                  withStatus
                />
                <div className="turnstile-config-help">
                  <AdminSettingsTextMask>
                    {`TURNSTILE_SITE_KEY = ${maintenanceText.turnstileSiteKeyLabel}`}
                  </AdminSettingsTextMask>
                  <AdminSettingsTextMask>
                    {`TURNSTILE_SECRET_KEY = ${maintenanceText.turnstileSecretKeyLabel}`}
                  </AdminSettingsTextMask>
                </div>
              </div>
            </SkeletonVisibility>
          ) : turnstileSettingsError ? (
            <div className="settings-card-error" role="alert">
              <h3>{maintenanceText.turnstileTitle}</h3>
              <p>{turnstileSettingsError}</p>
              <button className="ghost-button" type="button" onClick={() => void loadTurnstileSettingsCard()}>
                {maintenanceText.systemRetry}
              </button>
            </div>
          ) : (
            <>
              <div className="source-card-heading">
                <h3>{maintenanceText.turnstileTitle}</h3>
                <SettingsStatusBadge
                  ariaDescribedBy="turnstile-settings-description turnstile-settings-configuration"
                  disabled={
                    turnstileSettingsSaving || !turnstileSettings?.available
                  }
                  disabledLabel={turnstileSettings?.available
                    ? maintenanceText.turnstileDisabled
                    : maintenanceText.turnstileUnavailable}
                  enabled={turnstileSettings?.enabled ?? false}
                  enabledLabel={maintenanceText.turnstileEnabled}
                  onChange={() => void toggleTurnstile()}
                />
                <p id="turnstile-settings-description">{maintenanceText.turnstileDescription}</p>
                <div className="turnstile-config-help" id="turnstile-settings-configuration">
                  <span>
                    <code>TURNSTILE_SITE_KEY</code>
                    {` = ${maintenanceText.turnstileSiteKeyLabel}`}
                  </span>
                  <span>
                    <code>TURNSTILE_SECRET_KEY</code>
                    {` = ${maintenanceText.turnstileSecretKeyLabel}`}
                  </span>
                </div>
                {!turnstileSettings?.available ? <p>{maintenanceText.turnstileNotConfigured}</p> : null}
              </div>
            </>
          )}
          </article>
          <TelegramSettingsCard
            locale={locale}
            maintenanceText={maintenanceText}
            onReload={onReloadTelegramSettings}
            onSettingsChange={onTelegramSettingsChange}
            setStatus={setStatus}
            settings={telegramSettings}
            settingsError={telegramSettingsLoadError}
            loading={telegramSettingsLoading}
            t={t}
            token={token}
          />
          <article className="source-public-card proxy-settings-card">
          {proxySettingsLoading ? (
            <SkeletonVisibility visible={showProxySettingsSkeleton}>
              <ProxySettingsCardSkeleton maintenanceText={maintenanceText} />
            </SkeletonVisibility>
          ) : proxySettingsError ? (
            <div className="settings-card-error" role="alert">
              <h3>{maintenanceText.proxyTitle}</h3>
              <p>{proxySettingsError}</p>
              <button
                className="ghost-button"
                type="button"
                onClick={() => void loadProxySettingsCard()}
              >
                {maintenanceText.systemRetry}
              </button>
            </div>
          ) : (
          <>
          <div className="source-card-heading">
            <h3>{maintenanceText.proxyTitle}</h3>
            <SettingsStatusBadge
              ariaDescribedBy="proxy-settings-description proxy-settings-help"
              disabled={
                proxySaving ||
                (!proxyEnabled && !normalizeProxyBaseUrl(proxySettings.baseUrl))
              }
              disabledLabel={maintenanceText.proxyDisabled}
              enabled={proxyEnabled}
              enabledLabel={maintenanceText.proxyEnabled}
              onChange={toggleProxy}
            />
            <p id="proxy-settings-description">{maintenanceText.proxyDescription}</p>
          </div>
          <form
            aria-describedby="proxy-settings-description proxy-settings-help"
            className="proxy-settings-form"
            onSubmit={saveProxyForm}
          >
            <label className="source-url-field">
              {maintenanceText.proxyUrlLabel}
              <input
                disabled={proxySaving}
                onChange={(event) =>
                  setProxyForm({
                    ...proxyForm,
                    baseUrl: event.target.value
                  })
                }
                placeholder={maintenanceText.proxyPlaceholder}
                type="url"
                value={proxyForm.baseUrl}
              />
            </label>
            <label className="source-url-field">
              {maintenanceText.proxyScopeLabel}
              <select
                disabled={proxySaving}
                onChange={(event) =>
                  setProxyForm({
                    ...proxyForm,
                    scope: normalizeProxyScope(event.target.value)
                  })
                }
                value={normalizeProxyScope(proxyForm.scope)}
              >
                <option value="all">{maintenanceText.proxyScopeAll}</option>
                <option value="images">{maintenanceText.proxyScopeImages}</option>
              </select>
            </label>
            <label className="source-url-field">
              {maintenanceText.proxyModeLabel}
              <select
                disabled={proxySaving}
                onChange={(event) =>
                  setProxyForm({
                    ...proxyForm,
                    mode: normalizeProxyMode(event.target.value)
                  })
                }
                value={normalizeProxyMode(proxyForm.mode)}
              >
                <option value="prefix">{maintenanceText.proxyModePrefix}</option>
                <option value="edgeone-proxy">
                  {maintenanceText.proxyModeEdgeOneProxy}
                </option>
                <option value="edgeone-advanced">
                  {maintenanceText.proxyModeEdgeOneAdvanced}
                </option>
              </select>
            </label>
            <div className="proxy-settings-help" id="proxy-settings-help">
              <p>{maintenanceText.proxyHelp}</p>
              <a
                className="proxy-project-link"
                href={EDGEONE_PROXY_PROJECT_URL}
                rel="noreferrer"
                target="_blank"
              >
                {maintenanceText.proxyProjectLink}
              </a>
            </div>
            <div className="source-public-actions">
              <button
                className="ghost-button"
                disabled={proxySaving || !proxySettingsDirty}
                type="submit"
              >
                {maintenanceText.proxySave}
              </button>
            </div>
          </form>
          </>
          )}
          </article>
          </div>
        </div>

        <div
          aria-labelledby="system-settings-tab-management"
          className="system-settings-column system-settings-secondary system-settings-group-panel"
          hidden={activeSettingsGroup !== "management"}
          id="system-settings-panel-management"
          role="tabpanel"
        >
          <div className="security-settings-stack">
          <article className="source-public-card admin-security-card">
          {securitySettingsLoading ? (
            <SkeletonVisibility visible={showSecuritySettingsSkeleton}>
              <div className="admin-settings-card-loading" aria-hidden="true">
                <AdminSettingsCopySkeleton
                  description={maintenanceText.securityDescription}
                  title={maintenanceText.securityTitle}
                />
                <form className="admin-security-form">
                  <AdminSettingsFieldSkeleton />
                  <AdminSettingsFieldSkeleton />
                  <AdminSettingsFieldSkeleton />
                  <span className="skeleton-shimmer admin-settings-button-skeleton" />
                </form>
              </div>
            </SkeletonVisibility>
          ) : securitySettingsError ? (
            <div className="settings-card-error" role="alert">
              <h3>{maintenanceText.securityTitle}</h3>
              <p>{securitySettingsError}</p>
              <button
                className="ghost-button"
                type="button"
                onClick={() => void loadSecuritySettingsCard()}
              >
                {maintenanceText.systemRetry}
              </button>
            </div>
          ) : (
            <>
              <div>
                <h3>{maintenanceText.securityTitle}</h3>
                <p id="security-settings-description">{maintenanceText.securityDescription}</p>
                {securitySettings?.updatedAt ? (
                  <p>
                    {maintenanceText.securityUpdatedAt(
                      formatAdminDate(securitySettings.updatedAt)
                    )}
                  </p>
                ) : null}
              </div>
              <form aria-describedby="security-settings-description" className="admin-security-form" onSubmit={saveSecuritySettings}>
                <label>
                  {maintenanceText.securityCurrent}
                  <input
                    aria-describedby={securityInvalidField === "current" ? "security-settings-description admin-operation-status" : "security-settings-description"}
                    aria-invalid={securityInvalidField === "current"}
                    autoComplete="current-password"
                    data-security-field="current"
                    disabled={securitySaving}
                    type="password"
                    value={securityForm.currentPassword}
                    onChange={(event) => {
                      setSecurityForm({
                        ...securityForm,
                        currentPassword: event.target.value
                      });
                      if (securityInvalidField === "current") setSecurityInvalidField(null);
                    }}
                  />
                </label>
                <label>
                  {maintenanceText.securityNew}
                  <input
                    aria-describedby={securityInvalidField === "new" ? "security-settings-description admin-operation-status" : "security-settings-description"}
                    aria-invalid={securityInvalidField === "new"}
                    autoComplete="new-password"
                    data-security-field="new"
                    disabled={securitySaving}
                    type="password"
                    value={securityForm.newPassword}
                    onChange={(event) => {
                      setSecurityForm({
                        ...securityForm,
                        newPassword: event.target.value
                      });
                      if (securityInvalidField === "new") setSecurityInvalidField(null);
                    }}
                  />
                </label>
                <label>
                  {maintenanceText.securityConfirm}
                  <input
                    aria-describedby={securityInvalidField === "confirm" ? "security-settings-description admin-operation-status" : "security-settings-description"}
                    aria-invalid={securityInvalidField === "confirm"}
                    autoComplete="new-password"
                    data-security-field="confirm"
                    disabled={securitySaving}
                    type="password"
                    value={securityForm.confirmPassword}
                    onChange={(event) => {
                      setSecurityForm({
                        ...securityForm,
                        confirmPassword: event.target.value
                      });
                      if (securityInvalidField === "confirm") setSecurityInvalidField(null);
                    }}
                  />
                </label>
                <button
                  className="primary-button"
                  disabled={securitySaving || !securitySettingsDirty}
                  type="submit"
                >
                  {maintenanceText.securitySave}
                </button>
              </form>
            </>
          )}
          </article>

          <article className="source-public-card factory-reset-card">
          {securitySettingsLoading ? (
            <SkeletonVisibility visible={showSecuritySettingsSkeleton}>
              <FactoryResetCardSkeleton maintenanceText={maintenanceText} />
            </SkeletonVisibility>
          ) : (
          <>
          <div>
            <h3>{maintenanceText.resetTitle}</h3>
            <p id="factory-reset-description">{maintenanceText.resetDescription}</p>
            <p id="factory-reset-warning">{maintenanceText.resetWarning}</p>
          </div>
          <div className="source-public-actions">
            <button
              aria-describedby="factory-reset-description factory-reset-warning"
              className="primary-button"
              disabled={factoryResetting}
              type="button"
              onClick={requestFactoryReset}
            >
              {maintenanceText.resetButton}
            </button>
          </div>
          </>
          )}
          </article>
          </div>

          <div className="security-settings-backup">
          <article className="source-public-card backup-restore-card">
          {securitySettingsLoading ? (
            <SkeletonVisibility visible={showSecuritySettingsSkeleton}>
              <BackupRestoreCardSkeleton maintenanceText={maintenanceText} />
            </SkeletonVisibility>
          ) : (
          <>
          <div>
            <h3>{maintenanceText.backupTitle}</h3>
            <p id="backup-settings-description">{maintenanceText.backupDescription}</p>
            <p id="backup-settings-help">{maintenanceText.backupHelp}</p>
          </div>
          {backupFileName ? <code>{backupFileName}</code> : null}
          <span aria-live="polite" className="visually-hidden" id="backup-file-status">
            {backupFileName}
          </span>
          <div className="source-public-actions">
            <button
              aria-describedby="backup-settings-description backup-settings-help"
              className="primary-button"
              disabled={backupExporting || backupRestoring}
              type="button"
              onClick={() => void exportBackup()}
            >
              {maintenanceText.backupExport}
            </button>
            <label aria-describedby="backup-settings-description backup-settings-help backup-file-status admin-operation-status" className="ghost-button backup-file-picker">
              {maintenanceText.backupChoose}
              <input
                accept="application/json,.json"
                aria-describedby="backup-settings-description backup-settings-help backup-file-status admin-operation-status"
                aria-invalid={backupFileInvalid}
                type="file"
                onChange={handleBackupFile}
              />
            </label>
            <button
              aria-describedby="backup-settings-description backup-settings-help"
              className="ghost-button"
              disabled={!backupPayload || backupExporting || backupRestoring}
              type="button"
              onClick={() => {
                if (!backupPayload) {
                  setStatus(maintenanceText.backupEmpty);
                  return;
                }

                requestBackupRestore();
              }}
            >
              {maintenanceText.backupRestore}
            </button>
          </div>
          </>
          )}
          </article>
          </div>
        </div>
      </div>

      {pendingDiscardAction ? (
        <AdminConfirmDialog
          cancelLabel={maintenanceText.unsavedStay}
          closeLabel={t.actions.close}
          confirmLabel={maintenanceText.unsavedLeave}
          descriptionId="unsaved-settings-dialog-description"
          description={maintenanceText.unsavedDescription}
          title={maintenanceText.unsavedTitle}
          onCancel={() => setPendingDiscardAction(null)}
          onConfirm={() => {
            setPendingDiscardAction(null);
            setPendingBackupRestore(true);
          }}
        />
      ) : null}

      {pendingBackupRestore ? (
        <AdminConfirmDialog
          cancelLabel={t.status.deleteCancel}
          closeLabel={t.actions.close}
          confirmLabel={t.actions.confirm}
          descriptionId="backup-restore-dialog-description"
          description={
            backupPayload
              ? maintenanceText.backupRestoreConfirm(backupPayload.counts)
              : maintenanceText.backupEmpty
          }
          title={maintenanceText.backupTitle}
          disabled={backupRestoring}
          onCancel={() => {
            if (!backupRestoring) {
              setPendingBackupRestore(false);
            }
          }}
          onConfirm={() => void restoreBackup()}
        />
      ) : null}

      {pendingFactoryReset ? (
        <AdminConfirmDialog
          cancelLabel={t.status.deleteCancel}
          closeLabel={t.actions.close}
          confirmLabel={t.actions.confirm}
          descriptionId="factory-reset-dialog-description"
          description={maintenanceText.resetConfirm}
          title={maintenanceText.resetTitle}
          disabled={factoryResetting}
          onCancel={() => {
            if (!factoryResetting) {
              setPendingFactoryReset(false);
            }
          }}
          onConfirm={() => void factoryReset()}
        />
      ) : null}
      </section>
    </>
  );
}

type AdminMaintenanceSection = "import-export" | "link-check";

function AdminLinkCheckPanel({
  isLoadingTools,
  maintenanceText,
  onReloadTools,
  proxySettings,
  section,
  setStatus,
  t,
  token,
  tools
}: {
  isLoadingTools: boolean;
  maintenanceText: ReturnType<typeof getAdminMaintenanceText>;
  onReloadTools: () => Promise<void>;
  proxySettings: ProxySettings;
  section: AdminMaintenanceSection;
  setStatus: (status: string) => void;
  t: Messages;
  token: string;
  tools: Tool[];
}) {
  const [timeoutSeconds, setTimeoutSeconds] = useState(6);
  const [batchSize, setBatchSize] = useState(4);
  const [sourceUrl, setSourceUrl] = useState(DEFAULT_SOURCE_URL);
  const [sourceMode, setSourceMode] = useState<ToolImportMode>("skip");
  const [sourceItems, setSourceItems] = useState<unknown[] | null>(null);
  const [checkedSourceUrl, setCheckedSourceUrl] = useState("");
  const [sourceChecking, setSourceChecking] = useState(false);
  const [sourceImporting, setSourceImporting] = useState(false);
  const [sourceExporting, setSourceExporting] = useState(false);
  const [results, setResults] = useState<LinkCheckResult[]>([]);
  const [activeFilter, setActiveFilter] = useState("abnormal");
  const [checking, setChecking] = useState(false);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [wasStopped, setWasStopped] = useState(false);
  const stopRequested = useRef(false);

  const targets = useMemo(() => buildLinkCheckTargets(tools), [tools]);
  const toolById = useMemo(
    () => new Map(tools.map((tool) => [tool.id, tool])),
    [tools]
  );
  const sourcePreview = useMemo(
    () =>
      sourceItems
        ? createSourcePreview(sourceItems, tools, sourceMode, maintenanceText)
        : null,
    [maintenanceText, sourceItems, sourceMode, tools]
  );
  const displayedSourcePreview = sourcePreview ?? {
    total: 0,
    valid: 0,
    duplicateInSource: 0,
    duplicateInSite: 0,
    invalid: 0,
    willCreate: 0,
    willUpdate: 0,
    willSkip: 0
  };
  const totalCount = targets.length;
  const checkedCount = results.length;
  const normalCount = results.filter((result) => result.ok).length;
  const abnormalCount = results.filter((result) => !result.ok).length;
  const networkErrorCount = results.filter((result) => result.status === 0).length;
  const progress = totalCount ? Math.round((checkedCount / totalCount) * 100) : 0;
  const completed = totalCount > 0 && checkedCount === totalCount && !checking;
  const statusItems = useMemo(() => {
    const counts = new Map<number, number>();

    for (const result of results.filter((item) => !item.ok)) {
      counts.set(result.status, (counts.get(result.status) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .sort(([left], [right]) => left - right)
      .map(([status, count]) => ({
        status,
        count,
        value: `status:${status}`
      }));
  }, [results]);
  const filteredResults = useMemo(() => {
    if (activeFilter === "all") {
      return results;
    }

    if (activeFilter === "abnormal") {
      return results.filter((result) => !result.ok);
    }

    if (activeFilter.startsWith("status:")) {
      const status = Number(activeFilter.replace("status:", ""));
      return results.filter((result) => result.status === status);
    }

    return results;
  }, [activeFilter, results]);
  const emptyMessage = !results.length
    ? t.linkCheck.emptyNotStarted
    : completed && activeFilter === "abnormal" && abnormalCount === 0
      ? t.linkCheck.emptyNoBrokenLinks
      : t.linkCheck.emptyNoMatchingResults;
  const showToolsLoadingSkeleton = useLoadingSkeleton(isLoadingTools);

  if (isLoadingTools) {
    return (
      <SkeletonVisibility visible={showToolsLoadingSkeleton}>
        <AdminLinkCheckSkeleton
          maintenanceText={maintenanceText}
          section={section}
          t={t}
        />
      </SkeletonVisibility>
    );
  }

  async function checkSource(url = sourceUrl) {
    const nextUrl = normalizeSourceUrl(url);
    setSourceChecking(true);
    setStatus("");

    try {
      const items = await fetchToolSource(nextUrl, maintenanceText);
      const preview = createSourcePreview(items, tools, sourceMode, maintenanceText);
      setSourceUrl(nextUrl);
      setSourceItems(items);
      setCheckedSourceUrl(nextUrl);
      setStatus(maintenanceText.sourceChecked(preview.total));
    } catch (error) {
      setStatus(getSourceErrorMessage(error, maintenanceText, t));
      setSourceItems(null);
      setCheckedSourceUrl("");
    } finally {
      setSourceChecking(false);
    }
  }

  async function importSource() {
    const nextUrl = normalizeSourceUrl(sourceUrl);
    setSourceImporting(true);
    setStatus("");

    try {
      const items =
        sourceItems && checkedSourceUrl === nextUrl
          ? sourceItems
          : await fetchToolSource(nextUrl, maintenanceText);
      const result = await importTools(items, sourceMode, token);
      setSourceUrl(nextUrl);
      setSourceItems(items);
      setCheckedSourceUrl(nextUrl);
      setStatus(maintenanceText.sourceImportSummary(result));
      await onReloadTools();
    } catch (error) {
      setStatus(getSourceErrorMessage(error, maintenanceText, t));
    } finally {
      setSourceImporting(false);
    }
  }

  async function exportSource() {
    setSourceExporting(true);
    setStatus("");

    try {
      const source = await exportToolSourceData(token);
      downloadTextFile(
        createDatedExportFilename("tools", "json"),
        JSON.stringify(source, null, 2),
        "application/json;charset=utf-8"
      );
      setStatus(maintenanceText.sourceExported(source.length));
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      setSourceExporting(false);
    }
  }

  async function reloadLinks() {
    if (checking) {
      return;
    }

    setLoadingLinks(true);
    setStatus("");

    try {
      await onReloadTools();
      setResults([]);
      setWasStopped(false);
      setActiveFilter("abnormal");
      setStatus(t.linkCheck.messages.reloaded);
    } catch (error) {
      setStatus(getLocalizedErrorMessage(error, t));
    } finally {
      setLoadingLinks(false);
    }
  }

  async function startCheck() {
    if (checking) {
      return;
    }

    const nextTimeout = clampInteger(timeoutSeconds, 1, 9, 6);
    const nextBatchSize = clampInteger(batchSize, 1, 10, 4);

    setTimeoutSeconds(nextTimeout);
    setBatchSize(nextBatchSize);

    if (!targets.length) {
      setStatus(t.linkCheck.messages.empty);
      return;
    }

    setChecking(true);
    setWasStopped(false);
    setResults([]);
    setActiveFilter("abnormal");
    setStatus("");
    stopRequested.current = false;

    try {
      for (let index = 0; index < targets.length; index += nextBatchSize) {
        if (stopRequested.current) {
          break;
        }

        const batch = targets.slice(index, index + nextBatchSize);

        try {
          const response = await checkLinks(batch, nextTimeout, token);
          setResults((current) => [...current, ...response.results]);
        } catch (error) {
          setResults((current) => [
            ...current,
            ...buildFailedLinkCheckResults(batch, error)
          ]);

          if (getErrorMessage(error).toLowerCase().includes("unauthorized")) {
            break;
          }
        }
      }

      const stopped = stopRequested.current;
      setWasStopped(stopped);
      setStatus(stopped ? t.linkCheck.messages.stopped : t.linkCheck.messages.completed);
    } finally {
      setChecking(false);
      stopRequested.current = false;
    }
  }

  function stopCheck() {
    stopRequested.current = true;
  }

  function clearResults() {
    setResults([]);
    setWasStopped(false);
    setActiveFilter("abnormal");
  }

  function exportResults() {
    const rows = results.filter((result) => !result.ok);

    if (!rows.length) {
      return;
    }

    const csv = createCsv([
      [
        "tool",
        "type",
        "url",
        "status",
        "result",
        "error",
        "duration",
        "checkedAt"
      ],
      ...rows.map((result) => [
        result.name,
        result.kind === "demoUrl"
          ? t.linkCheck.linkTypeDemo
          : t.linkCheck.linkTypeOfficial,
        result.url,
        result.status,
        getLinkCheckResultText(result, t),
        result.error ?? "",
        result.duration,
        result.checkedAt
      ])
    ]);
    downloadTextFile(
      createDatedExportFilename("link-check", "csv"),
      `\ufeff${csv}`,
      "text/csv;charset=utf-8"
    );
  }

  return (
    <section
      className="admin-link-check"
      aria-label={
        section === "import-export"
          ? maintenanceText.importExportTab
          : maintenanceText.linkCheckTab
      }
    >
      {section === "import-export" ? (
        <section className="admin-maintenance-panel">
          <section className="source-import-panel">
        <div className="source-import-main">
          <div className="link-check-heading">
            <h2>{maintenanceText.sourceTitle}</h2>
            <p>{maintenanceText.sourceDescription}</p>
          </div>

          <label className="source-url-field">
            <span>{maintenanceText.sourceUrl}</span>
            <input
              value={sourceUrl}
              onChange={(event) => {
                setSourceUrl(event.target.value);
                setStatus("");
              }}
              placeholder={maintenanceText.sourcePlaceholder}
            />
          </label>

          <div className="source-mode-row" aria-label={maintenanceText.sourceMode}>
            <span>{maintenanceText.sourceMode}</span>
            <div className="admin-segmented-toggle">
              <button
                className={sourceMode === "skip" ? "is-active" : ""}
                type="button"
                onClick={() => setSourceMode("skip")}
              >
                {maintenanceText.sourceModeSkip}
              </button>
              <button
                className={sourceMode === "upsert" ? "is-active" : ""}
                type="button"
                onClick={() => setSourceMode("upsert")}
              >
                {maintenanceText.sourceModeUpsert}
              </button>
            </div>
            <small>{maintenanceText.sourceModeHelp}</small>
          </div>

          <div className="source-action-row">
            <button
              className="ghost-button"
              disabled={sourceChecking || sourceImporting || sourceExporting}
              type="button"
              onClick={() => void checkSource()}
            >
              {maintenanceText.sourceDetect}
            </button>
            <button
              className="primary-button"
              disabled={sourceChecking || sourceImporting || sourceExporting}
              type="button"
              onClick={() => void importSource()}
            >
              {maintenanceText.sourceImport}
            </button>
          </div>

          <div className="source-report-grid" aria-live="polite">
            <div>
              <span>{maintenanceText.sourceTotal}</span>
              <strong>{displayedSourcePreview.total}</strong>
            </div>
            <div>
              <span>{maintenanceText.sourceValid}</span>
              <strong>{displayedSourcePreview.valid}</strong>
            </div>
            <div>
              <span>{maintenanceText.sourceDuplicate}</span>
              <strong>{displayedSourcePreview.duplicateInSource}</strong>
            </div>
            <div>
              <span>{maintenanceText.sourceExisting}</span>
              <strong>{displayedSourcePreview.duplicateInSite}</strong>
            </div>
            <div>
              <span>{maintenanceText.sourceMissing}</span>
              <strong>{displayedSourcePreview.invalid}</strong>
            </div>
            <div>
              <span>{maintenanceText.sourceWillCreate}</span>
              <strong>{displayedSourcePreview.willCreate}</strong>
            </div>
            <div>
              <span>{maintenanceText.sourceWillUpdate}</span>
              <strong>{displayedSourcePreview.willUpdate}</strong>
            </div>
            <div>
              <span>{maintenanceText.sourceWillSkip}</span>
              <strong>{displayedSourcePreview.willSkip}</strong>
            </div>
          </div>

          {sourcePreview?.errors.length ? (
            <div className="source-error-list">
              <strong>{maintenanceText.sourceErrors}</strong>
              {sourcePreview.errors
                .slice(0, SOURCE_PREVIEW_ERROR_LIMIT)
                .map((error) => (
                  <span key={`${error.index}-${error.message}`}>
                    {maintenanceText.sourceErrorItem(error.index, error.message)}
                  </span>
                ))}
            </div>
          ) : null}

        </div>

        <div className="source-import-main source-export-card">
          <div className="link-check-heading">
            <h2>{maintenanceText.sourceExportTitle}</h2>
            <p>{maintenanceText.sourceExportDescription}</p>
          </div>
          <div className="source-report-grid source-export-summary">
            <div>
              <span>{maintenanceText.sourceExportCount}</span>
              <strong>{tools.length}</strong>
            </div>
            <div>
              <span>{maintenanceText.sourceExportFormat}</span>
              <strong>JSON</strong>
            </div>
            <div>
              <span>{maintenanceText.sourceExportScope}</span>
              <strong>{maintenanceText.sourceExportScopeAll}</strong>
            </div>
          </div>
          <div className="source-action-row">
            <button
              className="primary-button"
              disabled={sourceChecking || sourceImporting || sourceExporting}
              type="button"
              onClick={() => void exportSource()}
            >
              {maintenanceText.sourceExport}
            </button>
          </div>
        </div>
      </section>

        </section>
      ) : (
        <section className="admin-maintenance-panel admin-maintenance-link-panel">

      <div className="link-check-hero">
        <div className="link-check-heading">
          <h2>{maintenanceText.linkModuleTitle}</h2>
          <p>{maintenanceText.linkModuleDescription}</p>
        </div>

        <div className="link-check-config">
          <label className="link-check-field">
            <span>{t.linkCheck.timeout}</span>
            <input
              disabled={checking}
              max={9}
              min={1}
              onChange={(event) => setTimeoutSeconds(event.target.valueAsNumber)}
              step={1}
              type="number"
              value={Number.isFinite(timeoutSeconds) ? timeoutSeconds : ""}
            />
            <small>{t.linkCheck.timeoutHelp}</small>
          </label>
          <label className="link-check-field">
            <span>{t.linkCheck.batchSize}</span>
            <input
              disabled={checking}
              max={10}
              min={1}
              onChange={(event) => setBatchSize(event.target.valueAsNumber)}
              step={1}
              type="number"
              value={Number.isFinite(batchSize) ? batchSize : ""}
            />
            <small>{t.linkCheck.batchSizeHelp}</small>
          </label>
        </div>

        <div className="link-check-actions">
          <button
            className="primary-button"
            disabled={checking || loadingLinks || totalCount === 0}
            onClick={() => void startCheck()}
            type="button"
          >
            {t.linkCheck.start}
          </button>
          <button
            className="ghost-button danger-action"
            disabled={!checking}
            onClick={stopCheck}
            type="button"
          >
            {t.linkCheck.stop}
          </button>
          <button
            className="ghost-button"
            disabled={checking || loadingLinks}
            onClick={() => void reloadLinks()}
            type="button"
          >
            {t.linkCheck.reload}
          </button>
          <button
            className="ghost-button"
            disabled={checking || !results.length}
            onClick={clearResults}
            type="button"
          >
            {t.linkCheck.clear}
          </button>
          <button
            className="ghost-button"
            disabled={checking || abnormalCount === 0}
            onClick={exportResults}
            type="button"
          >
            {t.linkCheck.exportCsv}
          </button>
        </div>
      </div>

      <div className="link-check-stats" aria-label={t.linkCheck.progressTitle}>
        <div>
          <span>{t.linkCheck.total}</span>
          <strong>{totalCount}</strong>
        </div>
        <div>
          <span>{t.linkCheck.checked}</span>
          <strong>{checkedCount}</strong>
        </div>
        <div>
          <span>{t.linkCheck.normal}</span>
          <strong>{normalCount}</strong>
        </div>
        <div>
          <span>{t.linkCheck.abnormal}</span>
          <strong>{abnormalCount}</strong>
        </div>
        <div>
          <span>{t.linkCheck.networkError}</span>
          <strong>{networkErrorCount}</strong>
        </div>
      </div>

      <section className="link-check-progress">
        <div className="link-check-progress-head">
          <div>
            <h3>{t.linkCheck.progressTitle}</h3>
            <p>
              {wasStopped
                ? t.linkCheck.progressStopped
                : t.linkCheck.progressText(checkedCount, totalCount)}
            </p>
          </div>
          <strong>{progress}%</strong>
        </div>
        <div className="link-check-progress-track" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section className="link-check-results">
        <div className="link-check-results-head">
          <div>
            <h3>{t.linkCheck.resultsTitle}</h3>
            <p>{t.linkCheck.resultsDescription}</p>
          </div>
        </div>

        <div className="link-check-tabs" role="tablist" aria-label={t.linkCheck.resultsTitle}>
          <button
            className={activeFilter === "abnormal" ? "is-active" : ""}
            onClick={() => setActiveFilter("abnormal")}
            type="button"
          >
            {t.linkCheck.tabsAbnormal(abnormalCount)}
          </button>
          {statusItems.map((item) => (
            <button
              className={activeFilter === item.value ? "is-active" : ""}
              key={item.value}
              onClick={() => setActiveFilter(item.value)}
              type="button"
            >
              {t.linkCheck.tabsStatus(item.status, item.count)}
            </button>
          ))}
          <button
            className={activeFilter === "all" ? "is-active" : ""}
            onClick={() => setActiveFilter("all")}
            type="button"
          >
            {t.linkCheck.tabsAll(results.length)}
          </button>
        </div>

        {filteredResults.length === 0 ? (
          <div aria-busy={checking} className="link-check-empty-state">
            {emptyMessage}
          </div>
        ) : (
          <div aria-busy={checking} className="link-check-table-wrap">
            <table className="link-check-table">
            <thead>
              <tr>
                <th>{t.linkCheck.tableTool}</th>
                <th>{t.linkCheck.tableType}</th>
                <th>{t.linkCheck.tableUrl}</th>
                <th>{t.linkCheck.tableStatusCode}</th>
                <th>{t.linkCheck.tableResult}</th>
                <th>{t.linkCheck.tableDuration}</th>
                <th>{t.linkCheck.tableError}</th>
                <th>{t.linkCheck.tableAction}</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((result, index) => {
                  const relatedTool = toolById.get(result.id);
                  const relatedToolUrl = relatedTool?.url ?? "";
                  const targetLabel =
                    result.kind === "demoUrl"
                      ? maintenanceText.demoUrlLabel
                      : maintenanceText.urlLabel;
                  const secondaryTargetLabel = maintenanceText.urlLabel;
                  const showToolUrl =
                    result.kind === "demoUrl" &&
                    Boolean(relatedToolUrl) &&
                    normalizeUrlForImport(relatedToolUrl) !==
                      normalizeUrlForImport(result.url);

                  return (
                    <tr key={`${result.id}-${result.kind}-${result.checkedAt}-${index}`}>
                      <td>
                        <strong>{result.name || result.id}</strong>
                      </td>
                      <td>
                        <span className="link-check-type-label">
                          {result.kind === "demoUrl"
                            ? t.linkCheck.linkTypeDemo
                            : t.linkCheck.linkTypeOfficial}
                        </span>
                      </td>
                      <td>
                        <span className="link-check-url" title={result.url}>
                          {result.url || "-"}
                        </span>
                      </td>
                      <td>
                        <span className={getLinkCheckPillClass(result)}>
                          {result.status}
                        </span>
                      </td>
                      <td>
                        <span className={getLinkCheckPillClass(result)}>
                          {getLinkCheckResultText(result, t)}
                        </span>
                      </td>
                      <td>
                        <span className="link-check-duration">
                          {t.linkCheck.durationMs(result.duration)}
                        </span>
                      </td>
                      <td>
                        <span className="link-check-error-text" title={result.error ?? "-"}>
                          {result.error ?? "-"}
                        </span>
                      </td>
                      <td>
                        <div className="link-check-action-buttons">
                          {showToolUrl ? (
                            <a
                              className="ghost-button link-check-open-link"
                              href={proxifyUrl(relatedToolUrl, proxySettings)}
                              aria-label={secondaryTargetLabel}
                              rel="noreferrer"
                              target="_blank"
                              title={secondaryTargetLabel}
                            >
                              <span>{secondaryTargetLabel}</span>
                            </a>
                          ) : null}
                          {result.url ? (
                            <a
                              className="ghost-button link-check-open-link"
                              href={proxifyUrl(result.url, proxySettings)}
                              aria-label={targetLabel}
                              rel="noreferrer"
                              target="_blank"
                              title={targetLabel}
                            >
                              <span>{targetLabel}</span>
                            </a>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
            </table>
          </div>
        )}
      </section>
        </section>
      )}
    </section>
  );
}

function getLinkCheckResultText(result: LinkCheckResult, t: Messages) {
  if (result.status === 0) {
    return t.linkCheck.resultNetworkError;
  }

  return result.ok ? t.linkCheck.resultNormal : t.linkCheck.resultAbnormal;
}

function getLinkCheckPillClass(result: LinkCheckResult) {
  if (result.status === 0) {
    return "link-check-result-pill is-network";
  }

  return result.ok
    ? "link-check-result-pill is-ok"
    : "link-check-result-pill is-error";
}

const DIALOG_FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

type DialogReturnFocusTarget = HTMLElement | (() => HTMLElement | null) | null;

let nextDialogReturnFocusTarget: DialogReturnFocusTarget = null;
const adminDialogStack: symbol[] = [];

type AdminDialogScrollLockSnapshot = {
  bodyLeft: string;
  bodyOverflow: string;
  bodyOverscroll: string;
  bodyPosition: string;
  bodyRight: string;
  bodyTop: string;
  bodyWidth: string;
  htmlOverflow: string;
  htmlOverscroll: string;
  htmlScrollBehavior: string;
  scrollY: number;
};

let adminDialogScrollLockCount = 0;
let adminDialogScrollLockSnapshot: AdminDialogScrollLockSnapshot | null = null;
let adminDialogScrollRestoreFrame: number | null = null;
let adminDialogPendingScrollBehavior = "";

function acquireAdminDialogScrollLock() {
  if (adminDialogScrollRestoreFrame !== null) {
    window.cancelAnimationFrame(adminDialogScrollRestoreFrame);
    adminDialogScrollRestoreFrame = null;
    document.documentElement.style.scrollBehavior = adminDialogPendingScrollBehavior;
    adminDialogPendingScrollBehavior = "";
  }

  adminDialogScrollLockCount += 1;
  if (adminDialogScrollLockCount > 1) return;

  const scrollY = window.scrollY;
  adminDialogScrollLockSnapshot = {
    bodyLeft: document.body.style.left,
    bodyOverflow: document.body.style.overflow,
    bodyOverscroll: document.body.style.overscrollBehavior,
    bodyPosition: document.body.style.position,
    bodyRight: document.body.style.right,
    bodyTop: document.body.style.top,
    bodyWidth: document.body.style.width,
    htmlOverflow: document.documentElement.style.overflow,
    htmlOverscroll: document.documentElement.style.overscrollBehavior,
    htmlScrollBehavior: document.documentElement.style.scrollBehavior,
    scrollY
  };

  document.documentElement.style.overflow = "hidden";
  document.documentElement.style.overscrollBehavior = "none";
  document.body.style.overflow = "hidden";
  document.body.style.overscrollBehavior = "none";
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = "100%";
  document.body.style.left = "0";
  document.body.style.right = "0";
}

function releaseAdminDialogScrollLock() {
  adminDialogScrollLockCount = Math.max(0, adminDialogScrollLockCount - 1);
  if (adminDialogScrollLockCount > 0) return;

  const snapshot = adminDialogScrollLockSnapshot;
  adminDialogScrollLockSnapshot = null;
  if (!snapshot) return;

  document.documentElement.style.overflow = snapshot.htmlOverflow;
  document.documentElement.style.overscrollBehavior = snapshot.htmlOverscroll;
  document.body.style.overflow = snapshot.bodyOverflow;
  document.body.style.overscrollBehavior = snapshot.bodyOverscroll;
  document.body.style.position = snapshot.bodyPosition;
  document.body.style.top = snapshot.bodyTop;
  document.body.style.width = snapshot.bodyWidth;
  document.body.style.left = snapshot.bodyLeft;
  document.body.style.right = snapshot.bodyRight;
  document.documentElement.style.scrollBehavior = "auto";
  window.scrollTo(0, snapshot.scrollY);

  adminDialogPendingScrollBehavior = snapshot.htmlScrollBehavior;
  adminDialogScrollRestoreFrame = window.requestAnimationFrame(() => {
    document.documentElement.style.scrollBehavior = adminDialogPendingScrollBehavior;
    adminDialogPendingScrollBehavior = "";
    adminDialogScrollRestoreFrame = null;
  });
}

function getDialogReturnFocusTarget(
  element: Element | null
): DialogReturnFocusTarget {
  if (!(element instanceof HTMLElement)) {
    return null;
  }

  const categoryFilter = element.closest<HTMLElement>(".admin-category-filter");

  if (categoryFilter) {
    return () =>
      categoryFilter.querySelector<HTMLButtonElement>(
        ".admin-category-filter-trigger"
      );
  }

  const cardActions = element.closest<HTMLElement>(".admin-tool-card-actions");
  const cardMenuTrigger = cardActions?.querySelector<HTMLButtonElement>(
    ".admin-tool-menu-trigger"
  );

  return cardMenuTrigger ?? element;
}

function rememberNextDialogReturnFocus(target: DialogReturnFocusTarget) {
  nextDialogReturnFocusTarget = target;
}

function consumeNextDialogReturnFocus() {
  const target = nextDialogReturnFocusTarget;
  nextDialogReturnFocusTarget = null;
  return target;
}

function resolveDialogReturnFocusTarget(target: DialogReturnFocusTarget) {
  return typeof target === "function" ? target() : target;
}

function getDialogFocusableElements(panel: HTMLElement) {
  return Array.from(
    panel.querySelectorAll<HTMLElement>(DIALOG_FOCUSABLE_SELECTOR)
  ).filter(
    (element) =>
      element.getAttribute("aria-hidden") !== "true" &&
      element.getClientRects().length > 0
  );
}

function getDialogInitialFocus(panel: HTMLElement) {
  const selectors = [
    "[data-dialog-initial-focus]",
    ".dialog-body input:not([disabled]):not([type='hidden'])",
    ".dialog-body textarea:not([disabled])",
    ".dialog-body select:not([disabled])",
    ".dialog-body [contenteditable='true']",
    ".dialog-body .admin-category-filter-trigger:not([disabled])",
    ".dialog-body [aria-pressed]:not([disabled])",
    ".dialog-footer button:not([disabled])",
    ".dialog-header button:not([disabled])"
  ];

  for (const selector of selectors) {
    const element = panel.querySelector<HTMLElement>(selector);

    if (element && element.getClientRects().length > 0) {
      return element;
    }
  }

  return panel;
}

function Dialog({
  children,
  closeDisabled = false,
  closeLabel,
  closeRequestRef,
  description,
  descriptionId,
  footer,
  panelClassName = "",
  title,
  onClose
}: {
  children?: ReactNode;
  closeDisabled?: boolean;
  closeLabel: string;
  closeRequestRef?: { current: (() => void) | null };
  description?: ReactNode;
  descriptionId?: string;
  footer?: ReactNode;
  panelClassName?: string;
  title: string;
  onClose: () => void;
}) {
  const generatedDescriptionId = useId();
  const resolvedDescriptionId = description
    ? descriptionId ?? generatedDescriptionId
    : undefined;
  const titleId = resolvedDescriptionId
    ? `${resolvedDescriptionId}-title`
    : undefined;
  const panelRef = useRef<HTMLElement | null>(null);
  const dialogIdRef = useRef(Symbol("admin-dialog"));
  const returnFocusTargetRef = useRef<DialogReturnFocusTarget | undefined>(
    undefined
  );
  const restoreFocusOnCloseRef = useRef(true);

  if (returnFocusTargetRef.current === undefined) {
    restoreFocusOnCloseRef.current = getLastInputModality() === "keyboard";
    returnFocusTargetRef.current =
      consumeNextDialogReturnFocus() ??
      getDialogReturnFocusTarget(document.activeElement);
  }

  const drawerDrag = useRef({
    dragging: false,
    pointerId: -1,
    startY: 0,
    lastY: 0
  });
  const backdropClassName = panelClassName
    .split(" ")
    .filter(Boolean)
    .map((className) => `${className}-backdrop`)
    .join(" ");
  const isToolEditorDrawer = panelClassName.split(" ").includes("tool-editor-dialog");
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  function shouldAnimateClose() {
    return (
      isToolEditorDrawer &&
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 920px)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function requestClose(force = false) {
    if (isClosing || (!force && closeDisabled)) return;

    if (!shouldAnimateClose()) {
      onClose();
      return;
    }

    const panel = panelRef.current;
    if (panel) {
      panel.style.transition = "";
      panel.style.transform = "";
    }

    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      onClose();
    }, 280);
  }

  useEffect(() => {
    if (closeRequestRef) {
      closeRequestRef.current = () => requestClose(true);
    }

    return () => {
      if (closeRequestRef) closeRequestRef.current = null;
    };
  });

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    const dialogId = dialogIdRef.current;
    adminDialogStack.push(dialogId);
    const panel = panelRef.current;
    if (panel) {
      getDialogInitialFocus(panel).focus({ preventScroll: true });
    }

    return () => {
      const stackIndex = adminDialogStack.lastIndexOf(dialogId);
      if (stackIndex >= 0) {
        adminDialogStack.splice(stackIndex, 1);
      }
      const returnTarget = returnFocusTargetRef.current;
      window.requestAnimationFrame(() => {
        const element = resolveDialogReturnFocusTarget(returnTarget ?? null);
        const visibleDialogs = Array.from(
          document.querySelectorAll<HTMLElement>(".dialog-panel")
        );
        const topDialog = visibleDialogs.at(-1);

        if (adminDialogStack.length > 0 && topDialog) {
          if (
            restoreFocusOnCloseRef.current &&
            element?.isConnected &&
            topDialog.contains(element)
          ) {
            element.focus({ preventScroll: true });
          } else if (!topDialog.contains(document.activeElement)) {
            getDialogInitialFocus(topDialog).focus({ preventScroll: true });
          }
          return;
        }

        if (restoreFocusOnCloseRef.current && element?.isConnected) {
          element.focus({ preventScroll: true });
        }
      });
    };
  }, []);

  useEffect(() => {
    acquireAdminDialogScrollLock();
    return releaseAdminDialogScrollLock;
  }, []);

  useVisualViewportKeyboard({
    active: !isToolEditorDrawer,
    containerRef: panelRef
  });

  function canDragDrawer() {
    return (
      isToolEditorDrawer &&
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 640px)").matches
    );
  }

  function resetDrawerPosition() {
    const panel = panelRef.current;

    if (!panel) {
      return;
    }

    panel.style.transition = "transform 0.18s cubic-bezier(0.2, 0.82, 0.2, 1)";
    panel.style.transform = "translateY(0)";
    window.setTimeout(() => {
      panel.style.transition = "";
      panel.style.transform = "";
    }, 190);
  }

  function handleDrawerPointerDown(event: React.PointerEvent<HTMLElement>) {
    if (!canDragDrawer() || (event.pointerType === "mouse" && event.button !== 0)) {
      return;
    }

    const target = event.target as HTMLElement;

    if (
      target.closest(
        "button, a, input, textarea, select, [role='button'], [role='menuitem']"
      )
    ) {
      return;
    }

    drawerDrag.current = {
      dragging: true,
      pointerId: event.pointerId,
      startY: event.clientY,
      lastY: event.clientY
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleDrawerPointerMove(event: React.PointerEvent<HTMLElement>) {
    const state = drawerDrag.current;

    if (!state.dragging || state.pointerId !== event.pointerId) {
      return;
    }

    const distance = Math.max(0, event.clientY - state.startY);
    state.lastY = event.clientY;

    const panel = panelRef.current;

    if (!panel) {
      return;
    }

    event.preventDefault();
    panel.style.transition = "none";
    panel.style.transform = `translateY(${distance}px)`;
  }

  function handleDrawerPointerEnd(event: React.PointerEvent<HTMLElement>) {
    const state = drawerDrag.current;

    if (!state.dragging || state.pointerId !== event.pointerId) {
      return;
    }

    const distance = Math.max(0, state.lastY - state.startY);
    drawerDrag.current.dragging = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const panel = panelRef.current;

    if (distance > 88 && panel) {
      requestClose();
      return;
    }

    resetDrawerPosition();
  }

  function handleDialogKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (adminDialogStack.at(-1) !== dialogIdRef.current) {
      return;
    }

    restoreFocusOnCloseRef.current = true;

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      requestClose();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const panel = panelRef.current;
    if (!panel) return;
    const focusableElements = getDialogFocusableElements(panel);

    if (focusableElements.length === 0) {
      event.preventDefault();
      panel.focus({ preventScroll: true });
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (
      event.shiftKey &&
      (activeElement === firstElement || !panel.contains(activeElement))
    ) {
      event.preventDefault();
      lastElement.focus();
    } else if (
      !event.shiftKey &&
      (activeElement === lastElement || !panel.contains(activeElement))
    ) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  return (
    <div
      className={`dialog-backdrop ${backdropClassName} ${isClosing ? "is-closing" : ""}`}
      role="presentation"
      aria-hidden={isClosing}
      onMouseDown={() => requestClose()}
    >
      <section
        aria-describedby={resolvedDescriptionId}
        aria-label={resolvedDescriptionId ? undefined : title}
        aria-labelledby={titleId}
        ref={panelRef}
        className={`dialog-panel ${footer ? "has-dialog-footer" : "is-dialog-body-only"} ${panelClassName}`}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header
          className={`dialog-header ${isToolEditorDrawer ? "is-drawer-draggable" : ""}`}
          onPointerCancel={handleDrawerPointerEnd}
          onPointerDown={handleDrawerPointerDown}
          onPointerMove={handleDrawerPointerMove}
          onPointerUp={handleDrawerPointerEnd}
        >
          <span className="dialog-drawer-grip" aria-hidden="true" />
          <h2 id={titleId}>{title}</h2>
          <button
            className="icon-button"
            type="button"
            onClick={() => requestClose()}
            aria-label={closeLabel}
          >
            <X size={18} />
          </button>
        </header>
        <DialogCloseContext.Provider value={requestClose}>
          <div
            className={`dialog-body ${description ? "has-dialog-description" : ""}`.trim()}
          >
            {description ? (
              <p className="dialog-description" id={resolvedDescriptionId}>
                {description}
              </p>
            ) : null}
            {children}
          </div>
          {footer ? <footer className="dialog-footer">{footer}</footer> : null}
        </DialogCloseContext.Provider>
      </section>
    </div>
  );
}
