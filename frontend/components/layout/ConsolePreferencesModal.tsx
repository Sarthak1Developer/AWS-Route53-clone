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
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container-high bg-surface-container-low/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[22px]">settings</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Console Preferences</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-tertiary hover:text-on-surface p-1 rounded transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Visual Mode */}
          <div>
            <label className="block text-label-md font-label-md text-on-surface mb-2">Display Theme</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { if (isDarkMode) toggleDarkMode(); }}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-body-sm transition-all ${
                  !isDarkMode
                    ? "border-primary bg-primary/10 font-bold text-on-surface"
                    : "border-surface-container-high bg-surface hover:bg-surface-container-low text-tertiary"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">light_mode</span>
                <span>Light mode</span>
              </button>
              <button
                type="button"
                onClick={() => { if (!isDarkMode) toggleDarkMode(); }}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-body-sm transition-all ${
                  isDarkMode
                    ? "border-primary bg-primary/10 font-bold text-on-surface"
                    : "border-surface-container-high bg-surface hover:bg-surface-container-low text-tertiary"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">dark_mode</span>
                <span>Dark mode (AWS)</span>
              </button>
            </div>
          </div>

          {/* Table Density */}
          <div>
            <label className="block text-label-md font-label-md text-on-surface mb-2">Table Row Density</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTableDensity("normal")}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-body-sm transition-all ${
                  tableDensity === "normal"
                    ? "border-primary bg-primary/10 font-bold text-on-surface"
                    : "border-surface-container-high bg-surface hover:bg-surface-container-low text-tertiary"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">view_comfortable</span>
                <span>Normal (40px)</span>
              </button>
              <button
                type="button"
                onClick={() => setTableDensity("dense")}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-body-sm transition-all ${
                  tableDensity === "dense"
                    ? "border-primary bg-primary/10 font-bold text-on-surface"
                    : "border-surface-container-high bg-surface hover:bg-surface-container-low text-tertiary"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">view_compact</span>
                <span>Compact (32px)</span>
              </button>
            </div>
          </div>

          {/* Shortcuts Link */}
          <div className="pt-2 border-t border-surface-container-high flex items-center justify-between">
            <div>
              <p className="text-label-md font-bold text-on-surface">Keyboard Navigation</p>
              <p className="text-body-sm text-tertiary">Quick access shortcuts for power users</p>
            </div>
            <button
              onClick={() => {
                onClose();
                toggleShortcuts();
              }}
              className="px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-label-md font-bold rounded flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">keyboard</span>
              View shortcuts
            </button>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-surface-container-high bg-surface-container-low flex justify-end">
          <button 
            onClick={onClose}
            type="button"
            className="px-5 py-1.5 bg-primary-container hover:bg-surface-tint text-white text-label-md font-bold rounded transition-all shadow-sm"
          >
            Save preferences
          </button>
        </div>
      </div>
    </div>
  );
}
