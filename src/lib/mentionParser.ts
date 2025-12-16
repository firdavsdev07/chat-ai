/**
 * Mention Parser Utility
 * Parses Excel cell/range mentions from text
 * Format: @SheetName!A1 or @SheetName!A1:B3
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Parsed mention structure
 */
export interface Mention {
  /** Full matched mention string (e.g., "@Sheet1!A1:B3") */
  full: string;
  /** Sheet name (e.g., "Sheet1", "Users") */
  sheet: string;
  /** Start cell reference (e.g., "A1") */
  from: string;
  /** End cell reference for ranges (e.g., "B3") - undefined for single cells */
  to?: string;
  /** Start index in the original text */
  startIndex: number;
  /** End index in the original text */
  endIndex: number;
}

/**
 * Options for generating mention string
 */
export interface MentionGenerateOptions {
  sheet: string;
  from: string;
  to?: string;
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Regex pattern for matching mentions
 * Matches: @SheetName!A1 or @SheetName!A1:B3
 * Sheet names can contain letters, numbers, and underscores
 * Cell references are standard Excel format (A1, ZZ999, etc.)
 */
export const MENTION_REGEX = /@([a-zA-Z_][a-zA-Z0-9_]*)!([A-Z]+\d+)(?::([A-Z]+\d+))?/g;

/**
 * Same regex but without global flag (for single match testing)
 */
export const MENTION_REGEX_SINGLE = /@([a-zA-Z_][a-zA-Z0-9_]*)!([A-Z]+\d+)(?::([A-Z]+\d+))?/;

// ============================================
// PARSE FUNCTIONS
// ============================================

/**
 * Parse all mentions from a text string
 * @param text - The text to parse
 * @returns Array of parsed mentions
 */
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

/**
 * Check if a text contains any mentions
 * @param text - The text to check
 * @returns true if mentions are found
 */
export function hasMentions(text: string): boolean {
  return MENTION_REGEX_SINGLE.test(text);
}

/**
 * Parse a single mention string
 * @param mention - The mention string (e.g., "@Sheet1!A1:B3")
 * @returns Parsed mention or null if invalid
 */
export function parseSingleMention(mention: string): Omit<Mention, 'startIndex' | 'endIndex'> | null {
  const match = mention.match(MENTION_REGEX_SINGLE);
  
  if (!match) return null;
  
  return {
    full: match[0],
    sheet: match[1],
    from: match[2],
    to: match[3] || undefined,
  };
}

/**
 * Validate if a string is a valid mention format
 * @param text - The text to validate
 * @returns true if valid mention format
 */
export function isValidMention(text: string): boolean {
  return MENTION_REGEX_SINGLE.test(text);
}

// ============================================
// GENERATE FUNCTIONS
// ============================================

/**
 * Generate a mention string from components
 * @param options - Sheet, from, and optional to cell
 * @returns Formatted mention string
 */
export function generateMention(options: MentionGenerateOptions): string {
  const { sheet, from, to } = options;
  
  // Normalize cell references to uppercase
  const fromCell = from.toUpperCase();
  const toCell = to?.toUpperCase();
  
  // Single cell mention
  if (!toCell || fromCell === toCell) {
    return `@${sheet}!${fromCell}`;
  }
  
  // Range mention
  return `@${sheet}!${fromCell}:${toCell}`;
}

/**
 * Generate mention from TableModal selection result
 * @param sheet - Sheet name
 * @param range - Range selection result { from, to }
 * @returns Formatted mention string
 */
export function generateMentionFromSelection(
  sheet: string,
  range: { from: string; to: string }
): string {
  return generateMention({
    sheet,
    from: range.from,
    to: range.to,
  });
}

// ============================================
// TEXT MANIPULATION FUNCTIONS
// ============================================

/**
 * Insert mention at cursor position in text
 * @param text - Current text
 * @param cursorPosition - Current cursor position
 * @param mention - Mention string to insert
 * @returns New text with mention inserted and new cursor position
 */
export function insertMentionAtCursor(
  text: string,
  cursorPosition: number,
  mention: string
): { text: string; newCursorPosition: number } {
  const before = text.slice(0, cursorPosition);
  const after = text.slice(cursorPosition);
  
  // Add space before mention if needed
  const needsSpaceBefore = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n');
  // Add space after mention
  const spaceBefore = needsSpaceBefore ? ' ' : '';
  const spaceAfter = ' ';
  
  const insertText = `${spaceBefore}${mention}${spaceAfter}`;
  const newText = before + insertText + after;
  const newCursorPosition = cursorPosition + insertText.length;
  
  return { text: newText, newCursorPosition };
}

/**
 * Replace a mention in text with new text
 * @param text - Original text
 * @param mention - Mention to replace
 * @param replacement - Replacement text
 * @returns Text with mention replaced
 */
export function replaceMention(
  text: string,
  mention: Mention,
  replacement: string
): string {
  return (
    text.slice(0, mention.startIndex) +
    replacement +
    text.slice(mention.endIndex)
  );
}

/**
 * Highlight mentions in text (for display purposes)
 * Returns array of text segments with type
 */
export interface TextSegment {
  text: string;
  type: 'text' | 'mention';
  mention?: Mention;
}

export function segmentTextWithMentions(text: string): TextSegment[] {
  const mentions = parseMentions(text);
  const segments: TextSegment[] = [];
  
  let lastIndex = 0;
  
  for (const mention of mentions) {
    // Add text before mention
    if (mention.startIndex > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, mention.startIndex),
        type: 'text',
      });
    }
    
    // Add mention
    segments.push({
      text: mention.full,
      type: 'mention',
      mention,
    });
    
    lastIndex = mention.endIndex;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      type: 'text',
    });
  }
  
  return segments;
}

// ============================================
// EXTRACTION FOR AI TOOLS
// ============================================

/**
 * Extract getRange parameters from mentions for AI tool calls
 * @param text - Text containing mentions
 * @returns Array of parameters for getRange tool
 */
export function extractRangeParams(text: string): Array<{
  sheet: string;
  from: string;
  to: string;
}> {
  const mentions = parseMentions(text);
  
  return mentions.map(mention => ({
    sheet: mention.sheet,
    from: mention.from,
    to: mention.to || mention.from, // Single cell uses same from/to
  }));
}
