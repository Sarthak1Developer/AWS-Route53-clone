import { useState, useEffect } from "react";
import { createHostedZone, updateHostedZone, HostedZone } from "@/lib/api";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  zone?: HostedZone;
}

export default function HostedZoneForm({ onClose, onSuccess, zone }: Props) {
  const isEdit = !!zone;
  const [domainName, setDomainName] = useState(zone?.domain_name || "");
  const [type, setType] = useState(zone?.type || "Public");
  const [comment, setComment] = useState(zone?.comment || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (zone) {
      setDomainName(zone.domain_name);
      setType(zone.type);
      setComment(zone.comment || "");
    }
  }, [zone]);

  const handleSubmit = async () => {
    const cleanDomain = domainName.trim().replace(/\s+/g, "");
    if (!cleanDomain) return;
    setLoading(true);
    try {
      if (isEdit && zone) {
        await updateHostedZone(zone.id, {
          domain_name: cleanDomain,
          type,
          comment: comment.trim(),
        });
      } else {
        await createHostedZone({
          domain_name: cleanDomain,
          type,
          comment: comment.trim(),
        });
      }
      onSuccess();
    } catch (error: any) {
      console.error(error);
      alert(error?.message || (isEdit ? "Failed to update hosted zone" : "Failed to create hosted zone"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-on-tertiary-container/30 backdrop-blur-[1px] z-50 transition-opacity duration-200" onClick={onClose}></div>
      <aside className="fixed top-nav-height right-0 bottom-0 w-full max-w-lg bg-surface-container-lowest shadow-2xl z-50 flex flex-col">
        <div className="p-space-lg bg-surface-container-low flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-display-md font-display-md text-on-surface">{isEdit ? "Edit hosted zone" : "Create hosted zone"}</h2>
            <p className="text-body-sm font-body-sm text-tertiary">Define authoritative name server domain boundaries.</p>
          </div>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-tertiary hover:text-on-surface hover:bg-surface-container transition-colors" onClick={onClose}>
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-space-lg space-y-space-lg">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-title-md font-title-md text-on-surface">
                Domain name <span className="text-error">*</span>
              </label>
              <span className="text-code-sm font-code-sm text-tertiary">RFC 1035 format</span>
            </div>
            <input 
              type="text"
              required
              disabled={isEdit}
              className={`h-8 px-space-sm font-code-md text-code-md rounded-lg focus:outline-none shadow-inner ${isEdit ? 'bg-surface-container-high text-tertiary cursor-not-allowed' : 'bg-surface-container-low text-on-surface focus:bg-surface-container-lowest'}`} 
              placeholder="example.com"
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
            />
            <p className="text-body-sm font-body-sm text-tertiary">
              The name of the hosted zone you want to create. This must match the apex or subzone domain you intend to delegate.
            </p>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-title-md font-title-md text-on-surface">Description</label>
              <span className="text-code-sm font-code-sm text-tertiary italic">Optional</span>
            </div>
            <textarea 
              className="p-space-sm bg-surface-container-low text-on-surface text-body-md font-body-md rounded-lg focus:outline-none focus:bg-surface-container-lowest resize-y shadow-inner" 
              placeholder="Enter comments or purpose for this hosted zone" 
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            ></textarea>
          </div>
          
          <div className="flex flex-col gap-space-xs">
            <label className="text-title-md font-title-md text-on-surface mb-1">Type</label>
            <label className="flex items-start gap-space-sm p-space-md bg-surface-container-low rounded-lg cursor-pointer hover:bg-surface-container transition-colors">
              <input 
                type="radio" 
                name="zone-type" 
                value="Public" 
                disabled={isEdit}
                checked={type === "Public"}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 accent-primary-container cursor-pointer" 
              />
              <div className="flex flex-col">
                <span className={`text-title-md font-title-md ${isEdit && type !== 'Public' ? 'text-tertiary' : 'text-on-surface'}`}>Public hosted zone</span>
                <span className="text-body-sm font-body-sm text-tertiary mt-0.5">
                  Determines how traffic is routed on the Internet. Accessible globally by recursive resolvers.
                </span>
              </div>
            </label>
            <label className="flex items-start gap-space-sm p-space-md bg-surface-container-lowest rounded-lg cursor-pointer hover:bg-surface-container-low transition-colors border border-surface-container-high">
              <input 
                type="radio" 
                name="zone-type" 
                value="Private" 
                disabled={isEdit}
                checked={type === "Private"}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 accent-primary-container cursor-pointer" 
              />
              <div className="flex flex-col">
                <span className={`text-title-md font-title-md ${isEdit && type !== 'Private' ? 'text-tertiary' : 'text-on-surface'}`}>Private hosted zone</span>
                <span className="text-body-sm font-body-sm text-tertiary mt-0.5">
                  Determines how traffic is routed within one or more Amazon VPCs without public internet exposure.
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="p-space-lg bg-surface-container-low flex items-center justify-end gap-space-sm shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="h-8 px-space-lg bg-surface-container text-on-surface font-title-md text-title-md rounded-lg shadow-sm hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleSubmit}
            disabled={loading}
            className="h-8 px-space-lg bg-primary-container text-on-primary font-title-md text-title-md rounded-lg shadow-sm hover:opacity-90 active:opacity-95 transition-all disabled:opacity-50"
          >
            {loading ? (isEdit ? "Saving..." : "Creating...") : (isEdit ? "Save changes" : "Create hosted zone")}
          </button>
        </div>
      </aside>
    </>
  );
}
