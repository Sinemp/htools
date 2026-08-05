import {
  getTelegramSourceState,
  readTelegramResourceType,
  writeTelegramErrorResponse
} from "../../../../../_telegram";
import { json, requireAdmin, type Env } from "../../../../../_shared";

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  try {
    const url = new URL(request.url);
    return json({
      source: await getTelegramSourceState(
        env,
        readTelegramResourceType(params.resourceType),
        String(params.id ?? ""),
        url.origin,
        url.searchParams.get("locale") === "en" ? "en" : "zh"
      )
    });
  } catch (error) {
    return writeTelegramErrorResponse(error, "Unable to load linked content.");
  }
};
