"""
Authentication API Router

Endpoints:
- POST /api/auth/register — Register new user in PostgreSQL database
- POST /api/auth/login    — Verify credentials & issue JWT token
- GET  /api/auth/me       — Retrieve current authenticated user profile
- POST /api/auth/logout   — Logout current user
"""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.dependencies import CurrentUserDep, DatabaseDep
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.schemas.auth import AuthTokenResponse, UserLoginRequest, UserProfile, UserRegisterRequest

router = APIRouter()


@router.post(
    "/register",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register_user(
    req: UserRegisterRequest,
    db: DatabaseDep,
) -> AuthTokenResponse:
    """Validate user registration inputs, store credentials in PostgreSQL, and return access token."""
    cleaned_email = req.email.strip().lower()
    username = req.email.split("@")[0].strip().lower()

    # Check for duplicate email
    res = await db.execute(select(User).where(User.email == cleaned_email))
    existing_user = res.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # Ensure unique username
    res_username = await db.execute(select(User).where(User.username == username))
    if res_username.scalar_one_or_none():
        import uuid
        username = f"{username}_{uuid.uuid4().hex[:6]}"

    # Hash password securely
    hashed_pwd = get_password_hash(req.password)

    # Save to PostgreSQL
    new_user = User(
        email=cleaned_email,
        username=username,
        full_name=req.name.strip(),
        hashed_password=hashed_pwd,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Generate JWT token
    access_token = create_access_token(data={"sub": new_user.id, "email": new_user.email})

    user_profile = UserProfile(
        uid=new_user.id,
        email=new_user.email,
        displayName=new_user.full_name or new_user.username,
        photoURL=None,
    )

    return AuthTokenResponse(
        success=True,
        access_token=access_token,
        token_type="bearer",
        user=user_profile,
    )


@router.post(
    "/login",
    response_model=AuthTokenResponse,
    summary="Login user and issue JWT token",
)
async def login_user(
    req: UserLoginRequest,
    db: DatabaseDep,
) -> AuthTokenResponse:
    """Verify credentials and issue JWT access token."""
    cleaned_email = req.email.strip().lower()

    res = await db.execute(select(User).where(User.email == cleaned_email))
    user = res.scalar_one_or_none()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated.",
        )

    access_token = create_access_token(data={"sub": user.id, "email": user.email})

    user_profile = UserProfile(
        uid=user.id,
        email=user.email,
        displayName=user.full_name or user.username,
        photoURL=None,
    )

    return AuthTokenResponse(
        success=True,
        access_token=access_token,
        token_type="bearer",
        user=user_profile,
    )


@router.get(
    "/me",
    response_model=UserProfile,
    summary="Get current user profile",
)
async def get_current_user_profile(
    current_user: CurrentUserDep,
) -> UserProfile:
    """Return profile information for the authenticated user."""
    return UserProfile(
        uid=current_user.id,
        email=current_user.email,
        displayName=current_user.full_name or current_user.username,
        photoURL=None,
    )


@router.post(
    "/logout",
    response_model=dict,
    summary="Logout user session",
)
async def logout_user() -> dict:
    """Logout current user session."""
    return {"success": True, "message": "Successfully logged out."}
