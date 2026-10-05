"""
HidroScanner — Run ETL Pipeline
Execução manual do pipeline completo de coleta e processamento.
"""

import logging
import sys
from datetime import datetime

logger = logging.getLogger(__name__)


def run_pipeline_ana():
    """Pipeline completo: ANA → Normalizar → Carregar."""
    logger.info("=" * 60)
    logger.info("PIPELINE ANA SISAGUA — Início")
    logger.info("=" * 60)

    try:
        from collectors.ana_sisagua import coletar_outorgas
        from processors.normalizar_coordenadas import normalizar_lat_lng
        from loaders.supabase_loader import upsert_pocos

        # 1. Coletar
        df = coletar_outorgas("MT")
        if df.empty:
            logger.warning("ANA: nenhum dado coletado")
            return

        # 2. Normalizar coordenadas
        df = normalizar_lat_lng(df)

        # 3. Carregar
        total = upsert_pocos(df)
        logger.info(f"ANA: pipeline concluído — {total} registros carregados")

    except Exception as e:
        logger.error(f"ANA: falha no pipeline — {e}")


def run_pipeline_cprm():
    """Pipeline: CPRM → Normalizar CRS → Carregar."""
    logger.info("=" * 60)
    logger.info("PIPELINE CPRM/SIAGAS — Início")
    logger.info("=" * 60)

    try:
        from collectors.cprm_siagas import coletar_aquiferos
        from processors.normalizar_coordenadas import normalizar_crs
        from loaders.supabase_loader import upsert_aquiferos

        gdf = coletar_aquiferos("MT")
        if gdf is None or gdf.empty:
            logger.warning("CPRM: nenhum dado coletado")
            return

        gdf = normalizar_crs(gdf)
        total = upsert_aquiferos(gdf)
        logger.info(f"CPRM: pipeline concluído — {total} registros")

    except Exception as e:
        logger.error(f"CPRM: falha no pipeline — {e}")


def run_pipeline_ibge():
    """Pipeline: IBGE → Carregar uso do solo."""
    logger.info("=" * 60)
    logger.info("PIPELINE IBGE SIDRA — Início")
    logger.info("=" * 60)

    try:
        from collectors.ibge_sidra import coletar_uso_solo
        from loaders.supabase_loader import upsert_uso_solo

        df = coletar_uso_solo()
        if df.empty:
            logger.warning("IBGE: nenhum dado coletado")
            return

        total = upsert_uso_solo(df)
        logger.info(f"IBGE: pipeline concluído — {total} registros")

    except Exception as e:
        logger.error(f"IBGE: falha no pipeline — {e}")


def run_pipeline_inmet():
    """Pipeline: INMET → Normalizar → Carregar."""
    logger.info("=" * 60)
    logger.info("PIPELINE INMET BDMet — Início")
    logger.info("=" * 60)

    try:
        from collectors.inmet_bdmet import coletar_dados_diarios
        from loaders.supabase_loader import upsert_clima

        df = coletar_dados_diarios()
        if df.empty:
            logger.warning("INMET: nenhum dado coletado")
            return

        total = upsert_clima(df)
        logger.info(f"INMET: pipeline concluído — {total} registros")

    except Exception as e:
        logger.error(f"INMET: falha no pipeline — {e}")


def run_all():
    """Executa todos os pipelines sequencialmente."""
    inicio = datetime.now()
    logger.info(f"ETL COMPLETO — Início: {inicio.isoformat()}")

    run_pipeline_ana()
    run_pipeline_cprm()
    run_pipeline_ibge()
    run_pipeline_inmet()

    fim = datetime.now()
    duracao = (fim - inicio).total_seconds()
    logger.info(f"ETL COMPLETO — Fim: {fim.isoformat()} | Duração: {duracao:.1f}s")


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    )

    if len(sys.argv) > 1:
        pipeline = sys.argv[1].lower()
        if pipeline == "ana":
            run_pipeline_ana()
        elif pipeline == "cprm":
            run_pipeline_cprm()
        elif pipeline == "ibge":
            run_pipeline_ibge()
        elif pipeline == "inmet":
            run_pipeline_inmet()
        else:
            print(f"Pipeline desconhecido: {pipeline}")
            print("Uso: python run_etl.py [ana|cprm|ibge|inmet]")
    else:
        run_all()
