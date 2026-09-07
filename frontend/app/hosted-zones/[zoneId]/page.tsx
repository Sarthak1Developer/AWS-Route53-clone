"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getHostedZone, getDNSRecords, deleteDNSRecord, DNSRecord, HostedZone } from "@/lib/api";
import RecordTable from "@/components/records/RecordTable";
import RecordForm from "@/components/records/RecordForm";

export default function HostedZoneDetailsPage() {
  const { zoneId } = useParams();
  const [zone, setZone] = useState<HostedZone | null>(null);
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DNSRecord | undefined>(undefined);
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [zoneData, recordsData] = await Promise.all([
        getHostedZone(zoneId as string),
        getDNSRecords(zoneId as string),
      ]);
      setZone(zoneData);
      setRecords(recordsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [zoneId]);

  const handleDelete = async () => {
    if (selectedRecordIds.size === 0) return;
    if (confirm("Are you sure you want to delete the selected record(s)?")) {
      for (const id of Array.from(selectedRecordIds)) {
        await deleteDNSRecord(zoneId as string, id);
      }
      setSelectedRecordIds(new Set());
      fetchData();
    }
  };

  const handleEdit = () => {
    if (selectedRecordIds.size !== 1) return;
    const recordId = Array.from(selectedRecordIds)[0];
    const record = records.find(r => r.id === recordId);
    if (record) {
      setEditingRecord(record);
      setIsFormOpen(true);
    }
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.record_name.toLowerCase().includes(searchQuery.toLowerCase()) || r.value.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "All" || r.record_type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (!zone && !loading) {
    return <div className="p-4">Zone not found</div>;
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between py-space-xs mb-space-sm text-body-sm font-body-sm text-tertiary">
        <div className="flex items-center gap-space-xs text-body-sm font-body-sm">
          <Link className="text-secondary hover:underline" href="#">Amazon Route 53</Link>
          <span className="text-tertiary-fixed-dim">/</span>
          <Link className="text-secondary hover:underline" href="/hosted-zones">Hosted zones</Link>
          <span className="text-tertiary-fixed-dim">/</span>
          <span className="font-title-md text-on-surface">{zone?.domain_name || "Loading..."}</span>
        </div>
        <div className="flex items-center gap-space-sm">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container text-[11px] font-label-sm text-tertiary">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            DNS Propagation: In Sync
          </span>
          <button onClick={fetchData} className="text-tertiary hover:text-on-surface p-1 rounded transition-colors" title="Reload record telemetry">
            <span className="material-symbols-outlined text-[16px]">refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md mb-space-lg">
        <div className="xl:col-span-8 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-space-sm mb-space-xs">
              <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight">{zone?.domain_name || "Loading..."}</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-[11px]">
                <span className="material-symbols-outlined text-[13px] text-secondary">public</span>
                {zone?.type || "Public"} hosted zone
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-tertiary font-code-sm text-code-sm">
                ID: {zone?.id}
              </span>
            </div>
            <p className="text-body-sm font-body-sm text-tertiary max-w-2xl mb-space-md">
              {zone?.comment || "No description provided."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-space-xs pt-space-sm">
            <button 
              onClick={() => { setEditingRecord(undefined); setIsFormOpen(!isFormOpen); }}
              className="h-8 px-space-md bg-primary-container hover:bg-surface-tint text-white font-title-md text-label-md rounded flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              Create record
            </button>
            <button onClick={handleEdit} disabled={selectedRecordIds.size !== 1} className="h-8 px-space-md bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-title-md text-label-md rounded transition-colors disabled:opacity-50">
              Edit record
            </button>
            <button 
              onClick={handleDelete}
              disabled={selectedRecordIds.size === 0} 
              className="h-8 px-space-md bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-title-md text-label-md rounded transition-colors disabled:opacity-50"
            >
              Delete record
            </button>
            <button className="h-8 px-space-md bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-title-md text-label-md rounded flex items-center gap-1 transition-colors">
              <span className="material-symbols-outlined text-[15px] text-tertiary">network_ping</span>
              Test record
            </button>
          </div>
        </div>
        
        <div className="xl:col-span-4 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-space-sm">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary">Queries Last 24h</span>
            <span className="text-emerald-700 font-label-sm text-[11px] flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> +4.2%
            </span>
          </div>
          <div className="flex items-baseline gap-space-sm mb-space-xs">
            <span className="font-display-lg text-[28px] font-bold text-on-surface">14.8M</span>
            <span className="font-body-sm text-body-sm text-tertiary">avg 171.2 req/sec</span>
          </div>
          <div className="w-full h-10 mt-1">
            <svg className="w-full h-full text-secondary" fill="none" preserveAspectRatio="none" viewBox="0 0 240 40">
              <path d="M0,32 Q20,28 40,24 T80,18 T120,26 T160,12 T200,8 T240,4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2"></path>
              <path d="M0,32 Q20,28 40,24 T80,18 T120,26 T160,12 T200,8 T240,4 L240,40 L0,40 Z" fill="currentColor" fillOpacity="0.08"></path>
            </svg>
          </div>
          <div className="flex items-center justify-between text-[11px] font-body-sm text-tertiary pt-2">
            <span>Region: <strong className="text-on-surface font-semibold">Global (Anycast)</strong></span>
            <span>Nameservers: <strong className="text-on-surface font-semibold">4 Assigned</strong></span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-space-md mb-space-md overflow-x-auto">
        <button className="pb-2.5 font-title-md text-body-md text-primary-container border-b-2 border-primary-container flex items-center gap-1.5 whitespace-nowrap">
          <span>Records</span>
          <span className="px-1.5 py-0.2 rounded-full bg-primary-fixed text-on-primary-fixed font-code-sm text-[11px]">{records.length}</span>
        </button>
        <button className="pb-2.5 font-body-md text-body-md text-tertiary hover:text-on-surface border-b-2 border-transparent transition-colors whitespace-nowrap">
          Hosted zone details
        </button>
      </div>

      <div className="relative flex flex-col lg:flex-row gap-space-md items-start w-full">
        <div className="flex-1 w-full bg-surface-container-lowest rounded-xl shadow-sm p-space-md overflow-hidden">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-sm mb-space-md">
            <div className="flex flex-1 items-center gap-space-xs">
              <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary text-[18px]">search</span>
                <input 
                  className="w-full h-8 pl-8 pr-3 text-body-sm font-body-sm rounded bg-surface text-on-surface placeholder:text-tertiary border border-surface-container-high focus:outline-none focus:border-secondary transition-all" 
                  placeholder="Search records by name or value..." 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                className="h-8 px-2 text-body-sm font-body-sm rounded bg-surface-container-high text-on-surface cursor-pointer focus:outline-none focus:bg-surface-container-highest"
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
                <option value="SRV">SRV</option>
                <option value="CAA">CAA</option>
              </select>
            </div>
          </div>

          <RecordTable 
            records={filteredRecords} 
            selectedRecordIds={selectedRecordIds as any} 
            onSelectionChange={setSelectedRecordIds as any} 
            loading={loading}
          />
          
          <div className="flex items-center justify-between pt-space-md text-body-sm font-body-sm text-tertiary">
            <div className="flex items-center gap-1">
              <span>Records 1-{filteredRecords.length} of {filteredRecords.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <button className="px-2.5 py-1 rounded bg-surface-container-high text-tertiary cursor-not-allowed">Previous</button>
              <button className="px-2.5 py-1 rounded bg-secondary text-on-secondary font-bold">1</button>
              <button className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors">Next</button>
            </div>
          </div>
        </div>

        {isFormOpen && zone && (
          <div className="w-full lg:w-[440px] bg-surface-container-lowest rounded-xl shadow-xl shrink-0 transition-all flex flex-col justify-between">
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
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
