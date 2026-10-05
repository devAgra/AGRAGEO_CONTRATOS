"""
HidroScanner — ETL Collector: SEMA-MT
Coleta dados ambientais e de restrição da SEMA-MT via WFS.
GeoServer: geo.sema.mt.gov.br/geoserver/Geoportal/ows

NOTA: A SEMA-MT NÃO expõe dados de outorga/poços via WFS público.
Os dados de outorga ficam no SIGA Hídrico (acesso restrito).
Mas o WFS tem camadas valiosas de restrição ambiental.
"""

import requests
import pandas as pd
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# ── Endpoints Reais SEMA-MT (verificados 2026-03) ──────────
SEMA_WFS_BASE = "http://geo.sema.mt.gov.br/geoserver/Geoportal/ows"

# Camadas disponíveis no WFS da SEMA-MT
CAMADAS = {
    "areas_embargadas": "Geoportal:AREAS_EMBARGADAS_SEMA",
    "uso_restrito": "Geoportal:AREAS_USO_RESTRITO",
    "autex_pmfs": "Geoportal:AUTEX_PMFS_SEMA",
    "aqc": "Geoportal:AQC",
}


def _fetch_wfs_sema(layer_name, max_features=500, output_format="application/json"):
    """
    Fetches features from SEMA-MT GeoServer WFS.

    Args:
        layer_name: Nome da camada WFS
        max_features: Limite de features
        output_format: Formato de saída

    Returns:
        list de features (GeoJSON) ou None
    """
    params = {
        "service": "WFS",
        "version": "1.1.0",
        "request": "GetFeature",
        "typeName": layer_name,
        "outputFormat": output_format,
        "maxFeatures": max_features,
    }

    try:
        response = requests.get(SEMA_WFS_BASE, params=params, timeout=120)
        response.raise_for_status()
        data = response.json()
        features = data.get("features", [])
        logger.info(f"[SEMA-MT] ✅ {len(features)} features de {layer_name}")
        return features

    except requests.exceptions.Timeout:
        logger.warning(f"[SEMA-MT] ⏱️ Timeout ao acessar {layer_name} (servidor instável)")
        return None
    except Exception as e:
        logger.error(f"[SEMA-MT] ❌ Falha ao acessar {layer_name}: {e}")
        return None


def coletar_areas_embargadas():
    """
    Coleta áreas embargadas pela SEMA-MT.
    Dados importantes para cruzamento com outorgas.

    Returns:
        list de features GeoJSON ou None
    """
    logger.info("[SEMA-MT] Coletando áreas embargadas")
    return _fetch_wfs_sema(CAMADAS["areas_embargadas"])


def coletar_areas_uso_restrito():
    """
    Coleta áreas de uso restrito (restrição ambiental).

    Returns:
        list de features GeoJSON ou None
    """
    logger.info("[SEMA-MT] Coletando áreas de uso restrito")
    return _fetch_wfs_sema(CAMADAS["uso_restrito"])


def coletar_wfs_geojson(camada_key, max_features=500):
    """
    Coleta genérica para qualquer camada WFS da SEMA-MT.

    Args:
        camada_key: Chave de CAMADAS (ex: 'areas_embargadas')
        max_features: Limite de features

    Returns:
        list de features GeoJSON ou None
    """
    if camada_key not in CAMADAS:
        logger.error(f"[SEMA-MT] Camada desconhecida: {camada_key}")
        return None

    return _fetch_wfs_sema(CAMADAS[camada_key], max_features=max_features)


def coletar_para_dataframe(camada_key, max_features=500):
    """
    Coleta e converte features WFS para DataFrame (sem geometria).

    Args:
        camada_key: Chave de CAMADAS
        max_features: Limite de features

    Returns:
        DataFrame com propriedades das features
    """
    features = coletar_wfs_geojson(camada_key, max_features)
    if not features:
        return pd.DataFrame()

    rows = [f.get("properties", {}) for f in features]
    df = pd.DataFrame(rows)
    df["fonte_dado"] = "SEMA-MT"
    df["atualizado_em"] = datetime.utcnow().isoformat()

    return df


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    print("─── Áreas Embargadas SEMA-MT ───")
    embargadas = coletar_areas_embargadas()
    if embargadas:
        print(f"Total features: {len(embargadas)}")
        if len(embargadas) > 0:
            print(f"Propriedades: {list(embargadas[0].get('properties', {}).keys())}")
    else:
        print("Servidor SEMA-MT indisponível (timeout comum)")

    print("\n─── Áreas Uso Restrito ───")
    restrito = coletar_areas_uso_restrito()
    if restrito:
        print(f"Total features: {len(restrito)}")
    else:
        print("Servidor SEMA-MT indisponível")
