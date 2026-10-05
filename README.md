# 💧 HidroScanner

> Plataforma de inteligência geoespacial para identificação de poços irregulares e potencial hidrogeológico no Brasil.

![Status](https://img.shields.io/badge/status-MVP%20Pilot-blue)
![Estado](https://img.shields.io/badge/estado-Mato%20Grosso-green)
![Versão](https://img.shields.io/badge/versão-1.0-teal)

---

## 📋 Visão Geral

O **HidroScanner** cruza dados públicos de outorgas de poços (ANA, SEMA-MT), geologia (CPRM/SGB), uso do solo (IBGE) e clima (INMET) para:

- 🔴 Identificar áreas com **poços tubulares irregulares** (sem outorga)
- 🗺️ Mapear regiões com **alto potencial hidrogeológico** não explorado
- 🎯 Gerar **leads qualificados** para serviços de regularização e prospecção

## 🏗️ Stack Tecnológica

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | HTML5, CSS3, Vanilla JS, Leaflet.js 1.9, Chart.js 4.x |
| **Backend** | Supabase (PostgreSQL + PostGIS + Auth) |
| **ETL** | Python 3.11, GeoPandas, Pandas, APScheduler |
| **Infra** | Docker, Nginx, GitHub Actions |

## 🚀 Início Rápido

### Frontend (desenvolvimento)

```bash
# Abrir diretamente no navegador:
# frontend/pages/login.html

# Ou usar um servidor local:
cd frontend
npx serve .
# Acessar: http://localhost:3000/pages/login.html
```

### Credenciais de Acesso

```
Email: alexagra.contato@gmail.com
Senha: HidroScanner@2026
```

### Configurar Supabase

1. Copie `.env.example` para `.env`
2. Preencha `SUPABASE_URL` e `SUPABASE_KEY`
3. Execute as migrations SQL no Supabase

### ETL (coleta de dados)

```bash
cd etl
pip install -r requirements_etl.txt

# Executar pipeline completo:
python run_etl.py

# Executar pipeline específico:
python run_etl.py ana
python run_etl.py cprm
python run_etl.py ibge
python run_etl.py inmet

# Iniciar scheduler automático:
python scheduler.py
```

## 📁 Estrutura do Projeto

```
hidroscanner/
├── frontend/           # Interface Web
│   ├── css/            # Design system
│   ├── js/             # Módulos JS (auth, api, mapa, etc.)
│   └── pages/          # HTML (login, mapa, dashboard, etc.)
├── etl/                # Pipeline de coleta
│   ├── collectors/     # Coletores (ANA, CPRM, IBGE, INMET, SEMA)
│   ├── processors/     # Processamento (normalização, déficit)
│   └── loaders/        # Carga no Supabase
├── data/               # Dados brutos (gitignore)
├── docs/               # Documentação
└── .env.example        # Config de ambiente
```

## 📊 Algoritmo de Déficit

```
poços_estimados = (
  (pop_rural / 50) +
  (ha_irrigado / 120) +
  (num_propriedades × 0.6)
) × fator_stress_hídrico

déficit = poços_estimados - poços_outorgados
% irregularidade = déficit / poços_estimados × 100
```

## 📝 Fontes de Dados

- **ANA** — SISAGUA (outorgas federais)
- **CPRM/SGB** — SIAGAS + GeoSGB (hidrogeologia + aquíferos)
- **IBGE** — SIDRA (uso do solo + censo)
- **INMET** — BDMet (precipitação + clima)
- **SEMA-MT** — Portal estadual (outorgas MT)

## ⚠️ Disclaimer

> As estimativas são calculadas com base em dados públicos e representam análise estatística regional. NÃO constituem confirmação de irregularidade individual.

---

**Agrageo Consultoria** | HidroScanner v1.0 | Mato Grosso Pilot | 2026
