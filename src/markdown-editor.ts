import type { Locale } from "./i18n";

export const MARKDOWN_EDITOR_ACTIONS = [
  "heading",
  "bold",
  "italic",
  "quote",
  "list",
  "code",
  "table",
  "link"
] as const;

export const TELEGRAM_MARKDOWN_EDITOR_ACTIONS = [
  "bold",
  "italic",
  "quote",
  "list",
  "code",
  "link"
] as const;

export const MARKDOWN_EDITOR_MODES = ["edit", "preview"] as const;

export type MarkdownEditorAction = (typeof MARKDOWN_EDITOR_ACTIONS)[number];
export type MarkdownEditorMode = (typeof MARKDOWN_EDITOR_MODES)[number];

export type MarkdownEditorEdit = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

export function formatMarkdownSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  action: MarkdownEditorAction,
  locale: Locale
): MarkdownEditorEdit {
  const start = clampSelectionIndex(Math.min(selectionStart, selectionEnd), value.length);
  const end = clampSelectionIndex(Math.max(selectionStart, selectionEnd), value.length);
  const placeholders = locale === "zh"
    ? {
        bold: "粗体文字",
        code: "代码",
        heading: "标题",
        italic: "斜体文字",
        link: "链接文字",
        list: "列表项",
        quote: "引用内容",
        tableHeader: "项目",
        tableValue: "内容"
      }
    : {
        bold: "bold text",
        code: "code",
        heading: "Heading",
        italic: "italic text",
        link: "link text",
        list: "list item",
        quote: "quotation",
        tableHeader: "Item",
        tableValue: "Details"
      };

  if (action === "heading" || action === "quote" || action === "list") {
    const marker = action === "heading" ? "## " : action === "quote" ? "> " : "- ";
    return prefixMarkdownLines(
      value,
      start,
      end,
      marker,
      placeholders[action],
      action === "quote"
    );
  }

  if (action === "table") {
    const selected = value.slice(start, end).trim().replace(/\s*\n+\s*/g, " ").replace(/\|/g, "\\|");
    const firstValue = selected || placeholders.tableHeader;
    const table = [
      `| ${placeholders.tableHeader} | ${placeholders.tableValue} |`,
      "| --- | --- |",
      `| ${firstValue} | ${placeholders.tableValue} |`
    ].join("\n");
    const leading = start > 0 && value[start - 1] !== "\n" ? "\n\n" : "";
    const trailing = end < value.length && value[end] !== "\n" ? "\n\n" : "";
    const replacement = `${leading}${table}${trailing}`;
    const selectedOffset = leading.length + table.lastIndexOf(firstValue);
    return replaceMarkdownRange(
      value,
      start,
      end,
      replacement,
      selectedOffset,
      selectedOffset + firstValue.length
    );
  }

  if (action === "link") {
    const label = value.slice(start, end) || placeholders.link;
    const url = "https://";
    const replacement = `[${label}](${url})`;
    const urlStart = label.length + 3;
    return replaceMarkdownRange(
      value,
      start,
      end,
      replacement,
      urlStart,
      urlStart + url.length
    );
  }

  const selected = value.slice(start, end);
  const placeholder = action === "bold"
    ? placeholders.bold
    : action === "italic"
      ? placeholders.italic
      : placeholders.code;
  const content = selected || placeholder;
  const multilineCode = action === "code" && content.includes("\n");
  const prefix = action === "bold"
    ? "**"
    : action === "italic"
      ? "*"
      : multilineCode
        ? "```\n"
        : "`";
  const suffix = action === "bold"
    ? "**"
    : action === "italic"
      ? "*"
      : multilineCode
        ? "\n```"
        : "`";

  const isItalicDelimiterPartOfBold = action === "italic" && (
    value[start - prefix.length - 1] === "*" ||
    value[end + suffix.length] === "*"
  );

  if (
    start >= prefix.length &&
    value.slice(start - prefix.length, start) === prefix &&
    value.slice(end, end + suffix.length) === suffix &&
    !isItalicDelimiterPartOfBold
  ) {
    return replaceMarkdownRange(
      value,
      start - prefix.length,
      end + suffix.length,
      content,
      0,
      content.length
    );
  }

  return replaceMarkdownRange(
    value,
    start,
    end,
    `${prefix}${content}${suffix}`,
    prefix.length,
    prefix.length + content.length
  );
}

function clampSelectionIndex(value: number, length: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(Math.trunc(value), length));
}

function replaceMarkdownRange(
  value: string,
  start: number,
  end: number,
  replacement: string,
  relativeSelectionStart: number,
  relativeSelectionEnd: number
): MarkdownEditorEdit {
  return {
    value: `${value.slice(0, start)}${replacement}${value.slice(end)}`,
    selectionStart: start + relativeSelectionStart,
    selectionEnd: start + relativeSelectionEnd
  };
}

function prefixMarkdownLines(
  value: string,
  start: number,
  end: number,
  marker: string,
  placeholder: string,
  includeBlankLines: boolean
): MarkdownEditorEdit {
  const lineStart = start > 0 ? value.lastIndexOf("\n", start - 1) + 1 : 0;
  const endAnchor = end > start && value[end - 1] === "\n" ? end - 1 : end;
  const nextLineBreak = value.indexOf("\n", endAnchor);
  const lineEnd = nextLineBreak === -1 ? value.length : nextLineBreak;
  const block = value.slice(lineStart, lineEnd);

  if (!block && start === end) {
    const replacement = `${marker}${placeholder}`;
    return replaceMarkdownRange(
      value,
      lineStart,
      lineEnd,
      replacement,
      marker.length,
      replacement.length
    );
  }

  let firstLineChanged = false;
  const formatted = block
    .split("\n")
    .map((line, index) => {
      const alreadyFormatted = marker === "> "
        ? /^\s*>\s?/.test(line)
        : line.startsWith(marker);
      if (alreadyFormatted || (!includeBlankLines && !line.trim())) return line;
      if (index === 0) firstLineChanged = true;
      return `${marker}${line}`;
    })
    .join("\n");
  const nextValue = `${value.slice(0, lineStart)}${formatted}${value.slice(lineEnd)}`;

  if (start === end) {
    const caret = start + (firstLineChanged ? marker.length : 0);
    return { value: nextValue, selectionStart: caret, selectionEnd: caret };
  }

  return {
    value: nextValue,
    selectionStart: lineStart,
    selectionEnd: lineStart + formatted.length
  };
}
