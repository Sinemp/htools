import type { Locale } from "./i18n";
import type { ContentItemSummary, GitHubToolMetadata, ToolInput } from "./types";
import { normalizeMarkdownImageUrl } from "./article-helpers";
import { isValidHttpUrl } from "./tool-helpers";

export type GitHubMetadataEditableFields = {
  name: string;
  description: string;
  url: string;
  demoUrl: string;
  image: string;
  tags: string[];
};

function shouldUseGitHubMetadataValue(
  currentValue: string,
  previousValue?: string
) {
  const current = currentValue.trim();
  const previous = previousValue?.trim() ?? "";

  return !current || (Boolean(previous) && current === previous);
}

export function applyGitHubMetadataToForm(
  current: ToolInput,
  metadata: GitHubToolMetadata,
  normalizedUrl: string,
  previousMetadata?: GitHubToolMetadata | null,
  overwrite = false,
  requestSnapshot?: GitHubMetadataEditableFields
): ToolInput {
  const fields = applyGitHubMetadataToFields(
    current,
    metadata,
    normalizedUrl,
    previousMetadata,
    overwrite,
    requestSnapshot
  );

  return {
    ...current,
    ...fields,
    githubLanguage: metadata.language,
    githubLicense: metadata.license
  };
}

export function applyGitHubMetadataToFields(
  current: GitHubMetadataEditableFields,
  metadata: GitHubToolMetadata,
  normalizedUrl: string,
  previousMetadata?: GitHubToolMetadata | null,
  overwrite = false,
  requestSnapshot?: GitHubMetadataEditableFields
): GitHubMetadataEditableFields {
  if (overwrite) {
    const snapshot = requestSnapshot ?? current;
    const applyIfUnchanged = (
      currentValue: string,
      snapshotValue: string,
      metadataValue: string
    ) => currentValue === snapshotValue ? metadataValue : currentValue;

    return {
      ...current,
      url: normalizedUrl,
      name: applyIfUnchanged(current.name, snapshot.name, metadata.name),
      description: applyIfUnchanged(
        current.description,
        snapshot.description,
        metadata.description
      ),
      demoUrl: applyIfUnchanged(
        current.demoUrl,
        snapshot.demoUrl,
        metadata.demoUrl
      ),
      image: applyIfUnchanged(current.image, snapshot.image, metadata.image),
      tags: current.tags
    };
  }

  return {
    ...current,
    url: normalizedUrl,
    name: shouldUseGitHubMetadataValue(current.name, previousMetadata?.name)
      ? metadata.name
      : current.name,
    description: shouldUseGitHubMetadataValue(
      current.description,
      previousMetadata?.description
    )
      ? metadata.description
      : current.description,
    demoUrl: shouldUseGitHubMetadataValue(
      current.demoUrl,
      previousMetadata?.demoUrl
    )
      ? metadata.demoUrl
      : current.demoUrl,
    image: shouldUseGitHubMetadataValue(current.image, previousMetadata?.image)
      ? metadata.image
      : current.image,
    tags: current.tags
  };
}

export function createAdminIconFromUrl(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return `/icons/${encodeURIComponent(host)}/icon.png?fallback=404`;
  } catch {
    return "";
  }
}

function createArticleHref(slug: string) {
  return `/articles/${encodeURIComponent(slug)}`;
}

export function createArticleBrowseHref(
  slug: string,
  published?: boolean | null
) {
  return published ? createArticleHref(slug) : `${createArticleHref(slug)}?preview=1`;
}

export function createContentItemPreviewHref(id: string) {
  return `/articles/content-preview?contentItem=${encodeURIComponent(id)}`;
}

export function formatGitHubCount(value: number) {
  if (value >= 1000000) {
    return `${Math.round(value / 100000) / 10}m`;
  }

  if (value >= 1000) {
    return `${Math.round(value / 100) / 10}k`;
  }

  return String(Math.max(0, value));
}

export function formatGitHubUpdatedAt(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}

export function getContentItemPreviewImage(item: ContentItemSummary) {
  const explicitCoverImage = normalizeMarkdownImageUrl(item.coverImage);

  return isValidHttpUrl(explicitCoverImage) ? explicitCoverImage : "";
}

export function getGitHubMetadataDetailText(locale: Locale) {
  const chinese = locale === "zh";

  return {
    forks: "Forks",
    empty: chinese
      ? "\u70b9\u51fb\u4e0a\u65b9 GitHub \u4fe1\u606f\u8bfb\u53d6\u4ed3\u5e93\u8be6\u60c5"
      : "Use GitHub Info above to load repository details",
    failed: chinese
      ? "\u6682\u672a\u8bfb\u53d6\u5230 GitHub \u4ed3\u5e93\u4fe1\u606f"
      : "GitHub repository info is not available",
    language: chinese ? "\u8bed\u8a00" : "Language",
    license: chinese ? "\u534f\u8bae" : "License",
    loading: chinese
      ? "\u6b63\u5728\u8bfb\u53d6 GitHub \u4ed3\u5e93\u4fe1\u606f..."
      : "Loading GitHub repository info...",
    stars: "Stars",
    title: chinese ? "GitHub \u8be6\u60c5" : "GitHub details",
    updatedAt: chinese ? "\u66f4\u65b0" : "Updated"
  };
}

export function isGitHubUrl(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "github.com" || host === "www.github.com";
  } catch {
    return false;
  }
}

export function normalizeSlugInput(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}
