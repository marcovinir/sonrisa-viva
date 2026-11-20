"""Vercel instala desde pyproject.toml; CI y el desarrollo local, desde requirements.txt."""

import tomllib
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[3]


def test_pyproject_y_requirements_declaran_lo_mismo():
    pyproject = tomllib.loads((BACKEND / "pyproject.toml").read_text(encoding="utf-8"))
    requirements = [
        linea.strip()
        for linea in (BACKEND / "requirements.txt").read_text(encoding="utf-8").splitlines()
        if linea.strip() and not linea.startswith("#")
    ]
    assert sorted(pyproject["project"]["dependencies"]) == sorted(requirements)
