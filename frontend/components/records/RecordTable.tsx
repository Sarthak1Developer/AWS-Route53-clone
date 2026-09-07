import { DNSRecord } from "@/lib/api";

interface Props {
  records: DNSRecord[];
  selectedRecordIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  loading: boolean;
}

export default function RecordTable({ records, selectedRecordIds, onSelectionChange, loading }: Props) {
  if (loading) {
    return <div className="p-4 text-gray-500">Loading...</div>;
  }

  if (records.length === 0) {
    return <div className="p-4 text-gray-500">No records found.</div>;
  }

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      onSelectionChange(new Set(records.map(r => r.id)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedRecordIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left text-body-sm font-body-sm whitespace-nowrap">
        <thead>
          <tr className="h-8 bg-surface-container text-tertiary text-[11px] font-bold uppercase tracking-wider select-none">
            <th className="w-10 px-3 text-center">
              <input 
                type="checkbox"
                className="rounded text-primary-container focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-primary-container"
                checked={selectedRecordIds.size === records.length && records.length > 0}
                onChange={toggleAll}
              />
            </th>
            <th className="px-3">Record name</th>
            <th className="px-2">Type</th>
            <th className="px-3">Routing policy</th>
            <th className="px-2">Differentiator</th>
            <th className="px-2">Alias</th>
            <th className="px-3">Value / Route traffic to</th>
            <th className="px-2">TTL (s)</th>
            <th className="px-3">Health check ID</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-container-high">
          {records.map((record) => {
            const isSelected = selectedRecordIds.has(record.id);
            return (
              <tr 
                key={record.id}
                onClick={() => toggleOne(record.id)}
                className={`h-10 transition-colors group cursor-pointer ${isSelected ? 'bg-surface-container-low' : 'hover:bg-surface-container-low'}`}
              >
                <td className="px-3 text-center">
                  <input 
                    type="checkbox"
                    className="rounded text-primary-container focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-primary-container"
                    checked={isSelected}
                    onChange={() => {}}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="px-3 font-title-md text-on-surface flex items-center gap-1.5 h-10">
                  <span className="font-code-md text-code-md text-secondary hover:underline cursor-pointer">{record.record_name}</span>
                  <button className="opacity-0 group-hover:opacity-100 text-tertiary hover:text-on-surface transition-opacity" title="Copy FQDN">
                    <span className="material-symbols-outlined text-[13px]">content_copy</span>
                  </button>
                </td>
                <td className="px-2">
                  <span className="inline-block px-1.5 py-0.5 rounded bg-surface-container font-code-sm text-code-sm font-semibold text-on-surface">
                    {record.record_type}
                  </span>
                </td>
                <td className="px-3 text-tertiary">
                  Simple
                </td>
                <td className="px-2 font-code-sm text-tertiary">-</td>
                <td className="px-2">
                  <span className="px-1.5 py-0.5 rounded bg-surface-container text-tertiary font-label-sm text-[10px]">No</span>
                </td>
                <td className="px-3 font-code-sm text-code-sm text-on-surface max-w-xs truncate" title={record.value}>
                  {record.value}
                </td>
                <td className="px-2 font-code-sm text-on-surface">{record.ttl}</td>
                <td className="px-3 font-code-sm text-tertiary">-</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
