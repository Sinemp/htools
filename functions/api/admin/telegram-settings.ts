import {
  getTelegramSettings,
  saveTelegramSettings,
  writeTelegramErrorResponse
} from "../../_telegram";
import {
  json,
  requireAdmin,
  type Env
} from "../../_shared";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  try {
    return json({ settings: await getTelegramSettings(env) });
  } catch (error) {
    return writeTelegramErrorResponse(error, "Unable to load Telegram settings.");
  }
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  try {
    const payload = (await request.json()) as {
      enabled?: unknown;
      target?: unknown;
      footerMarkdown?: unknown;
    };
    return json({ settings: await saveTelegramSettings(env, payload) });
  } catch (error) {
    return writeTelegramErrorResponse(error, "Unable to save Telegram settings.");
  }
};
