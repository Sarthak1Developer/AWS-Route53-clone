"use client";

import { useState } from "react";
import { bulkUpdateRecordsTtl } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  zoneId: string;
  selectedCount: number;
  recordIds: string[];
  onSuccess: () => void;
}

const COMMON_TTLS = [
  { label: "60 seconds (1 minute)", value: 60 },
  { label: "300 seconds (5 minutes)", value: 300 },
  { label: "900 seconds (15 minutes)", value: 900 },
  { label: "3600 seconds (1 hour)", value: 3600 },
  { label: "86400 seconds (1 day)", value: 86400 },
  { label: "172800 seconds (2 days)", value: 172800 },
];

export default function BulkTtlModal({
  isOpen,
  onClose,
  zoneId,
  selectedCount,
  recordIds,
  onSuccess,
}: Props) {
  const [ttl, setTtl] = useState(300);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpdate = async () => {
    setLoading(true);
    setError(null);
    try {
      await bulkUpdateRecordsTtl(zoneId, recordIds, ttl);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update TTL for selected records");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-surface-container-lowest border border-surface-container-high rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container-high bg-surface-container-low/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[22px]">timer</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Bulk Update TTL</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-tertiary hover:text-on-surface p-1 rounded transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-lg text-body-sm">
              {error}
            </div>
          )}

          <p className="text-body-sm text-tertiary">
            Update Time-To-Live (TTL) for <strong className="text-on-surface">{selectedCount}</strong> selected record(s).
          </p>

          <div>
            <label className="block text-label-md font-label-md text-on-surface mb-2">
              Select Preset TTL
            </label>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_TTLS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setTtl(preset.value)}
                  className={`px-3 py-2 text-left rounded-lg border text-body-sm transition-all ${
                    ttl === preset.value
                      ? "border-primary bg-primary/10 font-bold text-on-surface"
                      : "border-surface-container-high bg-surface hover:bg-surface-container-low text-tertiary"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-label-md font-label-md text-on-surface mb-1">
              Or Enter Custom TTL (seconds)
            </label>
            <input 
              type="number"
              min={0}
              className="w-full h-9 px-3 text-body-sm rounded-lg bg-surface text-on-surface border border-surface-container-high focus:outline-none focus:border-secondary shadow-inner"
              value={ttl}
              onChange={(e) => setTtl(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="px-5 py-3 border-t border-surface-container-high bg-surface-container-low flex items-center justify-end gap-2">
          <button 
            onClick={onClose}
            type="button"
            className="px-4 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-label-md font-bold rounded transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleUpdate}
            disabled={loading}
            type="button"
            className="px-5 py-1.5 bg-primary-container hover:bg-surface-tint text-white text-label-md font-bold rounded flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">{loading ? "refresh" : "check"}</span>
            {loading ? "Updating..." : `Update ${selectedCount} Records`}
          </button>
        </div>
      </div>
    </div>
  );
}
