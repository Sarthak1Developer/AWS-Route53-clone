"use client";

import React, { useEffect } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: ShortcutItem[] = [
  { keys: ["Alt", "S"], description: "Focus global search console", category: "Navigation" },
  { keys: ["/"], description: "Quick search shortcut", category: "Navigation" },
  { keys: ["g", "h"], description: "Go to Hosted Zones", category: "Navigation" },
  { keys: ["g", "d"], description: "Go to Dashboard", category: "Navigation" },
  { keys: ["~"], description: "Toggle AWS CloudShell Terminal", category: "Developer Tools" },
  { keys: ["c"], description: "Create new record or hosted zone", category: "Actions" },
  { keys: ["e"], description: "Edit selected record or zone", category: "Actions" },
  { keys: ["d"], description: "Delete selected record(s) or zone(s)", category: "Actions" },
  { keys: ["r"], description: "Refresh current table data", category: "Actions" },
  { keys: ["b"], description: "Open BIND Zone Import modal", category: "Actions" },
  { keys: ["t"], description: "Toggle Dark / Light Mode theme", category: "Preferences" },
  { keys: ["?"], description: "Open this Keyboard Shortcuts cheat sheet", category: "Preferences" },
  { keys: ["Esc"], description: "Close active drawer, modal, or dropdown", category: "Preferences" },
];

export default function KeyboardShortcutsModal({ isOpen, onClose }: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = Array.from(new Set(SHORTCUTS.map((s) => s.category)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-surface-container-lowest border border-surface-container-high rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container-high">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[22px]">keyboard</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Keyboard Shortcuts</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-tertiary hover:text-on-surface p-1 rounded transition-colors"
            title="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-6">
          {categories.map((cat) => (
            <div key={cat} className="space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-tertiary">{cat}</h3>
              <div className="grid grid-cols-1 gap-2">
                {SHORTCUTS.filter((s) => s.category === cat).map((s, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-surface-container-low/70 border border-surface-container-high/40 hover:bg-surface-container transition-colors"
                  >
                    <span className="text-body-sm font-body-sm text-on-surface">{s.description}</span>
                    <div className="flex items-center gap-1">
                      {s.keys.map((k, kIdx) => (
                        <React.Fragment key={kIdx}>
                          <kbd className="px-2 py-0.5 text-[11px] font-code-sm font-semibold rounded bg-surface border border-surface-container-highest shadow-xs text-on-surface min-w-[24px] text-center">
                            {k}
                          </kbd>
                          {kIdx < s.keys.length - 1 && <span className="text-[11px] text-tertiary font-bold">+</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-surface-container-high bg-surface-container-low flex items-center justify-between text-body-sm text-tertiary">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-surface border border-surface-container-high text-[11px] font-code-sm">?</kbd> anytime to reopen this sheet</span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-label-md font-bold rounded transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
