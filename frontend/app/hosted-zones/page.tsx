"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getHostedZones, HostedZone, deleteHostedZone } from "@/lib/api";
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

  const handleDelete = async () => {
    if (selectedZoneIds.size === 0) return;
    if (confirm("Are you sure you want to delete the selected zone(s)?")) {
      for (const id of Array.from(selectedZoneIds)) {
        await deleteHostedZone(id);
      }
      setSelectedZoneIds(new Set());
      fetchZones();
    }
  };

  const handleEdit = () => {
    if (selectedZoneIds.size !== 1) return;
    const zoneId = Array.from(selectedZoneIds)[0];
    const zone = zones.find(z => z.id === zoneId);
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

  const filteredZones = zones.filter(z => 
    z.domain_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    z.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full">
      <nav aria-label="Breadcrumbs" className="flex items-center gap-space-xs text-body-sm font-body-sm text-tertiary mb-space-sm">
        <Link className="text-secondary hover:underline" href="/dashboard">Amazon Route 53</Link>
        <span className="text-tertiary-container select-none">/</span>
        <span className="text-on-surface font-title-md text-title-md">Hosted zones</span>
      </nav>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-lg">
        <div>
          <div className="flex items-baseline gap-space-xs">
            <h1 className="text-display-lg font-display-lg text-on-surface">Hosted zones</h1>
            <span className="text-display-md font-display-md text-tertiary font-normal">({filteredZones.length})</span>
          </div>
          <p className="text-body-sm font-body-sm text-tertiary mt-1 max-w-3xl">
            A hosted zone tells Route 53 how to respond to DNS queries for a domain such as example.com. Create and route traffic across public or VPC-scoped private zones.
          </p>
        </div>
        <div className="flex items-center gap-space-sm shrink-0 flex-wrap">
          <button 
            onClick={handleEdit}
            disabled={selectedZoneIds.size !== 1}
            className={`h-8 px-space-md font-title-md text-title-md rounded-lg shadow-sm transition-colors ${selectedZoneIds.size === 1 ? 'bg-surface-container text-on-surface hover:bg-surface-container-high' : 'bg-surface-container-low text-tertiary-container cursor-not-allowed opacity-50'}`}
          >
            Edit zone details
          </button>
          <button 
            onClick={handleDelete}
            disabled={selectedZoneIds.size === 0}
            className={`h-8 px-space-md font-title-md text-title-md rounded-lg transition-colors ${selectedZoneIds.size > 0 ? 'bg-surface-container text-error shadow-sm hover:bg-surface-container-high' : 'bg-surface-container-low text-tertiary-container cursor-not-allowed opacity-50'}`}
          >
            Delete hosted zone
          </button>
          <button 
            onClick={handleViewDetails}
            disabled={selectedZoneIds.size !== 1}
            className={`h-8 px-space-md font-title-md text-title-md rounded-lg shadow-sm transition-colors ${selectedZoneIds.size === 1 ? 'bg-surface-container text-on-surface hover:bg-surface-container-high' : 'bg-surface-container-low text-tertiary-container cursor-not-allowed opacity-50'}`}
          >
            View details
          </button>
          <button
            onClick={() => { setEditingZone(undefined); setIsFormOpen(true); }}
            className="h-8 px-space-md bg-primary-container text-on-primary font-title-md text-title-md rounded-lg shadow-sm hover:opacity-90 active:opacity-95 transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create hosted zone
          </button>
        </div>
      </div>

      <div className="bg-surface-container-lowest shadow-md rounded-lg overflow-hidden flex flex-col">
        <div className="p-space-md bg-surface-container-lowest flex flex-col gap-space-sm">
          <div className="flex flex-wrap items-center justify-between gap-space-md">
            <div className="flex-1 min-w-[280px] max-w-xl relative flex items-center">
              <span className="material-symbols-outlined absolute left-space-sm text-tertiary text-[18px]">search</span>
              <input 
                className="w-full h-8 pl-8 pr-8 bg-surface-container-low text-on-surface placeholder:text-tertiary text-body-sm font-body-sm rounded-lg focus:outline-none focus:bg-surface-container-lowest shadow-inner" 
                placeholder="Find hosted zones by name or ID" 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-space-xs shrink-0">
              <button onClick={fetchZones} className="w-8 h-8 flex items-center justify-center bg-surface-container text-tertiary hover:text-on-surface rounded-lg shadow-sm hover:bg-surface-container-high transition-colors" title="Refresh records">
                <span className="material-symbols-outlined text-[18px]">refresh</span>
              </button>
              <button className="w-8 h-8 flex items-center justify-center bg-surface-container text-tertiary hover:text-on-surface rounded-lg shadow-sm hover:bg-surface-container-high transition-colors" title="Preferences">
                <span className="material-symbols-outlined text-[18px]">settings</span>
              </button>
            </div>
          </div>
        </div>
        
        <HostedZoneTable 
          zones={filteredZones} 
          selectedZoneIds={selectedZoneIds} 
          onSelectionChange={setSelectedZoneIds} 
          loading={loading}
        />

        <div className="px-space-md py-space-sm bg-surface-container-lowest flex items-center justify-between text-body-sm font-body-sm text-tertiary border-t border-surface-container-high">
          <span className="text-label-sm font-label-sm text-tertiary">Showing 1-{filteredZones.length} of {filteredZones.length} hosted zones</span>
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 flex items-center justify-center rounded text-tertiary-container cursor-not-allowed" disabled>
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <span className="w-7 h-7 flex items-center justify-center bg-surface-container text-on-surface font-title-md text-title-md rounded-lg shadow-sm">1</span>
            <button className="w-7 h-7 flex items-center justify-center rounded text-tertiary-container cursor-not-allowed" disabled>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

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
          }}
        />
      )}
    </div>
  );
}
