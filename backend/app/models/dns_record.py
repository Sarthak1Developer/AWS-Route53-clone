from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base

class DNSRecord(Base):
    __tablename__ = "dns_records"

    id = Column(String, primary_key=True, index=True)
    zone_id = Column(String, ForeignKey("hosted_zones.id"))
    record_name = Column(String, index=True)
    record_type = Column(String)
    value = Column(String)
    ttl = Column(Integer, default=300)
    routing_policy = Column(String, default="Simple")

    zone = relationship("HostedZone", back_populates="records")
