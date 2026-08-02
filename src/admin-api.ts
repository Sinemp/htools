import { readJson, requestJsonWithTimeout } from "./api-client";
export { loadProxySettings, loadSiteConfiguration, loadSiteSettings } from "./public-api";
import type {
  AdminCategoryAction,
  AdminCategoryActionResult,
  AdminCategoryScope,
  AdminCategorySettings,
  AdminPasswordInput,
  AdminSecuritySettings,
  Article,
  ArticleInput,
  ArticleSummary,
  ContentItemSummary,
  ContentSource,
  ContentSourceInput,
  ContentSyncResponse,
  FactoryResetResponse,
  FeedPreview,
  GitHubSettings,
  GitHubSettingsInput,
  GitHubToolMetadata,
  LinkCheckResponse,
  LinkCheckTarget,
  ProxySettings,
  HtoolsBackup,
  BackupRestoreResponse,
  SiteSettings,
  SiteSettingsPatch,
  SourceSettings,
  TurnstileSettings,
  TelegramConnection,
  TelegramPushPage,
  TelegramResourceType,
  TelegramSettings,
  TelegramMessage,
  UmamiSettings,
  Tool,
  ToolSourceItem,
  ToolImportMode,
  ToolImportResponse,
  ToolInput
} from "./types";
import { loadBrowserGitHubMetadata } from "./github-metadata";

type ToolsResponse = {
  tools: Tool[];
};

type DeleteResponse = {
  success: true;
  deleted: true;
  resource: "tool" | "article" | "contentSource";
  id: string;
};

type ToolResponse = {
  tool: Tool;
};

type AdminArticlesPageResponse = {
  articles: ArticleSummary[];
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
  total: number;
  categoryCounts: Record<string, number>;
};

type ArticleResponse = {
  article: Article;
};

type ContentSourcesResponse = {
  sources: ContentSource[];
};

type ContentSourceResponse = {
  source: ContentSource;
};

type ContentItemsResponse = {
  items: ContentItemSummary[];
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
  total: number;
  sourceCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
};

type FeedPreviewResponse = {
  feed: FeedPreview;
};

type LoginResponse = {
  token: string;
};

export type AdminAuthConfig = {
  turnstileEnabled: boolean;
  turnstileSiteKey: string;
};

type GitHubSettingsResponse = {
  settings: GitHubSettings;
};

type GitHubToolMetadataResponse = {
  metadata: GitHubToolMetadata;
};

type SourceSettingsResponse = {
  settings: SourceSettings;
};

type TurnstileSettingsResponse = {
  settings: TurnstileSettings;
};

type ProxySettingsResponse = {
  settings: ProxySettings;
};

type UmamiSettingsResponse = {
  settings: UmamiSettings;
};

type SiteSettingsResponse = {
  settings: SiteSettings;
};

type AdminSecuritySettingsResponse = {
  settings: AdminSecuritySettings;
  token?: string;
};

type TelegramSettingsResponse = {
  settings: TelegramSettings;
};

type TelegramConnectionResponse = {
  connection: TelegramConnection;
};

type TelegramMessageResponse = {
  message: TelegramMessage;
};

type TelegramDeleteResponse = {
  result: {
    deleted: true;
    id: string;
    messageMissing: boolean;
  };
};

type AdminCategorySettingsResponse = {
  settings: AdminCategorySettings;
};

type AdminCategoryActionResponse = AdminCategoryActionResult;

export async function loadAdminTools(token: string): Promise<Tool[]> {
  const response = await fetch("/api/admin/tools", {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJson<ToolsResponse>(response);
  return data.tools;
}

export async function loadArticlePreview(
  slug: string,
  token: string
): Promise<Article> {
  const response = await fetch(
    `/api/admin/articles/preview/${encodeURIComponent(slug)}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    }
  );
  const data = await readJson<ArticleResponse>(response);
  return data.article;
}

export async function loadContentItemArticlePreview(
  id: string,
  token: string
): Promise<Article> {
  const response = await fetch(
    `/api/admin/content-items/${encodeURIComponent(id)}/preview`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    }
  );
  const data = await readJson<ArticleResponse>(response);
  return data.article;
}

export async function loadAdminAuthConfig(): Promise<AdminAuthConfig> {
  return requestJsonWithTimeout<AdminAuthConfig>("/api/auth/config", {
    cache: "no-store",
    headers: { Accept: "application/json" }
  });
}

export async function login(
  password: string,
  turnstileToken = ""
): Promise<string> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ password: password.trim(), turnstileToken })
  });
  const data = await readJson<LoginResponse>(response);
  return data.token;
}

export async function createTool(input: ToolInput, token: string): Promise<Tool> {
  const response = await fetch("/api/admin/tools", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
  const data = await readJson<ToolResponse>(response);
  return data.tool;
}

export async function updateTool(id: string, input: ToolInput, token: string): Promise<Tool> {
  const response = await fetch(`/api/admin/tools/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
  const data = await readJson<ToolResponse>(response);
  return data.tool;
}

export async function deleteTool(id: string, token: string): Promise<void> {
  const response = await fetch(`/api/admin/tools/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  await readJson<DeleteResponse>(response);
}

export async function loadAdminArticles(
  token: string,
  params: {
    category?: string;
    query?: string;
    sort?: "latest" | "oldest";
    limit?: number;
    cursor?: string;
  } = {}
): Promise<AdminArticlesPageResponse> {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.set("category", params.category);
  if (params.query) searchParams.set("q", params.query);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.limit !== undefined) searchParams.set("limit", String(params.limit));
  if (params.cursor) searchParams.set("cursor", params.cursor);
  const response = await fetch(
    `/api/admin/articles${searchParams.size ? `?${searchParams}` : ""}`,
    {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
    }
  );
  return readJson<AdminArticlesPageResponse>(response);
}

export async function loadAdminArticle(id: string, token: string): Promise<Article> {
  const response = await fetch(`/api/admin/articles/${encodeURIComponent(id)}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
  });
  return (await readJson<ArticleResponse>(response)).article;
}

export async function updateArticlePublished(
  id: string,
  published: boolean,
  token: string
): Promise<ArticleSummary> {
  const response = await fetch(`/api/admin/articles/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ published })
  });
  return (await readJson<{ article: ArticleSummary }>(response)).article;
}

export async function createArticle(
  input: ArticleInput,
  token: string
): Promise<Article> {
  const response = await fetch("/api/admin/articles", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
  const data = await readJson<ArticleResponse>(response);
  return data.article;
}

export async function updateArticle(
  id: string,
  input: ArticleInput,
  token: string
): Promise<Article> {
  const response = await fetch(`/api/admin/articles/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
  const data = await readJson<ArticleResponse>(response);
  return data.article;
}

export async function deleteArticle(id: string, token: string): Promise<void> {
  const response = await fetch(`/api/admin/articles/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  await readJson<DeleteResponse>(response);
}

export async function loadContentSources(
  token: string
): Promise<ContentSource[]> {
  const response = await fetch("/api/admin/content-sources", {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJson<ContentSourcesResponse>(response);
  return data.sources;
}

export async function createContentSource(
  input: ContentSourceInput,
  token: string
): Promise<ContentSource> {
  const response = await fetch("/api/admin/content-sources", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
  const data = await readJson<ContentSourceResponse>(response);
  return data.source;
}

export async function updateContentSource(
  id: string,
  input: ContentSourceInput,
  token: string
): Promise<ContentSource> {
  const response = await fetch(`/api/admin/content-sources/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
  const data = await readJson<ContentSourceResponse>(response);
  return data.source;
}

export async function deleteContentSource(
  id: string,
  token: string
): Promise<void> {
  const response = await fetch(`/api/admin/content-sources/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  await readJson<DeleteResponse>(response);
}

export async function previewContentSource(
  input: ContentSourceInput,
  token: string,
  options: { signal?: AbortSignal } = {}
): Promise<FeedPreview> {
  const response = await fetch("/api/admin/content-sources/preview", {
    method: "POST",
    signal: options.signal,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
  const data = await readJson<FeedPreviewResponse>(response);
  return data.feed;
}

export async function syncContentSource(
  id: string,
  token: string
): Promise<ContentSyncResponse> {
  const response = await fetch(
    `/api/admin/content-sources/${encodeURIComponent(id)}/sync`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return readJson<ContentSyncResponse>(response);
}

export async function loadContentItems(
  token: string,
  params: {
    sourceId?: string;
    category?: string;
    query?: string;
    sort?: "latest" | "oldest";
    limit?: number;
    cursor?: string;
  } = {}
): Promise<ContentItemsResponse> {
  const searchParams = new URLSearchParams();

  if (params.sourceId) {
    searchParams.set("sourceId", params.sourceId);
  }

  if (params.category) {
    searchParams.set("category", params.category);
  }

  if (params.query) {
    searchParams.set("q", params.query);
  }

  if (params.sort) {
    searchParams.set("sort", params.sort);
  }

  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  if (params.cursor) {
    searchParams.set("cursor", params.cursor);
  }

  const response = await fetch(
    `/api/admin/content-items${searchParams.size ? `?${searchParams}` : ""}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    }
  );
  return readJson<ContentItemsResponse>(response);
}

export async function convertContentItemToArticle(
  id: string,
  category: string,
  published: boolean,
  token: string
): Promise<Article> {
  const response = await fetch(
    `/api/admin/content-items/${encodeURIComponent(id)}/to-article`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ category, published })
    }
  );
  const data = await readJson<ArticleResponse>(response);
  return data.article;
}

export async function loadAdminCategorySettings(
  token: string
): Promise<AdminCategorySettings> {
  const response = await fetch("/api/admin/categories", {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJson<AdminCategorySettingsResponse>(response);
  return data.settings;
}

export async function saveAdminCategorySettings(
  settings: Partial<Record<AdminCategoryScope, string[]>>,
  token: string
): Promise<AdminCategorySettings> {
  const response = await fetch("/api/admin/categories", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(settings)
  });
  const data = await readJson<AdminCategorySettingsResponse>(response);
  return data.settings;
}

export async function applyAdminCategoryAction(
  scope: AdminCategoryScope,
  category: string,
  action: AdminCategoryAction,
  targetCategory: string,
  token: string
): Promise<AdminCategoryActionResult> {
  const response = await fetch("/api/admin/categories", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action,
      category,
      scope,
      targetCategory
    })
  });
  return readJson<AdminCategoryActionResponse>(response);
}

export async function importTools(
  tools: unknown[],
  mode: ToolImportMode,
  token: string
): Promise<ToolImportResponse> {
  const response = await fetch("/api/admin/import-tools", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      tools,
      mode
    })
  });

  return readJson<ToolImportResponse>(response);
}

export async function loadSourceSettings(
  token: string,
  options: { signal?: AbortSignal } = {}
): Promise<SourceSettings> {
  const data = await requestJsonWithTimeout<SourceSettingsResponse>(
    "/api/admin/source-settings",
    {
      signal: options.signal,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    }
  );
  return data.settings;
}

export async function saveSourceSettings(
  enabled: boolean,
  token: string
): Promise<SourceSettings> {
  const response = await fetch("/api/admin/source-settings", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ enabled })
  });
  const data = await readJson<SourceSettingsResponse>(response);
  return data.settings;
}

export async function saveProxySettings(
  input: ProxySettings,
  token: string
): Promise<ProxySettings> {
  const response = await fetch("/api/admin/proxy-settings", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
  const data = await readJson<ProxySettingsResponse>(response);
  return data.settings;
}

export async function loadTurnstileSettings(
  token: string,
  options: { signal?: AbortSignal } = {}
): Promise<TurnstileSettings> {
  const data = await requestJsonWithTimeout<TurnstileSettingsResponse>(
    "/api/admin/turnstile-settings",
    { signal: options.signal, headers: { Accept: "application/json", Authorization: `Bearer ${token}` } }
  );
  return data.settings;
}

export async function loadUmamiSettings(
  token: string,
  options: { signal?: AbortSignal } = {}
): Promise<UmamiSettings> {
  const data = await requestJsonWithTimeout<UmamiSettingsResponse>(
    "/api/admin/umami-settings",
    {
      signal: options.signal,
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
    }
  );
  return data.settings;
}

export async function saveUmamiSettings(
  input: UmamiSettings,
  token: string
): Promise<UmamiSettings> {
  const response = await fetch("/api/admin/umami-settings", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
  return (await readJson<UmamiSettingsResponse>(response)).settings;
}

export async function saveTurnstileSettings(enabled: boolean, token: string) {
  const response = await fetch("/api/admin/turnstile-settings", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ enabled })
  });
  return (await readJson<TurnstileSettingsResponse>(response)).settings;
}

export async function patchSiteSettings(
  input: SiteSettingsPatch,
  token: string
): Promise<SiteSettings> {
  const response = await fetch("/api/admin/site-settings", {
    cache: "no-store",
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
  const data = await readJson<SiteSettingsResponse>(response);
  return data.settings;
}

export async function exportBackupData(token: string): Promise<HtoolsBackup> {
  const response = await fetch("/api/admin/backup", {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  });

  return readJson<HtoolsBackup>(response);
}

export async function exportToolSourceData(token: string): Promise<ToolSourceItem[]> {
  const response = await fetch("/api/admin/tool-source", {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  });

  return readJson<ToolSourceItem[]>(response);
}

export async function restoreBackupData(
  backup: unknown,
  token: string
): Promise<BackupRestoreResponse> {
  const response = await fetch("/api/admin/backup", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(backup)
  });

  return readJson<BackupRestoreResponse>(response);
}

export async function resetFactorySettings(token: string): Promise<FactoryResetResponse> {
  const response = await fetch("/api/admin/factory-reset", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return readJson<FactoryResetResponse>(response);
}

export async function loadAdminSecuritySettings(
  token: string,
  options: { signal?: AbortSignal } = {}
): Promise<AdminSecuritySettings> {
  const data = await requestJsonWithTimeout<AdminSecuritySettingsResponse>(
    "/api/admin/security",
    {
      signal: options.signal,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    }
  );
  return data.settings;
}

export async function updateAdminPassword(
  input: AdminPasswordInput,
  token: string
): Promise<{ settings: AdminSecuritySettings; token: string }> {
  const response = await fetch("/api/admin/security", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
  const data = await readJson<AdminSecuritySettingsResponse>(response);
  if (!data.token) {
    throw new Error("Updated admin session token is missing.");
  }
  return { settings: data.settings, token: data.token };
}

export async function loadTelegramSettings(
  token: string,
  options: { signal?: AbortSignal } = {}
): Promise<TelegramSettings> {
  const data = await requestJsonWithTimeout<TelegramSettingsResponse>(
    "/api/admin/telegram-settings",
    {
      signal: options.signal,
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
    }
  );
  return data.settings;
}

export async function saveTelegramSettings(
  input: Pick<TelegramSettings, "enabled" | "target" | "footerMarkdown">,
  token: string
) {
  const response = await fetch("/api/admin/telegram-settings", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
  return (await readJson<TelegramSettingsResponse>(response)).settings;
}

export async function testTelegramSettings(token: string) {
  const response = await fetch("/api/admin/telegram-settings/test", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  return (await readJson<TelegramConnectionResponse>(response)).connection;
}

export async function loadTelegramMessage(
  resourceType: TelegramResourceType,
  resourceId: string,
  token: string,
  locale: "zh" | "en"
) {
  const response = await fetch(
    `/api/admin/telegram-messages/${resourceType}/${encodeURIComponent(resourceId)}?locale=${locale}`,
    { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } }
  );
  return (await readJson<TelegramMessageResponse>(response)).message;
}

export async function loadTelegramPushRecords(
  token: string,
  params: {
    cursor?: string;
    limit?: number;
    query?: string;
    resourceType?: TelegramResourceType;
    sort?: "latest" | "oldest";
  } = {}
): Promise<TelegramPushPage> {
  const searchParams = new URLSearchParams();
  if (params.cursor) searchParams.set("cursor", params.cursor);
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.query) searchParams.set("q", params.query);
  if (params.resourceType) searchParams.set("type", params.resourceType);
  if (params.sort) searchParams.set("sort", params.sort);
  const suffix = searchParams.size ? `?${searchParams.toString()}` : "";
  const response = await fetch(`/api/admin/telegram-messages${suffix}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
  });
  return readJson<TelegramPushPage>(response);
}

export async function deleteTelegramPush(
  resourceType: TelegramResourceType,
  resourceId: string,
  recordId: string,
  token: string
) {
  const response = await fetch(
    `/api/admin/telegram-messages/${resourceType}/${encodeURIComponent(resourceId)}?recordId=${encodeURIComponent(recordId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return (await readJson<TelegramDeleteResponse>(response)).result;
}

export async function sendTelegramMessage(
  resourceType: TelegramResourceType,
  resourceId: string,
  bodyMarkdown: string,
  mediaEnabled: boolean,
  mediaUrl: string,
  locale: "zh" | "en",
  token: string,
  title = ""
) {
  const response = await fetch(
    `/api/admin/telegram-messages/${resourceType}/${encodeURIComponent(resourceId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ bodyMarkdown, mediaEnabled, mediaUrl, locale, title })
    }
  );
  return (await readJson<TelegramMessageResponse>(response)).message;
}

export async function updateTelegramMessage(
  resourceType: TelegramResourceType,
  resourceId: string,
  bodyMarkdown: string,
  mediaEnabled: boolean,
  mediaUrl: string,
  locale: "zh" | "en",
  token: string,
  title = ""
) {
  const response = await fetch(
    `/api/admin/telegram-messages/${resourceType}/${encodeURIComponent(resourceId)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ bodyMarkdown, mediaEnabled, mediaUrl, locale, title })
    }
  );
  return (await readJson<TelegramMessageResponse>(response)).message;
}

export async function recoverTelegramMessage(
  resourceType: TelegramResourceType,
  resourceId: string,
  bodyMarkdown: string,
  mediaEnabled: boolean,
  mediaUrl: string,
  locale: "zh" | "en",
  token: string
) {
  const response = await fetch(
    `/api/admin/telegram-messages/${resourceType}/${encodeURIComponent(resourceId)}/recover?locale=${locale}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ bodyMarkdown, mediaEnabled, mediaUrl })
    }
  );
  return (await readJson<TelegramMessageResponse>(response)).message;
}

export async function saveTelegramMessage(
  resourceType: TelegramResourceType,
  resourceId: string,
  bodyMarkdown: string,
  mediaEnabled: boolean,
  mediaUrl: string,
  locale: "zh" | "en",
  token: string,
  title = ""
) {
  const response = await fetch(
    `/api/admin/telegram-messages/${resourceType}/${encodeURIComponent(resourceId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ bodyMarkdown, mediaEnabled, mediaUrl, locale, title })
    }
  );
  return (await readJson<TelegramMessageResponse>(response)).message;
}

export async function loadGitHubSettings(
  token: string,
  options: { signal?: AbortSignal } = {}
): Promise<GitHubSettings> {
  const data = await requestJsonWithTimeout<GitHubSettingsResponse>(
    "/api/admin/github-settings",
    {
      signal: options.signal,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    }
  );
  return data.settings;
}

export async function saveGitHubSettings(
  input: GitHubSettingsInput,
  token: string
): Promise<GitHubSettings> {
  const response = await fetch("/api/admin/github-settings", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
  const data = await readJson<GitHubSettingsResponse>(response);
  return data.settings;
}

const pendingGitHubMetadataRequests = new Map<
  string,
  Promise<GitHubToolMetadata>
>();
let adminGitHubMetadataMode: "server" | "browser" = "server";

export function loadGitHubToolMetadata(
  url: string,
  token: string,
  options: { forceRefresh?: boolean } = {}
): Promise<GitHubToolMetadata> {
  const requestMode = options.forceRefresh ? "force" : "cached";
  const requestKey = `${token}\u0000${requestMode}\u0000${url.trim().toLowerCase()}`;
  const pendingRequest = pendingGitHubMetadataRequests.get(requestKey);
  if (pendingRequest) {
    return pendingRequest;
  }

  const request = (async () => {
    if (adminGitHubMetadataMode === "browser") {
      return loadBrowserGitHubMetadata(url, {
        forceRefresh: options.forceRefresh
      });
    }

    const searchParams = new URLSearchParams({ url });
    if (options.forceRefresh) {
      searchParams.set("refresh", "1");
    }

    const response = await fetch(`/api/admin/github-metadata?${searchParams}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    if (response.status === 409) {
      adminGitHubMetadataMode = "browser";
      return loadBrowserGitHubMetadata(url, {
        forceRefresh: options.forceRefresh
      });
    }
    const data = await readJson<GitHubToolMetadataResponse>(response);
    adminGitHubMetadataMode = "server";
    return data.metadata;
  })();

  pendingGitHubMetadataRequests.set(requestKey, request);
  const clearPendingRequest = () => {
    if (pendingGitHubMetadataRequests.get(requestKey) === request) {
      pendingGitHubMetadataRequests.delete(requestKey);
    }
  };
  void request.then(clearPendingRequest, clearPendingRequest);

  return request;
}

export async function checkLinks(
  links: LinkCheckTarget[],
  timeout: number,
  token: string
): Promise<LinkCheckResponse> {
  const response = await fetch("/api/admin/link-check", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      links: links.map((link) => ({
        id: link.id,
        kind: link.kind
      })),
      timeout
    })
  });

  return readJson<LinkCheckResponse>(response);
}
