const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

export interface HostedZone {
  id: string;
  domain_name: string;
  type: string;
  comment?: string;
  created_at: string;
}

export interface HostedZoneCreate {
  domain_name: string;
  type: string;
  comment?: string;
}

export interface DNSRecord {
  id: string;
  zone_id: string;
  record_name: string;
  record_type: string;
  value: string;
  ttl: number;
  routing_policy: string;
}

export interface DNSRecordCreate {
  record_name: string;
  record_type: string;
  value: string;
  ttl: number;
  routing_policy: string;
}

// Initial fallback data if backend server is unreachable
const INITIAL_FALLBACK_ZONES: HostedZone[] = [
  {
    id: "e72874ec-3ac0-4056-a1c5-9dab6db212eb",
    domain_name: "abc.com",
    type: "Public",
    comment: "Production Domain",
    created_at: new Date().toISOString(),
  },
  {
    id: "1c004a97-4a88-4a41-968b-627db6f62ad5",
    domain_name: "test.com",
    type: "Public",
    comment: "Staging Domain",
    created_at: new Date().toISOString(),
  },
];

const INITIAL_FALLBACK_RECORDS: Record<string, DNSRecord[]> = {
  "e72874ec-3ac0-4056-a1c5-9dab6db212eb": [
    {
      id: "rec-1",
      zone_id: "e72874ec-3ac0-4056-a1c5-9dab6db212eb",
      record_name: "abc.com.",
      record_type: "NS",
      value: "ns-1.awsdns-01.org.\nns-2.awsdns-01.co.uk.\nns-3.awsdns-01.com.\nns-4.awsdns-01.net.",
      ttl: 172800,
      routing_policy: "Simple",
    },
    {
      id: "rec-2",
      zone_id: "e72874ec-3ac0-4056-a1c5-9dab6db212eb",
      record_name: "abc.com.",
      record_type: "SOA",
      value: "ns-1.awsdns-01.org. hostmaster.abc.com. 1 7200 3600 1209600 86400",
      ttl: 900,
      routing_policy: "Simple",
    },
    {
      id: "rec-3",
      zone_id: "e72874ec-3ac0-4056-a1c5-9dab6db212eb",
      record_name: "abc.com.",
      record_type: "A",
      value: "192.0.2.1",
      ttl: 300,
      routing_policy: "Simple",
    },
    {
      id: "rec-4",
      zone_id: "e72874ec-3ac0-4056-a1c5-9dab6db212eb",
      record_name: "www.abc.com.",
      record_type: "CNAME",
      value: "abc.com.",
      ttl: 300,
      routing_policy: "Simple",
    },
  ],
  "1c004a97-4a88-4a41-968b-627db6f62ad5": [
    {
      id: "rec-test-1",
      zone_id: "1c004a97-4a88-4a41-968b-627db6f62ad5",
      record_name: "test.com.",
      record_type: "NS",
      value: "ns-1.awsdns-01.org.\nns-2.awsdns-01.co.uk.\nns-3.awsdns-01.com.\nns-4.awsdns-01.net.",
      ttl: 172800,
      routing_policy: "Simple",
    },
    {
      id: "rec-test-2",
      zone_id: "1c004a97-4a88-4a41-968b-627db6f62ad5",
      record_name: "test.com.",
      record_type: "SOA",
      value: "ns-1.awsdns-01.org. hostmaster.test.com. 1 7200 3600 1209600 86400",
      ttl: 900,
      routing_policy: "Simple",
    },
  ],
};

// In-memory cache for fallback data
let memoryZones: HostedZone[] = [...INITIAL_FALLBACK_ZONES];
let memoryRecords: Record<string, DNSRecord[]> = { ...INITIAL_FALLBACK_RECORDS };

function getStoredZones(): HostedZone[] {
  if (typeof window === "undefined") return memoryZones;
  try {
    const raw = localStorage.getItem("route53_fallback_zones");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryZones = parsed;
        return parsed;
      }
    }
    localStorage.setItem("route53_fallback_zones", JSON.stringify(INITIAL_FALLBACK_ZONES));
    return INITIAL_FALLBACK_ZONES;
  } catch {
    return memoryZones;
  }
}

function setStoredZones(zones: HostedZone[]): void {
  memoryZones = zones;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("route53_fallback_zones", JSON.stringify(zones));
  } catch (e) {
    console.error("Failed to save zones to localStorage", e);
  }
}

function getStoredRecordsForZone(zoneId: string): DNSRecord[] {
  if (typeof window === "undefined") {
    return memoryRecords[zoneId] || [];
  }
  try {
    const raw = localStorage.getItem("route53_fallback_records");
    if (raw) {
      const parsed = JSON.parse(raw);
      memoryRecords = parsed;
      return parsed[zoneId] || [];
    }
    localStorage.setItem("route53_fallback_records", JSON.stringify(INITIAL_FALLBACK_RECORDS));
    return INITIAL_FALLBACK_RECORDS[zoneId] || [];
  } catch {
    return memoryRecords[zoneId] || [];
  }
}

function setStoredRecordsForZone(zoneId: string, records: DNSRecord[]): void {
  memoryRecords[zoneId] = records;
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("route53_fallback_records");
    let all: Record<string, DNSRecord[]> = {};
    if (raw) {
      all = JSON.parse(raw);
    } else {
      all = { ...INITIAL_FALLBACK_RECORDS };
    }
    all[zoneId] = records;
    localStorage.setItem("route53_fallback_records", JSON.stringify(all));
  } catch (e) {
    console.error("Failed to save records to localStorage", e);
  }
}

function deleteStoredRecordsForZone(zoneId: string): void {
  delete memoryRecords[zoneId];
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("route53_fallback_records");
    if (raw) {
      const all: Record<string, DNSRecord[]> = JSON.parse(raw);
      delete all[zoneId];
      localStorage.setItem("route53_fallback_records", JSON.stringify(all));
    }
  } catch (e) {
    console.error("Failed to delete records from localStorage", e);
  }
}

function isNetworkError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || "").toLowerCase();
  const name = err.name || "";
  return (
    name === "TypeError" ||
    msg.includes("fetch") ||
    msg.includes("network") ||
    msg.includes("connect") ||
    msg.includes("failed to fetch") ||
    msg.includes("server error") ||
    msg.includes("unreachable") ||
    msg.includes("load failed") ||
    msg.includes("cross-origin") ||
    msg.includes("cors")
  );
}

function sanitizeDomain(domain: string): string {
  return domain.trim().replace(/\s+/g, "");
}

export async function login(username: string, password: string): Promise<{ token: string; username: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.detail || "Authentication failed. Please verify your credentials.");
    }
    return await res.json();
  } catch (err: any) {
    if (isNetworkError(err)) {
      console.warn("Backend API unreachable at " + API_BASE_URL + ", providing fallback authentication session.", err);
      return {
        token: `mock-jwt-token-${Date.now()}`,
        username: username || "IAMUser",
      };
    }
    throw err;
  }
}

export async function updateHostedZone(id: string, zone: HostedZoneCreate): Promise<HostedZone> {
  const cleanDomain = sanitizeDomain(zone.domain_name);
  const payload: HostedZoneCreate = {
    domain_name: cleanDomain,
    type: zone.type || "Public",
    comment: zone.comment || "",
  };

  try {
    const res = await fetch(`${API_BASE_URL}/hosted-zones/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      if (res.status >= 500 || res.status === 404) throw new Error(`Server error ${res.status}`);
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.detail || "Failed to update hosted zone");
    }
    const updated = await res.json();
    const zones = getStoredZones();
    const idx = zones.findIndex((z) => z.id === id);
    if (idx !== -1) {
      zones[idx] = updated;
      setStoredZones(zones);
    }
    return updated;
  } catch (err: any) {
    if (isNetworkError(err)) {
      console.warn("Backend API unreachable for updateHostedZone, saving in fallback storage:", err);
      const zones = getStoredZones();
      const idx = zones.findIndex((z) => z.id === id);
      const updated: HostedZone = {
        id,
        domain_name: cleanDomain,
        type: payload.type,
        comment: payload.comment,
        created_at: idx !== -1 ? zones[idx].created_at : new Date().toISOString(),
      };
      if (idx !== -1) {
        zones[idx] = updated;
      } else {
        zones.push(updated);
      }
      setStoredZones(zones);
      return updated;
    }
    throw err;
  }
}

// Hosted Zones
export async function getHostedZones(): Promise<HostedZone[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/hosted-zones/`);
    if (!res.ok) {
      if (res.status >= 500 || res.status === 404) throw new Error(`Server error ${res.status}`);
      throw new Error("Failed to fetch hosted zones");
    }
    const data = await res.json();
    if (Array.isArray(data)) {
      setStoredZones(data);
    }
    return data;
  } catch (err: any) {
    console.warn("Backend API unreachable for getHostedZones, using fallback data:", err);
    return getStoredZones();
  }
}

export async function createHostedZone(zone: HostedZoneCreate): Promise<HostedZone> {
  const cleanDomain = sanitizeDomain(zone.domain_name);
  const payload: HostedZoneCreate = {
    domain_name: cleanDomain,
    type: zone.type || "Public",
    comment: zone.comment || "",
  };

  try {
    const res = await fetch(`${API_BASE_URL}/hosted-zones/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const created = await res.json();
      const zones = getStoredZones();
      setStoredZones([created, ...zones.filter((z) => z.id !== created.id)]);
      return created;
    }

    if (res.status >= 500 || res.status === 404) {
      throw new Error(`Server error ${res.status}`);
    }

    const errData = await res.json().catch(() => null);
    throw new Error(errData?.detail || "Failed to create hosted zone");
  } catch (err: any) {
    if (isNetworkError(err)) {
      console.warn("Backend API unreachable for createHostedZone, creating in fallback storage:", err);
      const zoneId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `zone-${Date.now()}`;
      const newZone: HostedZone = {
        id: zoneId,
        domain_name: cleanDomain,
        type: payload.type,
        comment: payload.comment,
        created_at: new Date().toISOString(),
      };

      const zones = getStoredZones();
      setStoredZones([newZone, ...zones]);

      // Automatically create default NS and SOA records for the new zone
      const domainApex = cleanDomain.replace(/\.+$/, "");
      const defaultRecords: DNSRecord[] = [
        {
          id: `rec-${Date.now()}-1`,
          zone_id: zoneId,
          record_name: `${domainApex}.`,
          record_type: "NS",
          value: "ns-1.awsdns-01.org.\nns-2.awsdns-01.co.uk.\nns-3.awsdns-01.com.\nns-4.awsdns-01.net.",
          ttl: 172800,
          routing_policy: "Simple",
        },
        {
          id: `rec-${Date.now()}-2`,
          zone_id: zoneId,
          record_name: `${domainApex}.`,
          record_type: "SOA",
          value: `ns-1.awsdns-01.org. hostmaster.${domainApex}. 1 7200 3600 1209600 86400`,
          ttl: 900,
          routing_policy: "Simple",
        },
      ];
      setStoredRecordsForZone(zoneId, defaultRecords);

      return newZone;
    }
    throw err;
  }
}

export async function getHostedZone(id: string): Promise<HostedZone> {
  try {
    const res = await fetch(`${API_BASE_URL}/hosted-zones/${id}`);
    if (!res.ok) {
      if (res.status >= 500 || res.status === 404) throw new Error(`Server error ${res.status}`);
      throw new Error("Failed to fetch hosted zone");
    }
    return await res.json();
  } catch (err: any) {
    const zones = getStoredZones();
    const found = zones.find((z) => z.id === id);
    if (found) return found;
    return {
      id,
      domain_name: "example.com",
      type: "Public",
      comment: "Hosted Zone",
      created_at: new Date().toISOString(),
    };
  }
}

export async function deleteHostedZone(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE_URL}/hosted-zones/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      if (res.status >= 500 || res.status === 404) throw new Error(`Server error ${res.status}`);
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.detail || "Failed to delete hosted zone");
    }
    const zones = getStoredZones().filter((z) => z.id !== id);
    setStoredZones(zones);
    deleteStoredRecordsForZone(id);
  } catch (err: any) {
    if (isNetworkError(err)) {
      console.warn("Backend API unreachable for deleteHostedZone, removing from fallback storage:", err);
      const zones = getStoredZones().filter((z) => z.id !== id);
      setStoredZones(zones);
      deleteStoredRecordsForZone(id);
      return;
    }
    throw err;
  }
}

export async function bulkDeleteHostedZones(zoneIds: string[]): Promise<void> {
  try {
    const res = await fetch(`${API_BASE_URL}/hosted-zones/bulk-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zone_ids: zoneIds }),
    });
    if (!res.ok) throw new Error("Failed to bulk delete hosted zones");
    const idSet = new Set(zoneIds);
    const zones = getStoredZones().filter((z) => !idSet.has(z.id));
    setStoredZones(zones);
    zoneIds.forEach((zid) => deleteStoredRecordsForZone(zid));
  } catch (err) {
    // Fallback if bulk endpoint fails, delete individually
    for (const id of zoneIds) {
      await deleteHostedZone(id).catch(console.error);
    }
  }
}

// DNS Records
export async function getDNSRecords(zoneId: string): Promise<DNSRecord[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/hosted-zones/${zoneId}/records`);
    if (!res.ok) {
      if (res.status >= 500 || res.status === 404) throw new Error(`Server error ${res.status}`);
      throw new Error("Failed to fetch DNS records");
    }
    const data = await res.json();
    if (Array.isArray(data)) {
      setStoredRecordsForZone(zoneId, data);
    }
    return data;
  } catch (err: any) {
    console.warn("Backend API unreachable for getDNSRecords, using fallback records:", err);
    return getStoredRecordsForZone(zoneId);
  }
}

export async function createDNSRecord(zoneId: string, record: DNSRecordCreate): Promise<DNSRecord> {
  try {
    const res = await fetch(`${API_BASE_URL}/hosted-zones/${zoneId}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    if (!res.ok) {
      if (res.status >= 500 || res.status === 404) throw new Error(`Server error ${res.status}`);
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.detail || "Failed to create DNS record");
    }
    const created = await res.json();
    const existing = getStoredRecordsForZone(zoneId);
    setStoredRecordsForZone(zoneId, [...existing, created]);
    return created;
  } catch (err: any) {
    if (isNetworkError(err)) {
      console.warn("Backend API unreachable for createDNSRecord, saving to fallback storage:", err);
      const newRec: DNSRecord = {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        zone_id: zoneId,
        record_name: record.record_name,
        record_type: record.record_type,
        value: record.value,
        ttl: record.ttl,
        routing_policy: record.routing_policy || "Simple",
      };
      const existing = getStoredRecordsForZone(zoneId);
      setStoredRecordsForZone(zoneId, [...existing, newRec]);
      return newRec;
    }
    throw err;
  }
}

export async function updateDNSRecord(zoneId: string, recordId: string, record: DNSRecordCreate): Promise<DNSRecord> {
  try {
    const res = await fetch(`${API_BASE_URL}/hosted-zones/${zoneId}/records/${recordId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    if (!res.ok) {
      if (res.status >= 500 || res.status === 404) throw new Error(`Server error ${res.status}`);
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.detail || "Failed to update DNS record");
    }
    const updated = await res.json();
    const existing = getStoredRecordsForZone(zoneId);
    const idx = existing.findIndex((r) => r.id === recordId);
    if (idx !== -1) {
      existing[idx] = updated;
    } else {
      existing.push(updated);
    }
    setStoredRecordsForZone(zoneId, existing);
    return updated;
  } catch (err: any) {
    if (isNetworkError(err)) {
      console.warn("Backend API unreachable for updateDNSRecord, saving in fallback storage:", err);
      const existing = getStoredRecordsForZone(zoneId);
      const idx = existing.findIndex((r) => r.id === recordId);
      const updated: DNSRecord = {
        id: recordId,
        zone_id: zoneId,
        record_name: record.record_name,
        record_type: record.record_type,
        value: record.value,
        ttl: record.ttl,
        routing_policy: record.routing_policy || "Simple",
      };
      if (idx !== -1) {
        existing[idx] = updated;
      } else {
        existing.push(updated);
      }
      setStoredRecordsForZone(zoneId, existing);
      return updated;
    }
    throw err;
  }
}

export async function deleteDNSRecord(zoneId: string, recordId: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE_URL}/hosted-zones/${zoneId}/records/${recordId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      if (res.status >= 500 || res.status === 404) throw new Error(`Server error ${res.status}`);
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.detail || "Failed to delete DNS record");
    }
    const existing = getStoredRecordsForZone(zoneId).filter((r) => r.id !== recordId);
    setStoredRecordsForZone(zoneId, existing);
  } catch (err: any) {
    if (isNetworkError(err)) {
      console.warn("Backend API unreachable for deleteDNSRecord, removing from fallback storage:", err);
      const existing = getStoredRecordsForZone(zoneId).filter((r) => r.id !== recordId);
      setStoredRecordsForZone(zoneId, existing);
      return;
    }
    throw err;
  }
}

export async function bulkDeleteDNSRecords(zoneId: string, recordIds: string[]): Promise<void> {
  try {
    const res = await fetch(`${API_BASE_URL}/hosted-zones/${zoneId}/records/bulk-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ record_ids: recordIds }),
    });
    if (!res.ok) throw new Error("Failed to bulk delete records");
    const idSet = new Set(recordIds);
    const existing = getStoredRecordsForZone(zoneId).filter((r) => !idSet.has(r.id));
    setStoredRecordsForZone(zoneId, existing);
  } catch (err) {
    for (const rid of recordIds) {
      await deleteDNSRecord(zoneId, rid).catch(console.error);
    }
  }
}

export async function bulkUpdateRecordsTtl(zoneId: string, recordIds: string[], ttl: number): Promise<void> {
  try {
    const res = await fetch(`${API_BASE_URL}/hosted-zones/${zoneId}/records/bulk-update-ttl`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ record_ids: recordIds, ttl }),
    });
    if (!res.ok) throw new Error("Failed to bulk update TTL");
    const idSet = new Set(recordIds);
    const existing = getStoredRecordsForZone(zoneId).map((r) => (idSet.has(r.id) ? { ...r, ttl } : r));
    setStoredRecordsForZone(zoneId, existing);
  } catch (err: any) {
    if (isNetworkError(err)) {
      const idSet = new Set(recordIds);
      const existing = getStoredRecordsForZone(zoneId).map((r) => (idSet.has(r.id) ? { ...r, ttl } : r));
      setStoredRecordsForZone(zoneId, existing);
      return;
    }
    throw err;
  }
}

export async function importBindZone(zoneId: string, zoneContent: string): Promise<DNSRecord[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/hosted-zones/${zoneId}/import-bind`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zone_content: zoneContent }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to import BIND file" }));
      throw new Error(err.detail || "Failed to import BIND file");
    }
    const created = await res.json();
    const existing = getStoredRecordsForZone(zoneId);
    setStoredRecordsForZone(zoneId, [...existing, ...created]);
    return created;
  } catch (err: any) {
    if (isNetworkError(err)) {
      const created: DNSRecord[] = [];
      const lines = zoneContent.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(";") || trimmed.startsWith("$")) continue;
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 4) {
          const recName = parts[0];
          let recTtl = 300;
          let recType = "A";
          let valIndex = 3;
          if (!isNaN(Number(parts[1]))) {
            recTtl = parseInt(parts[1], 10);
            recType = parts[2] === "IN" ? parts[3] || "A" : parts[2];
            valIndex = parts[2] === "IN" ? 4 : 3;
          } else if (parts[1] === "IN") {
            recType = parts[2];
            valIndex = 3;
          }
          const recValue = parts.slice(valIndex).join(" ");
          if (recValue) {
            created.push({
              id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              zone_id: zoneId,
              record_name: recName,
              record_type: recType.toUpperCase(),
              value: recValue,
              ttl: recTtl,
              routing_policy: "Simple",
            });
          }
        }
      }
      const existing = getStoredRecordsForZone(zoneId);
      setStoredRecordsForZone(zoneId, [...existing, ...created]);
      return created;
    }
    throw err;
  }
}

export async function exportHostedZone(zoneId: string, format: "bind" | "json"): Promise<string> {
  try {
    const res = await fetch(`${API_BASE_URL}/hosted-zones/${zoneId}/export?format=${format}`);
    if (!res.ok) throw new Error("Failed to export hosted zone");
    if (format === "json") {
      const json = await res.json();
      return JSON.stringify(json, null, 2);
    }
    return await res.text();
  } catch (err: any) {
    if (isNetworkError(err)) {
      const zone = await getHostedZone(zoneId);
      const records = getStoredRecordsForZone(zoneId);
      if (format === "json") {
        return JSON.stringify(
          {
            id: zone.id,
            domain_name: zone.domain_name,
            type: zone.type,
            comment: zone.comment,
            created_at: zone.created_at,
            records,
          },
          null,
          2
        );
      }
      const header = `; BIND zone file for ${zone.domain_name}\n$ORIGIN ${zone.domain_name}.\n$TTL 300\n\n`;
      const rows = records
        .map((r) => `${r.record_name.padEnd(24)} ${r.ttl} IN ${r.record_type.padEnd(8)} ${r.value}`)
        .join("\n");
      return header + rows;
    }
    throw err;
  }
}