import { createArticleBrowseHref } from "./admin-display";
import { createToolPreviewSource } from "./tool-helpers";
import type { ArticleSummary, TelegramPushResource, Tool } from "./types";
import type { Locale } from "./i18n";

export type { TelegramPushResource } from "./types";

export const TELEGRAM_MESSAGE_LIMIT = 4096;
const TELEGRAM_SECTION_SEPARATOR = "\n\n";

const TELEGRAM_CUSTOM_BODY_EXAMPLE_ZH = [
  "**在这里写推送标题**",
  "",
  "> 在这里写简介，一两句话说清楚这条推送是什么、值得看什么。",
  "",
  "项目地址：https://github.com/shaoyouvip/htools",
  "",
  "演示地址：https://htools.zrf.me/",
  "",
  "#导航 #工具"
].join("\n");

const TELEGRAM_CUSTOM_BODY_EXAMPLE_EN = [
  "**Write the push title here**",
  "",
  "> Write the summary here — one or two sentences on what this push is and why it is worth reading.",
  "",
  "Repository: https://github.com/shaoyouvip/htools",
  "",
  "Demo: https://htools.zrf.me/",
  "",
  "#Directory #Tools"
].join("\n");

export function readTelegramBodyTitle(markdown: string) {
  const firstLine = markdown.split("\n").find((line) => line.trim()) ?? "";
  return firstLine
    .trim()
    .replace(/^#{1,6}\s+/, "")
    .replace(/^\*\*([\s\S]*)\*\*$/, "$1")
    .trim();
}

export function replaceTelegramBodyTitle(markdown: string, title: string) {
  const heading = title.trim() ? `**${title.trim()}**` : "";
  const lines = markdown.split("\n");
  const index = lines.findIndex((line) => line.trim());
  if (index === -1) return heading;
  lines[index] = heading;
  return lines.join("\n");
}

export function createTelegramCustomBodyExample(locale: "zh" | "en") {
  return locale === "en"
    ? TELEGRAM_CUSTOM_BODY_EXAMPLE_EN
    : TELEGRAM_CUSTOM_BODY_EXAMPLE_ZH;
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
    tags: Array.from(new Set([article.category, ...article.tags].filter(Boolean)))
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
    ? { article: "文章地址", project: "项目地址", demo: "演示地址" }
    : { article: "Article", project: "Project", demo: "Demo" };
  const editableBody = bodyMarkdown.trim();
  const tags = resource.type === "custom"
    ? ""
    : resource.tags.map(toTelegramHashtag).filter(Boolean).join(" ");
  const linkLabel = resource.type === "article" ? labels.article : labels.project;

  return [
    editableBody,
    resource.url ? `${linkLabel}：[${resource.url}](${resource.url})` : "",
    resource.demoUrl ? `${labels.demo}：[${resource.demoUrl}](${resource.demoUrl})` : "",
    tags,
    footerMarkdown.trim()
  ].filter(Boolean).join(TELEGRAM_SECTION_SEPARATOR);
}

export function createTelegramResourceMediaUrl(resource: TelegramPushResource) {
  if (resource.type === "article") return resource.image;
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
        searchPlaceholder: "搜索推送内容...",
        filterAll: "全部",
        typeTool: "工具库",
        typeArticle: "文章管理",
        statusPushed: "已推送",
        pushAction: "推送到 Telegram",
        pushConfirmTitle: "推送到 Telegram？",
        pushConfirmDescription: "发出后仍可以继续编辑内容并更新到同一条消息，但无法退回草稿状态。",
        resourceDeleted: "原内容已删除",
        emptyTitle: "还没有推送",
        emptyDescription: "自己写一条消息推送到 Telegram，或者从工具库、文章管理卡片推送",
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
        serviceDisabledDescription: "在系统设置里配置并开启 Telegram 推送后，就能在这里撰写消息，也能从工具库、文章管理的卡片推送。",
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
        customDescription: "自己写一条推送发到 Telegram，不绑定工具或文章；固定消息尾巴由系统自动附加。",
        customTitleLabel: "推送标题",
        customTitlePlaceholder: "只用于在推送管理里区分记录",
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
        restoreDefault: "恢复默认",
        previewTitle: "消息预览",
        mediaLabel: "推送图片",
        mediaEnabled: "开启图片",
        mediaDisabled: "关闭图片",
        mediaUrlLabel: "图片地址",
        mediaUrlPlaceholder: "https://example.com/preview.png",
        mediaHelp: "开启后使用当前内容的预览图，可替换为其他公开图片地址。",
        mediaInvalid: "发送图片时请填写有效的图片地址。",
        save: "保存内容",
        send: "消息推送",
        update: "更新推送",
        saved: "Telegram 推送内容已保存。",
        restored: "已恢复默认正文和图片设置。",
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
          searchPlaceholder: "Search pushes...",
          filterAll: "All",
          typeTool: "Tool Library",
          typeArticle: "Articles",
          statusPushed: "Pushed",
          pushAction: "Push to Telegram",
          pushConfirmTitle: "Push to Telegram?",
          pushConfirmDescription: "After sending you can still edit the content and update the same message, but it cannot go back to draft.",
          resourceDeleted: "Original content deleted",
          emptyTitle: "No pushes yet",
          emptyDescription: "Write a message and push it to Telegram, or push from a Tool Library or Articles card.",
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
          serviceDisabledDescription: "Configure and enable Telegram pushing in System Settings to write messages here and push from Tool Library or Articles cards.",
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
        customDescription: "Write a standalone Telegram push that is not tied to a tool or article. The fixed message footer is appended automatically.",
        customTitleLabel: "Push title",
        customTitlePlaceholder: "Only used to identify the record here",
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
        restoreDefault: "Reset Default",
        previewTitle: "Message preview",
        mediaLabel: "Push image",
        mediaEnabled: "Enable image",
        mediaDisabled: "Disable image",
        mediaUrlLabel: "Image URL",
        mediaUrlPlaceholder: "https://example.com/preview.png",
        mediaHelp: "When enabled, uses the current item's preview image; replace it with another public image URL if needed.",
        mediaInvalid: "Enter a valid image URL when image sending is enabled.",
        save: "Save Content",
        send: "Push Message",
        update: "Update Push",
        saved: "Telegram push content saved.",
        restored: "Default content and image settings restored.",
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
