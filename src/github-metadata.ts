import type { GitHubToolMetadata } from "./types";
import { getGitHubRepoPath, normalizeHttpUrlInput } from "./tool-helpers";

type GitHubRepositoryResponse = {
  description?: string | null;
  forks_count?: number;
  full_name?: string;
  homepage?: string | null;
  html_url?: string;
  language?: string | null;
  license?: { name?: string | null; spdx_id?: string | null } | null;
  name?: string;
  owner?: { login?: string };
  private?: boolean;
  stargazers_count?: number;
  topics?: unknown;
  updated_at?: string;
};

type BrowserGitHubMetadataOptions = {
  fetchImpl?: typeof fetch;
  forceRefresh?: boolean;
  timeoutMs?: number;
};

export class BrowserGitHubMetadataError extends Error {
  constructor(
    readonly code:
      | "GITHUB_URL_INVALID"
      | "GITHUB_REPOSITORY_NOT_FOUND"
      | "GITHUB_RATE_LIMITED"
      | "GITHUB_METADATA_TIMEOUT"
      | "GITHUB_REQUEST_FAILED",
    message: string
  ) {
    super(message);
    this.name = "BrowserGitHubMetadataError";
  }
}

const browserGitHubMetadataCache = new Map<string, GitHubToolMetadata>();
export const GITHUB_METADATA_REQUEST_TIMEOUT_MS = 10_000;

export async function loadBrowserGitHubMetadata(
  value: string,
  options: BrowserGitHubMetadataOptions = {}
): Promise<GitHubToolMetadata> {
  const normalizedUrl = normalizeHttpUrlInput(value);
  const repoPath = getGitHubRepoPath(normalizedUrl);
  if (!repoPath) {
    throw new BrowserGitHubMetadataError(
      "GITHUB_URL_INVALID",
      "URL must be a GitHub repository."
    );
  }

  const cacheKey = repoPath.toLowerCase();
  const cached = browserGitHubMetadataCache.get(cacheKey);
  if (cached && !options.forceRefresh) return cached;

  const [owner, repo] = repoPath.split("/");
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? GITHUB_METADATA_REQUEST_TIMEOUT_MS;
  let timedOut = false;
  const timeout = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  let data: GitHubRepositoryResponse;

  try {
    const response = await (options.fetchImpl ?? fetch)(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28"
        },
        signal: controller.signal
      }
    );

    if (response.status === 404) {
      throw new BrowserGitHubMetadataError(
        "GITHUB_REPOSITORY_NOT_FOUND",
        "GitHub repository not found."
      );
    }
    if (
      response.status === 429 ||
      (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0")
    ) {
      throw new BrowserGitHubMetadataError(
        "GITHUB_RATE_LIMITED",
        "GitHub API rate limit reached. Try again later."
      );
    }
    if (!response.ok) {
      throw new BrowserGitHubMetadataError(
        "GITHUB_REQUEST_FAILED",
        `GitHub API request failed with status ${response.status}.`
      );
    }

    data = (await response.json()) as GitHubRepositoryResponse;
  } catch (error) {
    if (timedOut) {
      throw new BrowserGitHubMetadataError(
        "GITHUB_METADATA_TIMEOUT",
        "GitHub metadata request timed out."
      );
    }
    if (error instanceof BrowserGitHubMetadataError) throw error;
    throw new BrowserGitHubMetadataError(
      "GITHUB_REQUEST_FAILED",
      "Unable to load GitHub metadata."
    );
  } finally {
    globalThis.clearTimeout(timeout);
  }

  if (data.private === true) {
    throw new BrowserGitHubMetadataError(
      "GITHUB_REPOSITORY_NOT_FOUND",
      "GitHub repository not found."
    );
  }

  const fullName = readText(data.full_name) || repoPath;
  const repoName = readText(data.name) || repo;
  const repoOwner = readText(data.owner?.login) || owner;
  const metadata: GitHubToolMetadata = {
    owner: repoOwner,
    repo: repoName,
    fullName,
    name: repoName,
    description: readText(data.description) || fullName,
    url: normalizeUrl(data.html_url) || `https://github.com/${repoPath}`,
    demoUrl: normalizeUrl(data.homepage),
    image: `https://opengraph.githubassets.com/htools/${repoPath}`,
    stars: typeof data.stargazers_count === "number" ? data.stargazers_count : 0,
    forks: typeof data.forks_count === "number" ? data.forks_count : 0,
    language: readText(data.language),
    license: normalizeLicense(data.license),
    topics: normalizeTopics(data.topics),
    updatedAt: readText(data.updated_at)
  };

  browserGitHubMetadataCache.set(cacheKey, metadata);
  return metadata;
}

function readText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeUrl(value: unknown) {
  const normalized = normalizeHttpUrlInput(readText(value));
  if (!normalized) return "";
  try {
    const url = new URL(normalized);
    return /^https?:$/.test(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

function normalizeLicense(value: GitHubRepositoryResponse["license"]) {
  const spdxId = readText(value?.spdx_id);
  return spdxId && spdxId.toUpperCase() !== "NOASSERTION"
    ? spdxId
    : readText(value?.name);
}

function normalizeTopics(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .filter((topic): topic is string => typeof topic === "string")
        .map((topic) => topic.trim())
        .filter(Boolean)
    )
  ).slice(0, 12);
}
