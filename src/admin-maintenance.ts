import { normalizeUrlForImport } from "./admin-helpers";
import { isValidHttpUrl } from "./tool-helpers";
import type {
  BackupCounts,
  HtoolsBackup,
  Tool,
  ToolImportMode
} from "./types";

type SourceText = {
  sourceRequestFailed: (status: number) => string;
  sourceEmpty: string;
  sourceInvalid: string;
  sourceItemObject: string;
  sourceRequired: (fields: string) => string;
  sourceUrlInvalid: string;
  sourceDemoUrlInvalid: string;
  sourceImageInvalid: string;
};

type BackupText = {
  backupInvalid: string;
  backupTooLarge: string;
};

const SUPPORTED_BACKUP_VERSION = "4";
const MAX_BACKUP_FILE_BYTES = 10 * 1024 * 1024;
const BACKUP_DATA_FIELDS = [
  "tools",
  "articles",
  "contentSources",
  "contentItems",
  "telegramMessages",
  "settings"
] as const;

export async function fetchToolSource(sourceUrl: string, text: SourceText) {
  const response = await fetch(sourceUrl, {
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(text.sourceRequestFailed(response.status));
  }

  const payload = (await response.json()) as unknown;
  const tools = readToolSource(payload, text);

  if (!tools.length) {
    throw new Error(text.sourceEmpty);
  }

  return tools;
}

function readToolSource(payload: unknown, text: SourceText) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "tools" in payload &&
    Array.isArray((payload as { tools?: unknown }).tools)
  ) {
    return (payload as { tools: unknown[] }).tools;
  }

  throw new Error(text.sourceInvalid);
}

export function readBackupPayload(payload: unknown, text: BackupText): HtoolsBackup {
  if (!isRecordValue(payload)) {
    throw new Error(text.backupInvalid);
  }

  if (
    payload.source !== "htools-backup" ||
    payload.version !== SUPPORTED_BACKUP_VERSION
  ) {
    throw new Error(text.backupInvalid);
  }

  if (!isRecordValue(payload.data)) {
    throw new Error(text.backupInvalid);
  }

  const data = payload.data;

  if (BACKUP_DATA_FIELDS.some((field) => !Array.isArray(data[field]))) {
    throw new Error(text.backupInvalid);
  }

  return {
    source: "htools-backup",
    version: payload.version,
    exportedAt: typeof payload.exportedAt === "string" ? payload.exportedAt : "",
    counts: readBackupCounts(data),
    data
  };
}

export function validateBackupFileSize(file: Pick<File, "size">, text: BackupText) {
  if (file.size > MAX_BACKUP_FILE_BYTES) {
    throw new Error(text.backupTooLarge);
  }
}

function readBackupCounts(data: Record<string, unknown>): BackupCounts {
  return {
    tools: readBackupCount(data.tools),
    articles: readBackupCount(data.articles),
    contentSources: readBackupCount(data.contentSources),
    contentItems: readBackupCount(data.contentItems),
    telegramMessages: readBackupCount(data.telegramMessages),
    settings: readBackupCount(data.settings)
  };
}

function readBackupCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function isRecordValue(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function createSourcePreview(
  items: unknown[],
  currentTools: Tool[],
  mode: ToolImportMode,
  text: SourceText
) {
  const currentUrls = new Set(
    currentTools.map((tool) => normalizeUrlForImport(tool.url)).filter(Boolean)
  );
  const seenUrls = new Set<string>();
  const errors: Array<{ index: number; message: string }> = [];
  let valid = 0;
  let invalid = 0;
  let duplicateInSource = 0;
  let duplicateInSite = 0;
  let willCreate = 0;
  let willUpdate = 0;
  let willSkip = 0;

  items.forEach((item, index) => {
    const result = validateSourcePreviewItem(item, text);

    if (!result.ok) {
      invalid += 1;
      errors.push({ index, message: result.message });
      return;
    }

    valid += 1;

    if (seenUrls.has(result.urlKey)) {
      duplicateInSource += 1;
      willSkip += 1;
      return;
    }

    seenUrls.add(result.urlKey);

    if (currentUrls.has(result.urlKey)) {
      duplicateInSite += 1;

      if (mode === "upsert") {
        willUpdate += 1;
      } else {
        willSkip += 1;
      }
      return;
    }

    willCreate += 1;
  });

  return {
    total: items.length,
    valid,
    invalid,
    duplicateInSource,
    duplicateInSite,
    willCreate,
    willUpdate,
    willSkip,
    errors
  };
}

function validateSourcePreviewItem(
  item: unknown,
  text: SourceText
): { ok: true; urlKey: string } | { ok: false; message: string } {
  if (!item || typeof item !== "object") {
    return { ok: false, message: text.sourceItemObject };
  }

  const payload = item as Record<string, unknown>;
  const requiredFields = ["name", "description", "url", "category"] as const;
  const missing = requiredFields.filter(
    (field) => typeof payload[field] !== "string" || !payload[field].trim()
  );

  if (missing.length) {
    return { ok: false, message: text.sourceRequired(missing.join(", ")) };
  }

  const url = String(payload.url).trim();
  const demoUrl =
    typeof payload.demoUrl === "string"
      ? payload.demoUrl.trim()
      : typeof payload.demo_url === "string"
        ? payload.demo_url.trim()
        : "";
  const image = typeof payload.image === "string" ? payload.image.trim() : "";

  if (!isValidHttpUrl(url)) {
    return { ok: false, message: text.sourceUrlInvalid };
  }

  if (demoUrl && !isValidHttpUrl(demoUrl)) {
    return { ok: false, message: text.sourceDemoUrlInvalid };
  }

  if (image && !isValidHttpUrl(image)) {
    return { ok: false, message: text.sourceImageInvalid };
  }

  return { ok: true, urlKey: normalizeUrlForImport(url) };
}

export function createCsv(rows: Array<Array<string | number>>) {
  return rows
    .map((row) => row.map((cell) => escapeCsvCell(String(cell))).join(","))
    .join("\n");
}

function escapeCsvCell(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function createDatedExportFilename(
  kind: "backup" | "link-check" | "tools",
  extension: "csv" | "json",
  date = new Date()
) {
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");

  return `htools-${kind}-${stamp}.${extension}`;
}

export function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.hidden = true;
  document.body.appendChild(link);

  try {
    link.click();
  } finally {
    window.setTimeout(() => {
      link.remove();
      window.URL.revokeObjectURL(url);
    }, 0);
  }
}
