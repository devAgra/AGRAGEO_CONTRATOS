"""
HidroScanner — ETL Processor: Calcular Déficit
Estimativa de déficit de outorgas por município.
Fórmula da documentação técnica.
"""

import logging
import pandas as pd

logger = logging.getLogger(__name__)


def calcular_deficit_municipio(
    municipio: dict,
    pocos_outorgados: int,
    ha_irrigado: float = 0,
    indice_seca: float = 1.0
) -> dict:
    """
    Calcula o déficit de outorgas para um município usando a fórmula:

    pocos_estimados = (
        (pop_rural / 50) +
        (ha_irrigado / 120) +
        (num_propriedades × 0.6)
    ) × fator_stress_hidrico

    deficit = pocos_estimados - pocos_outorgados
    perc_irregular = deficit / pocos_estimados × 100

    Args:
        municipio: dict com dados do município
        pocos_outorgados: número de poços com outorga regular
        ha_irrigado: hectares irrigados no município
        indice_seca: fator de stress hídrico (1.0 = normal, >1 = seco)

    Returns:
        dict com análise de déficit
    """
    pop_rural = municipio.get("populacao_rural", 0) or 0
    num_propriedades = municipio.get("num_propriedades_rurais", 0) or 0
    fator_stress = max(1.0, 1.0 + (indice_seca * 0.5))

    pocos_estimados = (
        (pop_rural / 50) +
        (ha_irrigado / 120) +
        (num_propriedades * 0.6)
    ) * fator_stress

    pocos_estimados = max(1, round(pocos_estimados))
    deficit = max(0, pocos_estimados - pocos_outorgados)
    perc_irregularidade = round((deficit / pocos_estimados) * 100) if pocos_estimados > 0 else 0

    # Classificar prioridade
    if perc_irregularidade > 40:
        prioridade = "Alta"
    elif perc_irregularidade > 20:
        prioridade = "Média"
    else:
        prioridade = "Baixa"

    return {
        "cod_ibge_municipio": municipio.get("cod_ibge"),
        "nome_area": municipio.get("nome"),
        "latitude_centroide": municipio.get("lat"),
        "longitude_centroide": municipio.get("lng"),
        "pocos_outorgados_raio": pocos_outorgados,
        "pocos_estimados": pocos_estimados,
        "deficit_estimado": deficit,
        "perc_irregularidade": perc_irregularidade,
        "prioridade": prioridade,
        "status_lead": "Novo"
    }


def calcular_deficit_batch(municipios_df, pocos_df, clima_df=None):
    """
    Calcula déficit para todos os municípios.

    Returns:
        DataFrame com leads gerados
    """
    logger.info(f"Calculando déficit para {len(municipios_df)} municípios")

    leads = []
    for _, mun in municipios_df.iterrows():
        cod = mun.get("cod_ibge")

        pocos_outorgados = len(
            pocos_df[
                (pocos_df["cod_ibge_municipio"] == cod) &
                (pocos_df["situacao"] == "Regular")
            ]
        )

        # Média do índice de seca para o município
        indice_seca = 0.5
        if clima_df is not None and not clima_df.empty:
            clima_mun = clima_df[clima_df["cod_ibge_municipio"] == cod]
            if not clima_mun.empty:
                indice_seca = clima_mun["indice_seca"].mean()

        lead = calcular_deficit_municipio(
            municipio=mun.to_dict(),
            pocos_outorgados=pocos_outorgados,
            ha_irrigado=mun.get("area_km2", 0) * 0.15 * 100,
            indice_seca=indice_seca
        )
        leads.append(lead)

    result = pd.DataFrame(leads)
    logger.info(
        f"Leads gerados: {len(result)} | "
        f"Alta: {len(result[result['prioridade'] == 'Alta'])} | "
        f"Média: {len(result[result['prioridade'] == 'Média'])} | "
        f"Baixa: {len(result[result['prioridade'] == 'Baixa'])}"
    )

    return result
