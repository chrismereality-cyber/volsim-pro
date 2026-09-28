import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from webauthn import verify_registration_response

from database import get_db
from src.auth.authentication import AuthenticationService
from src.auth.dependencies import get_authorization_context
from src.auth.models import AuthorizationContext
from src.auth.repository import AuthRepository
from src.auth.tokens import create_access_token
from auth_models import WebAuthnCredential
from src.auth.webauthn import (
    WEBAUTHN_ORIGIN,
    WEBAUTHN_RP_ID,
    WebAuthnService,
)


router = APIRouter()


# ---------------------------------------------------------------------------
# Request / Response Contracts
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: int
    email: str
    is_active: bool
    is_verified: bool
    roles: list[str]


class WebAuthnAuthenticationOptionsRequest(BaseModel):
    email: EmailStr


class WebAuthnRegistrationVerificationRequest(BaseModel):
    credential: dict


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: UserResponse


class IdentityResponse(BaseModel):
    user_id: str
    username: str | None
    roles: list[str]
    permissions: list[str]
    is_active: bool


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
):
    try:
        user = AuthenticationService.register(
            db,
            email=payload.email,
            password=payload.password,
            role_name="user",
        )

        roles = AuthRepository.get_user_roles(
            db,
            user.id,
        )

        return UserResponse(
            id=user.id,
            email=user.email,
            is_active=user.is_active,
            is_verified=user.is_verified,
            roles=roles,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    import time
    _login_start = time.perf_counter()
    _login_db = time.perf_counter()
    _before_auth = time.perf_counter()
    result = AuthenticationService.authenticate(
        db,
        email=payload.email,
        password=payload.password,
    )
    print(f"LOGIN TIMING: DB acquired -> authenticate start = {_before_auth - _login_db:.3f}s")
    print(f"LOGIN TIMING: authenticate = {time.perf_counter() - _before_auth:.3f}s")

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    user, identity = result

    _before_session = time.perf_counter()
    refresh_token, _session = AuthenticationService.create_session(
        db,
        user_id=user.id,
    )
    print(f"LOGIN TIMING: create_session = {time.perf_counter() - _before_session:.3f}s")

    _before_token = time.perf_counter()
    access_token = create_access_token(
        user_id=str(user.id),
        username=user.email,
        roles=sorted(identity.roles),
    )
    print(f"LOGIN TIMING: create_access_token = {time.perf_counter() - _before_token:.3f}s")
    print(f"LOGIN TIMING: TOTAL = {time.perf_counter() - _login_start:.3f}s")

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            is_active=user.is_active,
            is_verified=user.is_verified,
            roles=sorted(identity.roles),
        ),
    )


# ---------------------------------------------------------------------------
# Refresh Access + Refresh Tokens
# ---------------------------------------------------------------------------

@router.post(
    "/refresh",
    response_model=TokenResponse,
)
def refresh(
    payload: RefreshRequest,
    db: Session = Depends(get_db),
):
    try:
        (
            user,
            identity,
            refresh_token,
            _session,
        ) = AuthenticationService.refresh_session(
            db,
            refresh_token=payload.refresh_token,
        )

        access_token = create_access_token(
            user_id=str(user.id),
            username=user.email,
            roles=sorted(identity.roles),
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user=UserResponse(
                id=user.id,
                email=user.email,
                is_active=user.is_active,
                is_verified=user.is_verified,
                roles=sorted(identity.roles),
            ),
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc


# ---------------------------------------------------------------------------
# Current Authenticated Identity
# ---------------------------------------------------------------------------

@router.get(
    "/me",
    response_model=IdentityResponse,
)
def me(
    context: AuthorizationContext = Depends(
        get_authorization_context
    ),
):
    identity = context.identity

    return IdentityResponse(
        user_id=identity.user_id,
        username=identity.username,
        roles=sorted(identity.roles),
        permissions=sorted(identity.permissions),
        is_active=identity.is_active,
    )

# ---------------------------------------------------------------------------
# WebAuthn Registration Options
# ---------------------------------------------------------------------------

@router.post(
    "/webauthn/register/options",
)
def webauthn_registration_options(
    context: AuthorizationContext = Depends(
        get_authorization_context
    ),
    db: Session = Depends(get_db),
):
    user = AuthRepository.get_user_by_id(
        db,
        user_id=int(context.identity.user_id),
    )

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user could not be resolved.",
        )

    try:
        options_json = WebAuthnService.create_registration_options(
            db,
            user=user,
        )
        db.commit()
        return json.loads(options_json)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create WebAuthn registration options.",
        )



@router.post(
    "/webauthn/register/verify",
)
def webauthn_registration_verify(
    payload: WebAuthnRegistrationVerificationRequest,
    context: AuthorizationContext = Depends(
        get_authorization_context
    ),
    db: Session = Depends(get_db),
):
    user = AuthRepository.get_user_by_id(
        db,
        user_id=int(context.identity.user_id),
    )

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user could not be resolved.",
        )

    credential = payload.credential
    response = credential.get("response")

    if not isinstance(response, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid WebAuthn credential response.",
        )

    client_data_json = response.get("clientDataJSON")

    if not isinstance(client_data_json, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WebAuthn clientDataJSON is missing.",
        )

    import base64

    try:
        padded_client_data = (
            client_data_json
            + "=" * (-len(client_data_json) % 4)
        )

        client_data = json.loads(
            base64.urlsafe_b64decode(
                padded_client_data
            ).decode("utf-8")
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid WebAuthn clientDataJSON.",
        ) from None

    challenge = client_data.get("challenge")

    if not isinstance(challenge, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WebAuthn challenge is missing.",
        )

    challenge_record = AuthRepository.get_webauthn_challenge(
        db,
        challenge=challenge,
        ceremony="registration",
    )

    if challenge_record is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WebAuthn challenge was not found.",
        )

    if challenge_record.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WebAuthn challenge does not belong to this user.",
        )

    if challenge_record.used_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WebAuthn challenge has already been used.",
        )

    if challenge_record.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WebAuthn challenge has expired.",
        )

    try:
        expected_challenge = base64.urlsafe_b64decode(
            challenge
            + "=" * (-len(challenge) % 4)
        )

        verified = verify_registration_response(
            credential=credential,
            expected_challenge=expected_challenge,
            expected_rp_id=WEBAUTHN_RP_ID,
            expected_origin=WEBAUTHN_ORIGIN,
            require_user_presence=True,
            require_user_verification=True,
        )

        credential_id = base64.urlsafe_b64encode(
            verified.credential_id
        ).rstrip(b"=").decode("ascii")

        credential_public_key = base64.b64encode(
            verified.credential_public_key
        ).decode("ascii")

        existing = db.query(WebAuthnCredential).filter(
            WebAuthnCredential.credential_id == credential_id
        ).first()

        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="WebAuthn credential is already registered.",
            )

        record = WebAuthnCredential(
            user_id=user.id,
            credential_id=credential_id,
            credential_public_key=credential_public_key,
            sign_count=verified.sign_count,
            aaguid=verified.aaguid,
            fmt=verified.fmt.value,
            credential_type=verified.credential_type.value,
            user_verified=verified.user_verified,
            credential_device_type=(
                verified.credential_device_type.value
            ),
            credential_backed_up=verified.credential_backed_up,
            attestation_object=base64.b64encode(
                verified.attestation_object
            ).decode("ascii"),
        )

        db.add(record)

        AuthRepository.consume_webauthn_challenge(
            db,
            challenge_record,
        )

        db.commit()
        db.refresh(record)

        return {
            "success": True,
            "credential_id": record.credential_id,
            "user_verified": record.user_verified,
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as exc:
        db.rollback()
        print(
            f"WEBAUTHN REGISTRATION VERIFY ERROR: {type(exc).__name__}: {exc}",
            flush=True,
        )
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WebAuthn registration verification failed.",
        ) from None


@router.post(
    "/webauthn/authenticate/verify",
    response_model=TokenResponse,
)
def webauthn_authentication_verify(
    payload: WebAuthnRegistrationVerificationRequest,
    db: Session = Depends(get_db),
):
    import base64

    credential = payload.credential
    response = credential.get("response")

    if not isinstance(response, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid WebAuthn credential response.",
        )

    raw_id = credential.get("rawId")
    credential_id = credential.get("id")

    if not isinstance(raw_id, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WebAuthn credential rawId is missing.",
        )

    if not isinstance(credential_id, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WebAuthn credential id is missing.",
        )

    stored_credential = AuthRepository.get_webauthn_credential(
        db,
        credential_id=credential_id,
    )

    if stored_credential is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or unregistered biometric credential.",
        )

    user = AuthRepository.get_user_by_id(
        db,
        user_id=stored_credential.user_id,
    )

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or inactive user.",
        )

    client_data_json = response.get("clientDataJSON")

    if not isinstance(client_data_json, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WebAuthn clientDataJSON is missing.",
        )

    try:
        padded_client_data = (
            client_data_json
            + "=" * (-len(client_data_json) % 4)
        )

        client_data = json.loads(
            base64.urlsafe_b64decode(
                padded_client_data
            ).decode("utf-8")
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid WebAuthn clientDataJSON.",
        ) from None

    challenge = client_data.get("challenge")

    if not isinstance(challenge, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WebAuthn challenge is missing.",
        )

    challenge_record = AuthRepository.get_webauthn_challenge(
        db,
        challenge=challenge,
        ceremony="authentication",
    )

    if challenge_record is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WebAuthn authentication challenge was not found.",
        )

    if challenge_record.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WebAuthn challenge does not belong to this user.",
        )

    if challenge_record.used_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WebAuthn challenge has already been used.",
        )

    if challenge_record.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WebAuthn challenge has expired.",
        )

    authenticator_data = response.get("authenticatorData")
    signature = response.get("signature")

    if not isinstance(authenticator_data, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WebAuthn authenticatorData is missing.",
        )

    if not isinstance(signature, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WebAuthn signature is missing.",
        )

    try:
        expected_challenge = base64.urlsafe_b64decode(
            challenge
            + "=" * (-len(challenge) % 4)
        )

        credential_public_key = base64.b64decode(
            stored_credential.credential_public_key
        )

        verified = verify_authentication_response(
            credential=credential,
            expected_challenge=expected_challenge,
            expected_rp_id=WEBAUTHN_RP_ID,
            expected_origin=WEBAUTHN_ORIGIN,
            credential_public_key=credential_public_key,
            credential_current_sign_count=stored_credential.sign_count,
            require_user_verification=True,
        )

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="WebAuthn authentication verification failed.",
        ) from None

    stored_credential.sign_count = verified.new_sign_count
    stored_credential.user_verified = verified.user_verified
    stored_credential.credential_device_type = (
        verified.credential_device_type.value
    )
    stored_credential.credential_backed_up = (
        verified.credential_backed_up
    )
    stored_credential.last_used_at = datetime.utcnow()

    AuthRepository.consume_webauthn_challenge(
        db,
        challenge_record,
    )

    try:
        refresh_token, _session = AuthenticationService.create_session(
            db,
            user_id=user.id,
        )

        roles = AuthRepository.get_user_roles(
            db,
            user_id=user.id,
        )

        access_token = create_access_token(
            user_id=str(user.id),
            username=user.email,
            roles=sorted(roles),
        )

        db.commit()

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create authenticated session.",
        ) from None

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            is_active=user.is_active,
            is_verified=user.is_verified,
            roles=sorted(roles),
        ),
    )


@router.post(
    "/webauthn/authenticate/options",
)
def webauthn_authentication_options(
    payload: WebAuthnAuthenticationOptionsRequest,
    db: Session = Depends(get_db),
):
    user = AuthRepository.get_user_by_email(
        db,
        email=str(payload.email).strip().lower(),
    )

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or biometric credentials.",
        )

    try:
        options_json = WebAuthnService.create_authentication_options(
            db,
            user=user,
        )

        db.commit()

        return json.loads(options_json)

    except ValueError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No WebAuthn credentials are registered for this user.",
        ) from None

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create WebAuthn authentication options.",
        ) from None



