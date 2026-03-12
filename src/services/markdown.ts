// Converts Markdown to LanguageTool AnnotatedText format.
//
// LanguageTool's `data` parameter accepts an annotation array where each
// element is either:
//   { text: "..." }           – checked for errors
//   { markup: "...", interpretAs?: "..." } – skipped (markup region)
//
// Reference: https://languagetool.org/http-api/swagger-ui/#!/default/post_check

export type AnnotationPart =
  | { text: string }
  | { markup: string; interpretAs?: string };

// ---------------------------------------------------------------------------
// Internal region types
// ---------------------------------------------------------------------------

interface MarkupRegion {
  start: number;
  end: number;          // exclusive
  markup: string;
  interpretAs?: string;
  // Higher priority regions are kept when overlapping; code blocks win over
  // everything else.
  priority: number;
}

// ---------------------------------------------------------------------------
// Pattern helpers
// ---------------------------------------------------------------------------

// Finds all non-overlapping matches of a regex in a string and returns regions.
function findRegions(
  input: string,
  pattern: RegExp,
  toRegion: (match: RegExpExecArray) => MarkupRegion | MarkupRegion[] | null,
): MarkupRegion[] {
  const regions: MarkupRegion[] = [];
  let m: RegExpExecArray | null;
  // Reset lastIndex in case the regex is reused
  pattern.lastIndex = 0;
  while ((m = pattern.exec(input)) !== null) {
    const result = toRegion(m);
    if (result !== null) {
      if (Array.isArray(result)) {
        regions.push(...result);
      } else {
        regions.push(result);
      }
    }
    // Avoid infinite loops on zero-length matches
    if (m[0].length === 0) {
      pattern.lastIndex++;
    }
  }
  return regions;
}

// ---------------------------------------------------------------------------
// Individual element extractors
// ---------------------------------------------------------------------------

// Fenced code blocks: ```...``` or ~~~...~~~  (highest priority)
function fencedCodeBlockRegions(input: string): MarkupRegion[] {
  const pattern = /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n\1\s*$/gm;
  return findRegions(input, pattern, (m) => ({
    start: m.index,
    end: m.index + m[0].length,
    markup: m[0],
    interpretAs: '\n\n',
    priority: 100,
  }));
}

// Inline code: `code`  (must not span newlines)
function inlineCodeRegions(input: string): MarkupRegion[] {
  const pattern = /`[^`\n]+`/g;
  return findRegions(input, pattern, (m) => ({
    start: m.index,
    end: m.index + m[0].length,
    markup: m[0],
    interpretAs: '',
    priority: 50,
  }));
}

// HTML comments: <!-- ... -->
function htmlCommentRegions(input: string): MarkupRegion[] {
  const pattern = /<!--[\s\S]*?-->/g;
  return findRegions(input, pattern, (m) => ({
    start: m.index,
    end: m.index + m[0].length,
    markup: m[0],
    priority: 80,
  }));
}

// Images: ![alt](url)  – entire element is markup, alt text is not checked
function imageRegions(input: string): MarkupRegion[] {
  const pattern = /!\[[^\]]*\]\([^)]*\)/g;
  return findRegions(input, pattern, (m) => ({
    start: m.index,
    end: m.index + m[0].length,
    markup: m[0],
    interpretAs: '',
    priority: 70,
  }));
}

// Links: [text](url) – the brackets and URL are markup, the link text is checked.
// Returns two markup regions (opening `[` and closing `](url)`).
function linkRegions(input: string): MarkupRegion[] {
  // Negative look-behind for `!` to avoid matching images already handled above
  const pattern = /(?<!!)\[([^\]]*)\]\(([^)]*)\)/g;
  return findRegions(input, pattern, (m) => {
    const openBracket  = m.index;
    const closeParen   = m.index + m[0].length;
    const textEnd      = m.index + 1 + m[1].length;
    // Markup region 1: `[`
    const open: MarkupRegion = {
      start: openBracket,
      end: openBracket + 1,
      markup: '[',
      priority: 60,
    };
    // Markup region 2: `](url)`
    const close: MarkupRegion = {
      start: textEnd,
      end: closeParen,
      markup: `](${m[2]})`,
      priority: 60,
    };
    return [open, close];
  });
}

// Heading markers: `# `, `## `, etc. at start of line – only the hashes + space
function headingMarkerRegions(input: string): MarkupRegion[] {
  const pattern = /^(#{1,6} )/gm;
  return findRegions(input, pattern, (m) => ({
    start: m.index,
    end: m.index + m[1].length,
    markup: m[1],
    priority: 40,
  }));
}

// Bold/italic markers: **, *, __, _
// Only the delimiters are markup; the surrounded text is kept as-is.
function emphasisMarkerRegions(input: string): MarkupRegion[] {
  // Match paired delimiters. Order: ** before * and __ before _ to avoid
  // partial matches.
  const pattern = /(\*\*|__|[*_])([\s\S]*?)\1/g;
  return findRegions(input, pattern, (m) => {
    const delimiter  = m[1];
    const innerStart = m.index + delimiter.length;
    const innerEnd   = m.index + m[0].length - delimiter.length;

    // Opening delimiter
    const open: MarkupRegion = {
      start: m.index,
      end: innerStart,
      markup: delimiter,
      priority: 30,
    };
    // Closing delimiter
    const close: MarkupRegion = {
      start: innerEnd,
      end: m.index + m[0].length,
      markup: delimiter,
      priority: 30,
    };
    return [open, close];
  });
}

// ---------------------------------------------------------------------------
// Region merger: resolve overlaps
// ---------------------------------------------------------------------------

function mergeRegions(regions: MarkupRegion[]): MarkupRegion[] {
  // Sort by start position; on tie, higher priority wins
  const sorted = [...regions].sort((a, b) =>
    a.start !== b.start ? a.start - b.start : b.priority - a.priority,
  );

  const result: MarkupRegion[] = [];
  let cursor = 0;

  for (const region of sorted) {
    if (region.start < cursor) {
      // Overlaps with a previously accepted region – skip
      continue;
    }
    result.push(region);
    cursor = region.end;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function markdownToAnnotatedText(markdown: string): AnnotationPart[] {
  // Collect all candidate regions
  const candidates: MarkupRegion[] = [
    ...fencedCodeBlockRegions(markdown),
    ...inlineCodeRegions(markdown),
    ...htmlCommentRegions(markdown),
    ...imageRegions(markdown),
    ...linkRegions(markdown),
    ...headingMarkerRegions(markdown),
    ...emphasisMarkerRegions(markdown),
  ];

  const merged = mergeRegions(candidates);

  // Build annotation parts by walking through the original string
  const parts: AnnotationPart[] = [];
  let pos = 0;

  for (const region of merged) {
    // Text before this markup region
    if (region.start > pos) {
      parts.push({ text: markdown.slice(pos, region.start) });
    }
    // The markup region itself
    const part: { markup: string; interpretAs?: string } = { markup: region.markup };
    if (region.interpretAs !== undefined) {
      part.interpretAs = region.interpretAs;
    }
    parts.push(part);
    pos = region.end;
  }

  // Remaining text after the last markup region
  if (pos < markdown.length) {
    parts.push({ text: markdown.slice(pos) });
  }

  // Filter out empty text/markup parts that contribute nothing
  return parts.filter((p) =>
    'text' in p ? p.text.length > 0 : p.markup.length > 0,
  );
}
