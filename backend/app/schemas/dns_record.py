from pydantic import BaseModel

class DNSRecordBase(BaseModel):
    record_name: str
    record_type: str
    value: str
    ttl: int = 300
    routing_policy: str = "Simple"

class DNSRecordCreate(DNSRecordBase):
    pass

class DNSRecord(DNSRecordBase):
    id: str
    zone_id: str

    class Config:
        from_attributes = True
