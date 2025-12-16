/**
 * MentionInput Component
 * Chat input with mention support and Table Modal integration
 */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import TableModal from "@/components/TableModal";
import {
  parseMentions,
  generateMentionFromSelection,
  insertMentionAtCursor,
  segmentTextWithMentions,
  type Mention,
} from "@/lib/mentionParser";

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface MentionInputProps {
  /** Current input value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Callback when form is submitted */
  onSubmit: (e: React.FormEvent) => void;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Sheet data for TableModal - array of { name, data } */
  sheets?: Array<{
    name: string;
    data: (string | number | boolean | null)[][];
  }>;
  /** Callback when mentions are parsed for AI context */
  onMentionsChange?: (mentions: Mention[]) => void;
}

// ============================================
// COMPONENT
// ============================================

export default function MentionInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "Xabar yozing... (@Sheet!A1 mention qo'shish uchun)",
  sheets = [],
  onMentionsChange,
}: MentionInputProps) {
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [showSheetPicker, setShowSheetPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse mentions when value changes
  useEffect(() => {
    if (onMentionsChange) {
      const mentions = parseMentions(value);
      onMentionsChange(mentions);
    }
  }, [value, onMentionsChange]);

  /**
   * Handle input change
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setCursorPosition(e.target.selectionStart || newValue.length);
  }, [onChange]);

  /**
   * Handle selection/cursor change
   */
  const handleSelect = useCallback((e: React.SyntheticEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setCursorPosition(target.selectionStart || 0);
  }, []);

  /**
   * Open sheet picker or TableModal
   */
  const handleOpenTableModal = useCallback(() => {
    if (sheets.length === 0) {
      alert("Sheet ma'lumotlari yuklanmagan");
      return;
    }
    
    if (sheets.length === 1) {
      // Single sheet - open modal directly
      setSelectedSheet(sheets[0].name);
      setIsModalOpen(true);
    } else {
      // Multiple sheets - show picker
      setShowSheetPicker(true);
    }
  }, [sheets]);

  /**
   * Select a sheet and open modal
   */
  const handleSelectSheet = useCallback((sheetName: string) => {
    setSelectedSheet(sheetName);
    setShowSheetPicker(false);
    setIsModalOpen(true);
  }, []);

  /**
   * Handle range selection from TableModal
   */
  const handleSelectRange = useCallback((range: { from: string; to: string }) => {
    if (!selectedSheet) return;
    
    const mention = generateMentionFromSelection(selectedSheet, range);
    const { text: newText, newCursorPosition } = insertMentionAtCursor(
      value,
      cursorPosition,
      mention
    );
    
    // Update value immediately
    onChange(newText);
    
    // Focus input and set cursor after React re-render
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        // Need to wait for the value to be updated in the DOM
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
            setCursorPosition(newCursorPosition);
          }
        });
      }
    });
  }, [selectedSheet, value, cursorPosition, onChange]);

  /**
   * Close modal
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedSheet(null);
    // Return focus to input
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  /**
   * Get current sheet data for modal
   */
  const getCurrentSheetData = useCallback(() => {
    if (!selectedSheet) return [];
    const sheet = sheets.find(s => s.name === selectedSheet);
    return sheet?.data || [];
  }, [selectedSheet, sheets]);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Ctrl/Cmd + M to open mention picker
    if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
      e.preventDefault();
      handleOpenTableModal();
    }
    
    // Enter to submit
    if (e.key === 'Enter' && !e.shiftKey) {
      // Let the form handle submit
    }
  }, [handleOpenTableModal]);

  // Segment text for display (show mentions highlighted)
  const segments = segmentTextWithMentions(value);
  const hasMentions = segments.some(s => s.type === 'mention');

  return (
    <>
      <form onSubmit={onSubmit} className="mention-input-container">
        <div className="mention-input-wrapper">
          {/* Hidden preview layer for mention highlighting (optional future feature) */}
          
          {/* Main input */}
          <input
            ref={inputRef}
            type="text"
            className="mention-input"
            value={value}
            onChange={handleChange}
            onSelect={handleSelect}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
          />
          
          {/* Table button */}
          <button
            type="button"
            onClick={handleOpenTableModal}
            className="mention-table-btn"
            disabled={disabled || sheets.length === 0}
            title="Excel jadvalidan hujayra tanlash (Ctrl+M)"
          >
            📊
          </button>
        </div>
        
        {/* Submit button */}
        <button
          type="submit"
          className="mention-submit-btn"
          disabled={disabled || !value.trim()}
        >
          Yuborish
        </button>
        
        {/* Mention indicator */}
        {hasMentions && (
          <div className="mention-indicator">
            <span className="mention-indicator-icon">📎</span>
            <span className="mention-indicator-text">
              {parseMentions(value).length} ta havola
            </span>
          </div>
        )}

        {/* Styles */}
        <style jsx>{`
          .mention-input-container {
            display: flex;
            gap: 12px;
            align-items: center;
            padding: 16px 20px;
            background: white;
            border-top: 1px solid #e5e7eb;
          }

          .mention-input-wrapper {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 8px;
            background: #f9fafb;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 4px;
            transition: all 0.15s ease;
          }

          .mention-input-wrapper:focus-within {
            border-color: #3b82f6;
            background: white;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .mention-input {
            flex: 1;
            padding: 10px 12px;
            font-size: 15px;
            color: #1f2937;
            background: transparent;
            border: none;
            outline: none;
          }

          .mention-input::placeholder {
            color: #9ca3af;
          }

          .mention-input:disabled {
            color: #9ca3af;
            cursor: not-allowed;
          }

          .mention-table-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            font-size: 20px;
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .mention-table-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
            transform: scale(1.05);
          }

          .mention-table-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .mention-submit-btn {
            padding: 12px 24px;
            font-size: 15px;
            font-weight: 600;
            color: white;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            border: none;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.15s ease;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
          }

          .mention-submit-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.35);
            transform: translateY(-1px);
          }

          .mention-submit-btn:disabled {
            background: #d1d5db;
            box-shadow: none;
            cursor: not-allowed;
          }

          .mention-indicator {
            position: absolute;
            bottom: 100%;
            left: 20px;
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 6px;
            font-size: 12px;
            color: #2563eb;
            margin-bottom: 8px;
          }

          .mention-indicator-icon {
            font-size: 14px;
          }

          .mention-indicator-text {
            font-weight: 500;
          }
        `}</style>
      </form>

      {/* Sheet Picker Dropdown */}
      {showSheetPicker && (
        <div className="sheet-picker-overlay" onClick={() => setShowSheetPicker(false)}>
          <div className="sheet-picker" onClick={e => e.stopPropagation()}>
            <div className="sheet-picker-header">
              <span className="sheet-picker-icon">📑</span>
              <span className="sheet-picker-title">Sheet tanlang</span>
            </div>
            <div className="sheet-picker-list">
              {sheets.map(sheet => (
                <button
                  key={sheet.name}
                  className="sheet-picker-item"
                  onClick={() => handleSelectSheet(sheet.name)}
                >
                  <span className="sheet-icon">📊</span>
                  <span className="sheet-name">{sheet.name}</span>
                  <span className="sheet-rows">{sheet.data.length} qator</span>
                </button>
              ))}
            </div>
          </div>
          
          <style jsx>{`
            .sheet-picker-overlay {
              position: fixed;
              inset: 0;
              z-index: 40;
              background: rgba(0, 0, 0, 0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .sheet-picker {
              background: white;
              border-radius: 16px;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              min-width: 280px;
              overflow: hidden;
            }

            .sheet-picker-header {
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 16px 20px;
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              border-bottom: 1px solid #e2e8f0;
            }

            .sheet-picker-icon {
              font-size: 24px;
            }

            .sheet-picker-title {
              font-size: 16px;
              font-weight: 600;
              color: #1e293b;
            }

            .sheet-picker-list {
              padding: 8px;
            }

            .sheet-picker-item {
              display: flex;
              align-items: center;
              gap: 12px;
              width: 100%;
              padding: 12px 16px;
              background: transparent;
              border: none;
              border-radius: 10px;
              cursor: pointer;
              transition: all 0.15s ease;
              text-align: left;
            }

            .sheet-picker-item:hover {
              background: #f1f5f9;
            }

            .sheet-icon {
              font-size: 20px;
            }

            .sheet-name {
              flex: 1;
              font-size: 14px;
              font-weight: 500;
              color: #334155;
            }

            .sheet-rows {
              font-size: 12px;
              color: #94a3b8;
            }
          `}</style>
        </div>
      )}

      {/* TableModal */}
      <TableModal
        isOpen={isModalOpen}
        data={getCurrentSheetData()}
        sheet={selectedSheet || ""}
        onSelectRange={handleSelectRange}
        onClose={handleCloseModal}
      />
    </>
  );
}
