import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.hosted_zone import HostedZone
from app.schemas.hosted_zone import HostedZone as HostedZoneSchema, HostedZoneCreate

router = APIRouter()

@router.get("/", response_model=List[HostedZoneSchema])
def list_hosted_zones(db: Session = Depends(get_db)):
    zones = db.query(HostedZone).all()
    return zones

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
