from app.models.user import RoleEnum
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from app.core.security import verify_password, create_access_token, decode_token, oauth2_scheme
from app.core.database import get_db
from app.models.user import User, Role
from app.schemas.auth import Token, LoginRequest

class AuthService:
    @staticmethod
    def authenticate(db: Session, login_data: LoginRequest) -> Token:
        user = db.query(User).filter(User.username == login_data.username).first()
        if not user or not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Tài khoản hoặc mật khẩu không chính xác",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tài khoản đã bị vô hiệu hóa",
            )
        
        role_name = user.role.name if user.role else "receptionist"
        access_token = create_access_token(
            subject=str(user.id),
            role=role_name
        )

        return Token(
            access_token=access_token,
            token_type="bearer",
            role=role_name,
            user_id=user.id,
            username=user.username,
            full_name=user.full_name
        )

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Yêu cầu xác thực tài khoản",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(token)
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không chứa thông tin người dùng",
        )
    user = db.query(User).filter(User.id == int(user_id_str)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Người dùng không tồn tại hoặc đã bị khóa",
        )
    return user

def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not token:
        return None
    try:
        payload = decode_token(token)
        user_id_str = payload.get("sub")
        if not user_id_str:
            return None
        user = db.query(User).filter(User.id == int(user_id_str)).first()
        if user and user.is_active:
            return user
    except Exception:
        pass
    return None

def require_roles(allowed_roles: list):
    def role_checker(current_user: User = Depends(get_current_user)):
        # Kiểm tra phòng hờ user không có role
        if not current_user.role:
            raise HTTPException(status_code=403, detail="Tài khoản chưa được cấp quyền.")

        # Lấy tên của role từ Object
        user_role = getattr(current_user.role, 'name', str(current_user.role)).lower()
        
        # Admin bypass
        if user_role == RoleEnum.ADMIN.value:
            return current_user
            
        # Danh sách quyền cho phép
        allowed_roles_str = [str(getattr(r, 'value', r)).lower() for r in allowed_roles]
        
        # Kiểm tra phân quyền
        if user_role not in allowed_roles_str:
            raise HTTPException(
                status_code=403,
                detail=f"Từ chối truy cập! (Role tài khoản: '{user_role}' - Cần: {allowed_roles_str})"
            )
        return current_user
    return role_checker
   
