from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


def _get_fernet():
    key = settings.NFC_ENCRYPTION_KEY
    if not key:
        raise ImproperlyConfigured('NFC_ENCRYPTION_KEY is not set.')
    return Fernet(key.encode() if isinstance(key, str) else key)


def encrypt_registration_number(registration_number):
    return _get_fernet().encrypt(registration_number.encode()).decode()


def decrypt_nfc_token(token):
    """Raises InvalidToken if the token is malformed, tampered with, or was
    encrypted under a different key (e.g. a legacy pre-encryption uid)."""
    return _get_fernet().decrypt(token.encode()).decode()
