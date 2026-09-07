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

export async function login(username: string, password: string):Promise<{token: string, username: string}> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Failed to login");
  return res.json();
}

export async function updateHostedZone(id: string, zone: HostedZoneCreate): Promise<HostedZone> {
  const res = await fetch(`${API_BASE_URL}/hosted-zones/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(zone),
  });
  if (!res.ok) throw new Error("Failed to update hosted zone");
  return res.json();
}

// Hosted Zones
export async function getHostedZones(): Promise<HostedZone[]> {
  const res = await fetch(`${API_BASE_URL}/hosted-zones/`);
  if (!res.ok) throw new Error('Failed to fetch hosted zones');
  return res.json();
}

export async function createHostedZone(zone: HostedZoneCreate): Promise<HostedZone> {
  const res = await fetch(`${API_BASE_URL}/hosted-zones/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(zone),
  });
  if (!res.ok) throw new Error('Failed to create hosted zone');
  return res.json();
}

export async function getHostedZone(id: string): Promise<HostedZone> {
  const res = await fetch(`${API_BASE_URL}/hosted-zones/${id}`);
  if (!res.ok) throw new Error('Failed to fetch hosted zone');
  return res.json();
}

export async function deleteHostedZone(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/hosted-zones/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete hosted zone');
}

// DNS Records
export async function getDNSRecords(zoneId: string): Promise<DNSRecord[]> {
  const res = await fetch(`${API_BASE_URL}/hosted-zones/${zoneId}/records`);
  if (!res.ok) throw new Error('Failed to fetch DNS records');
  return res.json();
}

export async function createDNSRecord(zoneId: string, record: DNSRecordCreate): Promise<DNSRecord> {
  const res = await fetch(`${API_BASE_URL}/hosted-zones/${zoneId}/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error('Failed to create DNS record');
  return res.json();
}

export async function updateDNSRecord(zoneId: string, recordId: string, record: DNSRecordCreate): Promise<DNSRecord> {
  const res = await fetch(`${API_BASE_URL}/hosted-zones/${zoneId}/records/${recordId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error('Failed to update DNS record');
  return res.json();
}

export async function deleteDNSRecord(zoneId: string, recordId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/hosted-zones/${zoneId}/records/${recordId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete DNS record');
}