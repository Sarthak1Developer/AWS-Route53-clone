import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.dns_record import DNSRecord
from app.models.hosted_zone import HostedZone
from app.schemas.dns_record import DNSRecord as DNSRecordSchema, DNSRecordCreate

router = APIRouter()

@router.get("/{zone_id}/records", response_model=List[DNSRecordSchema])
def list_dns_records(zone_id: str, db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    records = db.query(DNSRecord).filter(DNSRecord.zone_id == zone_id).all()
    return records

@router.post("/{zone_id}/records", response_model=DNSRecordSchema)
def create_dns_record(zone_id: str, record_in: DNSRecordCreate, db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    
    record_id = str(uuid.uuid4())
    db_record = DNSRecord(
        id=record_id,
        zone_id=zone_id,
        record_name=record_in.record_name,
        record_type=record_in.record_type,
        value=record_in.value,
        ttl=record_in.ttl,
        routing_policy=record_in.routing_policy
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

@router.put("/{zone_id}/records/{record_id}", response_model=DNSRecordSchema)
def update_dns_record(zone_id: str, record_id: str, record_in: DNSRecordCreate, db: Session = Depends(get_db)):
    db_record = db.query(DNSRecord).filter(DNSRecord.id == record_id, DNSRecord.zone_id == zone_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="DNS Record not found")
    
    db_record.record_name = record_in.record_name
    db_record.record_type = record_in.record_type
    db_record.value = record_in.value
    db_record.ttl = record_in.ttl
    db_record.routing_policy = record_in.routing_policy
    
    db.commit()
    db.refresh(db_record)
    return db_record

@router.delete("/{zone_id}/records/{record_id}")
def delete_dns_record(zone_id: str, record_id: str, db: Session = Depends(get_db)):
    db_record = db.query(DNSRecord).filter(DNSRecord.id == record_id, DNSRecord.zone_id == zone_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="DNS Record not found")
    db.delete(db_record)
    db.commit()
    return {"ok": True}
