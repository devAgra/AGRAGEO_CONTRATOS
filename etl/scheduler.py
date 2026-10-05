"""
HidroScanner — ETL Scheduler
APScheduler: agendamento de jobs de coleta e processamento.
"""

import logging
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

from run_etl import run_pipeline_ana, run_pipeline_cprm, run_pipeline_ibge, run_pipeline_inmet

logger = logging.getLogger(__name__)


def create_scheduler():
    """Cria e configura o scheduler com jobs de coleta."""
    scheduler = BlockingScheduler()

    # ── ANA SISAGUA — Diário às 06:00 ──
    scheduler.add_job(
        run_pipeline_ana,
        CronTrigger(hour=6, minute=0),
        id="coleta_ana",
        name="Coleta ANA SISAGUA (diário)",
        replace_existing=True
    )

    # ── CPRM/SIAGAS — Semanal domingo às 03:00 ──
    scheduler.add_job(
        run_pipeline_cprm,
        CronTrigger(day_of_week="sun", hour=3, minute=0),
        id="coleta_cprm",
        name="Coleta CPRM/SIAGAS (semanal)",
        replace_existing=True
    )

    # ── IBGE SIDRA — Mensal dia 1 às 04:00 ──
    scheduler.add_job(
        run_pipeline_ibge,
        CronTrigger(day=1, hour=4, minute=0),
        id="coleta_ibge",
        name="Coleta IBGE SIDRA (mensal)",
        replace_existing=True
    )

    # ── INMET BDMet — Diário às 07:00 ──
    scheduler.add_job(
        run_pipeline_inmet,
        CronTrigger(hour=7, minute=0),
        id="coleta_inmet",
        name="Coleta INMET BDMet (diário)",
        replace_existing=True
    )

    logger.info("Scheduler configurado com 4 jobs de coleta")
    return scheduler


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    )
    logger.info("Iniciando scheduler HidroScanner ETL...")
    scheduler = create_scheduler()

    try:
        scheduler.start()
    except KeyboardInterrupt:
        logger.info("Scheduler encerrado pelo usuário")
        scheduler.shutdown()
