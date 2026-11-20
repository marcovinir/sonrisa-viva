"""Desarrollo local: lee backend/.env."""

from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

from .base import *  # noqa: E402,F403

DEBUG = True
SECRET_KEY = SECRET_KEY or "solo-para-desarrollo-local"  # noqa: F405
ALLOWED_HOSTS = ["localhost", "127.0.0.1"]
