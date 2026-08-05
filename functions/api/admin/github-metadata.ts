import {
  badRequest,
  json,
  loadGitHubToolMetadata,
  requireAdmin,
  type Env
} from "../../_shared";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) {
    return unauthorized;
  }

  const requestUrl = new URL(request.url);

  if (!env.GITHUB_TOKEN?.trim()) {
    return json(
      {
        error: "GITHUB_TOKEN is not configured.",
        code: "GITHUB_TOKEN_NOT_CONFIGURED"
      },
      { status: 409 }
    );
  }

  try {
    const metadata = await loadGitHubToolMetadata(
      requestUrl.searchParams.get("url") ?? "",
      {
        token: env.GITHUB_TOKEN,
        forceRefresh: requestUrl.searchParams.get("refresh") === "1",
        cacheBaseUrl: request.url
      }
    );
    return json({ metadata });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load GitHub metadata.";

    if (message === "URL must be a GitHub repository.") {
      return badRequest(message);
    }
    if (message === "GitHub metadata request timed out.") {
      return json(
        { error: message, code: "GITHUB_METADATA_TIMEOUT" },
        { status: 504 }
      );
    }

    return json(
      { error: message },
      { status: message === "GitHub repository not found." ? 404 : 502 }
    );
  }
};
