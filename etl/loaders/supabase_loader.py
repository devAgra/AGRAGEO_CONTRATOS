"""
HidroScanner — ETL Loader: Supabase
Upsert processado no Supabase/PostgreSQL.
"""

import os
import logging

logger = logging.getLogger(__name__)


def get_supabase_client():
    """Retorna cliente Supabase configurado."""
    try:
        from supabase import create_client

        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

        if not url or not key:
            logger.error("SUPABASE_URL e SUPABASE_KEY não configurados")
            return None

        return create_client(url, key)

    except ImportError:
        logger.error("supabase-py não instalado. Execute: pip install supabase")
        return None


def upsert_pocos(df, batch_size=500):
    """Upsert dados de poços no Supabase."""
    client = get_supabase_client()
    if client is None or df.empty:
        return 0

    table = "pocos_outorgados"
    records = df.to_dict(orient="records")
    total = 0

    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        try:
            result = client.table(table).upsert(
                batch,
                on_conflict="numero_outorga"
            ).execute()
            total += len(batch)
            logger.info(f"[Loader] Upsert {table}: {total}/{len(records)}")
        except Exception as e:
            logger.error(f"[Loader] Erro no upsert {table}: {e}")

    return total


def upsert_aquiferos(df, batch_size=100):
    """Upsert dados de aquíferos."""
    client = get_supabase_client()
    if client is None or df.empty:
        return 0

    table = "aquiferos"
    records = df.to_dict(orient="records")

    # Remove geometry column (handled separately via PostGIS)
    for r in records:
        r.pop("geometry", None)

    try:
        result = client.table(table).upsert(records, on_conflict="nome").execute()
        logger.info(f"[Loader] Upsert {table}: {len(records)} registros")
        return len(records)
    except Exception as e:
        logger.error(f"[Loader] Erro no upsert {table}: {e}")
        return 0


def upsert_uso_solo(df, batch_size=500):
    """Upsert dados de uso do solo."""
    client = get_supabase_client()
    if client is None or df.empty:
        return 0

    table = "uso_solo_municipio"
    records = df.to_dict(orient="records")

    try:
        result = client.table(table).upsert(
            records,
            on_conflict="cod_ibge_municipio,ano_referencia"
        ).execute()
        logger.info(f"[Loader] Upsert {table}: {len(records)} registros")
        return len(records)
    except Exception as e:
        logger.error(f"[Loader] Erro no upsert {table}: {e}")
        return 0


def upsert_clima(df, batch_size=500):
    """Upsert dados climáticos."""
    client = get_supabase_client()
    if client is None or df.empty:
        return 0

    table = "dados_climaticos"
    records = df.to_dict(orient="records")
    total = 0

    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        try:
            result = client.table(table).upsert(
                batch,
                on_conflict="cod_ibge_municipio,ano,mes"
            ).execute()
            total += len(batch)
        except Exception as e:
            logger.error(f"[Loader] Erro no upsert {table}: {e}")

    logger.info(f"[Loader] Upsert {table}: {total}/{len(records)}")
    return total


def upsert_leads(df):
    """Upsert leads gerados."""
    client = get_supabase_client()
    if client is None or df.empty:
        return 0

    table = "leads_gerados"
    records = df.to_dict(orient="records")

    try:
        result = client.table(table).upsert(
            records,
            on_conflict="cod_ibge_municipio"
        ).execute()
        logger.info(f"[Loader] Upsert {table}: {len(records)} registros")
        return len(records)
    except Exception as e:
        logger.error(f"[Loader] Erro no upsert {table}: {e}")
        return 0
