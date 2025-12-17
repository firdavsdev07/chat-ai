export interface Mention {
  full: string;
  sheet: string;
  from: string;
  to?: string;
  startIndex: number;
  endIndex: number;
}

export interface MentionGenerateOptions {
  sheet: string;
  from: string;
  to?: string;
}

export interface TextSegment {
  text: string;
  type: 'text' | 'mention';
  mention?: Mention;
}

export const MENTION_REGEX = /@([a-zA-Z_][a-zA-Z0-9_]*)!([A-Z]+\d+)(?::([A-Z]+\d+))?/g;
export const MENTION_REGEX_SINGLE = /@([a-zA-Z_][a-zA-Z0-9_]*)!([A-Z]+\d+)(?::([A-Z]+\d+))?/;

export function parseMentions(text: string): Mention[] {
  const mentions: Mention[] = [];
  const regex = new RegExp(MENTION_REGEX.source, 'g');
  
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    mentions.push({
      full: match[0],
      sheet: match[1],
      from: match[2],
      to: match[3] || undefined,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }
  return mentions;
}

export function hasMentions(text: string): boolean {
  return MENTION_REGEX_SINGLE.test(text);
}

export function parseSingleMention(mention: string): Omit<Mention, 'startIndex' | 'endIndex'> | null {
  const match = mention.match(MENTION_REGEX_SINGLE);
  if (!match) return null;
  return { full: match[0], sheet: match[1], from: match[2], to: match[3] || undefined };
}

export function isValidMention(text: string): boolean {
  return MENTION_REGEX_SINGLE.test(text);
}

export function generateMention(options: MentionGenerateOptions): string {
  const { sheet, from, to } = options;
  const fromCell = from.toUpperCase();
  const toCell = to?.toUpperCase();
  
  if (!toCell || fromCell === toCell) return `@${sheet}!${fromCell}`;
  return `@${sheet}!${fromCell}:${toCell}`;
}

export function generateMentionFromSelection(sheet: string, range: { from: string; to: string }): string {
  return generateMention({ sheet, from: range.from, to: range.to });
}

export function insertMentionAtCursor(text: string, cursorPosition: number, mention: string): { text: string; newCursorPosition: number } {
  const before = text.slice(0, cursorPosition);
  const after = text.slice(cursorPosition);
  
  const needsSpaceBefore = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n');
  const spaceBefore = needsSpaceBefore ? ' ' : '';
  const spaceAfter = ' ';
  
  const insertText = `${spaceBefore}${mention}${spaceAfter}`;
  const newText = before + insertText + after;
  const newCursorPosition = cursorPosition + insertText.length;
  
  return { text: newText, newCursorPosition };
}

export function replaceMention(text: string, mention: Mention, replacement: string): string {
  return text.slice(0, mention.startIndex) + replacement + text.slice(mention.endIndex);
}

export function segmentTextWithMentions(text: string): TextSegment[] {
  const mentions = parseMentions(text);
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  
  for (const mention of mentions) {
    if (mention.startIndex > lastIndex) {
      segments.push({ text: text.slice(lastIndex, mention.startIndex), type: 'text' });
    }
    segments.push({ text: mention.full, type: 'mention', mention });
    lastIndex = mention.endIndex;
  }
  
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), type: 'text' });
  }
  return segments;
}

export function extractRangeParams(text: string): Array<{ sheet: string; from: string; to: string }> {
  const mentions = parseMentions(text);
  return mentions.map(mention => ({
    sheet: mention.sheet,
    from: mention.from,
    to: mention.to || mention.from,
  }));
}
