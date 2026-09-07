import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.hosted_zone import HostedZone
from app.models.dns_record import DNSRecord
from app.schemas.hosted_zone import (
    HostedZone as HostedZoneSchema,
    HostedZoneCreate,
    BulkDeleteZonesRequest,
    BindImportRequest,
)
from app.schemas.dns_record import DNSRecord as DNSRecordSchema
from app.services.bind_parser import parse_bind_zone, generate_bind_zone

router = APIRouter()

@router.get("", response_model=List[HostedZoneSchema])
@router.get("/", response_model=List[HostedZoneSchema])
def list_hosted_zones(db: Session = Depends(get_db)):
    zones = db.query(HostedZone).all()
    return zones

@router.post("/bulk-delete")
def bulk_delete_hosted_zones(req: BulkDeleteZonesRequest, db: Session = Depends(get_db)):
    deleted_count = 0
    for zid in req.zone_ids:
        zone = db.query(HostedZone).filter(HostedZone.id == zid).first()
        if zone:
            db.delete(zone)
            deleted_count += 1
    db.commit()
    return {"ok": True, "deleted_count": deleted_count}

@router.post("", response_model=HostedZoneSchema)
@router.post("/", response_model=HostedZoneSchema)
def create_hosted_zone(zone_in: HostedZoneCreate, db: Session = Depends(get_db)):
    zone_id = str(uuid.uuid4())
    db_zone = HostedZone(
        id=zone_id,
        domain_name=zone_in.domain_name,
        type=zone_in.type,
        comment=zone_in.comment
    )
    db.add(db_zone)

    # Automatically create default NS and SOA records for the new zone
    clean_domain = zone_in.domain_name.rstrip(".")
    ns_record = DNSRecord(
        id=str(uuid.uuid4()),
        zone_id=zone_id,
        record_name=f"{clean_domain}.",
        record_type="NS",
        value=f"ns-1.awsdns-01.org.\nns-2.awsdns-01.co.uk.\nns-3.awsdns-01.com.\nns-4.awsdns-01.net.",
        ttl=172800,
        routing_policy="Simple"
    )
    soa_record = DNSRecord(
        id=str(uuid.uuid4()),
        zone_id=zone_id,
        record_name=f"{clean_domain}.",
        record_type="SOA",
        value=f"ns-1.awsdns-01.org. hostmaster.{clean_domain}. 1 7200 3600 1209600 86400",
        ttl=900,
        routing_policy="Simple"
    )
    db.add(ns_record)
    db.add(soa_record)

    db.commit()
    db.refresh(db_zone)
    return db_zone

@router.get("/{zone_id}", response_model=HostedZoneSchema)
def get_hosted_zone(zone_id: str, db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    return zone

@router.put("/{zone_id}", response_model=HostedZoneSchema)
def update_hosted_zone(zone_id: str, zone_in: HostedZoneCreate, db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    
    zone.domain_name = zone_in.domain_name
    zone.type = zone_in.type
    zone.comment = zone_in.comment
    
    db.commit()
    db.refresh(zone)
    return zone

@router.delete("/{zone_id}")
def delete_hosted_zone(zone_id: str, db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    db.delete(zone)
    db.commit()
    return {"ok": True}

@router.post("/{zone_id}/import-bind", response_model=List[DNSRecordSchema])
def import_bind_zone(zone_id: str, req: BindImportRequest, db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    parsed_records = parse_bind_zone(req.zone_content, zone.domain_name)
    created_records = []
    for pr in parsed_records:
        rec_id = str(uuid.uuid4())
        db_rec = DNSRecord(
            id=rec_id,
            zone_id=zone_id,
            record_name=pr["record_name"],
            record_type=pr["record_type"],
            value=pr["value"],
            ttl=pr["ttl"],
            routing_policy=pr.get("routing_policy", "Simple")
        )
        db.add(db_rec)
        created_records.append(db_rec)

    db.commit()
    for rec in created_records:
        db.refresh(rec)
    return created_records

@router.get("/{zone_id}/export")
def export_hosted_zone(zone_id: str, format: str = Query("bind", pattern="^(bind|json)$"), db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    records = db.query(DNSRecord).filter(DNSRecord.zone_id == zone_id).all()

    if format == "json":
        data = {
            "id": zone.id,
            "domain_name": zone.domain_name,
            "type": zone.type,
            "comment": zone.comment,
            "created_at": zone.created_at.isoformat() if zone.created_at else None,
            "records": [
                {
                    "id": r.id,
                    "record_name": r.record_name,
                    "record_type": r.record_type,
                    "value": r.value,
                    "ttl": r.ttl,
                    "routing_policy": r.routing_policy
                }
                for r in records
            ]
        }
        return data

    bind_content = generate_bind_zone(zone.domain_name, zone.comment or "", records)
    return Response(
        content=bind_content,
        media_type="text/plain",
        headers={
            "Content-Disposition": f'attachment; filename="{zone.domain_name}.zone"'
        }
    )
