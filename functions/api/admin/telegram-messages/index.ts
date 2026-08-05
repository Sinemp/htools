import {
  listTelegramPushRecords,
  readTelegramResourceType,
  writeTelegramErrorResponse
} from "../../../_telegram";
import { json, requireAdmin, type Env } from "../../../_shared";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  try {
    const url = new URL(request.url);
    const typeValue = url.searchParams.get("type");
    const resourceType = typeValue === "tool" ||
      typeValue === "article" ||
      typeValue === "content" ||
      typeValue === "custom"
      ? readTelegramResourceType(typeValue)
      : null;
    const limitParam = url.searchParams.get("limit");
    const limitValue = limitParam === null ? undefined : Number(limitParam);
    return json(
      await listTelegramPushRecords(env, url.origin, {
        cursor: url.searchParams.get("cursor"),
        limit: limitValue !== undefined && Number.isSafeInteger(limitValue)
          ? limitValue
          : undefined,
        query: url.searchParams.get("q") ?? "",
        resourceType,
        category: url.searchParams.get("category"),
        sort: url.searchParams.get("sort") === "oldest" ? "oldest" : "latest"
      })
    );
  } catch (error) {
    return writeTelegramErrorResponse(error, "Unable to load Telegram pushes.");
  }
};
