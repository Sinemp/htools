import {
  InvalidRequestError,
  UpstreamServiceError,
  createSearchTerms,
  getDatabase,
  ensureTelegramMessageSchema,
  jsonError,
  type ArticleRow,
  type ContentItemRow,
  type Env,
  type ToolRow
} from "./_shared";

const TELEGRAM_SETTINGS_KEY = "telegram_settings";
const TELEGRAM_MAX_MESSAGE_LENGTH = 4096;
const TELEGRAM_MAX_FOOTER_LENGTH = 1000;
const TELEGRAM_MAX_BODY_LENGTH = 4096;
const TELEGRAM_SECTION_SEPARATOR = "\n\n";
const TELEGRAM_MESSAGE_TOO_LONG_ERROR =
  `Telegram message exceeds the ${TELEGRAM_MAX_MESSAGE_LENGTH} character limit.`;
const TELEGRAM_NOT_CONFIGURED_ERROR = "Telegram configuration is incomplete.";
const TELEGRAM_TEST_TIMEOUT_MS = 10_000;
const TELEGRAM_TEST_TIMEOUT_ERROR = "Telegram connection test timed out.";

export type TelegramSettings = {
  available: boolean;
  enabled: boolean;
  target: string;
  footerMarkdown: string;
};

export type TelegramConnection = {
  botName: string;
  botUsername: string;
  chatId: string;
  chatTitle: string;
  chatType: string;
  canSend: boolean;
};

export type TelegramResourceType = "tool" | "article" | "content" | "custom";

export type TelegramMessageRow = {
  id: string;
  resource_type: TelegramResourceType;
  resource_id: string;
  custom_title: string;
  resource_data: string;
  category: string;
  chat_id: string;
  target_ref: string;
  message_id: string;
  message_markdown: string;
  media_enabled: number;
  media_url: string;
  last_pushed_hash: string;
  sent_at: string;
  updated_at: string;
};

export type TelegramMessageSyncStatus =
  | "not_pushed"
  | "pending"
  | "synced";

export type TelegramMessageState = {
  exists: boolean;
  targetChanged: boolean;
  syncStatus: TelegramMessageSyncStatus;
  bodyMarkdown: string;
  mediaEnabled: boolean;
  mediaUrl: string;
  defaultBodyMarkdown: string;
  defaultMediaUrl: string;
  resource: TelegramResource;
  resourceExists: boolean;
};

type TelegramMessagePayload = {
  bodyMarkdown?: unknown;
  mediaEnabled?: unknown;
  mediaUrl?: unknown;
  locale?: unknown;
  title?: unknown;
  resource?: unknown;
  category?: unknown;
};

export type TelegramSourceState = {
  resource: TelegramResource;
  bodyMarkdown: string;
  mediaUrl: string;
};

export type TelegramResource = {
  type: TelegramResourceType;
  id: string;
  title: string;
  description: string;
  url: string;
  demoUrl: string;
  image: string;
  category: string;
  tags: string[];
};

export type TelegramPushListRecord = {
  id: string;
  resourceType: TelegramResourceType;
  resourceId: string;
  title: string;
  resourceExists: boolean;
  resource: TelegramResource | null;
  messageMarkdown: string;
  mediaEnabled: boolean;
  mediaUrl: string;
  syncStatus: "not_pushed" | "pending" | "synced";
  sentAt: string;
  updatedAt: string;
};

type TelegramPushListRow = TelegramMessageRow & {
  resource_exists: number;
  sort_key: string;
};

export type TelegramPushCategoryOptions = string[];

export type TelegramPushSortMode = "latest" | "oldest";

type TelegramPushCursor = {
  sort: TelegramPushSortMode;
  sortKey: string;
  id: string;
};

type TelegramApiResponse<T> = {
  ok?: boolean;
  result?: T;
  description?: string;
  error_code?: number;
};

type TelegramUser = {
  id: number;
  first_name?: string;
  username?: string;
};

type TelegramChat = {
  id: number;
  title?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  type?: string;
  permissions?: { can_send_messages?: boolean };
};

type TelegramChatMember = {
  status?: string;
  can_post_messages?: boolean;
  can_send_messages?: boolean;
};

type TelegramMessage = {
  message_id: number;
  chat: TelegramChat;
};

type TelegramSendPayload = {
  text: string;
  parse_mode: "HTML";
  link_preview_options: {
    is_disabled: boolean;
    url?: string;
    prefer_large_media?: boolean;
    show_above_text?: boolean;
  };
};

export async function getTelegramSettings(env: Env): Promise<TelegramSettings> {
  const db = await getDatabase(env);
  const row = await db.prepare("SELECT value FROM app_settings WHERE key = ?")
    .bind(TELEGRAM_SETTINGS_KEY)
    .first<{ value: string }>();

  if (!row?.value) {
    const target = getTelegramEnvironmentTarget(env);
    return {
      available: hasTelegramConfiguration(env, target),
      enabled: false,
      target,
      footerMarkdown: ""
    };
  }

  try {
    const parsed = JSON.parse(row.value) as {
      enabled?: unknown;
      target?: unknown;
      footerMarkdown?: unknown;
    };
    const target = Object.prototype.hasOwnProperty.call(parsed, "target")
      ? normalizeTelegramTarget(parsed.target)
      : getTelegramEnvironmentTarget(env);
    const available = hasTelegramConfiguration(env, target);
    return {
      available,
      enabled: available && parsed.enabled === true,
      target,
      footerMarkdown: normalizeFooterMarkdown(parsed.footerMarkdown)
    };
  } catch {
    const target = getTelegramEnvironmentTarget(env);
    return {
      available: hasTelegramConfiguration(env, target),
      enabled: false,
      target,
      footerMarkdown: ""
    };
  }
}

export function writeTelegramErrorResponse(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  if (message === TELEGRAM_TEST_TIMEOUT_ERROR) {
    return jsonError(message, "TELEGRAM_TEST_TIMEOUT", { status: 504 });
  }
  if (isTelegramMessageMissingError(message)) {
    return jsonError(message, "TELEGRAM_MESSAGE_NOT_FOUND", { status: 404 });
  }
  if (isTelegramTargetUnavailableError(message)) {
    return jsonError(message, "TELEGRAM_TARGET_UNAVAILABLE", { status: 400 });
  }
  if (isTelegramPermissionError(message)) {
    return jsonError(message, "TELEGRAM_PERMISSION_DENIED", { status: 403 });
  }
  if (message === TELEGRAM_NOT_CONFIGURED_ERROR) {
    return jsonError(message, "TELEGRAM_NOT_CONFIGURED", { status: 400 });
  }
  if (message === "Telegram pushing is disabled.") {
    return jsonError(message, "TELEGRAM_DISABLED", { status: 400 });
  }
  if (
    message === "Telegram message record was not found." ||
    message === "Telegram message no longer exists."
  ) {
    return jsonError(message, "TELEGRAM_MESSAGE_NOT_FOUND", { status: 404 });
  }
  if (message === "This content has already been pushed to Telegram.") {
    return jsonError(message, "TELEGRAM_MESSAGE_EXISTS", { status: 409 });
  }
  if (message === "Telegram target has changed.") {
    return jsonError(message, "TELEGRAM_TARGET_CHANGED", { status: 409 });
  }
  if (message === "Tool not found." || message === "Article not found.") {
    return jsonError(message, "NOT_FOUND", { status: 404 });
  }
  if (
    message === TELEGRAM_MESSAGE_TOO_LONG_ERROR ||
    message.includes("message body is too long") ||
    message.includes("message footer is too long")
  ) {
    return jsonError(message, "TELEGRAM_MESSAGE_TOO_LONG", { status: 400 });
  }
  if (error instanceof UpstreamServiceError || message.startsWith("Telegram API:")) {
    return jsonError(message, "TELEGRAM_UNAVAILABLE", { status: 502 });
  }
  if (error instanceof InvalidRequestError) {
    return jsonError(message, "INVALID_REQUEST", { status: 400 });
  }
  return jsonError(fallback, "SERVER_ERROR", { status: 500 });
}

function isTelegramMessageMissingError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized === "telegram message no longer exists." ||
    normalized.includes("message to edit not found") ||
    normalized.includes("message to delete not found") ||
    normalized.includes("message_id_invalid")
  );
}

function isTelegramTargetUnavailableError(message: string) {
  const normalized = message.toLowerCase();
  return [
    "chat not found",
    "chat_id_invalid",
    "bot is not a member",
    "bot was kicked",
    "bot was blocked"
  ].some((fragment) => normalized.includes(fragment));
}

function isTelegramPermissionError(message: string) {
  const normalized = message.toLowerCase();
  return [
    "cannot post",
    "cannot send",
    "not enough rights",
    "can't be edited",
    "cannot be edited",
    "forbidden"
  ].some((fragment) => normalized.includes(fragment));
}

export async function saveTelegramSettings(
  env: Env,
  payload: { enabled?: unknown; target?: unknown; footerMarkdown?: unknown }
) {
  const db = await getDatabase(env);
  const enabled = payload.enabled === true;
  const target = normalizeTelegramTarget(payload.target);
  const footerMarkdown = normalizeFooterMarkdown(payload.footerMarkdown);

  if (enabled && !hasTelegramConfiguration(env, target)) {
    throw new InvalidRequestError(TELEGRAM_NOT_CONFIGURED_ERROR);
  }

  const settings = { enabled, target, footerMarkdown };
  await db.prepare(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
  )
    .bind(TELEGRAM_SETTINGS_KEY, JSON.stringify(settings))
    .run();

  return getTelegramSettings(env);
}

export async function testTelegramConnection(env: Env, requestedTarget?: unknown) {
  const settings = await getTelegramSettings(env);
  const target = requestedTarget === undefined
    ? settings.target
    : normalizeTelegramTarget(requestedTarget);
  if (!getTelegramToken(env) || !target) {
    throw new InvalidRequestError(TELEGRAM_NOT_CONFIGURED_ERROR);
  }
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TELEGRAM_TEST_TIMEOUT_MS);

  try {
    return await resolveTelegramConnection(env, target, controller.signal);
  } catch (error) {
    if (timedOut) {
      throw new UpstreamServiceError(TELEGRAM_TEST_TIMEOUT_ERROR);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function readTelegramResourceType(value: unknown): TelegramResourceType {
  if (
    value === "tool" ||
    value === "article" ||
    value === "content" ||
    value === "custom"
  ) return value;
  throw new InvalidRequestError("Telegram resource type is invalid.");
}

export async function listTelegramPushRecords(
  env: Env,
  origin: string,
  options: {
    cursor?: string | null;
    limit?: number;
    query?: string;
    resourceType?: TelegramResourceType | null;
    category?: string | null;
    sort?: TelegramPushSortMode;
  } = {}
) {
  const db = await getDatabase(env);
  const limit = Math.min(50, Math.max(1, Math.trunc(options.limit ?? 30)));
  const query = (options.query ?? "").trim().slice(0, 100);
  const terms = query ? createSearchTerms(query) : null;
  const sort: TelegramPushSortMode = options.sort === "oldest" ? "oldest" : "latest";
  const cursor = readTelegramPushCursor(options.cursor ?? null, sort);
  const baseConditions: string[] = ["1 = 1"];
  const baseParams: Array<string | number> = [];

  if (options.resourceType) {
    baseConditions.push("m.resource_type = ?");
    baseParams.push(options.resourceType);
  }
  const category = (options.category ?? "").trim().slice(0, 48);
  if (category) {
    baseConditions.push("m.category = ?");
    baseParams.push(category);
  }
  if (terms) {
    baseConditions.push(
      `(COALESCE(NULLIF(m.custom_title, ''), CASE WHEN json_valid(m.resource_data) THEN json_extract(m.resource_data, '$.title') ELSE '' END, '') LIKE ? ESCAPE '\\' OR
        m.resource_data LIKE ? ESCAPE '\\' OR
        m.message_markdown LIKE ? ESCAPE '\\')`
    );
    baseParams.push(terms.likePattern, terms.likePattern, terms.likePattern);
  }

  const sortExpression = "m.updated_at";
  const pageConditions = [...baseConditions];
  const pageParams = [...baseParams];
  if (cursor) {
    if (sort === "oldest") {
      pageConditions.push(
        `(${sortExpression} > ? OR (${sortExpression} = ? AND m.id > ?))`
      );
    } else {
      pageConditions.push(
        `(${sortExpression} < ? OR (${sortExpression} = ? AND m.id < ?))`
      );
    }
    pageParams.push(cursor.sortKey, cursor.sortKey, cursor.id);
  }

  const orderClause = sort === "oldest"
    ? "sort_key ASC, m.id ASC"
    : "sort_key DESC, m.id DESC";
  const pageResult = await db.prepare(
    `SELECT m.*,
            CASE
              WHEN m.resource_type = 'custom' THEN 1
              WHEN m.resource_type = 'tool' THEN EXISTS(SELECT 1 FROM tools WHERE id = m.resource_id)
              WHEN m.resource_type = 'article' THEN EXISTS(SELECT 1 FROM articles WHERE id = m.resource_id)
              WHEN m.resource_type = 'content' THEN EXISTS(SELECT 1 FROM content_items WHERE id = m.resource_id)
              ELSE 0
            END AS resource_exists,
            ${sortExpression} AS sort_key
     FROM telegram_messages AS m
     WHERE ${pageConditions.join(" AND ")}
     ORDER BY ${orderClause}
     LIMIT ?`
  )
    .bind(...pageParams, limit + 1)
    .all<TelegramPushListRow>();
  const hasMore = pageResult.results.length > limit;
  const rows = pageResult.results.slice(0, limit);
  const settings = await getTelegramSettings(env);
  const [records, categoryOptions] = await Promise.all([
    Promise.all(
      rows.map((row) => toTelegramPushListRecord(row, origin, settings.footerMarkdown))
    ),
    db.prepare(
      `SELECT DISTINCT category
       FROM telegram_messages
       WHERE TRIM(category) <> ''
       ORDER BY category ASC`
    ).all<{ category: string }>()
  ]);
  const lastRow = rows.at(-1);

  return {
    records,
    categoryOptions: categoryOptions.results.map((row) => row.category),
    limit,
    hasMore,
    nextCursor: hasMore && lastRow
      ? createTelegramPushCursor({ sort, sortKey: lastRow.sort_key ?? "", id: lastRow.id })
      : null
  };
}

export async function getTelegramMessageState(
  env: Env,
  resourceType: TelegramResourceType,
  resourceId: string,
  origin: string,
  locale: "zh" | "en" = "zh"
): Promise<TelegramMessageState> {
  const settings = await requireEnabledTelegramSettings(env);
  const db = await getDatabase(env);
  await ensureTelegramMessageSchema(db);
  const row = await db.prepare(
    `SELECT * FROM telegram_messages
     WHERE resource_type = ? AND resource_id = ?
     ORDER BY updated_at DESC, id DESC
     LIMIT 1`
  )
    .bind(resourceType, resourceId)
    .first<TelegramMessageRow>();
  const resource = await loadStoredOrCurrentTelegramResource(
    db,
    resourceType,
    resourceId,
    origin,
    row
  );
  const defaultBody = buildTelegramMessageMarkdown(
    resource,
    createDefaultTelegramBody(resource),
    settings.footerMarkdown,
    locale
  );
  const defaultMediaUrl = createDefaultTelegramMediaUrl(resource);

  return toTelegramMessageState(
    row,
    defaultBody,
    defaultMediaUrl,
    settings.target,
    resource,
    await telegramResourceExists(db, resourceType, resourceId)
  );
}

export async function getTelegramSourceState(
  env: Env,
  resourceType: TelegramResourceType,
  resourceId: string,
  origin: string,
  locale: "zh" | "en" = "zh"
): Promise<TelegramSourceState> {
  if (resourceType === "custom") {
    throw new InvalidRequestError("Custom Telegram messages have no linked source.");
  }
  const db = await getDatabase(env);
  const settings = await getTelegramSettings(env);
  const resource = await loadTelegramResource(db, resourceType, resourceId, origin);
  return {
    resource,
    bodyMarkdown: buildTelegramMessageMarkdown(
      resource,
      createDefaultTelegramBody(resource),
      settings.footerMarkdown,
      locale
    ),
    mediaUrl: createDefaultTelegramMediaUrl(resource)
  };
}

export async function saveTelegramMessage(
  env: Env,
  resourceType: TelegramResourceType,
  resourceId: string,
  origin: string,
  payload: TelegramMessagePayload,
  locale: "zh" | "en" = "zh"
) {
  await requireEnabledTelegramSettings(env);
  const db = await getDatabase(env);
  await ensureTelegramMessageSchema(db);
  const existing = await db.prepare(
    `SELECT * FROM telegram_messages
     WHERE resource_type = ? AND resource_id = ?
     ORDER BY updated_at DESC, id DESC
     LIMIT 1`
  )
    .bind(resourceType, resourceId)
    .first<TelegramMessageRow>();
  let resource = await loadStoredOrCurrentTelegramResource(
    db, resourceType, resourceId, origin, existing
  );
  resource = normalizeTelegramPayloadResource(payload.resource, resource);
  const customTitle = resolveTelegramCustomTitle(resource, payload);
  const messageMarkdown = normalizeBodyMarkdown(payload.bodyMarkdown);
  const defaultMediaUrl = createDefaultTelegramMediaUrl(resource);
  const media = normalizeTelegramMedia(payload, defaultMediaUrl, false);
  const category = typeof payload.category === "string"
    ? payload.category.trim().slice(0, 48)
    : resource.category;
  const resourceData = serializeTelegramResource(resource);
  const now = new Date().toISOString();

  if (existing) {
    await db.prepare(
      `UPDATE telegram_messages
       SET custom_title = ?, resource_data = ?, category = ?, message_markdown = ?, media_enabled = ?,
           media_url = ?, updated_at = ?
       WHERE id = ?`
    )
      .bind(
        customTitle,
        resourceData,
        category,
        messageMarkdown,
        media.enabled ? 1 : 0,
        media.url,
        now,
        existing.id
      )
      .run();
  } else {
    await db.prepare(
      `INSERT INTO telegram_messages
        (id, resource_type, resource_id, custom_title, resource_data, category, chat_id, target_ref,
         message_id, message_markdown, media_enabled,
         media_url, sent_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, '', '', '', ?, ?, ?, '', ?)`
    )
      .bind(
        crypto.randomUUID(),
        resource.type,
        resource.id,
        customTitle,
        resourceData,
        category,
        messageMarkdown,
        media.enabled ? 1 : 0,
        media.url,
        now
      )
      .run();
  }

  return getTelegramMessageState(
    env,
    resource.type,
    resource.id,
    origin,
    locale
  );
}

export async function sendTelegramMessage(
  env: Env,
  resourceType: TelegramResourceType,
  resourceId: string,
  origin: string,
  payload: TelegramMessagePayload
) {
  const settings = await requireEnabledTelegramSettings(env);
  const db = await getDatabase(env);
  await ensureTelegramMessageSchema(db);
  const existing = await db.prepare(
    `SELECT * FROM telegram_messages
     WHERE resource_type = ? AND resource_id = ?
     ORDER BY updated_at DESC, id DESC
     LIMIT 1`
  )
    .bind(resourceType, resourceId)
    .first<TelegramMessageRow>();
  let resource = await loadStoredOrCurrentTelegramResource(
    db, resourceType, resourceId, origin, existing
  );
  resource = normalizeTelegramPayloadResource(payload.resource, resource);
  const customTitle = resolveTelegramCustomTitle(resource, payload);
  if (existing?.message_id) {
    throw new InvalidRequestError("This content has already been pushed to Telegram.");
  }

  const messageMarkdown = normalizeBodyMarkdown(payload.bodyMarkdown);
  const defaultBody = buildTelegramMessageMarkdown(
    resource,
    createDefaultTelegramBody(resource),
    settings.footerMarkdown,
    payload.locale === "en" ? "en" : "zh"
  );
  const media = normalizeTelegramMedia(
    payload,
    createDefaultTelegramMediaUrl(resource),
    false
  );
  const category = typeof payload.category === "string"
    ? payload.category.trim().slice(0, 48)
    : resource.category;
  const resourceData = serializeTelegramResource(resource);
  const pushedHash = await createTelegramMessageFingerprint(
    messageMarkdown,
    media.enabled,
    media.url
  );
  const targetRef = settings.target;
  const message = await telegramRequest<TelegramMessage>(env, "sendMessage", {
    chat_id: targetRef,
    ...createTelegramSendPayload(messageMarkdown, media.enabled ? media.url : "")
  });
  const now = new Date().toISOString();
  const chatId = String(message.chat.id);

  if (existing) {
    await db.prepare(
      `UPDATE telegram_messages
       SET custom_title = ?, resource_data = ?, category = ?, chat_id = ?, target_ref = ?, message_id = ?,
           message_markdown = ?, media_enabled = ?, media_url = ?,
           last_pushed_hash = ?, sent_at = ?, updated_at = ?
       WHERE id = ?`
    )
      .bind(
        customTitle,
        resourceData,
        category,
        chatId,
        targetRef,
        String(message.message_id),
        messageMarkdown,
        media.enabled ? 1 : 0,
        media.url,
        pushedHash,
        now,
        now,
        existing.id
      )
      .run();
  } else {
    await db.prepare(
      `INSERT INTO telegram_messages
        (id, resource_type, resource_id, custom_title, resource_data, category, chat_id, target_ref,
         message_id, message_markdown, media_enabled,
         media_url, last_pushed_hash, sent_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        crypto.randomUUID(),
        resource.type,
        resource.id,
        customTitle,
        resourceData,
        category,
        chatId,
        targetRef,
        String(message.message_id),
        messageMarkdown,
        media.enabled ? 1 : 0,
        media.url,
        pushedHash,
        now,
        now
      )
      .run();
  }

  const row = await db.prepare(
    `SELECT * FROM telegram_messages
     WHERE resource_type = ? AND resource_id = ? AND chat_id = ?`
  )
    .bind(resourceType, resourceId, chatId)
    .first<TelegramMessageRow>();

  return toTelegramMessageState(
    row,
    defaultBody,
    createDefaultTelegramMediaUrl(resource),
    targetRef,
    resource,
    await telegramResourceExists(db, resourceType, resourceId)
  );
}

export async function updateTelegramMessage(
  env: Env,
  resourceType: TelegramResourceType,
  resourceId: string,
  origin: string,
  payload: TelegramMessagePayload
) {
  const settings = await requireEnabledTelegramSettings(env);
  const db = await getDatabase(env);
  await ensureTelegramMessageSchema(db);
  const existing = await db.prepare(
    `SELECT * FROM telegram_messages
     WHERE resource_type = ? AND resource_id = ? AND message_id <> ''
     ORDER BY updated_at DESC, id DESC
     LIMIT 1`
  )
    .bind(resourceType, resourceId)
    .first<TelegramMessageRow>();
  if (!existing) {
    throw new InvalidRequestError("Telegram message record was not found.");
  }
  let resource = await loadStoredOrCurrentTelegramResource(
    db, resourceType, resourceId, origin, existing
  );
  resource = normalizeTelegramPayloadResource(payload.resource, resource);
  const customTitle = resolveTelegramCustomTitle(resource, payload);
  const targetRef = settings.target;
  if (hasTelegramTargetChanged(existing, targetRef)) {
    throw new InvalidRequestError("Telegram target has changed.");
  }

  const messageMarkdown = normalizeBodyMarkdown(payload.bodyMarkdown);
  const defaultBody = buildTelegramMessageMarkdown(
    resource,
    createDefaultTelegramBody(resource),
    settings.footerMarkdown,
    payload.locale === "en" ? "en" : "zh"
  );
  const defaultMediaUrl = createDefaultTelegramMediaUrl(resource);
  const currentMediaEnabled = existing.media_enabled === 1;
  const currentMediaUrl = getTelegramMediaUrl(existing.media_url) || defaultMediaUrl;
  const media = normalizeTelegramMedia(
    payload,
    currentMediaUrl,
    currentMediaEnabled
  );
  const category = typeof payload.category === "string"
    ? payload.category.trim().slice(0, 48)
    : resource.category;
  const resourceData = serializeTelegramResource(resource);
  const pushedHash = await createTelegramMessageFingerprint(
    messageMarkdown,
    media.enabled,
    media.url
  );
  try {
    await telegramRequest<TelegramMessage>(env, "editMessageText", {
      chat_id: existing.chat_id,
      message_id: Number(existing.message_id),
      ...createTelegramSendPayload(messageMarkdown, media.enabled ? media.url : "")
    });
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (isTelegramMessageMissingError(message)) {
      throw new InvalidRequestError("Telegram message no longer exists.");
    }
    if (!message.includes("message is not modified")) {
      throw error;
    }
  }

  const now = new Date().toISOString();
  await db.prepare(
    `UPDATE telegram_messages
     SET custom_title = ?, resource_data = ?, category = ?, target_ref = ?, message_markdown = ?,
         media_enabled = ?, media_url = ?,
         last_pushed_hash = ?, updated_at = ?
     WHERE id = ?`
  )
    .bind(
      customTitle,
      resourceData,
      category,
      targetRef,
      messageMarkdown,
      media.enabled ? 1 : 0,
      media.url,
      pushedHash,
      now,
      existing.id
    )
    .run();

  const row = await db.prepare("SELECT * FROM telegram_messages WHERE id = ?")
    .bind(existing.id)
    .first<TelegramMessageRow>();
  return toTelegramMessageState(
    row,
    defaultBody,
    defaultMediaUrl,
    targetRef,
    resource,
    await telegramResourceExists(db, resourceType, resourceId)
  );
}

export async function deleteTelegramPush(
  env: Env,
  resourceType: TelegramResourceType,
  resourceId: string,
  recordId?: string
) {
  const db = await getDatabase(env);
  await ensureTelegramMessageSchema(db);
  const normalizedRecordId = recordId?.trim() ?? "";
  if (normalizedRecordId.length > 256) {
    throw new InvalidRequestError("Telegram message record is invalid.");
  }
  const existing = normalizedRecordId
    ? await db.prepare(
        `SELECT * FROM telegram_messages
         WHERE id = ? AND resource_type = ? AND resource_id = ?
         LIMIT 1`
      )
        .bind(normalizedRecordId, resourceType, resourceId)
        .first<TelegramMessageRow>()
    : await db.prepare(
        `SELECT * FROM telegram_messages
         WHERE resource_type = ? AND resource_id = ?
         ORDER BY updated_at DESC, id DESC
         LIMIT 1`
      )
        .bind(resourceType, resourceId)
        .first<TelegramMessageRow>();

  if (!existing) {
    throw new InvalidRequestError("Telegram message record was not found.");
  }

  await db.prepare("DELETE FROM telegram_messages WHERE id = ?")
    .bind(existing.id)
    .run();

  return {
    deleted: true as const,
    id: existing.id
  };
}

export async function recoverTelegramMessage(
  env: Env,
  resourceType: TelegramResourceType,
  resourceId: string,
  origin: string,
  payload: TelegramMessagePayload,
  locale: "zh" | "en" = "zh"
) {
  await requireEnabledTelegramSettings(env);
  const db = await getDatabase(env);
  await ensureTelegramMessageSchema(db);
  const existing = await db.prepare(
    `SELECT * FROM telegram_messages
     WHERE resource_type = ? AND resource_id = ? AND message_id <> ''
     ORDER BY updated_at DESC, id DESC
     LIMIT 1`
  )
    .bind(resourceType, resourceId)
    .first<TelegramMessageRow>();

  if (!existing) {
    throw new InvalidRequestError("Telegram message record was not found.");
  }
  const resource = await loadStoredOrCurrentTelegramResource(
    db, resourceType, resourceId, origin, existing
  );

  const messageMarkdown = payload.bodyMarkdown === undefined
    ? existing.message_markdown
    : normalizeBodyMarkdown(payload.bodyMarkdown);
  const defaultMediaUrl = createDefaultTelegramMediaUrl(resource);
  const currentMediaEnabled = existing.media_enabled === 1;
  const currentMediaUrl = getTelegramMediaUrl(existing.media_url) || defaultMediaUrl;
  const media = normalizeTelegramMedia(
    payload,
    currentMediaUrl,
    currentMediaEnabled
  );

  await db.prepare(
    `UPDATE telegram_messages
     SET chat_id = '', target_ref = '', message_id = '', message_markdown = ?,
         media_enabled = ?, media_url = ?, last_pushed_hash = '', sent_at = '',
         updated_at = ?
     WHERE id = ?`
  )
    .bind(
      messageMarkdown,
      media.enabled ? 1 : 0,
      media.url,
      new Date().toISOString(),
      existing.id
    )
    .run();

  return getTelegramMessageState(
    env,
    resource.type,
    resource.id,
    origin,
    locale
  );
}

export function buildTelegramMessageMarkdown(
  resource: TelegramResource,
  bodyMarkdown: string,
  footerMarkdown: string,
  locale: "zh" | "en"
) {
  const labels = locale === "zh"
    ? {
        article: "文章地址",
        project: "项目地址",
        demo: "演示地址",
        original: "原文地址"
      }
    : {
        article: "Article",
        project: "Project",
        demo: "Demo",
        original: "Original"
      };
  const editableBody = bodyMarkdown.trim();
  const tags = resource.type === "custom"
    ? ""
    : resource.tags
      .map(toTelegramHashtag)
      .filter(Boolean)
      .join(" ");
  const linkLabel = resource.type === "article" ? labels.article : labels.project;
  const demoLabel = resource.type === "content" ? labels.original : labels.demo;
  const resourceUrl = resource.type === "content" ? "" : resource.url;
  const sections = [
    editableBody,
    resourceUrl ? `${linkLabel}：[${resourceUrl}](${resourceUrl})` : "",
    resource.demoUrl ? `${demoLabel}：[${resource.demoUrl}](${resource.demoUrl})` : "",
    tags,
    footerMarkdown.trim()
  ].filter(Boolean);
  const message = sections.join(TELEGRAM_SECTION_SEPARATOR);

  if (Array.from(message).length > TELEGRAM_MAX_MESSAGE_LENGTH) {
    throw new InvalidRequestError(TELEGRAM_MESSAGE_TOO_LONG_ERROR);
  }
  return message;
}

export function createTelegramSendPayload(
  markdown: string,
  mediaUrl: string
): TelegramSendPayload {
  const normalizedMediaUrl = getTelegramMediaUrl(mediaUrl);
  const text = renderTelegramHtml(markdown);

  if (Array.from(text).length > TELEGRAM_MAX_MESSAGE_LENGTH) {
    throw new InvalidRequestError("Telegram message exceeds the 4096 character limit.");
  }

  return {
    text,
    parse_mode: "HTML",
    link_preview_options: normalizedMediaUrl
      ? {
        is_disabled: false,
        url: normalizedMediaUrl,
        prefer_large_media: true,
        show_above_text: true
      }
      : { is_disabled: true }
  };
}

function renderTelegramHtml(markdown: string) {
  const blocks: string[] = [];
  const inlines: string[] = [];
  let text = markdown.replace(/\r\n?/g, "\n").trim();

  text = text.replace(/```([A-Za-z0-9_+-]*)\n?([\s\S]*?)```/g, (_, language: string, body: string) => {
    const content = escapeTelegramHtml(body.replace(/\n$/, ""));
    blocks.push(
      language
        ? `<pre><code class="language-${escapeTelegramHtml(language)}">${content}</code></pre>`
        : `<pre>${content}</pre>`
    );
    return `%%TGB${blocks.length - 1}%%`;
  });

  text = text.replace(/`([^`\n]+)`/g, (_, body: string) => {
    inlines.push(`<code>${escapeTelegramHtml(body)}</code>`);
    return `%%TGI${inlines.length - 1}%%`;
  });

  text = escapeTelegramHtml(text)
    .replace(
      /\[([^\]\n]+)]\((https?:\/\/[^)\s]+)\)/g,
      (_, label: string, url: string) => `<a href="${url}">${label}</a>`
    )
    .replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>")
    .replace(/~~([^~\n]+)~~/g, "<s>$1</s>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<i>$2</i>");

  const lines: string[] = [];
  let quote: string[] = [];
  const flushQuote = () => {
    if (!quote.length) return;
    lines.push(`<blockquote>${quote.join("\n")}</blockquote>`);
    quote = [];
  };

  for (const line of text.split("\n")) {
    const quoted = line.match(/^&gt;\s?(.*)$/);
    if (quoted) {
      quote.push(quoted[1]);
      continue;
    }
    if (quote.length && isTelegramQuoteContinuation(line)) {
      quote.push(line);
      continue;
    }
    flushQuote();
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    lines.push(heading ? `<b>${heading[1]}</b>` : line);
  }
  flushQuote();

  return lines
    .join("\n")
    .replace(/%%TGI(\d+)%%/g, (_, index: string) => inlines[Number(index)])
    .replace(/%%TGB(\d+)%%/g, (_, index: string) => blocks[Number(index)]);
}

function isTelegramQuoteContinuation(line: string) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^#{1,6}\s/.test(trimmed)) return false;
  if (/^[-*+]\s/.test(trimmed)) return false;
  if (/^\d+\.\s/.test(trimmed)) return false;
  if (/^%%TGB\d+%%$/.test(trimmed)) return false;
  return true;
}

function escapeTelegramHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function hasTelegramConfiguration(env: Env, target: string) {
  return Boolean(getTelegramToken(env) && target);
}

async function requireEnabledTelegramSettings(env: Env) {
  const settings = await getTelegramSettings(env);
  if (!settings.available) {
    throw new InvalidRequestError(TELEGRAM_NOT_CONFIGURED_ERROR);
  }
  if (!settings.enabled) {
    throw new InvalidRequestError("Telegram pushing is disabled.");
  }
  return settings;
}

async function resolveTelegramConnection(
  env: Env,
  target: string,
  signal: AbortSignal
): Promise<TelegramConnection> {
  const bot = await telegramRequest<TelegramUser>(env, "getMe", {}, { signal });
  const chat = await telegramRequest<TelegramChat>(env, "getChat", {
    chat_id: target
  }, { signal });
  const type = chat.type ?? "unknown";

  if (type !== "private") {
    const member = await telegramRequest<TelegramChatMember>(env, "getChatMember", {
      chat_id: chat.id,
      user_id: bot.id
    }, { signal });
    const status = member.status ?? "";
    if (status === "left" || status === "kicked") {
      throw new InvalidRequestError("Telegram bot is not a member of the target chat.");
    }
    if (
      type === "channel" &&
      status !== "creator" &&
      (status !== "administrator" || member.can_post_messages === false)
    ) {
      throw new InvalidRequestError("Telegram bot cannot post to the target channel.");
    }
    if (
      (type === "group" || type === "supergroup") &&
      (member.can_send_messages === false ||
        (status === "member" && chat.permissions?.can_send_messages === false))
    ) {
      throw new InvalidRequestError("Telegram bot cannot send messages to the target group.");
    }
  }

  return {
    botName: bot.first_name?.trim() ?? "",
    botUsername: bot.username ?? "",
    chatId: String(chat.id),
    chatTitle: getTelegramChatTitle(chat),
    chatType: type,
    canSend: true
  };
}

async function telegramRequest<T>(
  env: Env,
  method: string,
  payload: Record<string, unknown>,
  options: { signal?: AbortSignal } = {}
): Promise<T> {
  const token = getTelegramToken(env);
  if (!token) {
    throw new InvalidRequestError(TELEGRAM_NOT_CONFIGURED_ERROR);
  }

  let response: Response;
  try {
    response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: options.signal
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new UpstreamServiceError("Telegram API request failed.");
  }

  const data = (await response.json().catch(() => ({}))) as TelegramApiResponse<T>;
  if (!response.ok || data.ok !== true || data.result === undefined) {
    throw new UpstreamServiceError(
      data.description ? `Telegram API: ${data.description}` : "Telegram API request failed."
    );
  }
  return data.result;
}

function getTelegramToken(env: Env) {
  const token = env.TGTOKEN?.trim() ?? "";
  return /^\d+:[A-Za-z0-9_-]{20,}$/.test(token) ? token : "";
}

function getTelegramEnvironmentTarget(env: Env) {
  try {
    return normalizeTelegramTarget(env.TGID);
  } catch {
    return "";
  }
}

function normalizeTelegramTarget(value: unknown) {
  const target = typeof value === "string" ? value.trim() : "";
  if (!target) return "";
  if (/^@[A-Za-z][A-Za-z0-9_]{3,31}$/.test(target)) return target;
  if (/^-?\d{5,20}$/.test(target)) return target;
  throw new InvalidRequestError("Telegram target is invalid.");
}

function normalizeFooterMarkdown(value: unknown) {
  const footer = typeof value === "string"
    ? value
        .replace(/\r\n?/g, "\n")
        .replace(
          /(^|[\s｜|])([^\[\]\n()｜|]+?)\s*\((https?:\/\/[^)\s]+)\)/g,
          (_, prefix: string, label: string, url: string) =>
            `${prefix}[${label.trim()}](${url})`
        )
        .replace(/\s*｜\s*/g, " ｜ ")
        .trim()
    : "";
  if (Array.from(footer).length > TELEGRAM_MAX_FOOTER_LENGTH) {
    throw new InvalidRequestError("Telegram message footer is too long.");
  }
  return footer;
}

function normalizeBodyMarkdown(value: unknown) {
  const body = typeof value === "string" ? value.replace(/\r\n?/g, "\n").trim() : "";
  if (!body) throw new InvalidRequestError("Telegram message body is required.");
  if (Array.from(body).length > TELEGRAM_MAX_BODY_LENGTH) {
    throw new InvalidRequestError("Telegram message body is too long.");
  }
  return body;
}

function normalizeTelegramMedia(
  payload: TelegramMessagePayload,
  fallbackUrl: string,
  fallbackEnabled: boolean
) {
  const enabled = typeof payload.mediaEnabled === "boolean"
    ? payload.mediaEnabled
    : fallbackEnabled;
  const rawUrl = typeof payload.mediaUrl === "string"
    ? payload.mediaUrl.trim()
    : fallbackUrl;
  const url = getTelegramMediaUrl(rawUrl);

  if (rawUrl && !url) {
    throw new InvalidRequestError("Telegram image URL must use HTTP or HTTPS.");
  }
  if (enabled && !url) {
    throw new InvalidRequestError("Telegram image URL is required when image sending is enabled.");
  }
  if (url.length > 2048) {
    throw new InvalidRequestError("Telegram image URL is too long.");
  }

  return { enabled, url };
}

async function toTelegramPushListRecord(
  row: TelegramPushListRow,
  origin: string,
  footerMarkdown: string
): Promise<TelegramPushListRecord> {
  const resource = createTelegramPushListResource(row, origin, footerMarkdown);
  const messageMarkdown = normalizeTelegramEditableMessageMarkdown(
    row.message_markdown
  );
  const mediaEnabled = row.media_enabled === 1;
  const mediaUrl = getTelegramMediaUrl(row.media_url);
  const currentHash = await createTelegramMessageFingerprint(
    row.message_markdown,
    mediaEnabled,
    mediaUrl
  );

  return {
    id: row.id,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    title: resource?.title ?? readTelegramMessageTitle(row.message_markdown),
    resourceExists: row.resource_type === "custom" || row.resource_exists === 1,
    resource,
    messageMarkdown,
    mediaEnabled,
    mediaUrl,
    syncStatus: !row.message_id
      ? "not_pushed"
      : row.last_pushed_hash === currentHash
        ? "synced"
        : "pending",
    sentAt: row.sent_at,
    updatedAt: row.updated_at
  };
}

function createTelegramPushListResource(
  row: TelegramPushListRow,
  origin: string,
  footerMarkdown: string
): TelegramResource | null {
  const stored = parseTelegramStoredResource(
    row.resource_data,
    row.resource_type,
    row.resource_id,
    origin,
    row.category
  );
  if (stored) return stored;

  if (row.resource_type === "custom") {
    const content = parseCustomPushContent(
      row.message_markdown,
      footerMarkdown,
      row.custom_title
    );
    return {
      type: "custom",
      id: row.resource_id,
      title: row.custom_title,
      description: content.description,
      url: "",
      demoUrl: "",
      image: "",
      category: row.category ?? "",
      tags: content.tags
    };
  }

  return null;
}

function resolveTelegramCustomTitle(
  resource: TelegramResource,
  payload: TelegramMessagePayload
) {
  const provided = typeof payload.title === "string" ? payload.title.trim() : "";
  const title = (provided || resource.title).slice(0, 120);
  if (!title) throw new InvalidRequestError("Telegram message title is required.");
  resource.title = title;
  return title;
}

function normalizeTelegramPayloadResource(
  value: unknown,
  fallback: TelegramResource
): TelegramResource {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  const input = value as Partial<Record<keyof TelegramResource, unknown>>;
  const title = typeof input.title === "string" ? input.title.trim().slice(0, 120) : fallback.title;
  const description = typeof input.description === "string"
    ? input.description.trim().slice(0, 4000)
    : fallback.description;
  const url = typeof input.url === "string" ? input.url.trim().slice(0, 2048) : fallback.url;
  const demoUrl = typeof input.demoUrl === "string"
    ? input.demoUrl.trim().slice(0, 2048)
    : fallback.demoUrl;
  const image = typeof input.image === "string" ? input.image.trim().slice(0, 2048) : fallback.image;
  const category = typeof input.category === "string"
    ? input.category.trim().slice(0, 48)
    : fallback.category;
  const tags = Array.isArray(input.tags)
    ? input.tags
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim().replace(/^#+/, "").slice(0, 48))
        .filter(Boolean)
        .slice(0, 24)
    : fallback.tags;

  if (!title) throw new InvalidRequestError("Telegram message title is required.");
  for (const candidate of [url, demoUrl, image]) {
    if (!candidate) continue;
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
    } catch {
      throw new InvalidRequestError("Telegram resource URLs must use HTTP or HTTPS.");
    }
  }

  return {
    type: fallback.type,
    id: fallback.id,
    title,
    description,
    url,
    demoUrl,
    image,
    category,
    tags: Array.from(new Set(tags))
  };
}

function serializeTelegramResource(resource: TelegramResource) {
  return JSON.stringify({
    ...resource,
    url: resource.url,
    demoUrl: resource.demoUrl,
    image: resource.image,
    tags: resource.tags
  });
}

function parseTelegramStoredResource(
  value: string,
  type: TelegramResourceType,
  id: string,
  origin: string,
  categoryOverride = ""
): TelegramResource | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<TelegramResource>;
    if (parsed.type !== type || typeof parsed.title !== "string") return null;
    return {
      type,
      id,
      title: parsed.title,
      description: typeof parsed.description === "string" ? parsed.description : "",
      url: resolveTelegramPublicUrl(typeof parsed.url === "string" ? parsed.url : "", origin),
      demoUrl: resolveTelegramPublicUrl(typeof parsed.demoUrl === "string" ? parsed.demoUrl : "", origin),
      image: resolveTelegramPublicUrl(typeof parsed.image === "string" ? parsed.image : "", origin),
      category: categoryOverride,
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.filter((tag): tag is string => typeof tag === "string")
        : []
    };
  } catch {
    return null;
  }
}

async function loadStoredOrCurrentTelegramResource(
  db: D1Database,
  type: TelegramResourceType,
  id: string,
  origin: string,
  row: TelegramMessageRow | null
) {
  const stored = parseTelegramStoredResource(
    row?.resource_data ?? "",
    type,
    id,
    origin,
    row?.category ?? ""
  );
  if (stored) return stored;
  try {
    return await loadTelegramResource(db, type, id, origin);
  } catch (error) {
    if (!row || type === "custom") throw error;
    const content = parseCustomPushContent(row.message_markdown, "", row.custom_title);
    return {
      type,
      id,
      title: row.custom_title || readTelegramMessageTitle(row.message_markdown),
      description: content.description,
      url: "",
      demoUrl: "",
      image: getTelegramMediaUrl(row.media_url),
      category: row.category,
      tags: content.tags
    };
  }
}

function stripTelegramFooter(markdown: string, footerMarkdown: string) {
  const body = markdown.trim();
  const footer = footerMarkdown.trim();
  if (!footer || !body.endsWith(footer)) return body;
  return body.slice(0, body.length - footer.length).trim();
}

export function normalizeTelegramEditableMessageMarkdown(markdown: string) {
  return markdown.replace(
    /^(项目地址|演示地址|文章地址|本站浏览|原文地址|Project|Article|Demo|Repository|Site View|Original)([：:])\s*(https?:\/\/\S+)$/gim,
    (_line, label: string, separator: string, url: string) =>
      `${label}${separator}[${url}](${url})`
  );
}

function parseCustomPushContent(
  markdown: string,
  footerMarkdown: string,
  title: string
) {
  const body = stripTelegramFooter(markdown, footerMarkdown);
  const tags: string[] = [];
  const lines: string[] = [];

  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^#[^\s#]+(\s+#[^\s#]+)*$/.test(trimmed)) {
      for (const tag of trimmed.split(/\s+/)) {
        const name = tag.replace(/^#/, "").trim();
        if (name && !tags.includes(name)) tags.push(name);
      }
      continue;
    }
    lines.push(trimmed.replace(/^>\s*/, ""));
  }

  const heading = title.trim();
  if (heading && lines[0] === `**${heading}**`) lines.shift();

  return { description: lines.join(" "), tags };
}

function readTelegramMessageTitle(markdown: string) {
  const firstLine = markdown
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean) ?? "";
  const plain = firstLine
    .replace(/^#{1,6}\s+/, "")
    .replace(/^\*{1,3}|\*{1,3}$/g, "")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .trim();
  return plain.slice(0, 120) || "Telegram";
}

function readTelegramPushCursor(
  value: string | null,
  sort: TelegramPushSortMode
): TelegramPushCursor | null {
  if (!value) return null;
  if (value.length > 1024) throw new InvalidRequestError("Telegram push cursor is invalid.");

  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Partial<TelegramPushCursor>;
    if (
      parsed.sort !== sort ||
      typeof parsed.sortKey !== "string" ||
      parsed.sortKey.length > 256 ||
      typeof parsed.id !== "string" ||
      !parsed.id ||
      parsed.id.length > 256
    ) {
      throw new Error();
    }
    return parsed as TelegramPushCursor;
  } catch {
    throw new InvalidRequestError("Telegram push cursor is invalid.");
  }
}

function createTelegramPushCursor(cursor: TelegramPushCursor) {
  const bytes = new TextEncoder().encode(JSON.stringify(cursor));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function loadTelegramResource(
  db: D1Database,
  type: TelegramResourceType,
  id: string,
  origin: string
): Promise<TelegramResource> {
  if (type === "custom") {
    const record = await db.prepare(
      `SELECT custom_title FROM telegram_messages
       WHERE resource_type = 'custom' AND resource_id = ?`
    )
      .bind(id)
      .first<{ custom_title: string }>();
    return {
      type,
      id,
      title: record?.custom_title ?? "",
      description: "",
      url: "",
      demoUrl: "",
      image: "",
      category: "",
      tags: []
    };
  }

  if (type === "tool") {
    const tool = await db.prepare("SELECT * FROM tools WHERE id = ?")
      .bind(id)
      .first<ToolRow>();
    if (!tool) throw new InvalidRequestError("Tool not found.");
    return {
      type,
      id: tool.id,
      title: tool.name,
      description: tool.description,
      url: resolveTelegramPublicUrl(tool.url, origin),
      demoUrl: resolveTelegramPublicUrl(tool.demo_url ?? "", origin),
      image: resolveTelegramPublicUrl(tool.image, origin),
      category: "",
      tags: safelyParseTags(tool.tags)
    };
  }

  if (type === "content") {
    const item = await db.prepare("SELECT * FROM content_items WHERE id = ?")
      .bind(id)
      .first<ContentItemRow>();
    if (!item) throw new InvalidRequestError("Content item not found.");
    return {
      type,
      id: item.id,
      title: item.title,
      description: item.summary,
      url: "",
      demoUrl: resolveTelegramPublicUrl(item.url, origin),
      image: resolveTelegramPublicUrl(item.cover_image, origin),
      category: "",
      tags: Array.from(
        new Set([item.category, ...safelyParseTags(item.tags)].filter(Boolean))
      )
    };
  }

  const article = await db.prepare("SELECT * FROM articles WHERE id = ?")
    .bind(id)
    .first<ArticleRow>();
  if (!article) throw new InvalidRequestError("Article not found.");
  const articlePath = `/articles/${encodeURIComponent(article.slug)}${
    article.published === 1 ? "" : "?preview=1"
  }`;
  return {
    type,
    id: article.id,
    title: article.title,
    description: article.summary,
    url: resolveTelegramPublicUrl(articlePath, origin),
    demoUrl: "",
    image: resolveTelegramPublicUrl(article.cover_image, origin),
    category: "",
    tags: Array.from(
      new Set([article.category, ...safelyParseTags(article.tags)].filter(Boolean))
    )
  };
}

function createDefaultTelegramBody(resource: TelegramResource) {
  const description = escapeTelegramMarkdownText(resource.description);
  const title = escapeTelegramMarkdownText(resource.title);
  return description
    ? `**${title}**${TELEGRAM_SECTION_SEPARATOR}${toTelegramQuoteBlock(description)}`
    : `**${title}**`;
}

function toTelegramQuoteBlock(value: string) {
  return value
    .split("\n")
    .map((line) => (line.trim() ? `> ${line.trim()}` : ">"))
    .join("\n");
}

async function toTelegramMessageState(
  row: TelegramMessageRow | null,
  defaultBody: string,
  defaultMediaUrl: string,
  targetRef: string,
  resource: TelegramResource,
  resourceExists: boolean
): Promise<TelegramMessageState> {
  const sentMediaUrl = getTelegramMediaUrl(row?.media_url ?? "") || defaultMediaUrl;
  const storedMarkdown = row?.message_markdown || "";
  const bodyMarkdown = storedMarkdown
    ? normalizeTelegramEditableMessageMarkdown(storedMarkdown)
    : defaultBody;
  const mediaEnabled = row ? row.media_enabled === 1 : false;
  const currentHash = await createTelegramMessageFingerprint(
    storedMarkdown || bodyMarkdown,
    mediaEnabled,
    sentMediaUrl
  );
  return {
    exists: Boolean(row?.message_id),
    targetChanged: hasTelegramTargetChanged(row, targetRef),
    syncStatus: !row?.message_id
      ? "not_pushed"
      : row.last_pushed_hash === currentHash
        ? "synced"
        : "pending",
    bodyMarkdown,
    mediaEnabled,
    mediaUrl: sentMediaUrl,
    defaultBodyMarkdown: defaultBody,
    defaultMediaUrl,
    resource,
    resourceExists
  };
}

async function telegramResourceExists(
  db: D1Database,
  type: TelegramResourceType,
  id: string
) {
  if (type === "custom") return true;
  const table = type === "tool"
    ? "tools"
    : type === "article"
      ? "articles"
      : "content_items";
  const row = await db.prepare(`SELECT 1 AS found FROM ${table} WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<{ found: number }>();
  return Boolean(row);
}

export function hasTelegramTargetChanged(
  row: TelegramMessageRow | null,
  targetRef: string
) {
  if (!row?.message_id || !targetRef) return false;
  if (row.target_ref) return row.target_ref !== targetRef;
  return Boolean(row.chat_id && row.chat_id !== targetRef);
}

export async function createTelegramMessageFingerprint(
  bodyMarkdown: string,
  mediaEnabled: boolean,
  mediaUrl: string
) {
  const payload = JSON.stringify({
    bodyMarkdown,
    mediaEnabled,
    mediaUrl: mediaEnabled ? mediaUrl : ""
  });
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(payload)
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function createDefaultTelegramMediaUrl(resource: TelegramResource) {
  const repoPath = resource.type === "tool" ? getGitHubRepoPath(resource.url) : "";
  const currentImage = getTelegramMediaUrl(resource.image);

  if (resource.type === "article" || resource.type === "content") return currentImage;

  if (
    repoPath &&
    (!currentImage || isGeneratedPreviewUrl(currentImage))
  ) {
    return `https://opengraph.githubassets.com/htools/${repoPath}`;
  }

  if (currentImage) return currentImage;
  const resourceUrl = getTelegramMediaUrl(resource.url);
  return resourceUrl
    ? `https://image.thum.io/get/width/1200/crop/720/${resourceUrl}`
    : "";
}

function getGitHubRepoPath(value: string) {
  try {
    const url = new URL(value);
    if (!["github.com", "www.github.com"].includes(url.hostname.toLowerCase())) return "";
    const [owner, repository] = url.pathname.split("/").filter(Boolean).slice(0, 2);
    return owner && repository
      ? `${owner}/${repository.replace(/\.git$/i, "")}`
      : "";
  } catch {
    return "";
  }
}

function isGeneratedPreviewUrl(value: string) {
  try {
    return ["image.thum.io", "opengraph.githubassets.com"].includes(
      new URL(value).hostname.toLowerCase()
    );
  } catch {
    return false;
  }
}

function safelyParseTags(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === "string")
      : [];
  } catch {
    return [];
  }
}

function toTelegramHashtag(value: string) {
  const normalized = value.trim().replace(/^#+/, "").replace(/[^\p{L}\p{N}_]+/gu, "_");
  return normalized ? `#${normalized.replace(/^_+|_+$/g, "")}` : "";
}

function getTelegramChatTitle(chat: TelegramChat) {
  const name = [chat.first_name, chat.last_name].filter(Boolean).join(" ").trim();
  return chat.title?.trim() || name || (chat.username ? `@${chat.username}` : String(chat.id));
}

function getTelegramMediaUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : "";
  } catch {
    return "";
  }
}

function resolveTelegramPublicUrl(value: string, origin: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed, normalizeTelegramOrigin(origin));
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function normalizeTelegramOrigin(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return url.origin;
  } catch {
    // Fall through to the invalid local origin below.
  }
  return "https://invalid.local";
}

function escapeTelegramMarkdownText(value: string) {
  return value.trim().replace(/\\/g, "\\\\").replace(/\*/g, "\\*");
}

