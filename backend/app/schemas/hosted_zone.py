from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from .dns_record import DNSRecord

class HostedZoneBase(BaseModel):
    domain_name: str
    type: str = "Public"
    comment: Optional[str] = None

class HostedZoneCreate(HostedZoneBase):
    pass

class HostedZone(HostedZoneBase):
    id: str
    created_at: datetime
    records: List[DNSRecord] = []

    class Config:
        from_attributes = True

class BulkDeleteZonesRequest(BaseModel):
    zone_ids: List[str]

class BindImportRequest(BaseModel):
    zone_content: str
