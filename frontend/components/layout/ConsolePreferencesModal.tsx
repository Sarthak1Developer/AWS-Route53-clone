"use client";

import { useConsole } from "./ConsoleContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConsolePreferencesModal({ isOpen, onClose }: Props) {
  const { isDarkMode, toggleDarkMode, tableDensity, setTableDensity, toggleShortcuts } = useConsole();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-surface-container-lowest border border-surface-container-high rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container-high bg-surface-container-low/50">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-primary-container shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
            </svg>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Console Preferences</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-tertiary hover:text-on-surface p-1 rounded transition-colors"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Display Theme */}
          <div>
            <label className="block text-label-md font-bold text-on-surface mb-2.5">
              Display Theme
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => { if (isDarkMode) toggleDarkMode(); }}
                className={`h-12 px-4 rounded-lg flex items-center justify-center gap-2.5 text-body-sm transition-all cursor-pointer ${
                  !isDarkMode
                    ? "border-2 border-primary bg-primary/10 font-bold text-on-surface shadow-xs"
                    : "border border-surface-container-high bg-surface hover:bg-surface-container-low text-tertiary"
                }`}
              >
                <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="5" fill="currentColor" fillOpacity="0.2" />
                  <path strokeLinecap="round" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
                <span>Light mode</span>
              </button>

              <button
                type="button"
                onClick={() => { if (!isDarkMode) toggleDarkMode(); }}
                className={`h-12 px-4 rounded-lg flex items-center justify-center gap-2.5 text-body-sm transition-all cursor-pointer ${
                  isDarkMode
                    ? "border-2 border-primary bg-primary/10 font-bold text-on-surface shadow-xs"
                    : "border border-surface-container-high bg-surface hover:bg-surface-container-low text-tertiary"
                }`}
              >
                <svg className="w-5 h-5 text-indigo-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.3 2a10 10 0 0 0-.19 14 10 10 0 0 0 11.66 2.16 1 1 0 0 0 .44-1.29 1 1 0 0 0-1.07-.63A8 8 0 0 1 12 4.14a8.08 8.08 0 0 1 .87-.05 1 1 0 0 0 .84-.54 1 1 0 0 0-.15-1.12A10 10 0 0 0 12.3 2z" />
                </svg>
                <span>Dark mode (AWS)</span>
              </button>
            </div>
          </div>

          {/* Table Row Density */}
          <div>
            <label className="block text-label-md font-bold text-on-surface mb-2.5">
              Table Row Density
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTableDensity("normal")}
                className={`h-12 px-4 rounded-lg flex items-center justify-center gap-2.5 text-body-sm transition-all cursor-pointer ${
                  tableDensity === "normal"
                    ? "border-2 border-primary bg-primary/10 font-bold text-on-surface shadow-xs"
                    : "border border-surface-container-high bg-surface hover:bg-surface-container-low text-tertiary"
                }`}
              >
                <svg className="w-5 h-5 text-primary-container shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="3" y1="15" x2="21" y2="15" />
                </svg>
                <span>Normal (40px)</span>
              </button>

              <button
                type="button"
                onClick={() => setTableDensity("dense")}
                className={`h-12 px-4 rounded-lg flex items-center justify-center gap-2.5 text-body-sm transition-all cursor-pointer ${
                  tableDensity === "dense"
                    ? "border-2 border-primary bg-primary/10 font-bold text-on-surface shadow-xs"
                    : "border border-surface-container-high bg-surface hover:bg-surface-container-low text-tertiary"
                }`}
              >
                <svg className="w-5 h-5 text-primary-container shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" />
                  <line x1="3" y1="7.5" x2="21" y2="7.5" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="16.5" x2="21" y2="16.5" />
                </svg>
                <span>Compact (32px)</span>
              </button>
            </div>
          </div>

          {/* Keyboard Navigation */}
          <div className="pt-3 border-t border-surface-container-high flex items-center justify-between">
            <div>
              <p className="text-label-md font-bold text-on-surface">Keyboard Navigation</p>
              <p className="text-body-sm text-tertiary">Quick access shortcuts for power users</p>
            </div>
            <button
              onClick={() => {
                onClose();
                toggleShortcuts();
              }}
              className="px-3.5 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-label-md font-bold rounded-lg flex items-center gap-2 transition-colors cursor-pointer border border-surface-container-high"
            >
              <svg className="w-4 h-4 text-tertiary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8" strokeLinecap="round" />
              </svg>
              <span>View shortcuts</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-container-high bg-surface-container-low flex justify-end">
          <button 
            onClick={onClose}
            type="button"
            className="px-6 py-2 bg-primary-container hover:bg-surface-tint text-white text-label-md font-bold rounded-lg transition-all shadow-sm cursor-pointer"
          >
            Save preferences
          </button>
        </div>
      </div>
    </div>
  );
}
