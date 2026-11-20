"""Tokens del enlace de gestión de citas: en la base solo se guarda su hash."""

import hashlib
import secrets


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def generar_token() -> tuple[str, str]:
    """Devuelve (token en claro para el enlace, hash SHA-256 para guardar)."""
    token = secrets.token_urlsafe(32)
    return token, hash_token(token)
