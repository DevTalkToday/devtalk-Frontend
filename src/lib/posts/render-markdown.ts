const HEADING_TAG_PATTERN = /^<h([1-6])(?:\s[^>]*)?>([\s\S]*?)<\/h\1\s*>/i;
const PARAGRAPH_TAG_PATTERN = /^<(p|div)(?:\s[^>]*)?>([\s\S]*?)<\/\1\s*>/i;
const LINE_BREAK_TAG_PATTERN = /^<br(?:\s[^>]*)?\s*\/?>/i;
const HORIZONTAL_RULE_TAG_PATTERN = /^<hr(?:\s[^>]*)?\s*\/?>/i;
const FENCE_TAG_PATTERN = /^([`~]{3,})/;
const LIST_ITEM_PATTERN = /^ {0,3}(?:[-+*]|\d+[.)])(?:\s+|\t+)/;
export const BLANK_LINE_TOKEN_PREFIX = "@@DEVTALK_BLANK_LINES_";
export const BLANK_LINE_TOKEN_SUFFIX = "@@";

const normalizeInlineHtml = (value: string) =>
  value
    .replace(/<br(?:\s[^>]*)?\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div)(?:\s[^>]*)?>/gi, "\n")
    .replace(/<hr(?:\s[^>]*)?\s*\/?>/gi, "\n---\n")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n");

const collapseWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const createBlankLineToken = (count: number) => `${BLANK_LINE_TOKEN_PREFIX}${count}${BLANK_LINE_TOKEN_SUFFIX}`;

const getListContinuationIndent = (line: string) => {
  const match = line.match(LIST_ITEM_PATTERN);
  return match ? " ".repeat(match[0].length) : "";
};

const preserveBlankLineRuns = (value: string) => {
  const lines = value.split("\n");
  const normalized: string[] = [];
  let fenceMarker: "`" | "~" | null = null;
  let fenceLength = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmedStart = line.trimStart();
    const fenceMatch = trimmedStart.match(FENCE_TAG_PATTERN);

    if (fenceMatch) {
      const marker = fenceMatch[1][0] as "`" | "~";
      const length = fenceMatch[1].length;

      if (!fenceMarker) {
        fenceMarker = marker;
        fenceLength = length;
      } else if (fenceMarker === marker && length >= fenceLength) {
        fenceMarker = null;
        fenceLength = 0;
      }

      normalized.push(line);
      continue;
    }

    if (!fenceMarker && line.trim().length === 0) {
      let blankCount = 1;
      while (index + blankCount < lines.length && lines[index + blankCount].trim().length === 0) {
        blankCount += 1;
      }

      const previousLine = lines[index - 1] ?? "";
      const nextLine = lines[index + blankCount] ?? "";
      const betweenListItems =
        LIST_ITEM_PATTERN.test(previousLine.trimStart()) && LIST_ITEM_PATTERN.test(nextLine.trimStart());

      if (betweenListItems) {
        const continuationIndent = getListContinuationIndent(previousLine);
        for (let blankIndex = 0; blankIndex < blankCount; blankIndex += 1) {
          normalized.push(`${continuationIndent}<br />`);
        }
      } else {
        normalized.push("");

        if (blankCount > 1) {
          const extraBlankCount = blankCount - 1;
          const token = createBlankLineToken(extraBlankCount);
          normalized.push(token);
          normalized.push("");
        }
      }

      index += blankCount - 1;
      continue;
    }

    normalized.push(line);
  }

  return normalized.join("\n");
};

const convertAllowedHtml = (input: string) => {
  const lineBreakMatch = input.match(LINE_BREAK_TAG_PATTERN);
  if (lineBreakMatch) {
    return { length: lineBreakMatch[0].length, output: "\n" };
  }

  const ruleMatch = input.match(HORIZONTAL_RULE_TAG_PATTERN);
  if (ruleMatch) {
    return { length: ruleMatch[0].length, output: "\n\n---\n\n" };
  }

  const headingMatch = input.match(HEADING_TAG_PATTERN);
  if (headingMatch) {
    const depth = Number(headingMatch[1]);
    const text = collapseWhitespace(normalizeInlineHtml(headingMatch[2]));
    return {
      length: headingMatch[0].length,
      output: text ? `\n\n${"#".repeat(depth)} ${text}\n\n` : "",
    };
  }

  const paragraphMatch = input.match(PARAGRAPH_TAG_PATTERN);
  if (paragraphMatch) {
    const text = normalizeInlineHtml(paragraphMatch[2]).trim();
    return {
      length: paragraphMatch[0].length,
      output: text ? `\n\n${text}\n\n` : "\n\n",
    };
  }

  return null;
};

export const normalizeRenderableMarkdown = (value: string) => {
  const normalizedValue = preserveBlankLineRuns(value);
  let result = "";
  let index = 0;
  let atLineStart = true;
  let fenceMarker: "`" | "~" | null = null;
  let fenceLength = 0;
  let pendingFenceClose = false;
  let inlineCodeTicks = 0;

  while (index < normalizedValue.length) {
    const current = normalizedValue[index];

    if (atLineStart) {
      let markerIndex = index;
      while (normalizedValue[markerIndex] === " " || normalizedValue[markerIndex] === "\t") markerIndex += 1;

      const fenceMatch = normalizedValue.slice(markerIndex).match(FENCE_TAG_PATTERN);
      if (fenceMatch) {
        const marker = fenceMatch[1][0] as "`" | "~";
        const length = fenceMatch[1].length;
        if (!fenceMarker) {
          fenceMarker = marker;
          fenceLength = length;
        } else if (fenceMarker === marker && length >= fenceLength) {
          pendingFenceClose = true;
        }
      }
    }

    if (!fenceMarker && current === "`") {
      let tickCount = 1;
      while (normalizedValue[index + tickCount] === "`") tickCount += 1;

      result += normalizedValue.slice(index, index + tickCount);
      if (inlineCodeTicks === 0) inlineCodeTicks = tickCount;
      else if (inlineCodeTicks === tickCount) inlineCodeTicks = 0;

      index += tickCount;
      atLineStart = false;
      continue;
    }

    if (!fenceMarker && inlineCodeTicks === 0 && current === "<") {
      const converted = convertAllowedHtml(normalizedValue.slice(index));
      if (converted) {
        result += converted.output;
        index += converted.length;
        atLineStart = converted.output.endsWith("\n");
        continue;
      }
    }

    result += current;
    if (current === "\n") {
      atLineStart = true;
      if (pendingFenceClose) {
        fenceMarker = null;
        fenceLength = 0;
        pendingFenceClose = false;
      }
    } else {
      atLineStart = false;
    }
    index += 1;
  }

  return result;
};

export const safeUrlTransform = (url: string) => {
  try {
    const parsed = new URL(url, "http://localhost");
    if (["http:", "https:", "blob:", "data:"].includes(parsed.protocol)) return url;
    return "";
  } catch {
    return "";
  }
};
