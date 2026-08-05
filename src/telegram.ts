import {
  createArticleBrowseHref,
  createContentItemPreviewHref,
  getContentItemPreviewImage
} from "./admin-display";
import { ADMIN_RESOURCE_FIELD_EXAMPLES } from "./admin-field-examples";
import { getArticleDisplayTitle } from "./article-helpers";
import { createToolPreviewSource } from "./tool-helpers";
import type {
  ArticleSummary,
  ContentItemSummary,
  TelegramPushResource,
  Tool
} from "./types";
import type { Locale } from "./i18n";

export type { TelegramPushResource } from "./types";

export const TELEGRAM_MESSAGE_LIMIT = 4096;
const TELEGRAM_SECTION_SEPARATOR = "\n\n";

type TelegramBodyFieldPatch = {
  title?: string;
  description?: string;
  url?: string;
  demoUrl?: string;
  tags?: string[];
  resourceType?: TelegramPushResource["type"];
};

export type TelegramBodyFields = {
  title: string;
  description: string;
  url: string;
  demoUrl: string;
  tags: string[];
};

export function readTelegramBodyTitle(markdown: string) {
  const firstLine = markdown.split("\n").find((line) => line.trim()) ?? "";
  return firstLine
    .trim()
    .replace(/^#{1,6}\s+/, "")
    .replace(/^\*\*([\s\S]*)\*\*$/, "$1")
    .trim();
}

export function createTelegramCustomBodyExample(locale: "zh" | "en") {
  const examples = ADMIN_RESOURCE_FIELD_EXAMPLES[locale];
  const labels = locale === "zh"
    ? { title: "在这里写推送标题", project: "项目地址", demo: "演示地址" }
    : { title: "Write the push title here", project: "Project", demo: "Demo" };
  const tags = examples.tags
    .split(/\s*[,，、;；]\s*/)
    .map(toTelegramHashtag)
    .filter(Boolean)
    .join(" ");

  return [
    `**${labels.title}**`,
    "",
    `> ${examples.description.replace(/^例如[:：]\s*|^Example:\s*/i, "")}`,
    "",
    `${labels.project}：[${examples.url}](${examples.url})`,
    "",
    `${labels.demo}：[${examples.demoUrl}](${examples.demoUrl})`,
    "",
    tags
  ].join("\n");
}

export function syncTelegramBodyField(
  markdown: string,
  patch: TelegramBodyFieldPatch,
  footerMarkdown: string,
  locale: "zh" | "en"
) {
  const footer = footerMarkdown.trim();
  let body = markdown.trim();
  if (footer && body.endsWith(footer)) {
    body = body.slice(0, body.length - footer.length).trim();
  }

  let lines = body ? body.split("\n") : [];
  if (Object.prototype.hasOwnProperty.call(patch, "title")) {
    lines = replaceTelegramTitleLines(lines, patch.title ?? "");
  }
  if (Object.prototype.hasOwnProperty.call(patch, "description")) {
    lines = replaceTelegramDescriptionLines(lines, patch.description ?? "");
  }
  if (Object.prototype.hasOwnProperty.call(patch, "url")) {
    const label = locale === "zh"
      ? patch.resourceType === "article"
        ? "文章地址"
        : patch.resourceType === "content"
          ? "本站浏览"
          : "项目地址"
      : patch.resourceType === "article"
        ? "Article"
        : patch.resourceType === "content"
          ? "Site View"
          : "Project";
    lines = replaceTelegramLabeledLine(
      lines,
      /^(项目地址|文章地址|本站浏览|Project|Article|Site View|Repository)[：:]/i,
      createTelegramUrlLine(label, patch.url ?? ""),
      /^(演示地址|原文地址|Demo|Original)[：:]/i
    );
  }
  if (Object.prototype.hasOwnProperty.call(patch, "demoUrl")) {
    const label = locale === "zh"
      ? patch.resourceType === "content" ? "原文地址" : "演示地址"
      : patch.resourceType === "content" ? "Original" : "Demo";
    lines = replaceTelegramLabeledLine(
      lines,
      /^(演示地址|原文地址|Demo|Original)[：:]/i,
      createTelegramUrlLine(label, patch.demoUrl ?? ""),
      /^#[^\s#]+(?:\s+#[^\s#]+)*$/
    );
  }
  if (Object.prototype.hasOwnProperty.call(patch, "tags")) {
    const hashtags = (patch.tags ?? [])
      .map(toTelegramHashtag)
      .filter(Boolean)
      .join(" ");
    lines = replaceTelegramLabeledLine(
      lines,
      /^#[^\s#]+(?:\s+#[^\s#]+)*$/,
      hashtags
    );
  }

  body = normalizeTelegramBodyLines(lines);
  return [body, footer].filter(Boolean).join(TELEGRAM_SECTION_SEPARATOR);
}

export function readTelegramBodyFields(
  markdown: string,
  footerMarkdown: string,
  locale: "zh" | "en",
  ignoreExamples = false
): TelegramBodyFields {
  const footer = footerMarkdown.trim();
  let body = markdown.trim();
  if (footer && body.endsWith(footer)) {
    body = body.slice(0, body.length - footer.length).trim();
  }

  const lines = body.split("\n");
  const titleLine = lines.find((line) => line.trim())?.trim() ?? "";
  const title = /^\*\*[^*]+\*\*$/.test(titleLine) || /^#{1,6}\s+/.test(titleLine)
    ? readTelegramBodyTitle(titleLine)
    : "";
  const descriptionLines: string[] = [];
  let readingDescription = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^>/.test(trimmed)) {
      readingDescription = true;
      descriptionLines.push(trimmed.replace(/^>\s?/, ""));
    } else if (readingDescription) {
      break;
    }
  }

  const url = readTelegramLabeledUrl(
    lines,
    /^(项目地址|文章地址|本站浏览|Project|Article|Site View|Repository)[：:]/i
  );
  const demoUrl = readTelegramLabeledUrl(
    lines,
    /^(演示地址|原文地址|Demo|Original)[：:]/i
  );
  const hashtagLine = lines.find((line) =>
    /^#[^\s#]+(?:\s+#[^\s#]+)*$/.test(line.trim())
  )?.trim() ?? "";
  const tags = hashtagLine
    ? hashtagLine.split(/\s+/).map((tag) => tag.replace(/^#/, "")).filter(Boolean)
    : [];
  const fields = {
    title,
    description: descriptionLines.join("\n").trim(),
    url,
    demoUrl,
    tags
  };

  if (!ignoreExamples) return fields;

  const examples = ADMIN_RESOURCE_FIELD_EXAMPLES[locale];
  const exampleTitle = locale === "zh"
    ? "在这里写推送标题"
    : "Write the push title here";
  const exampleDescription = examples.description.replace(
    /^例如[:：]\s*|^Example:\s*/i,
    ""
  );
  const exampleTags = examples.tags
    .split(/\s*[,，、;；]\s*/)
    .filter(Boolean);

  return {
    title: fields.title === exampleTitle ? "" : fields.title,
    description: fields.description === exampleDescription ? "" : fields.description,
    url: fields.url === examples.url ? "" : fields.url,
    demoUrl: fields.demoUrl === examples.demoUrl ? "" : fields.demoUrl,
    tags: fields.tags.length === exampleTags.length &&
      fields.tags.every((tag, index) => tag === exampleTags[index])
      ? []
      : fields.tags
  };
}

function replaceTelegramTitleLines(lines: string[], title: string) {
  const next = [...lines];
  const index = next.findIndex((line) => line.trim());
  if (!title.trim()) {
    if (index >= 0 && (/^\*\*[^*]+\*\*$/.test(next[index].trim()) || /^#{1,6}\s+/.test(next[index].trim()))) {
      next.splice(index, 1);
    }
    return next;
  }
  const heading = `**${title.trim()}**`;
  if (index === -1) return heading ? [heading] : [];
  next[index] = heading;
  return next;
}

function replaceTelegramDescriptionLines(lines: string[], description: string) {
  const next = [...lines];
  const titleIndex = next.findIndex((line) => line.trim());
  let start = titleIndex + 1;
  while (start < next.length && !next[start].trim()) start += 1;
  let end = start;
  while (end < next.length && /^>/.test(next[end].trim())) end += 1;
  const quoteLines = description.trim() ? toTelegramQuoteBlock(description).split("\n") : [];

  if (start < next.length && /^>/.test(next[start].trim())) {
    next.splice(start, end - start, ...quoteLines);
  } else if (quoteLines.length) {
    next.splice(start, 0, ...quoteLines, "");
  }
  return next;
}

function replaceTelegramLabeledLine(
  lines: string[],
  matcher: RegExp,
  replacement: string,
  beforeMatcher?: RegExp
) {
  const next = [...lines];
  const index = next.findIndex((line) => matcher.test(line.trim()));
  if (index >= 0) {
    if (replacement) next[index] = replacement;
    else next.splice(index, 1);
    return next;
  }
  if (!replacement) return next;

  const beforeIndex = beforeMatcher
    ? next.findIndex((line) => beforeMatcher.test(line.trim()))
    : -1;
  const insertIndex = beforeIndex >= 0 ? beforeIndex : next.length;
  next.splice(insertIndex, 0, replacement, "");
  return next;
}

function createTelegramUrlLine(label: string, url: string) {
  const normalized = url.trim();
  return normalized ? `${label}：[${normalized}](${normalized})` : "";
}

function readTelegramLabeledUrl(lines: string[], matcher: RegExp) {
  const line = lines.find((candidate) => matcher.test(candidate.trim()))?.trim() ?? "";
  const markdownLink = line.match(/\[[^\]]*]\((https?:\/\/[^)\s]+)\)/i);
  if (markdownLink?.[1]) return markdownLink[1];
  return line.match(/https?:\/\/\S+/i)?.[0]?.replace(/[),.;，。；]+$/, "") ?? "";
}

function normalizeTelegramBodyLines(lines: string[]) {
  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeTelegramFooterMarkdown(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(
      /(^|[\s｜|])([^\[\]\n()｜|]+?)\s*\((https?:\/\/[^)\s]+)\)/g,
      (_, prefix: string, label: string, url: string) =>
        `${prefix}[${label.trim()}](${url})`
    )
    .replace(/\s*｜\s*/g, " ｜ ")
    .trim();
}

export function createTelegramToolResource(tool: Tool): TelegramPushResource {
  return {
    type: "tool",
    id: tool.id,
    title: tool.name,
    description: tool.description,
    url: tool.url,
    demoUrl: tool.demoUrl,
    image: createToolPreviewSource(tool),
    category: "",
    tags: tool.tags
  };
}

export function createTelegramArticleResource(
  article: ArticleSummary,
  origin: string
): TelegramPushResource {
  return {
    type: "article",
    id: article.id,
    title: article.title,
    description: article.summary,
    url: resolveTelegramResourceUrl(
      createArticleBrowseHref(article.slug, article.published),
      origin
    ),
    demoUrl: "",
    image: resolveTelegramResourceUrl(article.coverImage, origin),
    category: "",
    tags: Array.from(new Set([article.category, ...article.tags].filter(Boolean)))
  };
}

export function createTelegramContentResource(
  item: ContentItemSummary,
  origin: string
): TelegramPushResource {
  const browseHref = item.articleId && item.articleSlug
    ? createArticleBrowseHref(item.articleSlug, item.articlePublished)
    : createContentItemPreviewHref(item.id);

  return {
    type: "content",
    id: item.id,
    title: getArticleDisplayTitle(item),
    description: item.summary,
    url: resolveTelegramResourceUrl(browseHref, origin),
    demoUrl: resolveTelegramResourceUrl(item.url, origin),
    image: resolveTelegramResourceUrl(getContentItemPreviewImage(item), origin),
    category: "",
    tags: Array.from(new Set([item.category, ...item.tags].filter(Boolean)))
  };
}

export function createDefaultTelegramBody(resource: TelegramPushResource) {
  const description = escapeTelegramText(resource.description);
  const title = escapeTelegramText(resource.title);
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

export function buildTelegramPreviewMarkdown(
  resource: TelegramPushResource,
  bodyMarkdown: string,
  footerMarkdown: string,
  locale: "zh" | "en"
) {
  const labels = locale === "zh"
    ? {
        article: "文章地址",
        content: "本站浏览",
        project: "项目地址",
        demo: "演示地址",
        original: "原文地址"
      }
    : {
        article: "Article",
        content: "Site View",
        project: "Project",
        demo: "Demo",
        original: "Original"
      };
  const editableBody = bodyMarkdown.trim();
  const tags = resource.type === "custom"
    ? ""
    : resource.tags.map(toTelegramHashtag).filter(Boolean).join(" ");
  const linkLabel = resource.type === "article"
    ? labels.article
    : resource.type === "content"
      ? labels.content
      : labels.project;
  const demoLabel = resource.type === "content" ? labels.original : labels.demo;

  return [
    editableBody,
    resource.url ? `${linkLabel}：[${resource.url}](${resource.url})` : "",
    resource.demoUrl ? `${demoLabel}：[${resource.demoUrl}](${resource.demoUrl})` : "",
    tags,
    footerMarkdown.trim()
  ].filter(Boolean).join(TELEGRAM_SECTION_SEPARATOR);
}

export function createTelegramResourceMediaUrl(resource: TelegramPushResource) {
  if (resource.type === "article" || resource.type === "content") return resource.image;
  if (resource.image) return resource.image;
  return resource.url
    ? `https://image.thum.io/get/width/1200/crop/720/${resource.url}`
    : "";
}

export function countTelegramMessageCharacters(value: string) {
  return Array.from(value).length;
}

export function escapeTelegramPreviewHashtags(value: string) {
  return value.replace(
    /(^|\n)([ \t]*)(#[^\s#]+(?:[ \t]+#[^\s#]+)*)(?=\n|$)/g,
    (_match, lineStart: string, indentation: string, hashtags: string) =>
      `${lineStart}${indentation}\\${hashtags}`
  );
}

export function getTelegramText(locale: Locale) {
  return locale === "zh"
    ? {
      action: "消息推送",
      title: "Telegram 推送",
      management: {
        nav: "消息推送",
        title: "消息推送",
        addPush: "添加推送",
        typeCustom: "手动添加",
        searchPlaceholder: "搜索推送",
        filterAll: "全部",
        typeTool: "工具库",
        typeArticle: "文章管理",
        typeContent: "内容流",
        statusPushed: "已推送",
        pushedNotice: "此消息已推送，无法恢复为草稿；如需修改，请使用“编辑推送”。",
        pushAction: "推送到 Telegram",
        pushConfirmTitle: "推送到 Telegram？",
        pushConfirmDescription: "发出后仍可以继续编辑内容并更新到同一条消息，但无法退回草稿状态。",
        resourceDeleted: "原内容已删除",
        emptyTitle: "还没有推送",
        emptyDescription: "自己写一条消息推送到 Telegram，或者从工具库、文章管理、内容流卡片推送",
        noMatchTitle: "没有匹配的推送",
        noMatchDescription: "换个类型或搜索词再试。",
        loadMore: "加载更多",
        viewAction: "浏览推送",
        editAction: "编辑推送",
        editActionShort: "编辑",
        deleteAction: "删除推送",
        deleteActionShort: "删除",
        deleteTitle: "删除这条推送记录吗？",
        deleteDescription: "只移除本站的推送记录，Telegram 上已经发送的消息不会被删除，需要撤回请到 Telegram 中操作。",
        deleted: "推送记录已删除。",
        serviceDisabled: "Telegram 推送当前已关闭，开启后才能编辑消息。",
        serviceDisabledTitle: "Telegram 推送未开启",
        serviceDisabledDescription: "在系统设置里配置并开启 Telegram 推送后，就能在这里撰写消息，也能从工具库、文章管理、内容流卡片推送。",
        serviceDisabledAction: "去系统设置"
      },
        quickPush: {
          description: "选择直接推送到 Telegram，或者先存为草稿，稍后在「消息推送」里编辑内容再发。",
          alreadyPushed: "这条内容已经推送过了，去「消息推送」里编辑或更新消息。",
          modeLabel: "推送方式",
          sendLabel: "直接推送",
          draftLabel: "存为草稿",
          sendAction: "消息推送",
          draftAction: "保存草稿",
          goManage: "消息推送"
        },
        description: "编辑当前内容的 Telegram 推送信息，固定消息尾巴由系统自动附加。",
        customDescription: "自己写一条推送发到 Telegram，不绑定工具、文章或内容流；固定消息尾巴由系统自动附加。",
        customTitleLabel: "推送标题",
        categoryLabel: "推送分类",
        syncSource: "同步来源",
        syncSourceHint: "同步关联工具、文章或内容流的最新信息，当前编辑内容将被覆盖。",
        contentUrlLabel: "本站浏览",
        contentOriginalUrlLabel: "原文地址",
        contentUrlPlaceholder: "例如：https://example.com/articles/content-preview",
        contentOriginalUrlPlaceholder: "例如：https://example.com/article",
        projectUrlPlaceholder: "https://example.com",
        articleUrlPlaceholder: "例如：https://example.com/articles/article-name",
        bodyPlaceholder: "在这里编写 Telegram Markdown 正文",
        statuses: {
          not_pushed: "未推送",
          pending: "已推送",
          synced: "已推送"
        },
        messageNotFound: "原 Telegram 消息已不存在。清除旧消息记录后，可以手动重新推送。",
        targetChanged: "Telegram 发送目标已经改变。请重新建立推送，再将当前内容手动推送到新目标。",
        permissionDenied: "机器人当前没有发送或编辑目标消息的权限，请先调整 Telegram 权限后重试。",
        recoverMessage: "重新建立推送",
        recovered: "旧消息记录已清除，请手动重新推送。",
        bodyLabel: "Markdown 正文",
        previewTitle: "消息预览",
        mediaLabel: "推送图片",
        mediaEnabled: "开启图片",
        mediaDisabled: "关闭图片",
        mediaUrlLabel: "图片地址",
        mediaUrlPlaceholder: "例如：https://example.com/preview.png",
        mediaHelp: "开启后使用当前内容的预览图，可替换为其他公开图片地址。",
        mediaInvalid: "发送图片时请填写有效的图片地址。",
        save: "保存内容",
        send: "消息推送",
        update: "更新推送",
        saved: "Telegram 推送内容已保存。",
        sent: "已推送到 Telegram。",
        updated: "Telegram 推送已更新。",
        loading: "正在加载消息预览。",
        tooLong: "完整消息超过 Telegram 的 4096 字符限制。"
      }
    : {
        action: "Message Push",
        title: "Telegram Push",
        management: {
          nav: "Message Push",
          title: "Message Push",
          addPush: "Add Push",
          typeCustom: "Manual",
          searchPlaceholder: "Search pushes",
          filterAll: "All",
          typeTool: "Tool Library",
          typeArticle: "Articles",
          typeContent: "Content Flow",
          statusPushed: "Pushed",
          pushedNotice: "This message has already been pushed and cannot return to draft. Use Edit Push to make changes.",
          pushAction: "Push to Telegram",
          pushConfirmTitle: "Push to Telegram?",
          pushConfirmDescription: "After sending you can still edit the content and update the same message, but it cannot go back to draft.",
          resourceDeleted: "Original content deleted",
          emptyTitle: "No pushes yet",
          emptyDescription: "Write a message and push it to Telegram, or push from a Tool Library, Articles, or Content Flow card.",
          noMatchTitle: "No matching pushes",
          noMatchDescription: "Try another type or search term.",
          loadMore: "Load More",
          viewAction: "View Push",
          editAction: "Edit Push",
          editActionShort: "Edit",
          deleteAction: "Delete Push",
          deleteActionShort: "Delete",
          deleteTitle: "Delete this push record?",
          deleteDescription: "This only removes the local push record. The message already sent to Telegram is kept — delete it in Telegram if you need to withdraw it.",
          deleted: "Push record deleted.",
          serviceDisabled: "Telegram pushing is disabled. Enable it before editing messages.",
          serviceDisabledTitle: "Telegram pushing is off",
          serviceDisabledDescription: "Configure and enable Telegram pushing in System Settings to write messages here and push from Tool Library, Articles, or Content Flow cards.",
          serviceDisabledAction: "Open System Settings"
        },
        quickPush: {
          description: "Push to Telegram now, or save a draft and edit it later in Message Push.",
          alreadyPushed: "This item has already been pushed. Edit or update it in Message Push.",
          modeLabel: "Push mode",
          sendLabel: "Push now",
          draftLabel: "Save draft",
          sendAction: "Push Message",
          draftAction: "Save Draft",
          goManage: "Message Push"
        },
        description: "Edit the current Telegram message; the fixed message footer is appended automatically.",
        customDescription: "Write a standalone Telegram push that is not tied to a tool, article, or content item. The fixed message footer is appended automatically.",
        customTitleLabel: "Push title",
        categoryLabel: "Push category",
        syncSource: "Sync Source",
        syncSourceHint: "Sync the latest information from the linked tool, article, or content item. Your current edits will be overwritten.",
        contentUrlLabel: "Site View",
        contentOriginalUrlLabel: "Original URL",
        contentUrlPlaceholder: "Example: https://example.com/articles/content-preview",
        contentOriginalUrlPlaceholder: "Example: https://example.com/article",
        projectUrlPlaceholder: "https://example.com",
        articleUrlPlaceholder: "Example: https://example.com/articles/article-name",
        bodyPlaceholder: "Write the Telegram Markdown content here",
        statuses: {
          not_pushed: "Not pushed",
          pending: "Pushed",
          synced: "Pushed"
        },
        messageNotFound: "The original Telegram message no longer exists. Clear its old record, then push it manually again.",
        targetChanged: "The Telegram target has changed. Rebuild the push, then send the current content to the new target manually.",
        permissionDenied: "The bot cannot send or edit the target message. Update its Telegram permissions, then try again.",
        recoverMessage: "Rebuild Push",
        recovered: "The old message record was cleared. Push the content manually again.",
        bodyLabel: "Markdown content",
        previewTitle: "Message preview",
        mediaLabel: "Push image",
        mediaEnabled: "Enable image",
        mediaDisabled: "Disable image",
        mediaUrlLabel: "Image URL",
        mediaUrlPlaceholder: "Example: https://example.com/preview.png",
        mediaHelp: "When enabled, uses the current item's preview image; replace it with another public image URL if needed.",
        mediaInvalid: "Enter a valid image URL when image sending is enabled.",
        save: "Save Content",
        send: "Push Message",
        update: "Update Push",
        saved: "Telegram push content saved.",
        sent: "Pushed to the Telegram chat.",
        updated: "Telegram push updated.",
        loading: "Loading message preview.",
        tooLong: "The complete message exceeds Telegram's 4096-character limit."
      };
}

function toTelegramHashtag(value: string) {
  const normalized = value.trim().replace(/^#+/, "").replace(/[^\p{L}\p{N}_]+/gu, "_");
  return normalized ? `#${normalized.replace(/^_+|_+$/g, "")}` : "";
}

function resolveTelegramResourceUrl(value: string, origin: string) {
  if (!value.trim()) return "";
  try {
    return new URL(value, origin).toString();
  } catch {
    return "";
  }
}

function escapeTelegramText(value: string) {
  return value.trim().replace(/\\/g, "\\\\").replace(/\*/g, "\\*");
}
