from fastapi import APIRouter
from app.api.endpoints import hosted_zones, dns_records, auth

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(hosted_zones.router, prefix="/hosted-zones", tags=["hosted-zones"])
api_router.include_router(dns_records.router, prefix="/hosted-zones", tags=["dns-records"])
