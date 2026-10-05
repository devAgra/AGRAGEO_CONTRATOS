"""
HidroScanner — ETL Processor: Enriquecer Poços
Join espacial entre poços + aquíferos + uso do solo.
"""

import logging

logger = logging.getLogger(__name__)


def enriquecer_com_aquiferos(pocos_gdf, aquiferos_gdf):
    """
    Faz join espacial entre poços e aquíferos.
    Adiciona informações do aquífero ao poço.

    Args:
        pocos_gdf: GeoDataFrame de poços (pontos)
        aquiferos_gdf: GeoDataFrame de aquíferos (polígonos)

    Returns:
        GeoDataFrame enriquecido
    """
    try:
        import geopandas as gpd

        result = gpd.sjoin(
            pocos_gdf,
            aquiferos_gdf[["nome", "tipo", "produtividade", "geometry"]],
            how="left",
            predicate="within"
        )

        result = result.rename(columns={
            "nome_right": "nome_aquifero",
            "tipo_right": "tipo_aquifero",
            "produtividade_right": "produt_aquifero"
        })

        matched = result["nome_aquifero"].notna().sum()
        logger.info(f"Join espacial: {matched}/{len(result)} poços em aquíferos mapeados")

        return result

    except Exception as e:
        logger.error(f"Falha no join espacial: {e}")
        return pocos_gdf


def enriquecer_com_municipio(pocos_gdf, municipios_gdf):
    """
    Associa cada poço ao seu município via join espacial.
    """
    try:
        import geopandas as gpd

        result = gpd.sjoin(
            pocos_gdf,
            municipios_gdf[["cod_ibge", "nome", "geometry"]],
            how="left",
            predicate="within"
        )

        result = result.rename(columns={
            "cod_ibge_right": "cod_ibge_municipio",
            "nome_right": "municipio"
        })

        return result

    except Exception as e:
        logger.error(f"Falha no join municipal: {e}")
        return pocos_gdf
