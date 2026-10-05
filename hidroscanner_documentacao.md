# 💧 HidroScanner — Documentação Técnica Completa
> *Plataforma de Identificação de Poços Irregulares e Potencial Hidrogeológico*  
> Versão 1.0 | Março 2026 | Mato Grosso → Brasil

---

## 1. Visão Geral do Sistema

O **HidroScanner** é uma plataforma SaaS de inteligência geoespacial voltada para o mercado de hidrogeologia no Brasil. Seu propósito primário é **cruzar dados públicos** de outorgas de poços, geologia, uso do solo e clima para identificar:

- Áreas com **poços tubulares irregulares** (sem outorga)
- Regiões com **alto potencial hidrogeológico** não explorado
- Propriedades rurais que são **leads qualificados** para serviços de regularização e prospecção

O sistema é desenvolvido **100% com ferramentas open source** e alimentado exclusivamente por **dados públicos e gratuitos** de órgãos federais e estaduais brasileiros.

### Objetivo Estratégico

```
FASE 1 (0–6 meses): Uso interno pelo consultor geólogo para geração de leads
FASE 2 (6–12 meses): Produto freemium para consultorias de MT
FASE 3 (12–24 meses): Expansão nacional + assinaturas B2B
```

---

## 2. Fontes de Dados Públicas (Entradas do Sistema)

| Órgão | Sistema | Dados | Formato | Acesso |
|-------|---------|-------|---------|--------|
| **ANA** | SISAGUA | Outorgas de poços (todo BR) | CSV / API REST | `sistemas.ana.gov.br/sisagua` |
| **CPRM/SGB** | SIAGAS | Poços cadastrados, hidrogeologia, aquíferos | Shapefile / WMS | `sgb.gov.br/sisgas` |
| **CPRM/SGB** | GeoSGB | Mapas geológicos e hidrogeológicos | WMS / GeoTIFF | `geosgb.cprm.gov.br` |
| **IBGE** | SIDRA | Uso do solo, censo agropecuário, população | API REST / CSV | `servicodados.ibge.gov.br` |
| **INMET** | BDMet | Precipitação, evaporação, temperatura | CSV diário | `bdmep.inmet.gov.br` |
| **ICMBio** | GeoServer | Unidades de conservação | WMS | `geoserver.icmbio.gov.br` |
| **SEMA-MT** | Portal Estadual | Outorgas estaduais (MT) | CSV/PDF | Portal da SEMA-MT |
| **ANA** | HidroWeb | Dados fluviométricos (rios) | CSV | `hidroweb.ana.gov.br` |

---

## 3. Fluxo Global de Entrada de Dados

```mermaid
flowchart TD
    subgraph FONTES["🌐 Fontes de Dados Públicas"]
        ANA["🏛️ ANA - SISAGUA\nOutorgas de poços"]
        CPRM["🗺️ CPRM/SGB - SIAGAS\nHidrogeologia + Aquíferos"]
        IBGE["📊 IBGE - SIDRA\nUso do solo + Censo"]
        INMET["🌧️ INMET - BDMet\nPrecipitação + Clima"]
        SEMA["🏢 SEMA-MT\nOutorgas estaduais"]
    end

    subgraph COLETA["⚙️ Camada de Coleta (ETL)"]
        ETL_API["Script Python\nAPI Collector\n(requests + schedule)"]
        ETL_GEO["Script Python\nGeo Processor\n(GeoPandas + Fiona)"]
        ETL_CSV["Script Python\nCSV Normalizer\n(Pandas)"]
    end

    subgraph BANCO["🗄️ Banco de Dados (Supabase + PostGIS)"]
        TB_POCOS["Tabela: pocos_outorgados"]
        TB_AQUIF["Tabela: aquiferos"]
        TB_SOLO["Tabela: uso_solo_municipio"]
        TB_CLIMA["Tabela: dados_climaticos"]
        TB_MUNIC["Tabela: municipios (geometria)"]
        TB_LEADS["Tabela: leads_gerados"]
    end

    subgraph BACKEND["🔧 Backend (FastAPI)"]
        API_REST["API REST\nEndpoints de consulta"]
        MOTOR["Motor de Análise\nAlgoritmo de Déficit"]
        RELAT["Gerador de\nRelatórios PDF"]
    end

    subgraph FRONTEND["💻 Frontend (HTML + Leaflet)"]
        MAPA["Mapa Interativo\n(Leaflet.js)"]
        DASH["Dashboard\nEstatísticas (Chart.js)"]
        REL_UI["Painel de\nRelatórios"]
    end

    ANA --> ETL_API
    SEMA --> ETL_CSV
    IBGE --> ETL_API
    INMET --> ETL_CSV
    CPRM --> ETL_GEO

    ETL_API --> TB_POCOS
    ETL_API --> TB_SOLO
    ETL_API --> TB_CLIMA
    ETL_GEO --> TB_AQUIF
    ETL_GEO --> TB_MUNIC
    ETL_CSV --> TB_POCOS
    ETL_CSV --> TB_CLIMA

    TB_POCOS --> MOTOR
    TB_AQUIF --> MOTOR
    TB_SOLO --> MOTOR
    TB_CLIMA --> MOTOR
    TB_MUNIC --> MOTOR

    MOTOR --> TB_LEADS
    MOTOR --> API_REST
    RELAT --> API_REST

    API_REST --> MAPA
    API_REST --> DASH
    API_REST --> REL_UI
```

---

## 4. Stack Tecnológica Completa (100% Open Source)

### 4.1 Visão por Camada

```mermaid
graph LR
    subgraph DADOS["Camada de Dados"]
        direction TB
        D1["PostgreSQL 15\n+ PostGIS 3.4"]
        D2["Supabase\n(BaaS gratuito)"]
        D3["GeoServer\n(opcional WMS)"]
    end

    subgraph ETL["Camada ETL / Processamento"]
        direction TB
        E1["Python 3.11"]
        E2["GeoPandas 0.14"]
        E3["Pandas 2.x"]
        E4["Fiona\n(leitura shapefiles)"]
        E5["Pyproj\n(projeções CRS)"]
        E6["Rasterio\n(imagens raster)"]
        E7["APScheduler\n(agendamento)"]
    end

    subgraph BACKEND["Camada Backend"]
        direction TB
        B1["FastAPI 0.110"]
        B2["SQLAlchemy 2.0\n(ORM)"]
        B3["Alembic\n(migrações DB)"]
        B4["WeasyPrint\n(geração PDF)"]
        B5["Pydantic v2\n(validação)"]
        B6["Uvicorn\n(servidor ASGI)"]
    end

    subgraph FRONTEND["Camada Frontend"]
        direction TB
        F1["HTML5 + CSS3\nVanilla JS"]
        F2["Leaflet.js 1.9\n(mapas)"]
        F3["Chart.js 4.x\n(gráficos)"]
        F4["OpenStreetMap\n(tiles base)"]
        F5["OpenLayers\n(WMS layers)"]
    end

    subgraph INFRA["Camada Infra / DevOps"]
        direction TB
        I1["Docker + Compose\n(containers)"]
        I2["Nginx\n(proxy reverso)"]
        I3["GitHub Actions\n(CI/CD)"]
        I4["VPS Linux\n(R$ 60-100/mês)"]
    end

    ETL --> DADOS
    BACKEND --> DADOS
    FRONTEND --> BACKEND
    INFRA --> BACKEND
    INFRA --> FRONTEND
```

### 4.2 Tabela Detalhada da Stack

| Camada | Ferramenta | Versão | Função | Custo |
|--------|-----------|--------|--------|-------|
| **BD Principal** | PostgreSQL | 15 | Banco relacional | R$ 0 |
| **Extensão GIS** | PostGIS | 3.4 | Consultas espaciais | R$ 0 |
| **BaaS** | Supabase | Free Tier | Hosting DB + Auth + API | R$ 0 |
| **ETL** | Python | 3.11 | Processamento de dados | R$ 0 |
| **Geo Python** | GeoPandas | 0.14 | Shapefiles, geometrias | R$ 0 |
| **Dataframes** | Pandas | 2.x | Manipulação CSV/Excel | R$ 0 |
| **Shapefiles** | Fiona | 1.9 | Leitura formatos GIS | R$ 0 |
| **Projeções** | Pyproj | 3.6 | Conversão CRS/SIRGAS | R$ 0 |
| **Rasters** | Rasterio | 1.3 | Imagens satélite | R$ 0 |
| **Agendamento** | APScheduler | 3.10 | Jobs diários de coleta | R$ 0 |
| **API Backend** | FastAPI | 0.110 | Endpoints REST | R$ 0 |
| **ORM** | SQLAlchemy | 2.0 | Queries ao banco | R$ 0 |
| **Migrações** | Alembic | 1.13 | Versionamento do schema | R$ 0 |
| **PDF** | WeasyPrint | 62 | Gerar relatórios PDF | R$ 0 |
| **Servidor** | Uvicorn | 0.29 | ASGI server | R$ 0 |
| **Mapas** | Leaflet.js | 1.9 | Mapa interativo frontend | R$ 0 |
| **Gráficos** | Chart.js | 4.x | Dashboards estatísticos | R$ 0 |
| **Tiles** | OpenStreetMap | — | Base cartográfica | R$ 0 |
| **WMS** | GeoServer | 2.25 | Servir camadas WMS | R$ 0 |
| **Container** | Docker | 26 | Empacotamento | R$ 0 |
| **Proxy** | Nginx | 1.25 | Roteamento HTTP | R$ 0 |
| **CI/CD** | GitHub Actions | — | Deploy automatizado | R$ 0 |
| **Hosting** | VPS Ubuntu | — | Servidor na nuvem | R$60-100/mês |
| **TOTAL** | | | | **~R$ 80/mês** |

---

## 5. Estrutura de Pastas do Projeto

```
hidroscanner/
│
├── 📁 backend/                         # API FastAPI + lógica de negócio
│   ├── 📁 app/
│   │   ├── 📁 api/                     # Rotas da API REST
│   │   │   ├── 📁 v1/
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── pocos.py        # CRUD e consulta de poços
│   │   │   │   │   ├── municipios.py   # Dados por município
│   │   │   │   │   ├── aquiferos.py    # Consulta de aquíferos
│   │   │   │   │   ├── relatorios.py   # Geração de relatórios PDF
│   │   │   │   │   └── leads.py        # Gestão de leads gerados
│   │   │   │   └── router.py
│   │   │   └── deps.py                 # Dependências (auth, DB session)
│   │   │
│   │   ├── 📁 core/                    # Configurações centrais
│   │   │   ├── config.py               # Variáveis de ambiente
│   │   │   ├── security.py             # JWT, autenticação
│   │   │   └── database.py             # Conexão com PostgreSQL/Supabase
│   │   │
│   │   ├── 📁 models/                  # Modelos SQLAlchemy (tabelas)
│   │   │   ├── poco.py                 # Model: pocos_outorgados
│   │   │   ├── aquifero.py             # Model: aquiferos
│   │   │   ├── municipio.py            # Model: municipios
│   │   │   ├── uso_solo.py             # Model: uso_solo_municipio
│   │   │   ├── clima.py                # Model: dados_climaticos
│   │   │   └── lead.py                 # Model: leads_gerados
│   │   │
│   │   ├── 📁 schemas/                 # Pydantic (validação de dados)
│   │   │   ├── poco.py
│   │   │   ├── relatorio.py
│   │   │   └── lead.py
│   │   │
│   │   ├── 📁 services/                # Lógica de negócio
│   │   │   ├── algoritmo_deficit.py    # 🔑 Motor de análise de irregularidades
│   │   │   ├── potencial_hidro.py      # Cálculo de potencial hidrogeológico
│   │   │   ├── gerador_relatorio.py    # Geração de PDF com WeasyPrint
│   │   │   └── alertas.py              # Outorgas vencendo
│   │   │
│   │   └── main.py                     # Entry point FastAPI
│   │
│   ├── 📁 migrations/                  # Alembic (versionamento do schema)
│   │   ├── env.py
│   │   └── versions/
│   │       ├── 001_create_tables.py
│   │       ├── 002_add_postgis.py
│   │       └── 003_add_leads_table.py
│   │
│   ├── requirements.txt
│   └── Dockerfile
│
├── 📁 etl/                             # Pipeline de coleta de dados
│   ├── 📁 collectors/
│   │   ├── ana_sisagua.py              # Coleta outorgas da ANA (API REST)
│   │   ├── cprm_siagas.py              # Coleta hidrogeologia CPRM (WMS/Shapefile)
│   │   ├── ibge_sidra.py               # Coleta uso do solo e censo (API)
│   │   ├── inmet_bdmet.py              # Coleta dados climáticos (CSV)
│   │   └── sema_mt.py                  # Coleta outorgas estaduais MT
│   │
│   ├── 📁 processors/
│   │   ├── normalizar_coordenadas.py   # Converter CRS para SIRGAS 2000
│   │   ├── enriquecer_pocos.py         # Join espacial: poço + aquífero + solo
│   │   ├── calcular_deficit.py         # Estimativa de déficit por município
│   │   └── geocodificar.py             # Endereços → coordenadas (Nominatim)
│   │
│   ├── 📁 loaders/
│   │   └── supabase_loader.py          # Upsert no Supabase/PostgreSQL
│   │
│   ├── 📁 templates/
│   │   └── relatorio_base.html         # Template HTML para PDF
│   │
│   ├── scheduler.py                    # APScheduler: jobs diários/semanais
│   ├── run_etl.py                      # Execução manual do pipeline
│   └── requirements_etl.txt
│
├── 📁 frontend/                        # Interface Web
│   ├── 📁 css/
│   │   ├── main.css                    # Estilos globais
│   │   ├── mapa.css                    # Controles do mapa
│   │   └── dashboard.css               # Cards e gráficos
│   │
│   ├── 📁 js/
│   │   ├── mapa.js                     # Inicialização Leaflet + camadas
│   │   ├── filtros.js                  # Filtros de município/tipo/situação
│   │   ├── dashboard.js                # Chart.js (gráficos de déficit)
│   │   ├── relatorios.js               # Geração e download de PDF
│   │   ├── api.js                      # Wrapper fetch() para a API
│   │   └── auth.js                     # Autenticação (Supabase Auth)
│   │
│   ├── 📁 pages/
│   │   ├── index.html                  # Mapa principal
│   │   ├── dashboard.html              # Estatísticas e métricas
│   │   ├── municipio.html              # Detalhe por município
│   │   ├── relatorio.html              # Visualização de relatório
│   │   └── login.html                  # Tela de autenticação
│   │
│   └── 📁 assets/
│       ├── icons/                      # Ícones de poços, alertas
│       └── img/
│
├── 📁 geoserver/                       # Configuração GeoServer (WMS layers)
│   ├── workspaces/
│   │   └── hidroscanner/
│   │       ├── aquiferos_mt.sld        # Estilização de aquíferos
│   │       └── pocos_outorgados.sld    # Estilização de poços
│   └── docker-compose.geoserver.yml
│
├── 📁 data/                            # Dados brutos baixados (gitignore)
│   ├── 📁 raw/
│   │   ├── ana/                        # CSVs baixados do SISAGUA
│   │   ├── cprm/                       # Shapefiles do SGB/CPRM
│   │   ├── ibge/                       # Malhas municipais + censo
│   │   └── inmet/                      # Séries climáticas
│   └── 📁 processed/                   # Dados já normalizados para carga
│
├── 📁 docs/                            # Documentação técnica
│   ├── hidroscanner_documentacao.md    # Este arquivo
│   ├── schema_banco.md                 # Diagrama do banco de dados
│   └── api_reference.md               # Endpoints da API
│
├── docker-compose.yml                  # Stack completa (API + DB + Nginx)
├── .env.example                        # Variáveis de ambiente (modelo)
├── .gitignore
└── README.md
```

---

## 6. Schema do Banco de Dados (PostGIS)

```mermaid
erDiagram
    POCOS_OUTORGADOS {
        serial id PK
        varchar numero_outorga
        varchar nome_proprietario
        varchar cpf_cnpj
        varchar municipio
        int cod_ibge_municipio FK
        float latitude
        float longitude
        geography geometry_point
        float vazao_m3h
        float profundidade_m
        varchar uso_principal
        varchar fonte_dado
        date data_outorga
        date data_vencimento
        varchar situacao
        timestamp atualizado_em
    }

    AQUIFEROS {
        serial id PK
        varchar nome
        varchar tipo
        varchar sistema_aquifero
        varchar produtividade
        float area_km2
        geography geometry_polygon
        varchar fonte_cprm
    }

    MUNICIPIOS {
        serial id PK
        int cod_ibge UK
        varchar nome
        varchar estado
        varchar uf
        int populacao_total
        int populacao_rural
        float area_km2
        float area_irrigada_ha
        int num_propriedades_rurais
        geography geometry_polygon
    }

    USO_SOLO_MUNICIPIO {
        serial id PK
        int cod_ibge_municipio FK
        int ano_referencia
        float ha_lavoura_temporaria
        float ha_lavoura_permanente
        float ha_pastagem
        float ha_silvicultura
        float ha_mata_natural
    }

    DADOS_CLIMATICOS {
        serial id PK
        int cod_ibge_municipio FK
        int ano
        int mes
        float precipitacao_mm
        float temperatura_media_c
        float evapotranspiracao_mm
        float indice_seca
    }

    LEADS_GERADOS {
        serial id PK
        int cod_ibge_municipio FK
        varchar nome_area
        float latitude_centroide
        float longitude_centroide
        int pocos_outorgados_raio
        int pocos_estimados
        int deficit_estimado
        float perc_irregularidade
        varchar potencial_hidrogeologico
        varchar prioridade
        text observacoes
        varchar status_lead
        timestamp criado_em
    }

    POCOS_OUTORGADOS }|--|| MUNICIPIOS : "pertence a"
    AQUIFEROS }|--|{ MUNICIPIOS : "sobrepõe"
    USO_SOLO_MUNICIPIO }|--|| MUNICIPIOS : "descreve"
    DADOS_CLIMATICOS }|--|| MUNICIPIOS : "registra"
    LEADS_GERADOS }|--|| MUNICIPIOS : "localizado em"
```

---

## 7. Fluxo do Algoritmo de Detecção de Irregularidades

```mermaid
flowchart TD
    START([Usuário seleciona\num município]) --> Q1

    Q1["📥 Buscar dados do município\n(PostGIS ST_Within)"]
    Q1 --> Q2["📊 Contar poços outorgados\nna área (ANA + SEMA-MT)"]
    Q2 --> Q3["🌾 Buscar dados de uso do solo\n(IBGE: ha irrigados, propriedades)"]
    Q3 --> Q4["👥 Buscar dados populacionais\n(IBGE: população rural)"]
    Q4 --> Q5["🌧️ Calcular índice de stress\nhídrico (INMET)"]

    Q5 --> FORMULA["🧮 Fórmula de Estimativa\n\npoços_estimados =\n(pop_rural / 50) +\n(ha_irrigado / 120) +\n(num_propriedades × 0.6)\n× fator_stress_hidrico"]

    FORMULA --> CALC["📉 Calcular Déficit\n\ndeficit = poços_estimados - poços_outorgados\nperc_irregular = deficit / poços_estimados × 100"]

    CALC --> POTENCIAL["🗺️ Cruzar com Aquíferos\n(ST_Intersects)\nAlto | Médio | Baixo"]

    POTENCIAL --> PRIORIDADE{Classificar\nPrioridade}

    PRIORIDADE --> |"deficit > 40% + potencial ALTO"| ALTA["🔴 PRIORIDADE ALTA\nLead imediato"]
    PRIORIDADE --> |"deficit 20-40% + potencial MÉDIO"| MEDIA["🟡 PRIORIDADE MÉDIA\nMonitorar"]
    PRIORIDADE --> |"deficit < 20% + potencial BAIXO"| BAIXA["🟢 BAIXA PRIORIDADE\nRegistrar"]

    ALTA --> LEAD["💾 Salvar em leads_gerados\n+ Gerar Relatório PDF"]
    MEDIA --> LEAD
    BAIXA --> LEAD

    LEAD --> MAPA["📍 Exibir no Mapa\ncomo heatmap / marcadores"]
```

---

## 8. Fluxo de Geração de Relatório (Lead → PDF)

```mermaid
sequenceDiagram
    actor GEOLOGO as Geólogo (Você)
    participant UI as Frontend (Leaflet)
    participant API as Backend (FastAPI)
    participant DB as Banco (PostGIS)
    participant PDF as WeasyPrint

    GEOLOGO->>UI: Clica em área de alto potencial
    UI->>API: GET /api/v1/relatorios/municipio/{cod_ibge}
    API->>DB: SELECT poços, aquíferos, uso_solo, clima
    DB-->>API: Retorna dados consolidados
    API->>API: Executa algoritmo_deficit.py
    API->>PDF: Renderiza template HTML com dados
    PDF-->>API: Retorna PDF binário
    API-->>UI: Streaming do PDF
    UI-->>GEOLOGO: Download automático do relatório
    GEOLOGO->>GEOLOGO: Usa relatório para abordar cliente
```

---

## 9. Fluxo de Pipeline ETL (Coleta Automática de Dados)

```mermaid
flowchart LR
    subgraph SCHEDULE["🕐 APScheduler (Agendamento)"]
        S1["Diário 06:00\nANA SISAGUA"]
        S2["Semanal Dom\nCPRM/SGB"]
        S3["Mensal dia 1\nIBGE SIDRA"]
        S4["Diário 07:00\nINMET BDMet"]
    end

    subgraph COLLECT["📥 Coleta"]
        C1["ana_sisagua.py\nrequests + JSON"]
        C2["cprm_siagas.py\nfiona + geopandas"]
        C3["ibge_sidra.py\nrequests + JSON"]
        C4["inmet_bdmet.py\nrequests + CSV"]
    end

    subgraph PROCESS["⚙️ Processamento"]
        P1["Normalizar CRS\n→ SIRGAS 2000 (4674)"]
        P2["Deduplicar registros\npor numero_outorga"]
        P3["Geocodificar endereços\nsem coordenadas"]
        P4["Calcular geometrias\nST_MakePoint"]
    end

    subgraph LOAD["💾 Carga"]
        L1["Upsert em\npocos_outorgados"]
        L2["Upsert em\naquiferos"]
        L3["Upsert em\nuso_solo_municipio"]
        L4["Upsert em\ndados_climaticos"]
    end

    subgraph VALIDATE["✅ Validação"]
        V1["Log de execução\n(sucesso/erro)"]
        V2["Alertas por email\nem caso de falha"]
    end

    S1 --> C1 --> P1 --> P2 --> P3 --> P4 --> L1
    S2 --> C2 --> P1 --> L2
    S3 --> C3 --> L3
    S4 --> C4 --> L4
    L1 & L2 & L3 & L4 --> V1 --> V2
```

---

## 10. Arquitetura de Deployment (Produção)

```mermaid
graph TD
    subgraph INTERNET["🌐 Internet"]
        USER["Usuário / Geólogo"]
    end

    subgraph VPS["🖥️ VPS Linux (Ubuntu 22.04)"]
        NGINX["Nginx\nProxy Reverso\n:80/:443"]

        subgraph DOCKER["Docker Compose"]
            FE["📦 Container: Frontend\nNginx static files\n:8080"]
            BE["📦 Container: Backend\nFastAPI + Uvicorn\n:8000"]
            GS["📦 Container: GeoServer\n:8181 (WMS layers)"]
            ETL_C["📦 Container: ETL\nAPScheduler\n(background)"]
        end

        subgraph SUPABASE_EXT["☁️ Supabase (externo)"]
            SB_DB["PostgreSQL + PostGIS\nHosted Free Tier"]
            SB_AUTH["Supabase Auth\nJWT tokens"]
            SB_STORAGE["Supabase Storage\nPDFs + Shapefiles"]
        end
    end

    USER -->|HTTPS| NGINX
    NGINX -->|"/api/*"| BE
    NGINX -->|"/*"| FE
    NGINX -->|"/geoserver/*"| GS

    BE --> SB_DB
    BE --> SB_AUTH
    BE --> SB_STORAGE
    ETL_C --> SB_DB
```

---

## 11. Fluxo de Uso — Perspectiva do Geólogo

```mermaid
journey
    title Jornada do Geólogo no HidroScanner
    section Prospecção
      Acessa o sistema: 5: Geólogo
      Seleciona município no MT: 5: Geólogo
      Visualiza mapa de poços outorgados: 5: Geólogo
      Identifica área de déficit alto (heatmap): 5: Geólogo
    section Análise
      Clica na área prioritária: 5: Geólogo
      Lê estatísticas: poços outorgados vs estimados: 5: Geólogo
      Verifica potencial do aquífero (CPRM): 5: Geólogo
      Gera relatório PDF automático: 5: Geólogo
    section Captação
      Liga/visita proprietário da área: 5: Geólogo
      Apresenta relatório técnico: 5: Geólogo
      Propõe diagnóstico inicial (R$ 1.500): 4: Geólogo
    section Serviço
      Emite ART para serviço: 5: Geólogo
      Executa prospecção geofísica: 5: Geólogo
      Elabora relatório para outorga: 5: Geólogo
      Acompanha processo ANA/SEMA-MT: 4: Geólogo
      Recebe pagamento: 5: Geólogo
```

---

## 12. Catálogo de Serviços (o que fazer com o lead)

| Serviço | Descrição | Entregável | Duração | Valor (MT) |
|---------|-----------|------------|---------|-----------|
| **Diagnóstico Hidrogeológico** | Análise de dados públicos + parecer técnico inicial | Relatório 5-10p + ART | 3-5 dias | R$ 800 – R$ 2.000 |
| **Regularização de Poço** | Laudo técnico + relatório para processo de outorga | Relatório completo + ART + protocolo ANA/SEMA | 15-30 dias | R$ 4.000 – R$ 12.000 |
| **Locação de Poço Novo** | Levantamento geofísico + relatório de locação | Laudo geofísico + mapa de locação + ART | 3-7 dias campo | R$ 3.000 – R$ 8.000 |
| **Laudo de Qualidade da Água** | Acompanhamento de coleta + interpretação de análises | Relatório de qualidade + recomendações | 5-10 dias | R$ 1.500 – R$ 3.000 |
| **Relatório de Interferência** | Análise de conflito entre poços vizinhos | Parecer técnico | 5-10 dias | R$ 2.000 – R$ 5.000 |
| **Monitoramento Anual** | Visitas semestrais + relatório de acompanhamento | 2 relatórios/ano + ART | Contínuo | R$ 1.500 – R$ 4.000/ano |
| **Renovação de Outorga** | Processo de renovação antes do vencimento | Relatório + protocolo | 15-30 dias | R$ 2.500 – R$ 6.000 |
| **Mapeamento para Prefeituras** | Levantamento de poços no município | Mapa shapefile + relatório executivo | 30-60 dias | R$ 15.000 – R$ 50.000 |

---

## 13. Roadmap de Desenvolvimento

```mermaid
gantt
    title HidroScanner — Roadmap MVP
    dateFormat  YYYY-MM-DD
    section Fase 1 - Dados (MT)
    Coleta ANA SISAGUA MT           :a1, 2026-04-01, 7d
    Processamento CPRM Aquíferos MT :a2, after a1, 7d
    Carga no Supabase PostGIS       :a3, after a2, 5d
    section Fase 2 - Algoritmo
    Algoritmo de Déficit v1         :b1, after a3, 7d
    Cruzamento Aquíferos + Solo     :b2, after b1, 5d
    Gerador de Leads                :b3, after b2, 3d
    section Fase 3 - Frontend
    Mapa Leaflet básico             :c1, after b3, 7d
    Dashboard Chart.js              :c2, after c1, 5d
    Gerador PDF WeasyPrint          :c3, after c1, 7d
    section Fase 4 - Validação
    Teste com 3 clientes reais MT   :d1, after c3, 14d
    Ajuste do algoritmo             :d2, after d1, 7d
    section Fase 5 - Escala
    Pipeline ETL automatizado       :e1, after d2, 14d
    Módulo autenticação (multi-user):e2, after e1, 10d
    Expansão para demais estados    :e3, after e2, 30d
```

---

## 14. Estimativa de Custos e ROI

### Custo de Operação (mensal)

| Item | Custo |
|------|-------|
| VPS Linux (2vCPU, 4GB RAM) | R$ 80/mês |
| Supabase Free Tier | R$ 0 |
| Domínio .com.br | R$ 5/mês (anualizado) |
| **Total operacional** | **~R$ 85/mês** |

### ROI Estimado (Uso Interno — MT)

| Cenário | Leads/mês | Conversão | Contratos | Ticket médio | Receita |
|---------|-----------|-----------|-----------|-------------|---------|
| Conservador | 20 | 5% | 1 | R$ 8.000 | R$ 8.000 |
| Moderado | 50 | 10% | 5 | R$ 8.000 | R$ 40.000 |
| Otimista | 100 | 15% | 15 | R$ 8.000 | R$ 120.000 |

**ROI no cenário conservador:** 94x o custo mensal de operação.

---

## 15. Aspectos Legais e Normativos

| Tema | Regulamentação | Implicação para o Sistema |
|------|----------------|--------------------------|
| **Outorga de poços tubulares** | Lei 9.433/97 (PNRH) | Base legal do problema que o sistema resolve |
| **Competência federal/estadual** | Rios interestaduais = ANA; rios estaduais = SEMA-MT | Sistema deve distinguir as outorgadoras |
| **ART obrigatória** | Lei 6.496/77 + CFP/CREA | Todo relatório gerado deve indicar necessidade de ART |
| **LGPD** | Lei 13.709/18 | Dados de proprietários individuais requerem consentimento |
| **Acesso a dados públicos** | LAI (Lei 12.527/11) | Dados da ANA/CPRM/IBGE são de livre acesso e uso |
| **Penalidades por poço irregular** | Resolução ANA nº 707/2004 | Multa + interdição – argumento de venda |

> [!WARNING]
> O sistema deve ser enquadrado sempre como **"estimativa regional baseada em dados públicos"**, nunca como acusação individual de irregularidade. Os relatórios devem incluir disclaimer técnico.

---

## 16. Disclaimer Padrão para Relatórios

```
NOTA TÉCNICA IMPORTANTE:
As estimativas de déficit de outorgas apresentadas neste relatório são calculadas 
com base em dados públicos disponibilizados pela ANA, CPRM e IBGE, e representam 
uma análise estatística regional. NÃO constituem confirmação de irregularidade 
individual, infração administrativa ou acusação de qualquer natureza.

A regularização de poços deve ser avaliada caso a caso por profissional habilitado 
(geólogo/engenheiro de minas) com emissão de ART, conforme legislação vigente.

Elaborado por: [Nome do Geólogo] | CREA/CFP: [Número] | [Data]
```

---

*Documento gerado em: Março 2026*  
*Sistema: HidroScanner v1.0 — Mato Grosso Pilot*  
*Autor: Agrageo Consultoria*
