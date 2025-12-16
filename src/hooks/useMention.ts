/**
 * useMention Hook
 * Manages mention state and provides helper functions for mention insertion
 */
"use client";

import { useState, useCallback, useRef } from "react";
import {
  generateMentionFromSelection,
  insertMentionAtCursor,
  parseMentions,
  type Mention,
} from "@/lib/mentionParser";

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface UseMentionOptions {
  /** Initial input value */
  initialValue?: string;
  /** Callback when input changes */
  onChange?: (value: string) => void;
}

export interface UseMentionReturn {
  /** Current input value */
  value: string;
  /** Set input value */
  setValue: (value: string) => void;
  /** Current cursor position */
  cursorPosition: number;
  /** Set cursor position */
  setCursorPosition: (position: number) => void;
  /** Reference to update cursor in input element */
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  /** Insert a mention at current cursor position */
  insertMention: (sheet: string, range: { from: string; to: string }) => void;
  /** Insert raw text at cursor position */
  insertText: (text: string) => void;
  /** Get all mentions in current value */
  getMentions: () => Mention[];
  /** Check if input has mentions */
  hasMentions: () => boolean;
  /** Handle input change event */
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Handle selection change (for tracking cursor) */
  handleSelect: (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Clear input */
  clear: () => void;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useMention(options: UseMentionOptions = {}): UseMentionReturn {
  const { initialValue = "", onChange } = options;
  
  const [value, setValueState] = useState(initialValue);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  /**
   * Set value and notify callback
   */
  const setValue = useCallback((newValue: string) => {
    setValueState(newValue);
    onChange?.(newValue);
  }, [onChange]);

  /**
   * Insert mention at cursor position
   */
  const insertMention = useCallback((
    sheet: string,
    range: { from: string; to: string }
  ) => {
    const mention = generateMentionFromSelection(sheet, range);
    const { text: newText, newCursorPosition } = insertMentionAtCursor(
      value,
      cursorPosition,
      mention
    );
    
    setValue(newText);
    setCursorPosition(newCursorPosition);
    
    // Focus input and set cursor after React re-render
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  }, [value, cursorPosition, setValue]);

  /**
   * Insert raw text at cursor position
   */
  const insertText = useCallback((text: string) => {
    const before = value.slice(0, cursorPosition);
    const after = value.slice(cursorPosition);
    const newText = before + text + after;
    const newCursorPosition = cursorPosition + text.length;
    
    setValue(newText);
    setCursorPosition(newCursorPosition);
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  }, [value, cursorPosition, setValue]);

  /**
   * Get all mentions in current value
   */
  const getMentions = useCallback((): Mention[] => {
    return parseMentions(value);
  }, [value]);

  /**
   * Check if input has mentions
   */
  const hasMentionsCheck = useCallback((): boolean => {
    return parseMentions(value).length > 0;
  }, [value]);

  /**
   * Handle input change event
   */
  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newValue = e.target.value;
    setValue(newValue);
    setCursorPosition(e.target.selectionStart || newValue.length);
  }, [setValue]);

  /**
   * Handle selection change (for tracking cursor)
   */
  const handleSelect = useCallback((
    e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    setCursorPosition(target.selectionStart || 0);
  }, []);

  /**
   * Clear input
   */
  const clear = useCallback(() => {
    setValue("");
    setCursorPosition(0);
  }, [setValue]);

  return {
    value,
    setValue,
    cursorPosition,
    setCursorPosition,
    inputRef,
    insertMention,
    insertText,
    getMentions,
    hasMentions: hasMentionsCheck,
    handleChange,
    handleSelect,
    clear,
  };
}

// ============================================
// ADDITIONAL UTILITIES
// ============================================

/**
 * Hook to detect mention being typed (for autocomplete)
 * Detects when user types @ and provides context
 */
export interface MentionTypingContext {
  isTyping: boolean;
  partialText: string;
  startIndex: number;
}

export function useMentionDetection(value: string, cursorPosition: number): MentionTypingContext {
  // Look backwards from cursor for @ symbol
  const textBeforeCursor = value.slice(0, cursorPosition);
  const atIndex = textBeforeCursor.lastIndexOf('@');
  
  if (atIndex === -1) {
    return { isTyping: false, partialText: '', startIndex: -1 };
  }
  
  // Check if @ is at word boundary (start of string or after space)
  const charBefore = atIndex > 0 ? textBeforeCursor[atIndex - 1] : ' ';
  if (charBefore !== ' ' && charBefore !== '\n' && atIndex !== 0) {
    return { isTyping: false, partialText: '', startIndex: -1 };
  }
  
  // Get text after @
  const partialText = textBeforeCursor.slice(atIndex + 1);
  
  // Check if partial text contains space (mention completed)
  if (partialText.includes(' ')) {
    return { isTyping: false, partialText: '', startIndex: -1 };
  }
  
  return {
    isTyping: true,
    partialText,
    startIndex: atIndex,
  };
}
