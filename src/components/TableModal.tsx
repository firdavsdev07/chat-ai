/**
 * TableModal Component
 * Modal dialog for displaying Excel data with range selection
 */
"use client";

import { useState, useCallback, useEffect } from "react";
import ExcelGrid from "@/components/ExcelGrid";
import type { RangeResult } from "@/hooks/useRangeSelection";

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface TableModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** 2D array of cell values from Excel */
  data: (string | number | boolean | null)[][];
  /** Name of the Excel sheet */
  sheet: string;
  /** Callback when user selects a range and confirms */
  onSelectRange: (range: { from: string; to: string }) => void;
  /** Callback when modal is closed */
  onClose: () => void;
}

// ============================================
// COMPONENT
// ============================================

export default function TableModal({
  isOpen,
  data,
  sheet,
  onSelectRange,
  onClose,
}: TableModalProps) {
  const [currentSelection, setCurrentSelection] = useState<RangeResult | null>(null);

  // Reset selection when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentSelection(null);
    }
  }, [isOpen]);

  // Handle selection change from grid
  const handleSelectionChange = useCallback((range: RangeResult | null) => {
    setCurrentSelection(range);
  }, []);

  // Handle confirm button click
  const handleConfirm = useCallback(() => {
    if (currentSelection) {
      onSelectRange({
        from: currentSelection.from,
        to: currentSelection.to,
      });
      onClose();
    }
  }, [currentSelection, onSelectRange, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Format selection display text
  const getSelectionText = (): string => {
    if (!currentSelection) return "Hujayra tanlanmagan";
    
    const { from, to } = currentSelection;
    if (from === to) {
      return `${sheet}!${from}`;
    }
    return `${sheet}!${from}:${to}`;
  };

  // Format mention text (for copy/insert)
  const getMentionText = (): string => {
    if (!currentSelection) return "";
    
    const { from, to } = currentSelection;
    if (from === to) {
      return `@${sheet}!${from}`;
    }
    return `@${sheet}!${from}:${to}`;
  };

  if (!isOpen) return null;

  return (
    <div
      className="table-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="table-modal-title"
    >
      <div className="table-modal-container">
        {/* Header */}
        <div className="table-modal-header">
          <div className="table-modal-title-section">
            <div className="table-modal-icon">📊</div>
            <div>
              <h2 id="table-modal-title" className="table-modal-title">
                {sheet}
              </h2>
              <p className="table-modal-subtitle">
                Hujayra yoki diapazon tanlang
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="table-modal-close-btn"
            aria-label="Yopish"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Selection Info Bar */}
        <div className="table-modal-selection-bar">
          <div className="selection-indicator">
            <span className="selection-label">Tanlangan:</span>
            <span className={`selection-value ${currentSelection ? 'has-selection' : ''}`}>
              {getSelectionText()}
            </span>
          </div>
          
          {currentSelection && (
            <div className="mention-preview">
              <span className="mention-label">Mention:</span>
              <code className="mention-code">{getMentionText()}</code>
            </div>
          )}
        </div>

        {/* Grid Container */}
        <div className="table-modal-grid">
          <ExcelGrid
            data={data}
            onSelectionChange={handleSelectionChange}
            maxHeight="450px"
          />
        </div>

        {/* Footer */}
        <div className="table-modal-footer">
          <div className="table-modal-info">
            <span className="info-icon">💡</span>
            <span className="info-text">
              Bir hujayrani bosing yoki diapazon tanlash uchun suring
            </span>
          </div>
          
          <div className="table-modal-actions">
            <button
              onClick={onClose}
              className="btn-cancel"
            >
              Bekor qilish
            </button>
            <button
              onClick={handleConfirm}
              disabled={!currentSelection}
              className="btn-confirm"
            >
              Tasdiqlash
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Styles */}
      <style jsx>{`
        .table-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          animation: fadeIn 0.15s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .table-modal-container {
          width: 90%;
          max-width: 900px;
          max-height: 90vh;
          background: white;
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          animation: slideUp 0.2s ease-out;
          overflow: hidden;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Header */
        .table-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
        }

        .table-modal-title-section {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .table-modal-icon {
          font-size: 28px;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          padding: 10px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }

        .table-modal-title {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #111827;
        }

        .table-modal-subtitle {
          margin: 2px 0 0;
          font-size: 14px;
          color: #6b7280;
        }

        .table-modal-close-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 10px;
          background: #f3f4f6;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .table-modal-close-btn:hover {
          background: #e5e7eb;
          color: #374151;
        }

        /* Selection Bar */
        .table-modal-selection-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 12px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
        }

        .selection-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .selection-label {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
        }

        .selection-value {
          font-size: 14px;
          color: #9ca3af;
          font-weight: 500;
          padding: 4px 10px;
          background: #e5e7eb;
          border-radius: 6px;
          transition: all 0.15s ease;
        }

        .selection-value.has-selection {
          color: #1d4ed8;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          font-weight: 600;
        }

        .mention-preview {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mention-label {
          font-size: 12px;
          color: #9ca3af;
        }

        .mention-code {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 13px;
          color: #16a34a;
          background: #dcfce7;
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid #bbf7d0;
        }

        /* Grid */
        .table-modal-grid {
          flex: 1;
          padding: 16px 24px;
          overflow: hidden;
          min-height: 300px;
        }

        /* Footer */
        .table-modal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
          background: #fafafa;
        }

        .table-modal-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .info-icon {
          font-size: 16px;
        }

        .info-text {
          font-size: 13px;
          color: #6b7280;
        }

        .table-modal-actions {
          display: flex;
          gap: 12px;
        }

        .btn-cancel {
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-cancel:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .btn-confirm {
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 600;
          color: white;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .btn-confirm:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
          transform: translateY(-1px);
        }

        .btn-confirm:disabled {
          background: #d1d5db;
          box-shadow: none;
          cursor: not-allowed;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .table-modal-container {
            width: 95%;
            max-height: 95vh;
          }

          .table-modal-selection-bar {
            flex-direction: column;
            align-items: flex-start;
          }

          .table-modal-footer {
            flex-direction: column;
            gap: 12px;
          }

          .table-modal-info {
            width: 100%;
            justify-content: center;
          }

          .table-modal-actions {
            width: 100%;
          }

          .table-modal-actions button {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}
