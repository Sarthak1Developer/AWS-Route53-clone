import { HostedZone } from "@/lib/api";
import Link from "next/link";

interface Props {
  zones: HostedZone[];
  selectedZoneIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  loading: boolean;
}

export default function HostedZoneTable({ zones, selectedZoneIds, onSelectionChange, loading }: Props) {
  if (loading) {
    return <div className="p-4 text-gray-500">Loading...</div>;
  }

  if (zones.length === 0) {
    return <div className="p-4 text-gray-500">No hosted zones found.</div>;
  }

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      onSelectionChange(new Set(zones.map(z => z.id)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedZoneIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full min-w-[720px] text-left text-body-sm font-body-sm select-none border-collapse">
        <thead className="bg-surface-container-low text-tertiary font-title-md text-label-md uppercase tracking-wider">
          <tr>
            <th className="w-10 px-space-md py-space-sm text-center">
              <input 
                type="checkbox"
                className="accent-primary-container rounded cursor-pointer"
                checked={selectedZoneIds.size === zones.length && zones.length > 0}
                onChange={toggleAll}
              />
            </th>
            <th className="px-space-md py-space-sm">
              <div className="flex items-center gap-1 cursor-pointer hover:text-on-surface">
                <span>Domain name</span>
                <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
              </div>
            </th>
            <th className="px-space-md py-space-sm">Type</th>
            <th className="px-space-md py-space-sm">Status</th>
            <th className="px-space-md py-space-sm text-right">Record count</th>
            <th className="px-space-md py-space-sm">Hosted zone ID</th>
            <th className="px-space-md py-space-sm">Comment</th>
          </tr>
        </thead>
        <tbody>
          {zones.map((zone) => {
            const isSelected = selectedZoneIds.has(zone.id);
            return (
              <tr 
                key={zone.id} 
                onClick={() => toggleOne(zone.id)}
                className={`transition-colors cursor-pointer group ${isSelected ? 'bg-surface-container-low' : 'bg-surface-container-lowest hover:bg-surface-container-low'}`}
              >
                <td className="w-10 px-space-md py-space-sm text-center">
                  <input 
                    type="checkbox"
                    className="accent-primary-container rounded cursor-pointer"
                    checked={isSelected}
                    onChange={() => {}} // handled by row click
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="px-space-md py-space-sm font-title-md text-title-md text-secondary group-hover:underline">
                  <Link href={`/hosted-zones/${zone.id}`} onClick={(e) => e.stopPropagation()}>{zone.domain_name}</Link>
                </td>
                <td className="px-space-md py-space-sm">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-code-sm font-code-sm bg-surface-container-high text-on-surface">
                    {zone.type}
                  </span>
                </td>
                <td className="px-space-md py-space-sm whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-code-sm font-code-sm bg-surface-container text-on-surface">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    In sync
                  </span>
                </td>
                <td className="px-space-md py-space-sm text-right font-code-sm text-code-sm text-on-surface font-semibold">-</td>
                <td className="px-space-md py-space-sm font-code-sm text-code-sm text-tertiary">{zone.id}</td>
                <td className="px-space-md py-space-sm text-tertiary max-w-xs truncate">{zone.comment || "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
