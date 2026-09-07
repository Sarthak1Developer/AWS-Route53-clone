import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    username: str

@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest):
    # Mocked auth: Accept any username/password and return a token
    if not req.username or not req.password:
        raise HTTPException(status_code=400, detail="Username and password required")
    
    # In a real app we'd verify password, here we just return a mocked token
    token = f"mock-jwt-token-{uuid.uuid4()}"
    return LoginResponse(token=token, username=req.username)

@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}
