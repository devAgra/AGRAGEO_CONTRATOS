"""
HidroScanner — ETL Collector: INMET BDMet
Coleta dados climáticos (precipitação, temperatura, evapotranspiração).
Fonte: bdmep.inmet.gov.br
"""

import requests
import pandas as pd
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

INMET_API = "https://apitempo.inmet.gov.br"


def coletar_estacoes(uf="MT"):
    """
    Lista estações meteorológicas do INMET por UF.

    Returns:
        DataFrame com estações
    """
    logger.info(f"[INMET] Coletando estações para UF={uf}")

    try:
        url = f"{INMET_API}/estacoes/T/{uf}"
        response = requests.get(url, timeout=30)

        if response.status_code == 200:
            data = response.json()
            df = pd.DataFrame(data)
            logger.info(f"[INMET] Encontradas {len(df)} estações em {uf}")
            return df

    except Exception as e:
        logger.error(f"[INMET] Falha ao listar estações: {e}")

    return pd.DataFrame()


def coletar_dados_diarios(data_inicio=None, data_fim=None):
    """
    Coleta dados climáticos diários de todas as estações.

    Args:
        data_inicio: Data inicial (YYYY-MM-DD)
        data_fim: Data final (YYYY-MM-DD)

    Returns:
        DataFrame com dados climáticos
    """
    if data_fim is None:
        data_fim = datetime.now().strftime("%Y-%m-%d")
    if data_inicio is None:
        data_inicio = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

    logger.info(f"[INMET] Coletando dados de {data_inicio} a {data_fim}")

    try:
        url = f"{INMET_API}/estacao/dados/{data_inicio}/{data_fim}"
        response = requests.get(url, timeout=120)

        if response.status_code == 200:
            data = response.json()
            df = pd.DataFrame(data)
            logger.info(f"[INMET] Coletados {len(df)} registros climáticos")
            return _normalizar_clima(df)

    except Exception as e:
        logger.error(f"[INMET] Falha na coleta: {e}")

    return pd.DataFrame()


def _normalizar_clima(df):
    """Normaliza dados climáticos para o schema do banco."""
    column_map = {
        "CHUVA": "precipitacao_mm",
        "TEMP_MED": "temperatura_media_c",
        "EVAP_PICHE": "evapotranspiracao_mm",
        "DT_MEDICAO": "data_medicao",
        "CD_ESTACAO": "cod_estacao",
        "UF": "uf",
    }

    rename = {k: v for k, v in column_map.items() if k in df.columns}
    df = df.rename(columns=rename)

    # Convert numeric columns
    for col in ["precipitacao_mm", "temperatura_media_c", "evapotranspiracao_mm"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    return df


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    estacoes = coletar_estacoes("MT")
    print(f"Estações MT: {len(estacoes)}")
