import { testTelegramConnection, writeTelegramErrorResponse } from "../../../_telegram";
import {
  json,
  requireAdmin,
  type Env
} from "../../../_shared";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  try {
    const payload = await request.json().catch(() => ({})) as {
      target?: unknown;
    };
    return json({
      connection: await testTelegramConnection(env, payload.target)
    });
  } catch (error) {
    return writeTelegramErrorResponse(error, "Unable to test Telegram connection.");
  }
};
