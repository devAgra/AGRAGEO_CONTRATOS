"""
HidroScanner — ETL Collector: ANA CNARH
Coleta outorgas de poços tubulares do CNARH via ArcGIS Feature Service.
API: portal1.snirh.gov.br/arcgis/rest/services/SFI/cnarh_dados_abertos
"""

import requests
import pandas as pd
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# ── Endpoints Reais ANA/SNIRH (verificados 2026-03) ─────────
# CNARH — Outorgas subterrâneas estaduais (ArcGIS FeatureServer)
CNARH_SUBTERRANEAS_ESTADUAIS = (
    "https://portal1.snirh.gov.br/arcgis/rest/services/SFI/"
    "cnarh_dados_abertos_v31082022/FeatureServer/5"
)

# CNARH — Usuários em domínio da União (ArcGIS FeatureServer)
CNARH_FEDERAIS = (
    "https://portal1.snirh.gov.br/arcgis/rest/services/SFI/"
    "cnarh_dados_abertos_v31082022/FeatureServer/4"
)

# Outorgas superficiais estaduais
OUTORGAS_SUPERFICIAIS = (
    "https://www.snirh.gov.br/arcgis/rest/services/DADOSABERTOS/"
    "outorgas_estaduais_superficial/FeatureServer"
)


def _query_arcgis_feature_service(url, where_clause="1=1", out_fields="*",
                                   result_offset=0, result_record_count=2000,
                                   out_sr=4326):
    """
    Query ArcGIS REST FeatureServer.

    Args:
        url: Base FeatureServer URL (layer endpoint)
        where_clause: SQL-like filter (ex: "UF='MT'")
        out_fields: Campos a retornar
        result_offset: Paginação offset
        result_record_count: Max registros por request
        out_sr: CRS de output (4326 = WGS84)

    Returns:
        list de features (dict) ou []
    """
    query_url = f"{url}/query"
    params = {
        "where": where_clause,
        "outFields": out_fields,
        "returnGeometry": "true",
        "outSR": out_sr,
        "f": "json",
        "resultOffset": result_offset,
        "resultRecordCount": result_record_count,
    }

    try:
        response = requests.get(query_url, params=params, timeout=120)
        response.raise_for_status()
        data = response.json()

        if "error" in data:
            logger.error(f"[ANA] ArcGIS error: {data['error']}")
            return []

        features = data.get("features", [])
        logger.info(f"[ANA] 📡 Recebidas {len(features)} features (offset={result_offset})")
        return features

    except requests.exceptions.Timeout:
        logger.warning("[ANA] ⏱️ Timeout ao acessar ArcGIS FeatureServer")
        return []
    except Exception as e:
        logger.error(f"[ANA] ❌ Falha na query: {e}")
        return []


def coletar_outorgas_subterraneas(uf="MT", max_registros=5000):
    """
    Coleta outorgas subterrâneas estaduais do CNARH via ArcGIS REST.

    Args:
        uf: Sigla do estado (default: MT)
        max_registros: Limite total de registros

    Returns:
        DataFrame com outorgas coletadas
    """
    logger.info(f"[ANA] Iniciando coleta CNARH — outorgas subterrâneas UF={uf}")

    where = f"UF='{uf}'" if uf else "1=1"
    all_features = []
    offset = 0
    batch_size = 2000

    while len(all_features) < max_registros:
        features = _query_arcgis_feature_service(
            CNARH_SUBTERRANEAS_ESTADUAIS,
            where_clause=where,
            result_offset=offset,
            result_record_count=batch_size,
        )

        if not features:
            break

        all_features.extend(features)
        offset += len(features)

        if len(features) < batch_size:
            break  # Last page

    if not all_features:
        logger.warning("[ANA] Nenhuma outorga subterrânea retornada")
        return pd.DataFrame()

    # Convert ArcGIS features to DataFrame
    rows = []
    for f in all_features:
        attrs = f.get("attributes", {})
        geom = f.get("geometry", {})
        if geom:
            attrs["longitude"] = geom.get("x")
            attrs["latitude"] = geom.get("y")
        rows.append(attrs)

    df = pd.DataFrame(rows)
    logger.info(f"[ANA] ✅ Total coletado: {len(df)} outorgas subterrâneas")

    return _normalizar_dados(df)


def coletar_outorgas_federais(uf="MT", max_registros=2000):
    """
    Coleta outorgas de domínio federal do CNARH.

    Args:
        uf: Sigla do estado
        max_registros: Limite total

    Returns:
        DataFrame com outorgas federais
    """
    logger.info(f"[ANA] Iniciando coleta CNARH — outorgas federais UF={uf}")

    where = f"UF='{uf}'" if uf else "1=1"
    features = _query_arcgis_feature_service(
        CNARH_FEDERAIS,
        where_clause=where,
        result_record_count=max_registros,
    )

    if not features:
        logger.warning("[ANA] Nenhuma outorga federal retornada")
        return pd.DataFrame()

    rows = []
    for f in features:
        attrs = f.get("attributes", {})
        geom = f.get("geometry", {})
        if geom:
            attrs["longitude"] = geom.get("x")
            attrs["latitude"] = geom.get("y")
        rows.append(attrs)

    df = pd.DataFrame(rows)
    logger.info(f"[ANA] ✅ Total coletado: {len(df)} outorgas federais")

    return _normalizar_dados(df)


def _normalizar_dados(df):
    """Normaliza colunas do DataFrame para o schema do banco."""
    column_map = {
        "NumeroOutorga": "numero_outorga",
        "NOM_OUTORGA": "numero_outorga",
        "NomeProprietario": "nome_proprietario",
        "NOM_REQUERENTE": "nome_proprietario",
        "CPFCNPJ": "cpf_cnpj",
        "CPF_CNPJ": "cpf_cnpj",
        "Municipio": "municipio",
        "NOM_MUNICIPIO": "municipio",
        "CodIBGE": "cod_ibge_municipio",
        "Latitude": "latitude",
        "LAT": "latitude",
        "Longitude": "longitude",
        "LONG": "longitude",
        "VazaoM3H": "vazao_m3h",
        "VAZ_MAX_OUTORGA": "vazao_m3h",
        "Profundidade": "profundidade_m",
        "UsoPrincipal": "uso_principal",
        "TIP_FINALIDADE": "uso_principal",
        "DataOutorga": "data_outorga",
        "DAT_PUBLICACAO": "data_outorga",
        "DataVencimento": "data_vencimento",
        "DAT_VENCIMENTO": "data_vencimento",
        "Situacao": "situacao",
        "SIT_OUTORGA": "situacao",
        "UF": "uf",
    }

    rename = {k: v for k, v in column_map.items() if k in df.columns}
    df = df.rename(columns=rename)

    df["fonte_dado"] = "ANA/CNARH"
    df["atualizado_em"] = datetime.utcnow().isoformat()

    return df


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    print("─── Outorgas Subterrâneas Estaduais (MT) ───")
    df = coletar_outorgas_subterraneas("MT", max_registros=10)
    print(f"Total registros: {len(df)}")
    if not df.empty:
        print(df.columns.tolist())
        print(df.head())

    print("\n─── Outorgas Federais (MT) ───")
    df2 = coletar_outorgas_federais("MT", max_registros=10)
    print(f"Total registros: {len(df2)}")
    if not df2.empty:
        print(df2.columns.tolist())
        print(df2.head())
