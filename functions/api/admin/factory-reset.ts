import {
  getDatabase,
  ensureTelegramMessageSchema,
  invalidatePublicApiCache,
  json,
  jsonError,
  requireAdmin,
  type Env
} from "../../_shared";

const SOURCE_PUBLIC_KEY = "source_public_enabled";
const ADMIN_CATEGORY_SETTINGS_KEY = "admin_category_settings";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const db = await getDatabase(env);
    await ensureTelegramMessageSchema(db);
    const [toolCount, articleCount, contentSourceCount, contentItemCount, telegramMessageCount] =
      await db.batch([
        db.prepare("SELECT COUNT(*) AS total FROM tools"),
        db.prepare("SELECT COUNT(*) AS total FROM articles"),
        db.prepare("SELECT COUNT(*) AS total FROM content_sources"),
        db.prepare("SELECT COUNT(*) AS total FROM content_items"),
        db.prepare("SELECT COUNT(*) AS total FROM telegram_messages")
      ]);
    const counts = {
      tools: readCount(toolCount),
      articles: readCount(articleCount),
      contentSources: readCount(contentSourceCount),
      contentItems: readCount(contentItemCount),
      telegramMessages: readCount(telegramMessageCount),
      settings: 1
    };
    const deleted =
      counts.tools + counts.articles + counts.contentSources + counts.contentItems +
      counts.telegramMessages;

    await db.batch([
      db.prepare("DELETE FROM telegram_messages"),
      db.prepare("DELETE FROM content_items"),
      db.prepare("DELETE FROM content_sources"),
      db.prepare("DELETE FROM articles"),
      db.prepare("DELETE FROM tools"),
      db.prepare("DELETE FROM app_settings WHERE key = ?").bind(
        ADMIN_CATEGORY_SETTINGS_KEY
      ),
      db.prepare(
        `INSERT INTO app_settings (key, value, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
      ).bind(SOURCE_PUBLIC_KEY, JSON.stringify({ enabled: false }))
    ]);

    await invalidatePublicApiCache(env);

    return json({ deleted, counts });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reset factory settings.";
    return jsonError(message, "SERVER_ERROR", { status: 500 });
  }
};

function readCount(result: D1Result<unknown>) {
  const first =
    typeof result.results?.[0] === "object" && result.results[0] !== null
      ? (result.results[0] as Record<string, unknown>)
      : null;
  const total = first?.total;

  return typeof total === "number" ? total : Number(total ?? 0);
}
