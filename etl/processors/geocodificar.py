"""
HidroScanner — ETL Processor: Geocodificar
Converte endereços sem coordenadas em lat/lng usando Nominatim.
"""

import logging
import time

logger = logging.getLogger(__name__)


def geocodificar_enderecos(df, col_endereco="endereco", col_municipio="municipio", col_uf="uf"):
    """
    Geocodifica registros sem coordenadas usando Nominatim (OSM).
    Respeita rate limit de 1 request/segundo.

    Args:
        df: DataFrame com registros
        col_endereco: coluna de endereço
        col_municipio: coluna de município
        col_uf: coluna de UF

    Returns:
        DataFrame com coordenadas preenchidas
    """
    import requests

    sem_coords = df[df["latitude"].isna() | df["longitude"].isna()]
    if sem_coords.empty:
        logger.info("Todos os registros já possuem coordenadas")
        return df

    logger.info(f"Geocodificando {len(sem_coords)} registros sem coordenadas")

    for idx, row in sem_coords.iterrows():
        query_parts = []
        if col_endereco in row and row[col_endereco]:
            query_parts.append(str(row[col_endereco]))
        if col_municipio in row and row[col_municipio]:
            query_parts.append(str(row[col_municipio]))
        if col_uf in row and row[col_uf]:
            query_parts.append(str(row[col_uf]))

        query = ", ".join(query_parts) + ", Brasil"

        try:
            response = requests.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": query, "format": "json", "limit": 1},
                headers={"User-Agent": "HidroScanner/1.0"},
                timeout=10
            )

            if response.status_code == 200 and response.json():
                result = response.json()[0]
                df.at[idx, "latitude"] = float(result["lat"])
                df.at[idx, "longitude"] = float(result["lon"])

            time.sleep(1)  # Nominatim rate limit

        except Exception as e:
            logger.warning(f"Falha ao geocodificar [{query}]: {e}")
            continue

    geocoded = df["latitude"].notna().sum() - (len(df) - len(sem_coords))
    logger.info(f"Geocodificados: {geocoded}/{len(sem_coords)}")

    return df
