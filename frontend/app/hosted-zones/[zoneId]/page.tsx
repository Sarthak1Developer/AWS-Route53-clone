"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getHostedZone,
  getDNSRecords,
  deleteDNSRecord,
  bulkDeleteDNSRecords,
  exportHostedZone,
  DNSRecord,
  HostedZone,
} from "@/lib/api";
import RecordTable from "@/components/records/RecordTable";
import RecordForm from "@/components/records/RecordForm";
import BindImportModal from "@/components/records/BindImportModal";
import BulkTtlModal from "@/components/records/BulkTtlModal";

export default function HostedZoneDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const zoneId = params?.zoneId as string;

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab Slider State
  const [activeTab, setActiveTab] = useState<"records" | "details">("records");

  // Record Form Slider Drawer State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DNSRecord | undefined>(undefined);

  // Selection & Filters
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  // Modals & Export dropdown
  const [isBindImportOpen, setIsBindImportOpen] = useState(false);
  const [isBulkTtlOpen, setIsBulkTtlOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [testRecordModal, setTestRecordModal] = useState<DNSRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [zoneData, recordsData] = await Promise.all([
        getHostedZone(zoneId),
        getDNSRecords(zoneId),
      ]);
      setZone(zoneData);
      setRecords(recordsData);
    } catch (error) {
      console.error("Failed to load zone data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (zoneId) {
      fetchData();
    }
  }, [zoneId]);

  // Keyboard shortcut listener for c (create), e (edit), d (delete), b (bind), r (refresh)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (isInput) return;

      if (e.key === "c" || e.key === "C" || e.key === "n" || e.key === "N") {
        e.preventDefault();
        setEditingRecord(undefined);
        setIsFormOpen(true);
      } else if (e.key === "e" || e.key === "E") {
        if (selectedRecordIds.size === 1) {
          e.preventDefault();
          handleEdit();
        }
      } else if (e.key === "d" || e.key === "D") {
        if (selectedRecordIds.size > 0) {
          e.preventDefault();
          handleDelete();
        }
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        fetchData();
        showToast("Refreshed records");
      } else if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        setIsBindImportOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedRecordIds, records]);

  const handleDelete = async () => {
    if (selectedRecordIds.size === 0) return;
    const count = selectedRecordIds.size;
    if (confirm(`Are you sure you want to delete ${count} selected DNS record(s)? This action cannot be undone.`)) {
      try {
        await bulkDeleteDNSRecords(zoneId, Array.from(selectedRecordIds));
        setSelectedRecordIds(new Set());
        showToast(`Deleted ${count} record(s) successfully`);
        fetchData();
      } catch (err: any) {
        alert(err.message || "Failed to delete record(s)");
      }
    }
  };

  const handleEdit = () => {
    if (selectedRecordIds.size !== 1) return;
    const recordId = Array.from(selectedRecordIds)[0];
    const rec = records.find((r) => r.id === recordId);
    if (rec) {
      setEditingRecord(rec);
      setIsFormOpen(true);
    }
  };

  const handleExport = async (format: "bind" | "json") => {
    setIsExportMenuOpen(false);
    try {
      const content = await exportHostedZone(zoneId, format);
      const filename = `${zone?.domain_name || "zone"}.${format === "bind" ? "zone" : "json"}`;
      const blob = new Blob([content], {
        type: format === "bind" ? "text/plain" : "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Exported zone in ${format.toUpperCase()} format`);
    } catch (err: any) {
      alert("Export failed: " + err.message);
    }
  };

  const handleTestRecord = () => {
    if (selectedRecordIds.size === 1) {
      const rec = records.find((r) => r.id === Array.from(selectedRecordIds)[0]);
      if (rec) setTestRecordModal(rec);
    } else if (records.length > 0) {
      setTestRecordModal(records[0]);
    }
  };

  // Filtered records
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.record_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.value.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "All" || r.record_type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Extract nameservers from NS record
  const nsRecord = records.find((r) => r.record_type === "NS");
  const nameservers = nsRecord
    ? nsRecord.value.split("\n").filter((s) => s.trim().length > 0)
    : [
        "ns-1.awsdns-01.org",
        "ns-2.awsdns-01.co.uk",
        "ns-3.awsdns-01.com",
        "ns-4.awsdns-01.net",
      ];

  const soaRecord = records.find((r) => r.record_type === "SOA");

  if (!zone && !loading) {
    return (
      <div className="p-8 text-center bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high">
        <span className="material-symbols-outlined text-4xl text-tertiary mb-2">dns</span>
        <h2 className="text-xl font-bold text-on-surface">Hosted Zone Not Found</h2>
        <p className="text-tertiary text-sm mt-1">Zone ID &quot;{zoneId}&quot; could not be located.</p>
        <Link href="/hosted-zones" className="mt-4 inline-block px-4 py-2 bg-primary-container text-white font-bold rounded">
          Back to Hosted Zones
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-full">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1b2533] text-white px-4 py-2.5 rounded-lg shadow-2xl border border-secondary flex items-center gap-2 text-sm animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="material-symbols-outlined text-secondary text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumbs & Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-1 mb-3 text-body-sm font-body-sm text-tertiary">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <Link className="text-secondary hover:underline" href="/hosted-zones">Amazon Route 53</Link>
          <span className="text-tertiary-fixed-dim">/</span>
          <Link className="text-secondary hover:underline" href="/hosted-zones">Hosted zones</Link>
          <span className="text-tertiary-fixed-dim">/</span>
          <span className="font-title-md text-on-surface truncate max-w-[200px] sm:max-w-md">
            {zone?.domain_name || "Loading..."}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-[11px] font-label-sm text-on-surface">
            <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
            DNS Propagation: In Sync
          </span>
          <button
            onClick={() => {
              fetchData();
              showToast("Refreshing records...");
            }}
            className="text-tertiary hover:text-on-surface p-1 rounded transition-colors"
            title="Reload record telemetry (R)"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>
      </div>

      {/* Zone Overview Banner Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-4 mb-4">
        {/* Main Zone Card */}
        <div className="xl:col-span-8 bg-surface-container-lowest p-4 sm:p-5 rounded-xl border border-surface-container-high shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="font-display-lg text-xl sm:text-2xl text-on-surface tracking-tight font-bold break-all">
                {zone?.domain_name || "Loading..."}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-[11px]">
                <span className="material-symbols-outlined text-[13px] text-secondary">public</span>
                {zone?.type || "Public"} hosted zone
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-tertiary font-code-sm text-[11px]">
                ID: {zone?.id}
              </span>
            </div>
            <p className="text-body-sm text-tertiary max-w-2xl mb-4">
              {zone?.comment || "Authoritative hosted zone for DNS resolution across global anycast edge locations."}
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-container-high/60">
            <button
              onClick={() => {
                setEditingRecord(undefined);
                setIsFormOpen(!isFormOpen);
              }}
              className="h-8 px-3 bg-primary-container hover:bg-surface-tint text-white font-bold text-label-md rounded flex items-center gap-1.5 shadow-sm transition-all"
              title="Create new record (C)"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Create record</span>
            </button>

            <button
              onClick={handleEdit}
              disabled={selectedRecordIds.size !== 1}
              className="h-8 px-3 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold text-label-md rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Edit selected record (E)"
            >
              Edit record
            </button>

            <button
              onClick={handleDelete}
              disabled={selectedRecordIds.size === 0}
              className="h-8 px-3 bg-surface-container-high hover:bg-red-500/10 hover:text-error text-on-surface font-bold text-label-md rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete selected record(s) (D)"
            >
              Delete record {selectedRecordIds.size > 0 ? `(${selectedRecordIds.size})` : ""}
            </button>

            {/* Bulk TTL Action */}
            {selectedRecordIds.size > 0 && (
              <button
                onClick={() => setIsBulkTtlOpen(true)}
                className="h-8 px-3 bg-primary/15 border border-primary/40 text-on-surface font-bold text-label-md rounded flex items-center gap-1 hover:bg-primary/25 transition-colors"
                title="Update TTL for selected records"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">timer</span>
                <span>Bulk TTL ({selectedRecordIds.size})</span>
              </button>
            )}

            {/* BIND Import Button */}
            <button
              onClick={() => setIsBindImportOpen(true)}
              className="h-8 px-3 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold text-label-md rounded flex items-center gap-1 transition-colors"
              title="Import BIND Zone File (B)"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">upload_file</span>
              <span className="hidden sm:inline">Import BIND</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="h-8 px-3 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold text-label-md rounded flex items-center gap-1 transition-colors"
                title="Export zone records"
              >
                <span className="material-symbols-outlined text-[16px] text-secondary">download</span>
                <span>Export</span>
                <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </button>

              {isExportMenuOpen && (
                <div
                  className="absolute left-0 top-full mt-1 w-52 bg-surface-container-lowest border border-surface-container-high rounded-lg shadow-xl py-1 z-30 animate-in fade-in duration-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleExport("bind")}
                    className="w-full text-left px-3 py-2 text-body-sm text-on-surface hover:bg-surface-container flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">description</span>
                    <span>BIND Zone File (.zone)</span>
                  </button>
                  <button
                    onClick={() => handleExport("json")}
                    className="w-full text-left px-3 py-2 text-body-sm text-on-surface hover:bg-surface-container flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px] text-secondary">data_object</span>
                    <span>JSON Format (.json)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Test DNS Record Button */}
            <button
              onClick={handleTestRecord}
              className="h-8 px-3 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold text-label-md rounded flex items-center gap-1 transition-colors ml-auto sm:ml-0"
              title="Test DNS Resolution"
            >
              <span className="material-symbols-outlined text-[16px] text-tertiary">network_ping</span>
              <span className="hidden sm:inline">Test record</span>
            </button>
          </div>
        </div>

        {/* Telemetry & Summary Card */}
        <div className="xl:col-span-4 bg-surface-container-lowest p-4 sm:p-5 rounded-xl border border-surface-container-high shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-[11px] uppercase tracking-wider text-tertiary font-bold">
              Queries (Last 24h)
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-label-sm text-[11px] font-bold flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> +4.2%
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-display-lg text-2xl font-bold text-on-surface">14.8M</span>
            <span className="text-body-sm text-tertiary">avg 171.2 req/sec</span>
          </div>
          <div className="w-full h-9 my-1">
            <svg className="w-full h-full text-secondary" fill="none" preserveAspectRatio="none" viewBox="0 0 240 40">
              <path d="M0,32 Q20,28 40,24 T80,18 T120,26 T160,12 T200,8 T240,4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2"></path>
              <path d="M0,32 Q20,28 40,24 T80,18 T120,26 T160,12 T200,8 T240,4 L240,40 L0,40 Z" fill="currentColor" fillOpacity="0.12"></path>
            </svg>
          </div>
          <div className="flex items-center justify-between text-[11px] text-tertiary pt-2 border-t border-surface-container-high/60">
            <span>Routing: <strong className="text-on-surface font-semibold">Global Anycast</strong></span>
            <span>Delegation: <strong className="text-on-surface font-semibold">4 Nameservers</strong></span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* INTERACTIVE TAB SLIDER                                     */}
      {/* ========================================================= */}
      <div className="relative flex items-center border-b border-surface-container-high mb-4">
        {/* Tab 1: Records */}
        <button
          onClick={() => setActiveTab("records")}
          className={`relative pb-3 px-4 text-body-md font-bold flex items-center gap-2 transition-colors cursor-pointer select-none ${
            activeTab === "records"
              ? "text-primary font-bold"
              : "text-tertiary hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">table_rows</span>
          <span>Records</span>
          <span
            className={`px-1.5 py-0.5 rounded-full font-code-sm text-[11px] font-bold ${
              activeTab === "records"
                ? "bg-primary-container text-white"
                : "bg-surface-container text-tertiary"
            }`}
          >
            {records.length}
          </span>
        </button>

        {/* Tab 2: Hosted Zone Details */}
        <button
          onClick={() => setActiveTab("details")}
          className={`relative pb-3 px-4 text-body-md font-bold flex items-center gap-2 transition-colors cursor-pointer select-none ${
            activeTab === "details"
              ? "text-primary font-bold"
              : "text-tertiary hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span>Hosted zone details</span>
        </button>

        {/* Animated Sliding Underline Indicator */}
        <div
          className="absolute bottom-0 h-[3px] bg-primary rounded-t-sm transition-all duration-300 ease-out"
          style={{
            left: activeTab === "records" ? "0px" : "140px",
            width: activeTab === "records" ? "140px" : "185px",
          }}
        />
      </div>

      {/* ========================================================= */}
      {/* TAB CONTENT 1: RECORDS VIEW                                */}
      {/* ========================================================= */}
      {activeTab === "records" && (
        <div className="relative flex flex-col lg:flex-row gap-4 items-start w-full">
          <div className="flex-1 w-full min-w-0 bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-xs p-3 sm:p-4 overflow-hidden">
            {/* Table Search & Type Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-3">
              <div className="flex flex-1 items-center gap-2 max-w-lg">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary text-[18px]">
                    search
                  </span>
                  <input
                    className="w-full h-8 pl-8 pr-3 text-body-sm rounded-lg bg-surface text-on-surface placeholder:text-tertiary border border-surface-container-high focus:outline-none focus:border-secondary transition-all"
                    placeholder="Search records by name or value..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary hover:text-on-surface"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>
                <select
                  className="h-8 px-2.5 text-body-sm font-semibold rounded-lg bg-surface-container-high text-on-surface cursor-pointer focus:outline-none focus:bg-surface-container-highest border border-surface-container-high"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="All">All record types</option>
                  <option value="A">A</option>
                  <option value="AAAA">AAAA</option>
                  <option value="CNAME">CNAME</option>
                  <option value="TXT">TXT</option>
                  <option value="MX">MX</option>
                  <option value="NS">NS</option>
                  <option value="PTR">PTR</option>
                  <option value="SOA">SOA</option>
                  <option value="SRV">SRV</option>
                  <option value="CAA">CAA</option>
                </select>
              </div>

              {selectedRecordIds.size > 0 && (
                <div className="text-body-sm text-tertiary flex items-center gap-2">
                  <span className="font-bold text-on-surface">{selectedRecordIds.size}</span> selected
                  <button
                    onClick={() => setSelectedRecordIds(new Set())}
                    className="text-xs text-secondary hover:underline"
                  >
                    Clear selection
                  </button>
                </div>
              )}
            </div>

            {/* Record Table Container (Responsive Horizontal Scroll) */}
            <RecordTable
              records={filteredRecords}
              selectedRecordIds={selectedRecordIds}
              onSelectionChange={setSelectedRecordIds}
              loading={loading}
            />

            {/* Table Footer */}
            <div className="flex flex-wrap items-center justify-between pt-3 text-body-sm text-tertiary gap-2 border-t border-surface-container-high mt-2">
              <span className="text-xs">
                Showing 1-{filteredRecords.length} of {filteredRecords.length} records
              </span>
              <div className="flex items-center gap-1">
                <button
                  className="px-2.5 py-1 rounded bg-surface-container-high text-tertiary opacity-50 cursor-not-allowed text-xs font-bold"
                  disabled
                >
                  Previous
                </button>
                <button className="px-2.5 py-1 rounded bg-secondary text-white text-xs font-bold shadow-xs">
                  1
                </button>
                <button
                  className="px-2.5 py-1 rounded bg-surface-container-high text-tertiary opacity-50 cursor-not-allowed text-xs font-bold"
                  disabled
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Sliding Record Drawer (Create / Edit) */}
          {isFormOpen && zone && (
            <div className="w-full lg:w-[440px] bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-2xl shrink-0 transition-all flex flex-col animate-in slide-in-from-right-4 duration-200">
              <RecordForm
                record={editingRecord}
                zoneId={zone.id}
                zoneDomain={zone.domain_name}
                onClose={() => {
                  setIsFormOpen(false);
                  setEditingRecord(undefined);
                }}
                onSuccess={() => {
                  setIsFormOpen(false);
                  setEditingRecord(undefined);
                  fetchData();
                  showToast(editingRecord ? "Record updated" : "Record created successfully");
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB CONTENT 2: HOSTED ZONE DETAILS VIEW                   */}
      {/* ========================================================= */}
      {activeTab === "details" && zone && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in duration-150">
          {/* General Zone Properties */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-surface-container-high pb-3">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Hosted Zone Properties</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-xs font-bold border border-emerald-800">
                In Sync
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-body-sm">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-tertiary mb-1">
                  Domain Name
                </span>
                <span className="font-bold text-on-surface text-base break-all">{zone.domain_name}</span>
              </div>

              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-tertiary mb-1">
                  Type
                </span>
                <span className="inline-flex items-center gap-1 text-on-surface font-semibold">
                  <span className="material-symbols-outlined text-[16px] text-secondary">public</span>
                  {zone.type} Hosted Zone
                </span>
              </div>

              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-tertiary mb-1">
                  Hosted Zone ID
                </span>
                <div className="flex items-center gap-1.5 font-code-sm text-on-surface">
                  <span className="break-all">{zone.id}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(zone.id);
                      showToast("Copied Zone ID to clipboard");
                    }}
                    className="p-1 hover:bg-surface-container rounded text-tertiary hover:text-on-surface transition-colors"
                    title="Copy Zone ID"
                  >
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  </button>
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-tertiary mb-1">
                  Record Count
                </span>
                <span className="font-bold text-on-surface text-base">{records.length} records</span>
              </div>

              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-tertiary mb-1">
                  Created At
                </span>
                <span className="text-on-surface">
                  {zone.created_at ? new Date(zone.created_at).toUTCString() : "N/A"}
                </span>
              </div>

              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-tertiary mb-1">
                  Description / Comment
                </span>
                <span className="text-on-surface">{zone.comment || "No comment provided."}</span>
              </div>
            </div>
          </div>

          {/* Authoritative Name Servers (Delegation Set) */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-surface-container-high pb-3 mb-3">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Name Servers (Delegation Set)</h3>
                  <p className="text-xs text-tertiary mt-0.5">
                    Route 53 assigned 4 authoritative anycast nameservers for this zone
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(nameservers.join("\n"));
                    showToast("Copied all 4 nameservers to clipboard");
                  }}
                  className="px-2.5 py-1 text-xs font-bold bg-surface-container-high hover:bg-surface-container-highest rounded text-on-surface transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  <span>Copy all</span>
                </button>
              </div>

              <div className="space-y-2 font-code-sm">
                {nameservers.map((ns, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low border border-surface-container-high/60 group hover:bg-surface-container transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-on-surface font-semibold">{ns}</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(ns);
                        showToast(`Copied ${ns}`);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-tertiary hover:text-on-surface transition-opacity"
                      title="Copy nameserver"
                    >
                      <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 text-xs text-tertiary mt-4">
              <strong className="text-on-surface">Registrar Configuration:</strong> Update the nameservers at your domain registrar with these four addresses to delegate DNS traffic to this hosted zone.
            </div>
          </div>

          {/* SOA Record Details */}
          {soaRecord && (
            <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-5 shadow-xs lg:col-span-2">
              <div className="flex items-center justify-between border-b border-surface-container-high pb-3 mb-3">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Start of Authority (SOA) Record</h3>
                <span className="text-xs font-code-sm text-tertiary">TTL: {soaRecord.ttl}s</span>
              </div>
              <div className="p-3 bg-surface-container-low rounded-lg border border-surface-container-high/60 font-code-sm text-body-sm text-on-surface break-all">
                {soaRecord.value}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* BONUS MODALS                                              */}
      {/* ========================================================= */}
      {/* BIND Import Modal */}
      {zone && (
        <BindImportModal
          isOpen={isBindImportOpen}
          onClose={() => setIsBindImportOpen(false)}
          zoneId={zone.id}
          zoneDomain={zone.domain_name}
          onSuccess={() => {
            fetchData();
            showToast("Successfully imported BIND zone records!");
          }}
        />
      )}

      {/* Bulk TTL Modal */}
      {zone && (
        <BulkTtlModal
          isOpen={isBulkTtlOpen}
          onClose={() => setIsBulkTtlOpen(false)}
          zoneId={zone.id}
          selectedCount={selectedRecordIds.size}
          recordIds={Array.from(selectedRecordIds)}
          onSuccess={() => {
            fetchData();
            showToast(`Updated TTL for ${selectedRecordIds.size} records`);
          }}
        />
      )}

      {/* Test DNS Record Modal */}
      {testRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-surface-container-lowest border border-surface-container-high rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-container-high pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">network_ping</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Test Record Resolution</h3>
              </div>
              <button
                onClick={() => setTestRecordModal(null)}
                className="text-tertiary hover:text-on-surface p-1 rounded"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2 text-body-sm">
              <p className="text-tertiary">
                Simulating DNS query response from global Route 53 edge resolvers:
              </p>
              <div className="p-3 bg-surface-container-low rounded-lg font-code-sm text-xs space-y-1">
                <div className="text-primary font-bold">Query: {testRecordModal.record_name} ({testRecordModal.record_type})</div>
                <div className="text-emerald-500 font-semibold">Response Status: NOERROR (Success)</div>
                <div className="text-on-surface">Resolved Value: {testRecordModal.value}</div>
                <div className="text-tertiary">TTL: {testRecordModal.ttl}s | Routing Policy: {testRecordModal.routing_policy}</div>
                <div className="text-tertiary">Resolver: 169.254.169.253 (Anycast Global)</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setTestRecordModal(null)}
                className="px-4 py-1.5 bg-primary-container text-white text-xs font-bold rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
