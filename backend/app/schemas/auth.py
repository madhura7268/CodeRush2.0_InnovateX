"""
Authentication Pydantic Schemas
"""

from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    """Registration request payload."""

    name: str = Field(..., min_length=2, max_length=100, description="User's full name")
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=6, max_length=100, description="Password (at least 6 characters)")


class UserLoginRequest(BaseModel):
    """Login request payload."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="Password")


class UserProfile(BaseModel):
    """User profile information returned in API responses."""

    uid: str
    email: str
    displayName: str
    photoURL: str | None = None


class AuthTokenResponse(BaseModel):
    """Response returned upon successful authentication."""

    success: bool = True
    access_token: str
    token_type: str = "bearer"
    user: UserProfile
