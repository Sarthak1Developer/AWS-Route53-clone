"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getHostedZones, HostedZone, bulkDeleteHostedZones } from "@/lib/api";
import HostedZoneTable from "@/components/hosted-zones/HostedZoneTable";
import HostedZoneForm from "@/components/hosted-zones/HostedZoneForm";

export default function HostedZonesPage() {
  const router = useRouter();
  const [zones, setZones] = useState<HostedZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<HostedZone | undefined>(undefined);
  const [selectedZoneIds, setSelectedZoneIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchZones = async () => {
    setLoading(true);
    try {
      const data = await getHostedZones();
      setZones(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (isInput) return;

      if (e.key === "c" || e.key === "C" || e.key === "n" || e.key === "N") {
        e.preventDefault();
        setEditingZone(undefined);
        setIsFormOpen(true);
      } else if (e.key === "d" || e.key === "D") {
        if (selectedZoneIds.size > 0) {
          e.preventDefault();
          handleDelete();
        }
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        fetchZones();
        showToast("Refreshed hosted zones");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedZoneIds]);

  const handleDelete = async () => {
    if (selectedZoneIds.size === 0) return;
    const count = selectedZoneIds.size;
    if (confirm(`Are you sure you want to delete ${count} selected hosted zone(s)? All DNS records inside them will also be permanently deleted.`)) {
      try {
        await bulkDeleteHostedZones(Array.from(selectedZoneIds));
        setSelectedZoneIds(new Set());
        showToast(`Deleted ${count} hosted zone(s)`);
        fetchZones();
      } catch (err: any) {
        alert(err.message || "Failed to delete hosted zone(s)");
      }
    }
  };

  const handleEdit = () => {
    if (selectedZoneIds.size !== 1) return;
    const zoneId = Array.from(selectedZoneIds)[0];
    const zone = zones.find((z) => z.id === zoneId);
    if (zone) {
      setEditingZone(zone);
      setIsFormOpen(true);
    }
  };

  const handleViewDetails = () => {
    if (selectedZoneIds.size !== 1) return;
    const zoneId = Array.from(selectedZoneIds)[0];
    router.push(`/hosted-zones/${zoneId}`);
  };

  const handleExportZones = () => {
    const targetZones =
      selectedZoneIds.size > 0
        ? zones.filter((z) => selectedZoneIds.has(z.id))
        : zones;

    const data = JSON.stringify(targetZones, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hosted-zones-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported ${targetZones.length} hosted zone(s) as JSON`);
  };

  const filteredZones = zones.filter(
    (z) =>
      z.domain_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (z.comment && z.comment.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col w-full max-w-full">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1b2533] text-white px-4 py-2.5 rounded-lg shadow-2xl border border-secondary flex items-center gap-2 text-sm animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="material-symbols-outlined text-secondary text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-body-sm font-body-sm text-tertiary mb-3">
        <Link className="text-secondary hover:underline" href="/hosted-zones">Amazon Route 53</Link>
        <span className="text-tertiary select-none">/</span>
        <span className="text-on-surface font-bold text-sm">Hosted zones</span>
      </nav>

      {/* Title Bar & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl sm:text-2xl font-display-lg text-on-surface font-bold">Hosted zones</h1>
            <span className="text-sm sm:text-base text-tertiary font-normal">({filteredZones.length})</span>
          </div>
          <p className="text-body-sm text-tertiary mt-1 max-w-3xl">
            A hosted zone tells Route 53 how to respond to DNS queries for a domain such as example.com. Manage authoritative DNS configurations across public or VPC-scoped private zones.
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={handleEdit}
            disabled={selectedZoneIds.size !== 1}
            className={`h-8 px-3 text-xs font-bold rounded shadow-xs transition-colors ${
              selectedZoneIds.size === 1
                ? "bg-surface-container text-on-surface hover:bg-surface-container-high border border-surface-container-high"
                : "bg-surface-container-low text-tertiary cursor-not-allowed opacity-50 border border-transparent"
            }`}
          >
            Edit zone details
          </button>

          <button
            onClick={handleDelete}
            disabled={selectedZoneIds.size === 0}
            className={`h-8 px-3 text-xs font-bold rounded transition-colors ${
              selectedZoneIds.size > 0
                ? "bg-surface-container text-error shadow-xs hover:bg-red-500/10 border border-error/30"
                : "bg-surface-container-low text-tertiary cursor-not-allowed opacity-50 border border-transparent"
            }`}
          >
            Delete zone {selectedZoneIds.size > 0 ? `(${selectedZoneIds.size})` : ""}
          </button>

          <button
            onClick={handleViewDetails}
            disabled={selectedZoneIds.size !== 1}
            className={`h-8 px-3 text-xs font-bold rounded shadow-xs transition-colors ${
              selectedZoneIds.size === 1
                ? "bg-surface-container text-on-surface hover:bg-surface-container-high border border-surface-container-high"
                : "bg-surface-container-low text-tertiary cursor-not-allowed opacity-50 border border-transparent"
            }`}
          >
            View details
          </button>

          <button
            onClick={handleExportZones}
            className="h-8 px-3 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold rounded shadow-xs border border-surface-container-high flex items-center gap-1 transition-colors"
            title="Export hosted zones as JSON"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">download</span>
            <span>Export {selectedZoneIds.size > 0 ? `(${selectedZoneIds.size})` : ""}</span>
          </button>

          <button
            onClick={() => {
              setEditingZone(undefined);
              setIsFormOpen(true);
            }}
            className="h-8 px-3.5 bg-primary-container text-white text-xs font-bold rounded shadow-xs hover:bg-surface-tint active:opacity-95 transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Create hosted zone
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-surface-container-lowest shadow-xs border border-surface-container-high rounded-xl overflow-hidden flex flex-col">
        {/* Search & Refresh Bar */}
        <div className="p-3 sm:p-4 bg-surface-container-lowest border-b border-surface-container-high flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[240px] max-w-lg relative flex items-center">
            <span className="material-symbols-outlined absolute left-2.5 text-tertiary text-[18px]">search</span>
            <input
              className="w-full h-8 pl-8 pr-3 bg-surface text-on-surface placeholder:text-tertiary text-body-sm rounded-lg border border-surface-container-high focus:outline-none focus:border-secondary shadow-inner"
              placeholder="Find hosted zones by domain name or ID..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-tertiary hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                fetchZones();
                showToast("Refreshed zones list");
              }}
              className="h-8 px-2.5 flex items-center justify-center bg-surface-container text-tertiary hover:text-on-surface rounded-lg shadow-xs hover:bg-surface-container-high border border-surface-container-high transition-colors"
              title="Refresh (R)"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            </button>
          </div>
        </div>

        {/* Hosted Zone Table */}
        <HostedZoneTable
          zones={filteredZones}
          selectedZoneIds={selectedZoneIds}
          onSelectionChange={setSelectedZoneIds}
          loading={loading}
        />

        {/* Table Pagination Footer */}
        <div className="px-4 py-2.5 bg-surface-container-lowest flex flex-wrap items-center justify-between text-body-sm text-tertiary border-t border-surface-container-high gap-2">
          <span className="text-xs">
            Showing 1-{filteredZones.length} of {filteredZones.length} hosted zones
          </span>
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 flex items-center justify-center rounded text-tertiary opacity-50 cursor-not-allowed" disabled>
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <span className="w-7 h-7 flex items-center justify-center bg-secondary text-white text-xs font-bold rounded shadow-xs">
              1
            </span>
            <button className="w-7 h-7 flex items-center justify-center rounded text-tertiary opacity-50 cursor-not-allowed" disabled>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Form Modal for Create / Edit Zone */}
      {isFormOpen && (
        <HostedZoneForm
          zone={editingZone}
          onClose={() => {
            setIsFormOpen(false);
            setEditingZone(undefined);
          }}
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingZone(undefined);
            fetchZones();
            showToast(editingZone ? "Hosted zone updated" : "Hosted zone created successfully");
          }}
        />
      )}
    </div>
  );
}
