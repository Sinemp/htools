import {
  deleteTelegramPush,
  getTelegramMessageState,
  readTelegramResourceType,
  saveTelegramMessage,
  sendTelegramMessage,
  updateTelegramMessage,
  writeTelegramErrorResponse
} from "../../../../_telegram";
import { json, requireAdmin, type Env } from "../../../../_shared";

type TelegramPayload = {
  bodyMarkdown?: unknown;
  mediaEnabled?: unknown;
  mediaUrl?: unknown;
  locale?: unknown;
  title?: unknown;
  resource?: unknown;
  category?: unknown;
};

function readRequestContext(request: Request, params: Record<string, string | string[]>) {
  const url = new URL(request.url);
  return {
    locale: url.searchParams.get("locale") === "en" ? "en" as const : "zh" as const,
    origin: url.origin,
    resourceId: String(params.id ?? ""),
    resourceType: readTelegramResourceType(params.resourceType)
  };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  try {
    const context = readRequestContext(request, params);
    return json({
      message: await getTelegramMessageState(
        env,
        context.resourceType,
        context.resourceId,
        context.origin,
        context.locale
      )
    });
  } catch (error) {
    return writeTelegramErrorResponse(error, "Unable to load Telegram message.");
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  try {
    const context = readRequestContext(request, params);
    const payload = (await request.json()) as TelegramPayload;
    return json({
      message: await sendTelegramMessage(
        env,
        context.resourceType,
        context.resourceId,
        context.origin,
        payload
      )
    }, { status: 201 });
  } catch (error) {
    return writeTelegramErrorResponse(error, "Unable to send Telegram message.");
  }
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  try {
    const context = readRequestContext(request, params);
    const payload = (await request.json()) as TelegramPayload;
    return json({
      message: await updateTelegramMessage(
        env,
        context.resourceType,
        context.resourceId,
        context.origin,
        payload
      )
    });
  } catch (error) {
    return writeTelegramErrorResponse(error, "Unable to update Telegram message.");
  }
};

export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  try {
    const context = readRequestContext(request, params);
    const payload = (await request.json()) as TelegramPayload;
    return json({
      message: await saveTelegramMessage(
        env,
        context.resourceType,
        context.resourceId,
        context.origin,
        payload,
        payload.locale === "en" ? "en" : "zh"
      )
    });
  } catch (error) {
    return writeTelegramErrorResponse(error, "Unable to save Telegram message.");
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  try {
    const context = readRequestContext(request, params);
    const recordId = new URL(request.url).searchParams.get("recordId") ?? undefined;
    return json({
      result: await deleteTelegramPush(
        env,
        context.resourceType,
        context.resourceId,
        recordId
      )
    });
  } catch (error) {
    return writeTelegramErrorResponse(error, "Unable to delete Telegram message.");
  }
};
