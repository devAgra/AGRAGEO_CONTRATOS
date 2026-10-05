"""
HidroScanner — ETL Collector: IBGE SIDRA
Coleta dados de uso do solo, censo agropecuário e população.
API REST: servicodados.ibge.gov.br
"""

import requests
import pandas as pd
import logging

logger = logging.getLogger(__name__)

IBGE_API = "https://servicodados.ibge.gov.br/api/v3"
SIDRA_API = "https://apisidra.ibge.gov.br"


def coletar_municipios(uf_cod=51):
    """
    Coleta lista de municípios com dados populacionais.

    Args:
        uf_cod: Código IBGE do estado (51 = MT)

    Returns:
        DataFrame com municípios
    """
    logger.info(f"[IBGE] Coletando municípios para UF código {uf_cod}")

    try:
        url = f"{IBGE_API}/malhas/estados/{uf_cod}/municipios"
        response = requests.get(url, timeout=30)

        if response.status_code == 200:
            data = response.json()
            df = pd.DataFrame(data)
            logger.info(f"[IBGE] Coletados {len(df)} municípios")
            return df

    except Exception as e:
        logger.error(f"[IBGE] Falha na coleta de municípios: {e}")

    return pd.DataFrame()


def coletar_uso_solo(cod_ibge_municipio=None):
    """
    Coleta dados do Censo Agropecuário (uso do solo).
    Tabela SIDRA 6955 — Uso da terra por tipo

    Returns:
        DataFrame com dados de uso do solo por município
    """
    logger.info("[IBGE] Coletando dados de uso do solo (Censo Agropecuário)")

    try:
        # SIDRA Table 6955: Uso da terra
        # N6 = nível município
        # V = variável (área em hectares)
        url = (
            f"{SIDRA_API}/values/"
            f"t/6955/n6/all/v/allxp/p/last%201/"
            f"c829/all/d/v214%202"
        )

        response = requests.get(url, timeout=60)
        if response.status_code == 200:
            data = response.json()
            df = pd.DataFrame(data[1:], columns=[c['id'] for c in data[0].values()] if data else [])
            logger.info(f"[IBGE] Coletados {len(df)} registros de uso do solo")
            return df

    except Exception as e:
        logger.error(f"[IBGE] Falha na coleta de uso do solo: {e}")

    return pd.DataFrame()


def coletar_populacao(uf_cod=51):
    """
    Coleta dados populacionais dos municípios.

    Returns:
        DataFrame com população por município
    """
    logger.info(f"[IBGE] Coletando dados populacionais para UF {uf_cod}")

    try:
        url = f"{IBGE_API}/agregados/6579/periodos/-6/variaveis/9324"
        params = {
            "localidades": f"N6[N3[{uf_cod}]]",
            "classificacao": ""
        }

        response = requests.get(url, params=params, timeout=60)
        if response.status_code == 200:
            data = response.json()
            logger.info(f"[IBGE] Dados populacionais coletados")
            return _parse_agregado(data)

    except Exception as e:
        logger.error(f"[IBGE] Falha na coleta de população: {e}")

    return pd.DataFrame()


def _parse_agregado(data):
    """Parse IBGE agregados API response."""
    records = []
    if data and len(data) > 0:
        for variavel in data:
            for resultado in variavel.get("resultados", []):
                for serie in resultado.get("series", []):
                    localidade = serie.get("localidade", {})
                    for periodo, valor in serie.get("serie", {}).items():
                        records.append({
                            "cod_ibge": localidade.get("id"),
                            "nome": localidade.get("nome"),
                            "ano": periodo,
                            "valor": valor
                        })
    return pd.DataFrame(records)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    df = coletar_municipios(51)
    print(f"Municípios MT: {len(df)}")
