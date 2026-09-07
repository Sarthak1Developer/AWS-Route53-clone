import { useState, useEffect } from "react";
import { createDNSRecord, updateDNSRecord, DNSRecord } from "@/lib/api";

interface Props {
  zoneId: string;
  zoneDomain: string;
  onClose: () => void;
  onSuccess: () => void;
  record?: DNSRecord;
}

export default function RecordForm({ zoneId, zoneDomain, onClose, onSuccess, record }: Props) {
  const isEdit = !!record;
  
  // Extract subdomain name if possible
  const defaultName = record ? (record.record_name.endsWith(`.${zoneDomain}`) ? record.record_name.slice(0, -(zoneDomain.length + 1)) : (record.record_name === zoneDomain ? "" : record.record_name)) : "";

  const [name, setName] = useState(defaultName);
  const [type, setType] = useState(record?.record_type || "A");
  const [value, setValue] = useState(record?.value || "");
  const [ttl, setTtl] = useState(record?.ttl || 300);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (record) {
      const n = record.record_name.endsWith(`.${zoneDomain}`) ? record.record_name.slice(0, -(zoneDomain.length + 1)) : (record.record_name === zoneDomain ? "" : record.record_name);
      setName(n);
      setType(record.record_type);
      setValue(record.value);
      setTtl(record.ttl);
    }
  }, [record, zoneDomain]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    
    setLoading(true);
    try {
      const recordName = name ? `${name}.${zoneDomain}` : zoneDomain;
      if (isEdit && record) {
        await updateDNSRecord(zoneId, record.id, {
          record_name: recordName,
          record_type: type,
          value,
          ttl,
          routing_policy: "Simple"
        });
      } else {
        await createDNSRecord(zoneId, {
          record_name: recordName,
          record_type: type,
          value,
          ttl,
          routing_policy: "Simple"
        });
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      alert(isEdit ? "Failed to update DNS record" : "Failed to create DNS record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between pb-space-sm mb-space-md border-b border-surface-container-high p-space-lg">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-primary-container text-[20px]">{isEdit ? "edit" : "add_box"}</span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">{isEdit ? "Edit record" : "Quick create record"}</h2>
        </div>
        <button onClick={onClose} className="text-tertiary hover:text-on-surface p-1 rounded transition-colors" title="Close drawer">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-space-md flex-1 overflow-y-auto px-space-lg">
        <div>
          <label className="block font-label-md text-label-md text-on-surface mb-1">
            Record name
            <span className="text-tertiary font-normal text-body-sm ml-1">(Subdomain)</span>
          </label>
          <div className="flex items-center">
            <input 
              type="text"
              className="flex-1 h-8 px-2.5 font-code-md text-code-md rounded-l bg-surface text-on-surface border border-surface-container-high focus:outline-none focus:border-secondary shadow-inner"
              placeholder="e.g. stage-api"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <span className="h-8 px-2.5 bg-surface-container text-tertiary font-code-sm text-code-sm flex items-center rounded-r border border-l-0 border-surface-container-high select-none">
              .{zoneDomain}
            </span>
          </div>
        </div>

        <div>
          <label className="block font-label-md text-label-md text-on-surface mb-1">Record type</label>
          <select 
            className="w-full h-8 px-2 text-body-sm font-body-sm rounded bg-surface text-on-surface border border-surface-container-high focus:outline-none focus:border-secondary shadow-sm"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="A">A - Routes traffic to an IPv4 address and some AWS resources</option>
            <option value="AAAA">AAAA - Routes traffic to an IPv6 address and some AWS resources</option>
            <option value="CNAME">CNAME - Canonical name for an alias</option>
            <option value="MX">MX - Mail exchange record</option>
            <option value="TXT">TXT - Text records for SPF or verification</option>
            <option value="NS">NS - Name server</option>
            <option value="PTR">PTR - Pointer</option>
            <option value="SRV">SRV - Service locator</option>
            <option value="CAA">CAA - Certification Authority Authorization</option>
          </select>
        </div>

        <div>
          <label className="block font-label-md text-label-md text-on-surface mb-1">Value</label>
          <textarea 
            required
            className="w-full p-2.5 font-code-md text-code-md rounded bg-surface text-on-surface border border-surface-container-high focus:outline-none focus:border-secondary shadow-inner min-h-[80px]"
            placeholder="Enter value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          ></textarea>
        </div>

        <div>
          <label className="block font-label-md text-label-md text-on-surface mb-1">TTL (seconds)</label>
          <input 
            type="number"
            required
            min={0}
            className="w-full h-8 px-2.5 text-body-sm font-body-sm rounded bg-surface text-on-surface border border-surface-container-high focus:outline-none focus:border-secondary shadow-inner"
            value={ttl}
            onChange={(e) => setTtl(Number(e.target.value))}
          />
        </div>

        <div>
          <label className="block font-label-md text-label-md text-on-surface mb-2">Routing policy</label>
          <div className="grid grid-cols-2 gap-2 text-body-sm">
            <label className="flex items-center gap-2 p-2 rounded bg-surface hover:bg-surface-container cursor-pointer bg-surface-container-high/50 border border-surface-container-high">
              <input type="radio" name="policy" className="text-primary-container focus:ring-0 accent-primary-container" defaultChecked />
              <span className="font-title-md text-[12px] text-on-surface">Simple</span>
            </label>
          </div>
        </div>
      </form>

      <div className="flex items-center justify-end gap-space-xs pt-space-lg border-t border-surface-container-high mt-space-md p-space-lg">
        <button 
          onClick={onClose}
          type="button"
          className="h-8 px-space-md bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-title-md text-label-md rounded transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={handleSubmit}
          disabled={loading}
          type="submit"
          className="h-8 px-space-md bg-primary-container hover:bg-surface-tint text-white font-title-md text-label-md rounded flex items-center gap-1 shadow-sm transition-all disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[16px]">{loading ? "refresh" : "check"}</span>
          {loading ? (isEdit ? "Saving..." : "Creating...") : (isEdit ? "Save changes" : "Create records")}
        </button>
      </div>
    </>
  );
}
