"""
HidroScanner — ETL Collector: CPRM/SGB SIAGAS
Coleta dados hidrogeológicos e de aquíferos do SGB/CPRM.
WFS: opendata.sgb.gov.br/geoserver/ows
"""

import logging
import os

logger = logging.getLogger(__name__)

# ── Endpoints Reais SGB/CPRM (verificados 2026-03) ──────────
WFS_BASE = "https://opendata.sgb.gov.br/geoserver/ows"
POCOS_LAYER = "p3m:vw_cprm_pocos_siagas"
HIDROGEO_LAYER = "p3m:vw_cprm_cont_a_hidrog"
GEOLOGIA_MT_LAYER = "p3m:vw_cprm_mt_aflor"
ESTRUTURAS_MT_LAYER = "p3m:vw_cprm_mt_estr"


def _build_wfs_url(layer, uf=None, cql_filter=None, max_features=5000, output_format="application/json"):
    """Monta URL WFS padrão para o GeoServer SGB/CPRM."""
    url = (
        f"{WFS_BASE}?"
        f"service=WFS&version=1.1.0&request=GetFeature"
        f"&typeName={layer}"
        f"&outputFormat={output_format}"
        f"&maxFeatures={max_features}"
    )
    if cql_filter:
        url += f"&CQL_FILTER={cql_filter}"
    elif uf:
        url += f"&CQL_FILTER=str_uf='{uf}'"
    return url


def coletar_pocos_siagas(uf="MT", max_features=5000):
    """
    Coleta dados de poços cadastrados no SIAGAS via WFS real.

    Args:
        uf: Sigla do estado (default: MT)
        max_features: Limite máximo de features

    Returns:
        GeoDataFrame com poços do SIAGAS
    """
    logger.info(f"[SIAGAS] Iniciando coleta de poços para UF={uf}")

    try:
        import geopandas as gpd

        wfs_url = _build_wfs_url(POCOS_LAYER, uf=uf, max_features=max_features)
        logger.info(f"[SIAGAS] URL: {wfs_url}")

        gdf = gpd.read_file(wfs_url)
        logger.info(f"[SIAGAS] ✅ Coletados {len(gdf)} poços via WFS")

        return _normalizar_pocos(gdf)

    except Exception as e:
        logger.error(f"[SIAGAS] ❌ Falha na coleta: {e}")
        return None


def coletar_aquiferos(uf="MT", max_features=500):
    """
    Coleta dados de unidades hidrogeológicas do SGB/CPRM via WFS.

    Args:
        uf: Sigla do estado
        max_features: Limite máximo

    Returns:
        GeoDataFrame com geometrias de aquíferos
    """
    logger.info(f"[CPRM] Iniciando coleta de aquíferos para UF={uf}")

    try:
        import geopandas as gpd

        # Usar bbox de MT para filtrar
        bbox = "-18.04,-61.63,-7.35,-50.22"
        wfs_url = (
            f"{WFS_BASE}?"
            f"service=WFS&version=1.1.0&request=GetFeature"
            f"&typeName={HIDROGEO_LAYER}"
            f"&outputFormat=application/json"
            f"&maxFeatures={max_features}"
            f"&bbox={bbox},EPSG:4326"
        )

        gdf = gpd.read_file(wfs_url)
        logger.info(f"[CPRM] ✅ Coletados {len(gdf)} unidades hidrogeológicas via WFS")
        return _normalizar_aquiferos(gdf)

    except Exception as e:
        logger.warning(f"[CPRM] ⚠️ Falha no WFS de aquíferos: {e}")

    # Fallback: shapefile local
    local_path = os.path.join("data", "raw", "cprm", "aquiferos_mt.shp")
    if os.path.exists(local_path):
        try:
            import geopandas as gpd
            gdf = gpd.read_file(local_path)
            logger.info(f"[CPRM] Carregados {len(gdf)} aquíferos do shapefile local")
            return _normalizar_aquiferos(gdf)
        except Exception as e:
            logger.error(f"[CPRM] Falha ao ler shapefile local: {e}")

    logger.warning("[CPRM] Nenhuma fonte de dados disponível para aquíferos")
    return None


def coletar_geologia_mt(max_features=500):
    """Coleta afloramentos geológicos de MT via WFS."""
    logger.info("[CPRM] Coletando afloramentos geológicos de MT")

    try:
        import geopandas as gpd

        wfs_url = _build_wfs_url(GEOLOGIA_MT_LAYER, max_features=max_features)
        gdf = gpd.read_file(wfs_url)
        logger.info(f"[CPRM] ✅ Coletados {len(gdf)} afloramentos")
        return gdf

    except Exception as e:
        logger.error(f"[CPRM] ❌ Falha na coleta de geologia: {e}")
        return None


def coletar_estruturas_mt(max_features=500):
    """Coleta estruturas lineares de MT via WFS."""
    logger.info("[CPRM] Coletando estruturas lineares de MT")

    try:
        import geopandas as gpd

        wfs_url = _build_wfs_url(ESTRUTURAS_MT_LAYER, max_features=max_features)
        gdf = gpd.read_file(wfs_url)
        logger.info(f"[CPRM] ✅ Coletadas {len(gdf)} estruturas")
        return gdf

    except Exception as e:
        logger.error(f"[CPRM] ❌ Falha na coleta de estruturas: {e}")
        return None


def _normalizar_pocos(gdf):
    """Normaliza colunas do GeoDataFrame de poços."""
    column_map = {
        "str_uf": "uf",
        "str_municipio": "municipio",
        "num_latitude": "latitude",
        "num_longitude": "longitude",
        "num_prof": "profundidade_m",
        "num_ne": "nivel_estatico_m",
        "num_nd": "nivel_dinamico_m",
        "num_vazao": "vazao_m3h",
        "str_uso": "uso_principal",
        "str_situacao": "situacao",
        "dat_outorga": "data_outorga",
    }

    rename = {k: v for k, v in column_map.items() if k in gdf.columns}
    gdf = gdf.rename(columns=rename)
    gdf["fonte_dado"] = "SIAGAS/SGB"

    return gdf


def _normalizar_aquiferos(gdf):
    """Normaliza colunas do GeoDataFrame de aquíferos."""
    column_map = {
        "nome_aquif": "nome",
        "tipo_aquif": "tipo",
        "sistema": "sistema_aquifero",
        "produtiv": "produtividade",
        "area_km2": "area_km2",
    }

    rename = {k: v for k, v in column_map.items() if k in gdf.columns}
    gdf = gdf.rename(columns=rename)
    gdf["fonte_cprm"] = "SGB/CPRM"

    return gdf


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    print("─── Poços SIAGAS ───")
    pocos = coletar_pocos_siagas("MT", max_features=10)
    if pocos is not None:
        print(f"Total poços: {len(pocos)}")
        print(pocos.head())
    else:
        print("Falha na coleta")

    print("\n─── Aquíferos ───")
    aquiferos = coletar_aquiferos("MT", max_features=5)
    if aquiferos is not None:
        print(f"Total aquíferos: {len(aquiferos)}")
        print(aquiferos.head())
    else:
        print("Falha na coleta")
