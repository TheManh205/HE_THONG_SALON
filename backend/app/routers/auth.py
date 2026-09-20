from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import Token, LoginRequest
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService, get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
async def login(request: Request, db: Session = Depends(get_db)):
    """Authenticate user with username/password and return JWT token with user role.

    Accept both `application/x-www-form-urlencoded` (OAuth2 form) and
    `application/json` bodies with `username` and `password`.
    """
    content_type = request.headers.get("content-type", "")
    if content_type.startswith("application/json"):
        body = await request.json()
        login_data = LoginRequest(**body)
    else:
        form = await request.form()
        # `form` is an immutable MultiDict-like — extract username/password
        username = form.get("username") or form.get("user")
        password = form.get("password")
        if not username or not password:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="username and password are required")
        login_data = LoginRequest(username=username, password=password)

    return AuthService.authenticate(db, login_data)
@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get profile of current logged-in user."""
    return current_user
