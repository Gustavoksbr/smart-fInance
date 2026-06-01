"""SQLAlchemy database setup.

Important:
- Do NOT attempt to connect to the DB at import-time.
- In some PaaS environments (e.g. Render), IPv6 egress may be unavailable; Supabase
  Postgres hostnames can resolve to IPv6 first. We prefer an IPv4 address when
  connecting to Supabase by passing libpq/psycopg2's `hostaddr`.
"""

from __future__ import annotations

import os
import socket
from typing import Any

from sqlalchemy import create_engine
from sqlalchemy.engine.url import make_url
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings


def _resolve_preferred_ip(host: str, port: int, *, prefer_ipv4: bool = True) -> str | None:
    """Resolve host to an IP string.

    We intentionally query AF_UNSPEC then pick IPv4 first when requested.
    Some resolvers/environments return AAAA records first; choosing IPv4
    avoids failures when IPv6 egress is unavailable.
    """

    if prefer_ipv4:
        # Some environments effectively "prefer" AAAA or return only AAAA via
        # getaddrinfo() even when A records exist. gethostbyname() queries A.
        try:
            ipv4 = socket.gethostbyname(host)
            if ipv4 and ":" not in ipv4:
                return ipv4
        except OSError:
            pass

    try:
        infos = socket.getaddrinfo(host, port, family=socket.AF_UNSPEC, type=socket.SOCK_STREAM)
    except OSError:
        return None

    if not infos:
        return None

    if prefer_ipv4:
        for family, _socktype, _proto, _canonname, sockaddr in infos:
            if family == socket.AF_INET:
                return sockaddr[0]

    # Fallback: first result (often IPv6)
    return infos[0][4][0]


def _bool_env(name: str) -> bool:
    return os.getenv(name, "").strip().lower() in {"1", "true", "yes", "y", "on"}


def _build_connect_args(database_url: str) -> dict[str, Any]:
    connect_args: dict[str, Any] = {}

    if database_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
        return connect_args

    url = make_url(database_url)
    driver = (url.drivername or "").lower()

    if driver.startswith("postgres"):
        host = url.host
        port = int(url.port or 5432)
        query = dict(url.query or {})

        force_ipv4 = _bool_env("DB_FORCE_IPV4")
        hostaddr_override = os.getenv("DB_HOSTADDR", "").strip()
        is_supabase = bool(host) and host.endswith(".supabase.co")

        if host and (hostaddr_override or force_ipv4 or is_supabase):
            hostaddr = hostaddr_override
            if not hostaddr:
                hostaddr = _resolve_preferred_ip(host, port, prefer_ipv4=True)

            if hostaddr and ":" not in hostaddr:
                # psycopg2/libpq: use `hostaddr` for the socket connect, while
                # keeping `host` for TLS hostname validation.
                connect_args["hostaddr"] = hostaddr

        # Supabase requires SSL; only set if not already specified in URL.
        if is_supabase and "sslmode" not in query:
            connect_args["sslmode"] = "require"

        # Keep failures fast-ish (especially on cold start)
        connect_args.setdefault("connect_timeout", int(os.getenv("DB_CONNECT_TIMEOUT", "5")))

    return connect_args


def _log_db_startup(database_url: str, connect_args: dict[str, Any]) -> None:
    """Logs connection diagnostics without leaking secrets."""
    try:
        if database_url.startswith("sqlite"):
            print("DB: sqlite")
            return

        url = make_url(database_url)
        driver = (url.drivername or "").lower()
        if not driver.startswith("postgres"):
            print(f"DB: driver={url.drivername}")
            return

        host = url.host
        port = url.port or 5432
        is_supabase = bool(host) and host.endswith(".supabase.co")

        print(
            "DB: driver=postgres host={host} port={port} db={db} supabase={supabase} "
            "hostaddr={hostaddr} sslmode={sslmode}"
            .format(
                host=host,
                port=port,
                db=url.database,
                supabase=is_supabase,
                hostaddr=connect_args.get("hostaddr"),
                sslmode=connect_args.get("sslmode") or (url.query or {}).get("sslmode"),
            )
        )
    except Exception:
        # Nunca falhar o import/startup por causa de log
        return


_connect_args = _build_connect_args(settings.DATABASE_URL)
_log_db_startup(settings.DATABASE_URL, _connect_args)

# Cria engine baseado na DATABASE_URL do .env (sem conectar no import)
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=_connect_args,
    pool_pre_ping=True,
    pool_recycle=300,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency para obter sessão do banco de dados"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
