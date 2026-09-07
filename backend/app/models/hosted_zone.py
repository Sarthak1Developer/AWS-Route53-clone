from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
import datetime
from app.database.database import Base

class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id = Column(String, primary_key=True, index=True)
    domain_name = Column(String, index=True)
    type = Column(String, default="Public")
    comment = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    records = relationship("DNSRecord", back_populates="zone", cascade="all, delete-orphan")
