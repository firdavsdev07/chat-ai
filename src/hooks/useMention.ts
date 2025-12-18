"use client";

import { useState, useCallback, useRef } from "react";
import {
  generateMentionFromSelection,
  insertMentionAtCursor,
  parseMentions,
  type Mention,
} from "@/lib/mentionParser";


export interface UseMentionOptions {
  initialValue?: string;
  onChange?: (value: string) => void;
}

export interface UseMentionReturn {
  value: string;
  setValue: (value: string) => void;
  cursorPosition: number;
  setCursorPosition: (position: number) => void;
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  insertMention: (sheet: string, range: { from: string; to: string }) => void;
  insertText: (text: string) => void;
  getMentions: () => Mention[];
  hasMentions: () => boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelect: (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  clear: () => void;
}


export function useMention(options: UseMentionOptions = {}): UseMentionReturn {
  const { initialValue = "", onChange } = options;

  const [value, setValueState] = useState(initialValue);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);


  const setValue = useCallback((newValue: string) => {
    setValueState(newValue);
    onChange?.(newValue);
  }, [onChange]);

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

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  }, [value, cursorPosition, setValue]);

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

  const getMentions = useCallback((): Mention[] => {
    return parseMentions(value);
  }, [value]);

  const hasMentionsCheck = useCallback((): boolean => {
    return parseMentions(value).length > 0;
  }, [value]);

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newValue = e.target.value;
    setValue(newValue);
    setCursorPosition(e.target.selectionStart || newValue.length);
  }, [setValue]);


  const handleSelect = useCallback((
    e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    setCursorPosition(target.selectionStart || 0);
  }, []);

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


export interface MentionTypingContext {
  isTyping: boolean;
  partialText: string;
  startIndex: number;
}

export function useMentionDetection(value: string, cursorPosition: number): MentionTypingContext {
  const textBeforeCursor = value.slice(0, cursorPosition);
  const atIndex = textBeforeCursor.lastIndexOf('@');

  if (atIndex === -1) {
    return { isTyping: false, partialText: '', startIndex: -1 };
  }

  const charBefore = atIndex > 0 ? textBeforeCursor[atIndex - 1] : ' ';
  if (charBefore !== ' ' && charBefore !== '\n' && atIndex !== 0) {
    return { isTyping: false, partialText: '', startIndex: -1 };
  }

  const partialText = textBeforeCursor.slice(atIndex + 1);

  if (partialText.includes(' ')) {
    return { isTyping: false, partialText: '', startIndex: -1 };
  }

  return {
    isTyping: true,
    partialText,
    startIndex: atIndex,
  };
}
