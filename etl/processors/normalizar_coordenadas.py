"""
HidroScanner — ETL Processor: Normalizar Coordenadas
Converte sistemas de coordenadas para SIRGAS 2000 (EPSG:4674).
"""

import logging

logger = logging.getLogger(__name__)


def normalizar_crs(gdf, crs_destino="EPSG:4674"):
    """
    Converte GeoDataFrame para SIRGAS 2000.

    Args:
        gdf: GeoDataFrame com geometria
        crs_destino: CRS alvo (default: SIRGAS 2000)

    Returns:
        GeoDataFrame reprojetado
    """
    try:
        import geopandas as gpd

        if gdf.crs is None:
            logger.warning("GeoDataFrame sem CRS definido. Assumindo WGS84.")
            gdf = gdf.set_crs("EPSG:4326")

        if str(gdf.crs) != crs_destino:
            logger.info(f"Reprojetando de {gdf.crs} para {crs_destino}")
            gdf = gdf.to_crs(crs_destino)

        return gdf

    except Exception as e:
        logger.error(f"Erro na reprojeção: {e}")
        return gdf


def normalizar_lat_lng(df, col_lat="latitude", col_lng="longitude"):
    """
    Valida e normaliza coordenadas latitude/longitude.
    Remove registros com coordenadas inválidas.
    """
    import pandas as pd

    df[col_lat] = pd.to_numeric(df[col_lat], errors="coerce")
    df[col_lng] = pd.to_numeric(df[col_lng], errors="coerce")

    # Brasil: lat entre -33.75 e 5.27, lng entre -73.99 e -34.79
    mask = (
        df[col_lat].between(-33.75, 5.27) &
        df[col_lng].between(-73.99, -34.79)
    )

    invalid = (~mask).sum()
    if invalid > 0:
        logger.warning(f"Removidos {invalid} registros com coordenadas inválidas")

    return df[mask].copy()
