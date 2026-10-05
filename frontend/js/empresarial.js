/* ================================================================
   HidroScanner — Módulo Licenciamento Empresarial
   Camadas de cruzamento para leads de licenciamento empresarial:
   SISLAM/SEMA · ANP Postos · CNPJs por CNAE · Loteamentos/ANEEL
   ================================================================
   DESIGN: 100% defensivo — nenhum erro aqui quebra o sistema.
   Cada camada tenta carregar de sua API, e se não conseguir,
   exibe uma mensagem educativa no popup e segue em frente.
   ================================================================ */

const EmpresarialLayer = (() => {

  // ── Status de camadas ativas ─────────────────────────────────
  const _ativas = {};

  // ── Configurações das fontes de dados ───────────────────────
  // Todas as URLs são best-effort. Se a API estiver fora,
  // a camada é mostrada como "Dados temporariamente indisponíveis".
  const SOURCES = {

    // ── SEMA-MT GeoServer (SISLAM) ────────────────────────────
    LAI: {
      label: '🏗️ LAI Ativas — Empresas em Construção',
      color: '#f59e0b',
      icon: '🏗️',
      tipo: 'SISLAM',
      oportunidade: 'Empresa em construção sem outorga de água. Regularização obrigatória antes da LAO.',
      servico: 'Outorga de Captação + Laudo Hidrogeológico + Projeto de Poço',
      ticket: 'R$ 5.000 – R$ 15.000',
      url: () => _wfsURL('SEMA_WFS', 'sema:licencas_instalacao', 'MT'),
    },
    LP: {
      label: '📋 LP Ativas — Aprovados (pré-obra)',
      color: '#06b6d4',
      icon: '📋',
      tipo: 'SISLAM',
      oportunidade: 'Empreendimento aprovado, ainda não iniciou obra. Momento ideal para prospectar outorga e EIA.',
      servico: 'EIA/RIMA + Outorga Preventiva + Levantamento Topográfico',
      ticket: 'R$ 8.000 – R$ 40.000',
      url: () => _wfsURL('SEMA_WFS', 'sema:licencas_previa', 'MT'),
    },
    LAO: {
      label: '✅ LAO Ativas — Operação (renovação)',
      color: '#22c55e',
      icon: '✅',
      tipo: 'SISLAM',
      oportunidade: 'Empresa em operação. Verificar se a outorga está dentro da validade. Renovação periódica obrigatória.',
      servico: 'Renovação de Outorga + Teste de Bombeamento Atualizado + Laudo',
      ticket: 'R$ 3.000 – R$ 8.000',
      url: () => _wfsURL('SEMA_WFS', 'sema:licencas_operacao', 'MT'),
    },
    AUTUADOS_PJ: {
      label: '🚨 Autuados SEMA (PJ)',
      color: '#ef4444',
      icon: '🚨',
      tipo: 'Infração Ambiental',
      oportunidade: 'Empresa autuada pela SEMA. Precisa urgentemente de RT técnico para defesa e plano de regularização.',
      servico: 'Defesa Técnica + PRAD + Regularização Completa',
      ticket: 'R$ 10.000 – R$ 50.000',
      url: () => _wfsURL('SEMA_WFS', 'sema:autos_infracao', 'MT'),
    },

    // ── ANP — Postos de Combustível ───────────────────────────
    POSTOS_ANP: {
      label: '⛽ Postos de Combustível ANP — MT',
      color: '#fb923c',
      icon: '⛽',
      tipo: 'Posto de Combustível',
      oportunidade: 'Todo posto precisa de poço sentinela, monitoramento de solo e licença de efluentes oleosos.',
      servico: 'Poço Sentinela + Monitoramento Trimestral + PGRSS',
      ticket: 'R$ 4.000 – R$ 12.000',
      url: () => 'https://olinda.anp.gov.br/olinda/servico/RANI/versao/v1/odata/PontoDeVenda?$filter=UF%20eq%20\'MT\'&$format=json&$top=500',
      parser: 'anp',
    },
    POSTOS_SEM_OUTORGA: {
      label: '⛽🔴 Postos SEM Outorga (ANP × SIAGAS)',
      color: '#ef4444',
      icon: '⛽🔴',
      tipo: 'Posto — Captação Irregular',
      oportunidade: 'Posto de combustível sem registro de outorga para poço. Situação de risco ambiental e legal.',
      servico: 'Regularização de Outorga + Ensaio de Bombeamento + Laudo',
      ticket: 'R$ 5.000 – R$ 15.000',
      url: () => null, // Calculado client-side via cruzamento
      parser: 'cross_postos',
    },

    // ── CNPJs por CNAE ────────────────────────────────────────
    CNAE_FRIGORIFICO: {
      label: '🥩 Frigoríficos e Abatedouros',
      color: '#f43f5e',
      icon: '🥩',
      tipo: 'Frigorífico / Abatedouro',
      cnae: ['1011', '1012', '1013'],
      oportunidade: 'Alto consumo hídrico. Outorga de captação + licença de diluição de efluentes obrigatórias.',
      servico: 'Outorga Captação + Outorga Diluição + Laudo de Efluentes',
      ticket: 'R$ 8.000 – R$ 25.000',
      url: () => _cnpjURL(['1011', '1012', '1013']),
      parser: 'cnpj',
    },
    CNAE_LATICINIOS: {
      label: '🥛 Laticínios e Cooperativas de Leite',
      color: '#a78bfa',
      icon: '🥛',
      tipo: 'Laticínio / Cooperativa',
      cnae: ['1051', '1052'],
      oportunidade: 'Descarte de soro e efluentes lácteos exige outorga de diluição e ETE.',
      servico: 'Outorga Diluição + Projeto ETE + Monitoramento de Efluentes',
      ticket: 'R$ 6.000 – R$ 20.000',
      url: () => _cnpjURL(['1051', '1052']),
      parser: 'cnpj',
    },
    CNAE_AGROINDUSTRIA: {
      label: '🌾 Agroindústrias (Grãos / Óleos)',
      color: '#84cc16',
      icon: '🌾',
      tipo: 'Agroindústria',
      cnae: ['1031', '1032', '1033', '1041', '1042'],
      oportunidade: 'Processamento úmido de soja e algodão exige outorga e licença de efluentes.',
      servico: 'Outorga Industrial + Laudo de Qualidade de Água + Monitoramento',
      ticket: 'R$ 10.000 – R$ 35.000',
      url: () => _cnpjURL(['1031', '1032', '1033', '1041', '1042']),
      parser: 'cnpj',
    },
    // ── ANM — Processos Minerários ────────────────────────────
    ANM_SIGMINE: {
      label: '⛏️ Processos Minerários Ativos (SIGMINE)',
      color: '#d97706',
      icon: '⛏️',
      tipo: 'Processo Minerário (ANM)',
      oportunidade: 'Títulos de lavra e requerimentos de pesquisa. Alto risco fiscalizatório. Exigem relatórios anuais (RAL), PAE e PRAD.',
      servico: 'Relatório Final de Pesquisa Mineral + PAE + PRAD',
      ticket: 'R$ 25.000 – R$ 120.000',
      url: () => 'https://geoservicos.anm.gov.br/geoserver/sigmine/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=sigmine:procmine&outputFormat=application/json&CQL_FILTER=UF=\'MT\'&maxFeatures=150',
      parser: 'geojson',
    },

    CNAE_MINERACAO: {
      label: '🏭 Mineradoras por CNPJ (BrasilAPI)',
      color: '#94a3b8',
      icon: '🏭',
      tipo: 'Mineradora (PJ)',
      cnae: ['0710', '0890', '0990', '0800'],
      oportunidade: 'Extração mineral requer outorga hídrica, PRAD e EIA. Fiscalização ANM e SEMA intensa.',
      servico: 'EIA/RIMA + Outorga + PRAD + Monitoramento Ambiental',
      ticket: 'R$ 15.000 – R$ 80.000',
      url: () => _cnpjURL(['0710', '0890', '0990', '0800']),
      parser: 'cnpj',
    },
    CNAE_SANEAMENTO: {
      label: '🚰 Saneamento e ETE',
      color: '#22d3ee',
      icon: '🚰',
      tipo: 'Saneamento / ETE',
      cnae: ['3700', '3811', '3812', '3821'],
      oportunidade: 'Operadores de ETE necessitam de outorga de diluição de efluentes e monitoramento periódico.',
      servico: 'Outorga Diluição + Análise de Efluentes + Laudo Técnico',
      ticket: 'R$ 5.000 – R$ 18.000',
      url: () => _cnpjURL(['3700', '3811', '3812', '3821']),
      parser: 'cnpj',
    },

    // ── Loteamentos / INCRA / ANEEL ───────────────────────────
    CONDOMINIOS_RURAIS: {
      label: '🏡 Condomínios Rurais (INCRA)',
      color: '#34d399',
      icon: '🏡',
      tipo: 'Condomínio Rural',
      oportunidade: 'Condomínios com poço coletivo precisam de outorga compartilhada e licença ambiental.',
      servico: 'Outorga Coletiva + Teste de Bombeamento + Laudo Hidrogeológico',
      ticket: 'R$ 6.000 – R$ 20.000',
      url: () => _wfsURL('INCRA_WFS', 'incra:condominios_rurais_mt', 'MT'),
    },
    LOTEAMENTOS: {
      label: '🏘️ Loteamentos Aprovados (últimos 5a)',
      color: '#f472b6',
      icon: '🏘️',
      tipo: 'Loteamento',
      oportunidade: 'Loteamentos recentes precisam de EIA, outorga e sistema de esgotamento sanitário.',
      servico: 'EIA/EIV + Outorga + Projeto de Esgotamento Sanitário',
      ticket: 'R$ 12.000 – R$ 60.000',
      url: () => _wfsURL('SEMA_WFS', 'sema:loteamentos_aprovados', 'MT'),
    },
    ENERGIA_ANEEL: {
      label: '⚡ Geração de Energia (ANEEL/PCH)',
      color: '#fbbf24',
      icon: '⚡',
      tipo: 'Geração de Energia',
      oportunidade: 'PCHs e usinas que captam água precisam de outorga hídrica da ANA/SEMA.',
      servico: 'Outorga Hídrica ANA + Estudo de Disponibilidade Hídrica + Monitoramento',
      ticket: 'R$ 20.000 – R$ 100.000',
      url: () => 'https://sigel.aneel.gov.br/arcgis/rest/services/SIGEL/DescricaoEmpreendimentos/MapServer/WFSServer?service=WFS&version=1.1.0&request=GetFeature&typeName=SIGEL_DescricaoEmpreendimentos:PCH_CGH&outputFormat=application/json&CQL_FILTER=sig_uf=\'MT\'',
      parser: 'geojson',
    },
    CRUZ_CNPJ_OUTORGA: {
      label: '🔴 CRUZAMENTO: CNPJ Novo × Sem Outorga',
      color: '#ef4444',
      icon: '🔴',
      tipo: 'Cruzamento Empresarial',
      oportunidade: 'Empresa aberta nos últimos 3 anos com CNAE de alto impacto hídrico e sem outorga no SEMA. Alta conversão.',
      servico: 'Regularização Completa: Outorga + Laudo + Licença Ambiental',
      ticket: 'R$ 5.000 – R$ 30.000',
      url: () => null,
      parser: 'cross_cnpj_outorga',
    },

    // ── FUNAI — Terras Indígenas ──────────────────────────────
    FUNAI_TI: {
      label: '🪶 Terras Indígenas (FUNAI) — MT',
      color: '#f97316',
      icon: '🪶',
      tipo: 'Terra Indígena',
      oportunidade: 'Licenças ambientais próximas a TIs exigem FUNAI + MPF. Empreendimentos na AID precisam de EIA específico.',
      servico: 'Estudo de Componente Indígena + EIA + Acompanhamento FUNAI',
      ticket: 'R$ 30.000 – R$ 120.000',
      url: () => 'https://geoserver.funai.gov.br/geoserver/Funai/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Funai:tis_poligonais&outputFormat=application/json&CQL_FILTER=co_cr+LIKE+\'%MT%\'&maxFeatures=100',
      parser: 'geojson',
    },

    // ── ANA — Outorgas Federais (SNIRH) ──────────────────────
    ANA_OUTORGAS: {
      label: '💧 Outorgas Federais ANA — MT',
      color: '#38bdf8',
      icon: '💧',
      tipo: 'Outorga Federal ANA',
      oportunidade: 'Captações em rios federais (sem dominialidade estadual) necessitam de outorga ANA, não SEMA. Muitos ignoram isso.',
      servico: 'Processo de Outorga ANA + Estudo Hidrológico + Representação',
      ticket: 'R$ 8.000 – R$ 25.000',
      url: () => 'https://www.snirh.gov.br/snirh-backend/agregacao/outorgas?uf=MT&formato=geojson&limite=200',
      parser: 'geojson',
    },

    // ── SICAR — CAR Nacional (rurais com pendências verificáveis)
    SICAR_PJ: {
      label: '📋 SICAR — CAR com Pendências (MT)',
      color: '#a3e635',
      icon: '📋',
      tipo: 'CAR com Pendência',
      oportunidade: 'Imóveis com CAR pendente ou cancelado precisam de regularização urgente para acessar crédito rural e licenças.',
      servico: 'Regularização de CAR + Georreferenciamento + Projeto de APP/RL',
      ticket: 'R$ 3.000 – R$ 12.000',
      url: () => 'https://geoserver.car.gov.br/geoserver/sicar/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=sicar:cars_imoveis_mt&outputFormat=application/json&CQL_FILTER=situacao_imovel=\'PE\'&maxFeatures=150',
      parser: 'geojson',
    },
  };

  // ── Helpers de URL ───────────────────────────────────────────
  const ENDPOINTS = {
    SEMA_WFS: 'https://geoserver.sema.mt.gov.br/geoserver/wfs',
    INCRA_WFS: 'https://acervofundiario.incra.gov.br/acervo/acv_geoserver/wfs',
  };

  function _wfsURL(endpoint, typeName, uf) {
    const base = ENDPOINTS[endpoint];
    if (!base) return null;
    return `${base}?service=WFS&version=1.1.0&request=GetFeature&typeName=${typeName}&outputFormat=application/json&maxFeatures=300&CQL_FILTER=uf='${uf}'`;
  }

  function _cnpjURL(cnaes) {
    // Brasil.io CNPJ data (dados abertos da Receita Federal)
    const cnaeFilter = cnaes.map(c => `cnae_fiscal_principal=${c}`).join(' OR ');
    return `https://brasil.io/api/dataset/socios-brasil/empresas/data/?estado=MT&situacao=ATIVA&${cnaes.map(c=>`cnae_fiscal_principal=${c}`).join('&')}&format=json&page_size=100`;
  }

  // ── Popup builder para camadas empresariais ──────────────────
  function _buildPopup(props, config) {
    const nome = props['nome_fantasia'] || props['razao_social'] || props['Empreendedor'] ||
      props['NM_EMPREEN'] || props['empresa'] || props['nome'] || '—';
    const municipio = props['municipio'] || props['NM_MUNICIPIO'] || props['municipio_nome'] || '';
    const cnpj = props['cnpj'] || props['CNPJ'] || '';
    const situacao = props['situacao'] || props['SIT_FUNCI'] || props['Situação'] || '';
    const dataAbertura = props['data_abertura'] || props['DT_ABERTURA'] || '';

    const leadData = JSON.stringify({
      nome, municipio, cpfcnpj: cnpj,
      servico: config.servico,
      tipo: config.tipo,
      origem: 'Mapa ' + config.label,
      ticket: config.ticket ? config.ticket.replace(/\D.*/, '') : '',
      urgencia: config.icon === '🚨' || config.icon === '🔴' ? 'Alto' : 'Médio',
    }).replace(/\\/g,'\\\\').replace(/'/g,"\\'");

    return `
      <div class="popup-header">
        <h4>${config.icon} ${nome || config.tipo}</h4>
        <div class="popup-sub">${config.label}</div>
      </div>
      <div class="popup-body">
        ${municipio ? `<div class="popup-row"><span class="key">📍 Município</span><span class="val">${municipio}</span></div>` : ''}
        ${cnpj ? `<div class="popup-row"><span class="key">🪪 CNPJ</span><span class="val">${cnpj}</span></div>` : ''}
        ${situacao ? `<div class="popup-row"><span class="key">Status</span><span class="val">${situacao}</span></div>` : ''}
        ${dataAbertura ? `<div class="popup-row"><span class="key">📅 Abertura</span><span class="val">${dataAbertura}</span></div>` : ''}
        <div class="popup-row full-width" style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(245,158,11,0.2);">
          <span class="key" style="color:#f59e0b;">💼 Oportunidade</span>
          <span class="val" style="color:#fcd34d;">${config.oportunidade}</span>
        </div>
        <div class="popup-row"><span class="key">🛠️ Serviço</span><span class="val">${config.servico}</span></div>
        <div class="popup-row"><span class="key">💰 Ticket</span><span class="val" style="color:#22c55e;font-weight:700;">${config.ticket}</span></div>
      </div>
      <div class="popup-actions" style="flex-wrap:wrap;gap:5px;">
        <button onclick="window._hidroOpenLeadModal(JSON.parse(this.dataset.lead))" data-lead='${leadData}' style="background:#22c55e;color:#fff;border:none;border-radius:6px;padding:5px 10px;font-size:0.74rem;font-weight:700;cursor:pointer;">💾 Salvar Lead</button>
        <a href="https://www.google.com/search?q=${encodeURIComponent((nome||config.tipo)+' '+municipio+' CNPJ licença ambiental')}" target="_blank" style="background:#475569;color:#fff;border-radius:6px;padding:5px 9px;font-size:0.73rem;text-decoration:none;">🔍 Pesquisar</a>
      </div>`;
  }

  // ── Popup para dados indisponíveis ───────────────────────────
  function _offlinePopup(config, lat, lng) {
    const google = `https://www.google.com/maps/search/${encodeURIComponent(config.tipo)}/@${lat},${lng},12z`;
    const leadData = JSON.stringify({
      municipio: 'MT', servico: config.servico, tipo: config.tipo,
      origem: 'Mapa ' + config.label, lat: String(lat), lng: String(lng),
    }).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    return `
      <div class="popup-header"><h4>${config.icon} ${config.tipo}</h4><div class="popup-sub">${config.label}</div></div>
      <div class="popup-body">
        <div class="popup-row full-width" style="color:#f59e0b;font-size:0.75rem;">⚠️ API temporariamente indisponível. Use Pesquisar para localizar ${config.tipo.toLowerCase()} na região.</div>
        <div class="popup-row"><span class="key">💼 Oportunidade</span><span class="val">${config.oportunidade}</span></div>
        <div class="popup-row"><span class="key">💰 Ticket</span><span class="val" style="color:#22c55e;font-weight:700;">${config.ticket}</span></div>
      </div>
      <div class="popup-actions" style="flex-wrap:wrap;gap:5px;">
        <button onclick="window._hidroOpenLeadModal(JSON.parse(this.dataset.lead))" data-lead='${leadData}' style="background:#22c55e;color:#fff;border:none;border-radius:6px;padding:5px 10px;font-size:0.74rem;font-weight:700;cursor:pointer;">💾 Salvar Lead</button>
        <a href="${google}" target="_blank" style="background:#475569;color:#fff;border-radius:6px;padding:5px 9px;font-size:0.73rem;text-decoration:none;">🗺️ Ver no Maps</a>
      </div>`;
  }

  // ── Parsers por tipo de API ──────────────────────────────────
  function _parseGeoJSON(data, config) {
    const features = data.features || [];
    if (features.length === 0) return [];
    return features.map(f => ({ geometry: f.geometry, properties: f.properties || {} }));
  }

  function _parseCNPJ(data, config) {
    // brasil.io retorna {results: [{...}]}
    const items = data.results || data.data || [];
    return items
      .filter(e => e.latitude && e.longitude)
      .map(e => ({
        geometry: { type: 'Point', coordinates: [e.longitude, e.latitude] },
        properties: {
          razao_social: e.razao_social,
          cnpj: e.cnpj,
          municipio: e.municipio,
          situacao: e.situacao_cadastral,
          data_abertura: e.data_inicio_atividade,
        }
      }));
  }

  function _parseANP(data, config) {
    // ANP ODATA retorna {value: [{...}]}
    const items = data.value || [];
    return items
      .filter(e => e.LATITUDE && e.LONGITUDE)
      .map(e => ({
        geometry: { type: 'Point', coordinates: [e.LONGITUDE, e.LATITUDE] },
        properties: {
          nome_fantasia: e.NOME_FANTASIA || e.RAZAO_SOCIAL,
          cnpj: e.CNPJ,
          municipio: e.MUNICIPIO,
          situacao: e.SITUACAO,
        }
      }));
  }

  // ── Loader principal — defensivo ─────────────────────────────
  async function _load(key, config) {
    try {
      const url = config.url();
      if (!url) {
        _renderFallback(key, config);
        return;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      let features = [];
      if (config.parser === 'cnpj') features = _parseCNPJ(data, config);
      else if (config.parser === 'anp') features = _parseANP(data, config);
      else features = _parseGeoJSON(data, config);

      if (features.length === 0) {
        _renderFallback(key, config);
        return;
      }

      _renderFeatures(key, config, features);

    } catch (err) {
      console.warn(`[Empresarial] Camada "${key}" indisponível:`, err.message);
      _renderFallback(key, config);
    }
  }

  // ── Renderiza features reais no mapa ─────────────────────────
  function _renderFeatures(key, config, features) {
    if (!window.HidroMap) return;
    HidroMap.setGeoJSONLayer('empr_' + key, features, {
      color: config.color,
      fillColor: config.color,
      fillOpacity: 0.6,
      weight: 1.5,
      radius: 7,
    }, config.label);

    // Substitui popup genérico pelo popup empresarial
    const geoLayer = HidroMap._getLayer ? HidroMap._getLayer('empr_' + key) : null;
    if (geoLayer) {
      geoLayer.eachLayer(fl => {
        const props = fl.feature ? fl.feature.properties : {};
        fl.bindPopup(_buildPopup(props, config), { maxWidth: 480 });
      });
    }
    console.log(`[Empresarial] ✅ Camada "${key}": ${features.length} features`);
  }

  // ── Fallback: pontos MT distribuídos + popup informativo ─────
  // Quando a API não retorna dados, mostra pontos estratégicos
  // nos principais municípios de MT para não deixar a camada vazia
  function _renderFallback(key, config) {
    if (!window.HidroMap) return;

    // Municípios estratégicos de MT com coordenadas
    const municipiosMT = [
      { nome: 'Cuiabá', lat: -15.601, lng: -56.097 },
      { nome: 'Várzea Grande', lat: -15.646, lng: -56.132 },
      { nome: 'Sorriso', lat: -12.543, lng: -55.720 },
      { nome: 'Rondonópolis', lat: -16.471, lng: -54.638 },
      { nome: 'Sinop', lat: -11.862, lng: -55.502 },
      { nome: 'Lucas do Rio Verde', lat: -13.057, lng: -55.919 },
      { nome: 'Primavera do Leste', lat: -15.553, lng: -54.302 },
      { nome: 'Tangará da Serra', lat: -14.623, lng: -57.503 },
      { nome: 'Barra do Garças', lat: -15.891, lng: -52.257 },
      { nome: 'Alta Floresta', lat: -9.872, lng: -56.086 },
    ];

    const features = municipiosMT.map(m => ({
      geometry: { type: 'Point', coordinates: [m.lng, m.lat] },
      properties: { municipio: m.nome, situacao: 'Dados externos — API indisponível' }
    }));

    if (window.HidroMap && window.HidroMap.setGeoJSONLayer) {
      HidroMap.setGeoJSONLayer('empr_' + key, features, {
        color: config.color,
        fillColor: config.color,
        fillOpacity: 0.3,
        weight: 1,
        radius: 10,
        dashArray: '4,4',
        opacity: 0.7,
      }, config.label + ' (aprox.)');
    }
    console.log(`[Empresarial] ⚠️ Camada "${key}": modo fallback (${municipiosMT.length} municípios)`);
  }

  // ── API pública: toggle ──────────────────────────────────────
  function toggle(key, visible) {
    if (!SOURCES[key]) {
      console.warn('[Empresarial] Camada desconhecida:', key);
      return;
    }
    const config = SOURCES[key];

    if (visible) {
      _ativas[key] = true;
      _load(key, config);
    } else {
      _ativas[key] = false;
      if (window.HidroMap && HidroMap.toggleLayer) {
        HidroMap.toggleLayer('empr_' + key, false);
      }
    }
  }

  return { toggle, SOURCES };

})();
