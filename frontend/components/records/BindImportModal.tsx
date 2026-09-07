"use client";

import { useState } from "react";
import { importBindZone, DNSRecord } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  zoneId: string;
  zoneDomain: string;
  onSuccess: () => void;
}

interface ParsedPreview {
  record_name: string;
  record_type: string;
  value: string;
  ttl: number;
}

export default function BindImportModal({ isOpen, onClose, zoneId, zoneDomain, onSuccess }: Props) {
  const [bindText, setBindText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewRecords, setPreviewRecords] = useState<ParsedPreview[]>([]);
  const [isParsed, setIsParsed] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setBindText(content);
      parsePreview(content);
    };
    reader.readAsText(file);
  };

  const parsePreview = (text: string) => {
    setError(null);
    try {
      // Client-side quick parser for instant preview
      const clean = text.replace(/\r\n/g, "\n");
      const lines = clean.split("\n");
      const records: ParsedPreview[] = [];
      const origin = zoneDomain.endsWith(".") ? zoneDomain : `${zoneDomain}.`;
      let currentTtl = 300;

      for (const rawLine of lines) {
        const line = rawLine.split(";")[0].trim();
        if (!line) continue;
        if (line.startsWith("$TTL")) {
          const t = parseInt(line.split(/\s+/)[1], 10);
          if (!isNaN(t)) currentTtl = t;
          continue;
        }
        if (line.startsWith("$ORIGIN")) continue;

        const tokens = line.split(/\s+/);
        if (tokens.length >= 3) {
          let name = tokens[0];
          let typeIdx = -1;
          const types = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SOA", "SRV", "PTR", "CAA"];

          for (let i = 1; i < tokens.length; i++) {
            if (types.includes(tokens[i].toUpperCase())) {
              typeIdx = i;
              break;
            }
          }

          if (typeIdx !== -1) {
            const rtype = tokens[typeIdx].toUpperCase();
            const val = tokens.slice(typeIdx + 1).join(" ").replace(/^["']|["']$/g, "");
            let fqdn = name;
            if (name === "@") fqdn = zoneDomain;
            else if (!name.endsWith(".")) fqdn = `${name}.${zoneDomain}`;

            records.push({
              record_name: fqdn,
              record_type: rtype,
              value: val,
              ttl: currentTtl,
            });
          }
        }
      }

      setPreviewRecords(records);
      setIsParsed(true);
    } catch (err: any) {
      setError("Failed to parse zone text: " + err.message);
    }
  };

  const handleImport = async () => {
    if (!bindText.trim()) {
      setError("Please provide BIND zone file contents.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await importBindZone(zoneId, bindText);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to import BIND zone file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-3xl bg-surface-container-lowest border border-surface-container-high rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container-high bg-surface-container-low/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[22px]">upload_file</span>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Import BIND Zone File</h2>
              <p className="text-body-sm text-tertiary">Zone: <strong className="text-on-surface">{zoneDomain}</strong></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-tertiary hover:text-on-surface p-1 rounded transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-lg text-body-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-label-md font-label-md text-on-surface mb-1.5">
              Upload .zone or .txt file
            </label>
            <input 
              type="file" 
              accept=".zone,.txt"
              onChange={handleFileUpload}
              className="block w-full text-body-sm text-tertiary file:mr-4 file:py-1.5 file:px-4 file:rounded file:border-0 file:text-label-md file:font-semibold file:bg-primary-container file:text-white hover:file:opacity-90 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-label-md font-label-md text-on-surface">
                Or Paste RFC 1035 BIND Zone Text
              </label>
              {bindText && (
                <button 
                  onClick={() => parsePreview(bindText)}
                  className="text-[11px] text-secondary hover:underline font-semibold"
                >
                  Re-parse Preview
                </button>
              )}
            </div>
            <textarea
              className="w-full h-36 p-3 font-code-md text-code-md rounded-lg bg-surface text-on-surface border border-surface-container-high focus:outline-none focus:border-secondary shadow-inner resize-y"
              placeholder={`$ORIGIN ${zoneDomain}.\n$TTL 300\n@   IN  SOA  ns-1.awsdns.com. hostmaster.${zoneDomain}. ( 2026090801 7200 3600 1209600 300 )\n@   IN  NS   ns-1.awsdns.com.\n@   IN  A    192.0.2.1\nwww IN  CNAME ${zoneDomain}.`}
              value={bindText}
              onChange={(e) => {
                setBindText(e.target.value);
                if (e.target.value.length > 20) parsePreview(e.target.value);
              }}
            />
          </div>

          {previewRecords.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-label-md font-label-md text-on-surface font-bold">
                  Parsed Records Preview ({previewRecords.length})
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Ready to import
                </span>
              </div>
              <div className="border border-surface-container-high rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-body-sm">
                  <thead className="bg-surface-container-high text-on-surface font-title-md text-[11px] uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="px-3 py-1.5">Record Name</th>
                      <th className="px-3 py-1.5">Type</th>
                      <th className="px-3 py-1.5">TTL</th>
                      <th className="px-3 py-1.5">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high">
                    {previewRecords.map((r, i) => (
                      <tr key={i} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-3 py-1.5 font-code-sm text-on-surface truncate max-w-[180px]">{r.record_name}</td>
                        <td className="px-3 py-1.5 font-code-sm font-bold text-primary-container">{r.record_type}</td>
                        <td className="px-3 py-1.5 text-tertiary">{r.ttl}s</td>
                        <td className="px-3 py-1.5 font-code-sm text-on-surface truncate max-w-[240px]">{r.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-surface-container-high bg-surface-container-low flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            type="button"
            className="px-4 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-label-md font-bold rounded transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleImport}
            disabled={loading || !bindText.trim()}
            type="button"
            className="px-5 py-1.5 bg-primary-container hover:bg-surface-tint text-white text-label-md font-bold rounded flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">{loading ? "refresh" : "cloud_upload"}</span>
            {loading ? "Importing..." : `Import ${previewRecords.length > 0 ? previewRecords.length : ""} Records`}
          </button>
        </div>
      </div>
    </div>
  );
}
