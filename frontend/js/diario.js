/* ================================================================
   HidroScanner — Módulo Diário Oficial MT (DIOE)
   Fonte: Querido Diário API (Open Knowledge Brasil)
   API: https://api.queridodiario.ok.org.br
   ================================================================
   v2.0 — Smart Filtering:
   · Detecta publicações "já resolvidas" e oculta automaticamente
   · Filtro por Perfil Profissional (execução técnica vs. gestão)
   · Padrão de busca: apenas 30 dias (certeiro)
   ================================================================ */

const DiarioOficial = (() => {

  const API = 'https://api.queridodiario.ok.org.br';

  // IDs de território MT no Querido Diário (IBGE 7 dígitos)
  const MT_TERRITORIES = [
    '5100250', // Acorizal
    '5103403', // Cuiabá
    '5108402', // Várzea Grande
    '5107925', // Sorriso
    '5107602', // Rondonópolis
    '5107909', // Sinop
    '5105903', // Lucas do Rio Verde
    '5106422', // Primavera do Leste
    '5107701', // Tangará da Serra
    '5101209', // Alta Floresta
    '5101506', // Barra do Garças
    '5106455', // Sapezal
    '5107149', // Nova Mutum
    '5103254', // Campo Verde
    '5101803', // Cáceres
    '5107859', // Tapurah
  ];

  const MT_STATE_TERRITORY = '5100000';

  // Filtro ativo atual
  let _filtroAtivo = { query: 'autuado SEMA ambiental', id: 'autuado_sema' };
  let _buscando = false;

  // ── PALAVRAS-CHAVE que indicam dívida/problema JÁ RESOLVIDO ──
  // ══════════════════════════════════════════════════════════════
  // SISTEMA DE PONTUAÇÃO DE CONFIANÇA (Confidence Score 0–100)
  // Elimina falsos positivos com análise por peso, não binária:
  //   · Score ≥ 60 → "⚡ EM ABERTO" (oportunidade real, mostrar)
  //   · Score 35–59 → "⚠️ VERIFICAR" (dúvida, mostrar discreto)
  //   · Score < 35 → descartado silenciosamente (provável histórico/resolvido)
  // ══════════════════════════════════════════════════════════════

  // ── Sinais POSITIVOS de caso aberto (somam pontos) ───────────
  const SINAIS_ABERTO = [
    // Sinais fortes (+25 pts) — ação imediata / sanção
    { termo: 'auto de infração',             peso: 25 },
    { termo: 'auto de infracão',             peso: 25 },
    { termo: 'notificação de infração',      peso: 25 },
    { termo: 'lavratura do auto',            peso: 25 },
    { termo: 'aplicação de multa',           peso: 25 },
    { termo: 'embargo foi imposto',          peso: 25 },
    { termo: 'fica interditad',              peso: 25 },
    { termo: 'prazo improrrogável',          peso: 25 },
    { termo: 'deverá regularizar',           peso: 25 },
    { termo: 'sob pena de interdição',       peso: 25 },
    { termo: 'sob pena de multa',            peso: 25 },
    { termo: 'sob pena de embargo',          peso: 25 },
    { termo: 'sob pena de indeferimento',    peso: 25 },
    { termo: 'sob pena de cancelamento',     peso: 25 },
    { termo: 'prazo peremptório',            peso: 25 },
    { termo: 'prazo de 30',                  peso: 22 },
    { termo: 'prazo de 60',                  peso: 22 },
    { termo: 'prazo de 90',                  peso: 22 },
    { termo: 'prazo de 15',                  peso: 20 },
    { termo: 'intimado a',                   peso: 20 },
    { termo: 'notificado a',                 peso: 20 },
    { termo: 'prazo de',                     peso: 18 },
    // Sinais médios (+15 pts) — linguagem de pendência ativa
    { termo: 'notificação',                  peso: 15 },
    { termo: 'intimação',                    peso: 15 },
    { termo: 'autuação',                     peso: 15 },
    { termo: 'embargo',                      peso: 15 },
    { termo: 'irregularidade',               peso: 15 },
    { termo: 'infração ambiental',           peso: 15 },
    { termo: 'suspensão de licença',         peso: 15 },
    { termo: 'prazo para',                   peso: 12 },
    { termo: 'multad',                       peso: 15 },
    { termo: 'inadimplente',                 peso: 15 },
    { termo: 'pendente',                     peso: 10 },
    { termo: 'pendência',                    peso: 10 },
    { termo: 'ofício de pendência',          peso: 20 },
    { termo: 'oficio de pendencia',          peso: 20 },
    { termo: 'aguardando protocolo',         peso: 18 },
    { termo: 'aguardando responsável',       peso: 18 },
    { termo: 'atendimento integral',         peso: 15 },
    { termo: 'termo de intimação',           peso: 18 },
    { termo: 'termo de notificação',         peso: 18 },
    { termo: 'edital de intimação',          peso: 18 },
    { termo: 'inércia',                      peso: 15 },
    { termo: 'arquivamento definitivo',      peso: 15 },
    // Municipais — Obras e Uso do Solo
    { termo: 'alvará vencido',               peso: 22 },
    { termo: 'alvará expirado',              peso: 22 },
    { termo: 'alvará vence',                 peso: 20 },
    { termo: 'sem alvará',                   peso: 20 },
    { termo: 'sem habite-se',                peso: 20 },
    { termo: 'habite-se pendente',           peso: 20 },
    { termo: 'habite-se não emitido',        peso: 20 },
    { termo: 'construção irregular',         peso: 20 },
    { termo: 'construção sem licença',       peso: 20 },
    { termo: 'obra irregular',               peso: 20 },
    { termo: 'obra sem licença',             peso: 20 },
    { termo: 'uso irregular do solo',        peso: 18 },
    { termo: 'uso do solo em desacordo',     peso: 18 },
    { termo: 'parcelamento irregular',       peso: 18 },
    { termo: 'loteamento irregular',         peso: 18 },
    { termo: 'embargo de obra',              peso: 22 },
    { termo: 'auto de embargo',              peso: 22 },
    { termo: 'auto de demolição',            peso: 25 },
    { termo: 'ordem de demolição',           peso: 25 },
    { termo: 'regularização de imóvel',      peso: 18 },
    // Municipais — Fiscal / Tributário
    { termo: 'débito tributário',            peso: 15 },
    { termo: 'iptu em atraso',               peso: 18 },
    { termo: 'iptu inadimplente',            peso: 18 },
    { termo: 'divida ativa',                 peso: 18 },
    { termo: 'dívida ativa',                 peso: 18 },
    { termo: 'inscrição em dívida',          peso: 18 },
    { termo: 'cobrança de débito',           peso: 15 },
    { termo: 'notificação fiscal',           peso: 18 },
    { termo: 'auto de infração fiscal',      peso: 22 },
    // Ambiental Geral
    { termo: 'irregul',                      peso:  8 },
    { termo: 'sem licença',                  peso: 10 },
    { termo: 'não possui outorga',           peso: 15 },
    { termo: 'sem outorga',                  peso: 15 },
    { termo: 'clandestino',                  peso: 15 },
    { termo: 'clandestina',                  peso: 15 },
    { termo: 'ilegal',                       peso:  8 },
    { termo: 'descumprimento',               peso: 15 },
    { termo: 'não cumprimento',              peso: 15 },
    { termo: 'responsável técnico',          peso: 12 },
    { termo: 'rt pendente',                  peso: 18 },
  ];


  // ── Sinais NEGATIVOS de resolução (subtraem pontos) ──────────
  const SINAIS_RESOLVIDO = [
    // Sinais fortes (-30 pts cada) — resolução explícita
    { termo: 'devidamente regularizado',  peso: 30 },
    { termo: 'pendência sanada',          peso: 30 },
    { termo: 'infração sanada',           peso: 30 },
    { termo: 'multa quitada',             peso: 30 },
    { termo: 'multa cancelada',           peso: 30 },
    { termo: 'embargo levantado',         peso: 30 },
    { termo: 'embargo cancelado',         peso: 30 },
    { termo: 'recurso provido',           peso: 30 },
    { termo: 'recurso deferido',          peso: 30 },
    { termo: 'extinção do processo',      peso: 30 },
    { termo: 'tac cumprido',              peso: 30 },
    { termo: 'cumprimento integral',      peso: 30 },
    { termo: 'desinterdição',             peso: 30 },
    { termo: 'pagamento da multa',        peso: 25 },
    { termo: 'acordo celebrado',          peso: 25 },
    { termo: 'licença concedida',         peso: 20 },
    // Sinais médios (-15 pts cada)
    { termo: 'quitad',                    peso: 20 },
    { termo: 'cancelad',                  peso: 15 },
    { termo: 'anulad',                    peso: 15 },
    { termo: 'cassad',                    peso: 15 },
    { termo: 'arquivad',                  peso: 15 },
    { termo: 'encerrad',                  peso: 12 },
    { termo: 'concluíd',                  peso: 12 },
    // Sinais leves (-8 pts cada) — podem estar em contextos distintos
    { termo: 'regularizad',              peso:  8 },
    { termo: 'aprovad',                  peso:  6 },
  ];

  // ── Calcula pontuação de confiança do excerto ─────────────────
  function _scoreConfianca(excerto) {
    const t = excerto.toLowerCase();
    let score = 0;
    SINAIS_ABERTO.forEach(s => { if (t.includes(s.termo)) score += s.peso; });
    SINAIS_RESOLVIDO.forEach(s => { if (t.includes(s.termo)) score -= s.peso; });
    return Math.max(0, Math.min(100, score));
  }


  // ── Perfis Profissionais ──────────────────────────────────────
  // Mapa: perfil => lista de tipoKeys que se enquadram no perfil
  const PERFIS = {
    'todos': null, // null = sem filtro de perfil
    'execucao': [
      // Serviços que o usuário executa diretamente (geologia, hidrogeologia, topo, geo)
      'autuado', 'multa', 'embargo', 'interdição', 'licença instalação',
      'licença prévia', 'licença operação', 'renovação', 'outorga',
      'outorga diluição', 'poço tubular', 'qualidade água', 'prad',
      'geologia', 'lavra', 'pesquisa mineral', 'garimpo', 'anm',
      'app', 'supressão vegetal', 'car',
      // Topografia & Geoprocessamento
      'topografia', 'pericia_topo', 'georref_incra', 'reurb',
      'desapropriacao', 'drone_orto', 'divisao_imovel', 'usucapiao',
      // Novos perfis adicionados
      'irrigacao', 'aguas_sub', 'licenciamento', 'poco_irr', 'outorga_poco', 
      'teste_vazao', 'rebaixamento', 'ete_irr', 'efluente', 'lic_vencida',
    ],
    'gestao': [
      // Serviços que pode gerenciar/coordenar terceiros
      'eia', 'tac', 'compensação', 'bacia hidrográfica', 'crime ambiental',
      'apreensão', 'notificacao_fiscal', 'recurso_adm', 'credenciamento', 'default',
    ],
  };

  let _perfilAtivo = 'todos'; // perfil selecionado
  let _ocultarResolvidos = true; // padrão: oculta resolvidos automaticamente

  // ── Configuração de cada tipo de publicação ──────────────────
  const TIPO_CONFIG = {
    // Licenciamento Ambiental
    'autuado':            { icon:'🚨', cor:'#ef4444',  label:'Autuação Ambiental',       perfil:'execucao', urgencia:'🔴 URGENTE',  servico:'Defesa Técnica + PRAD + Regularização Completa',                ticket:'10000' },
    'licença instalação': { icon:'🏗️', cor:'#f59e0b',  label:'LAI Deferida',             perfil:'execucao', urgencia:'🟡 Médio',    servico:'Outorga de Captação + Laudo Hidrogeológico + Projeto de Poço', ticket:'8000'  },
    'licença prévia':     { icon:'📋', cor:'#06b6d4',  label:'LP Deferida',              perfil:'execucao', urgencia:'🟡 Médio',    servico:'EIA/RIMA + Projeto de Outorga + Topografia',                    ticket:'15000' },
    'licença operação':   { icon:'✅', cor:'#22c55e',  label:'LAO',                      perfil:'execucao', urgencia:'🟢 Baixo',    servico:'Renovação de Outorga + Teste de Bombeamento + Laudo',           ticket:'5000'  },
    'renovação':          { icon:'🔁', cor:'#f47242',  label:'Renovação LAO',            perfil:'execucao', urgencia:'🟡 Médio',    servico:'Renovação de Licença + Atualização de Outorga',                 ticket:'4000'  },
    'eia':                { icon:'📊', cor:'#a78bfa',  label:'EIA / RIMA',               perfil:'gestao',   urgencia:'🟡 Médio',    servico:'Apoio Técnico EIA + Complementações + Audiência Pública',       ticket:'20000' },
    'tac':                { icon:'🤝', cor:'#fb923c',  label:'TAC Ambiental',            perfil:'gestao',   urgencia:'🔴 URGENTE',  servico:'Elaboração de TAC + PRAD + Monitoramento de Cumprimento',       ticket:'8000'  },
    'compensação':        { icon:'♻️', cor:'#34d399',  label:'Compensação Ambiental',    perfil:'gestao',   urgencia:'🟢 Baixo',    servico:'Cálculo e Destinação de Compensação Ambiental',                 ticket:'5000'  },
    // Recursos Hídricos
    'outorga':            { icon:'💧', cor:'#3b82f6',  label:'Outorga Hídrica',          perfil:'execucao', urgencia:'🟡 Médio',    servico:'Processo de Outorga + Laudo Técnico + Ensaio de Bombeamento',  ticket:'6000'  },
    'outorga diluição':   { icon:'🚰', cor:'#818cf8',  label:'Outorga de Diluição',      perfil:'execucao', urgencia:'🟡 Médio',    servico:'Estudo de Autodepuração + Licença de Efluentes + PGRS',         ticket:'9000'  },
    'poço tubular':       { icon:'🕳️', cor:'#22d3ee',  label:'Poço Tubular',             perfil:'execucao', urgencia:'🟡 Médio',    servico:'Cadastro de Poço + Regularização + Outorga + Laudo Geológico', ticket:'5500'  },
    'qualidade água':     { icon:'🔬', cor:'#0ea5e9',  label:'Qualidade da Água',        perfil:'execucao', urgencia:'🟡 Médio',    servico:'Análise Físico-Química + Monitoramento + Laudo de Potabilidade',ticket:'4000'  },
    'bacia hidrográfica': { icon:'🏞️', cor:'#2dd4bf',  label:'Bacia Hidrográfica',       perfil:'gestao',   urgencia:'🟢 Baixo',    servico:'Estudos Hidrológicos + Planos de Bacia + Representação CBH',   ticket:'12000' },
    // Mineração / Geologia
    'lavra':              { icon:'⛏️', cor:'#94a3b8',  label:'Concessão de Lavra',       perfil:'execucao', urgencia:'🟡 Médio',    servico:'Outorga Hídrica Mineração + EIA + PRAD de Mina',                ticket:'25000' },
    'pesquisa mineral':   { icon:'🪨', cor:'#a8a29e',  label:'Pesquisa Mineral',         perfil:'execucao', urgencia:'🟢 Baixo',    servico:'Apoio Técnico ANM + Laudo Geológico + Outorga Processual',      ticket:'10000' },
    'anm':                { icon:'💎', cor:'#d6d3d1',  label:'Processo ANM',             perfil:'execucao', urgencia:'🟡 Médio',    servico:'Regularização Minerária + EIA + Outorga ANA',                   ticket:'30000' },
    'garimpo':            { icon:'🔴', cor:'#ef4444',  label:'Garimpo Ilegal',           perfil:'execucao', urgencia:'🔴 URGENTE',  servico:'Defesa Técnica + Regularização Perante ANM + PRAD',             ticket:'15000' },
    'geologia':           { icon:'🌍', cor:'#e7e5e4',  label:'Geologia / Sondagem',      perfil:'execucao', urgencia:'🟢 Baixo',    servico:'Laudo Geotécnico + Relatório de Sondagem + Consultoria',        ticket:'6000'  },
    // Vegetação / Solo
    'supressão vegetal':  { icon:'🌲', cor:'#4ade80',  label:'Supressão Vegetal (ASV)',  perfil:'execucao', urgencia:'🟡 Médio',    servico:'Inventário Florestal + ASV + Compensação de Reserva Legal',     ticket:'8000'  },
    'app':                { icon:'🌳', cor:'#86efac',  label:'APP / Reserva Legal',      perfil:'execucao', urgencia:'🔴 URGENTE',  servico:'Regularização de APP + PRAD + Cadastro CAR',                    ticket:'7000'  },
    'prad':               { icon:'🌱', cor:'#34d399',  label:'PRAD',                     perfil:'execucao', urgencia:'🟡 Médio',    servico:'Elaboração de PRAD + ART + Monitoramento de Recuperação',       ticket:'7000'  },
    'car':                { icon:'📋', cor:'#a3e635',  label:'CAR Rural',                perfil:'execucao', urgencia:'🟢 Baixo',    servico:'Cadastro CAR + Regularização + Georreferenciamento de APP',     ticket:'3500'  },
    'embargo':            { icon:'⚠️', cor:'#f59e0b',  label:'Embargo',                  perfil:'execucao', urgencia:'🔴 URGENTE',  servico:'Defesa de Embargo + PRAD + Readequação Ambiental',              ticket:'12000' },
    // Infrações / Sanções
    'multa':              { icon:'💸', cor:'#fca5a5',  label:'Multa Ambiental',          perfil:'execucao', urgencia:'🔴 URGENTE',  servico:'Defesa Administrativa + Recursos + Regularização',              ticket:'8000'  },
    'interdição':         { icon:'🚫', cor:'#f87171',  label:'Interdição',               perfil:'execucao', urgencia:'🔴 URGENTE',  servico:'RT Emergencial + Defesa + Plano de Desinterdição',              ticket:'10000' },
    'apreensão':          { icon:'🔒', cor:'#fbb6ce',  label:'Apreensão de Equipamento', perfil:'gestao',   urgencia:'🔴 URGENTE',  servico:'Defesa Administrativa + Regularização da Atividade',           ticket:'6000'  },
    'crime ambiental':    { icon:'⚖️', cor:'#fda4af',  label:'Crime Ambiental',          perfil:'gestao',   urgencia:'🔴 URGENTE',  servico:'Laudo Pericial + Apoio Técnico ao Advogado',                   ticket:'12000' },
    // Infrações e Recursos
    'notificacao_fiscal': { icon:'⚠️', cor:'#f97316',  label:'Notificação Fiscal',       perfil:'gestao',   urgencia:'🔴 URGENTE',  servico:'Defesa Técnica + Cumprimento de Notificação Fiscal',            ticket:'6000'  },
    'recurso_adm':        { icon:'⚖️', cor:'#fda4af',  label:'Recurso / Acórdão',        perfil:'gestao',   urgencia:'🟡 Médio',    servico:'Recurso Administrativo + Defesa de Multa + Laudo Pericial',     ticket:'8000'  },
    // Novos Chips Configs
    'irrigacao':          { icon:'🌾', cor:'#059669',  label:'Irrigação / Pivô',         perfil:'execucao', urgencia:'🟡 Médio',    servico:'Outorga de Captação Irrigação + Teste de Vazão + Laudo',        ticket:'9000'  },
    'aguas_sub':          { icon:'🌊', cor:'#2563eb',  label:'Águas Subterrâneas',       perfil:'execucao', urgencia:'🟢 Baixo',    servico:'Processo de Captação Subterrânea + Cadastro RIMAS',             ticket:'6000'  },
    'licenciamento':      { icon:'🍃', cor:'#10b981',  label:'Licenciamento SEMA',       perfil:'execucao', urgencia:'🟡 Médio',    servico:'Processo SEMA + RCA/PCA + Monitoramento Ambiental',             ticket:'12000' },
    'poco_irr':           { icon:'🚨', cor:'#ef4444',  label:'Poço Irregular',           perfil:'execucao', urgencia:'🔴 URGENTE',  servico:'Cadastro de Poço Existente + Defesa + Regularização Completa',  ticket:'7000'  },
    'outorga_poco':       { icon:'💧', cor:'#0284c7',  label:'Outorga de Poço',          perfil:'execucao', urgencia:'🟡 Médio',    servico:'Processo de Outorga + Laudo Geológico + Teste de Bombeamento',  ticket:'6500'  },
    'teste_vazao':        { icon:'📊', cor:'#0e7491',  label:'Teste de Vazão',           perfil:'execucao', urgencia:'🟢 Baixo',    servico:'Teste de Vazão Escalonado + Relatório Hidrogeológico',          ticket:'3500'  },
    'rebaixamento':       { icon:'📉', cor:'#1e3a5f',  label:'Rebaixamento de Aquífero', perfil:'execucao', urgencia:'🟡 Médio',    servico:'Estudo de Rebaixamento + Relatório Qualiquantitativo',          ticket:'8500'  },
    'ete_irr':            { icon:'🏭', cor:'#165373',  label:'ETE / ETA Irregular',      perfil:'execucao', urgencia:'🔴 URGENTE',  servico:'Projeto de Adequação ETE + Outorga de Lançamento + PGRS',       ticket:'15000' },
    'efluente':           { icon:'🏭', cor:'#5b21b6',  label:'Lançamento Efluente',      perfil:'execucao', urgencia:'🟡 Médio',    servico:'Outorga de Diluição/Lançamento + Monitoramento de Efluentes',   ticket:'10000' },
    'lic_vencida':        { icon:'⛔', cor:'#dc2626',  label:'Licença Vencida',          perfil:'execucao', urgencia:'🔴 URGENTE',  servico:'Renovação de Licença Ambiental + Atualização de Laudos',        ticket:'5500'  },
    // Default
    'default':            { icon:'📄', cor:'#94a3b8',  label:'Publicação DO',            perfil:'gestao',   urgencia:'🟢 Baixo',    servico:'Consultoria Ambiental',                                         ticket:'3000'  },

    // ── Topografia & Geoprocessamento ──
    // art = ART CREA obrigatória | cft = CGF CREA (cadastro de firma) | incra = credenciamento INCRA
    'topografia':      {
      icon:'📐', cor:'#f472b6', label:'Levantamento Topográfico / Cadastral',
      perfil:'execucao', urgencia:'🟡 Médio',
      servico:'Levantamento Planialtimétrico + Memorial Descritivo + Planta Geral',
      ticket:'4500',
      art:'✅ ART CREA obrigatória (Modalidade: Topografia / Levantamento)',
      cft:'Opcional se empresa — CGF CREA-MT recomendado',
    },
    'pericia_topo':    {
      icon:'🔭', cor:'#e879f9', label:'Perícia Topográfica Judicial / Extrajudicial',
      perfil:'execucao', urgencia:'🔴 URGENTE',
      servico:'Laudo Pericial Topográfico + Memorial + Croqui + Depoimento em Audiência',
      ticket:'9000',
      art:'✅ ART CREA obrigatória (Modalidade: Perícia + Topografia) — prazo processual!',
      cft:'✅ CGF CREA-MT obrigatório para emitir nota fiscal de perícia como PJ',
    },
    'georref_incra':   {
      icon:'🗺️', cor:'#c084fc', label:'Georreferenciamento de Imóvel Rural (SIGEF/INCRA)',
      perfil:'execucao', urgencia:'🟡 Médio',
      servico:'Georreferenciamento INCRA + SNCR + Planta + Memorial + Certificação SIGEF',
      ticket:'6500',
      art:'✅ ART CREA obrigatória (Modalidade: Georreferenciamento Rural)',
      cft:'✅ Credenciamento INCRA obrigatório (credencial de Responsável Técnico cadastrado no SNCR)',
    },
    'reurb':           {
      icon:'🏘️', cor:'#a855f7', label:'Regularização Fundiária Urbana (REURB)',
      perfil:'execucao', urgencia:'🟡 Médio',
      servico:'Levantamento Topográfico REURB + Planta de Conjunto + Memorial + CRF',
      ticket:'12000',
      art:'✅ ART CREA obrigatória (Modalidade: Levantamento Topográfico + Parcelamento)',
      cft:'✅ CGF CREA-MT se contratado como empresa',
    },
    'desapropriacao':  {
      icon:'⚖️', cor:'#d946ef', label:'Desapropriação / Avaliação de Imóvel',
      perfil:'execucao', urgencia:'🟡 Médio',
      servico:'Levantamento Topográfico + Laudo de Avaliação + Planta Cadastral',
      ticket:'7000',
      art:'✅ ART CREA obrigatória (Modalidade: Avaliação de Bens + Topografia)',
      cft:'Opcional — CGF CREA-MT recomendado para contratos municipais/estaduais',
    },
    'drone_orto':      {
      icon:'🚁', cor:'#9333ea', label:'Mapeamento com Drone / Ortofoto / MDT',
      perfil:'execucao', urgencia:'🟡 Médio',
      servico:'Ortomosaico + MDT/MDS + Levantamento Planimétrico + Relatório de Voo',
      ticket:'5500',
      art:'✅ ART CREA obrigatória (Modalidade: Topografia / Geoprocessamento)',
      cft:'⚠️ Operação de DRONE: exige cadastro ANAC (SISANT/CANAC) além da ART',
    },
    'divisao_imovel':  {
      icon:'📏', cor:'#7c3aed', label:'Divisão / Desmembramento / Remembramento',
      perfil:'execucao', urgencia:'🟡 Médio',
      servico:'Levantamento + Planta de Divisão + Memorial + Registro em Cartório',
      ticket:'3500',
      art:'✅ ART CREA obrigatória (Modalidade: Parcelamento do Solo / Topografia)',
      cft:'Opcional — CGF CREA-MT recomendado',
    },
    'usucapiao':       {
      icon:'🏠', cor:'#6d28d9', label:'Usucapião (Levantamento + Memorial Descritivo)',
      perfil:'execucao', urgencia:'🟡 Médio',
      servico:'Levantamento Topográfico + Planta Georreferenciada + Memorial Descritivo + ART',
      ticket:'4000',
      art:'✅ ART CREA obrigatória (Modalidade: Topografia / Georreferenciamento)',
      cft:'⚠️ Verificar se cartório exige credenciamento INCRA para imóveis rurais > 4 módulos',
    },
  };


  // ── Detecta STATUS REAL por palavras-chave (sem pontuação abstrata) ──────
  // Retorna: { label, cor, tipo:'aberto'|'verificar'|'info'|'resolvido'|'descartado', descartado:bool }
  function _detectarStatus(texto) {
    const t = texto.toLowerCase();

    // — Expurgo de Falsos Positivos: Textos Normativos / Leis Genéricas —
    const termosLei = ['dispõe sobre', 'fica instituído', 'fica criado', 'considerando a necessidade', 'considerando que a ', 'regulamenta o', 'altera a lei', 'no uso das atribuições'];
    if (termosLei.some(lei => t.includes(lei)) && !t.includes('extrato de auto de infração')) {
      return { label:'🏛️ Ato Normativo (Lei/Decreto)', cor:'#64748b', tipo:'descartado', descartado:true };
    }

    // — Indica resolvido/encerrado quando há sinais claros e nenhum sinal ativo —
    const termosResolvidos = ['regularizado','regularizou','regularização concluída','encerrado',
      'cancelado','arquivado','cumprimento integral','cumprido na totalidade',
      'extinto','embargo levantado','embargo cancelado','recurso provido','absolvido',
      'nulidade do auto','cancelamento do auto de infração','arquivamento definitivo'];
    const termosAtivos = ['auto de infração','nai','multa ambiental','embargo','notificado',
      'interdição','prazo','não cumprido','descumprimento','irregular','ilegal',
      'clandestino','autuado','autu','infração','infração ambiental','acórdão','recurso administrativo',
      'sanção', 'sanções', 'advertência', 'termo de notificação', 'intimação', 'intimado', 'edital de intimação',
      'lavratura do auto', 'notificação fiscal', 'impugnação', 'credenciamento', 'chamamento público', 'cadastro de prestadores', 'requereu junto', 'torna público que requereu', 'secretaria do estado de meio ambiente', 'secretaria municipal de meio ambiente', 'smma', 'semma', 'smmas'];
    
    // — Requerimentos / Protocolos Normais (Geralmente não é lead quente para defesa) —
    if (t.includes('requereu junto') || t.includes('torna público que requereu') || t.includes('requereu a secretaria') || t.includes('comunica que requereu') || t.includes('requerimento de licença')) {
      return { label:'ℹ️ Licença Protocolada', cor:'#0284c7', tipo:'info', descartado:false };
    }

    const isResolvido = termosResolvidos.some(x => t.includes(x))
                     && !termosAtivos.some(x => t.includes(x));
    if (isResolvido) return { label:'✅ Regularizado / Encerrado', cor:'#22c55e', tipo:'resolvido', descartado:false };

    // — Julgamentos e Recursos —
    if (t.includes('acórdão') || t.includes('acordao') || t.includes('julgamento de recurso') || t.includes('ementa') || t.includes('recurso administrativo')) {
      if (t.includes('recurso conhecido e provido') || t.includes('recurso provido') || t.includes('cancelamento do auto') || t.includes('nulidade do auto') || t.includes('provido e arquivado') || t.includes('desobrigando')) {
         return { label:'✅ Recurso Provido / Auto Cancelado', cor:'#22c55e', tipo:'resolvido', descartado:false };
      }
      if (t.includes('recurso improvido') || t.includes('recurso conhecido e improvido') || t.includes('manutenção do auto') || t.includes('manutencao do auto') || t.includes('improcedente a defesa') || t.includes('confirmando a aplicação da multa') || t.includes('obrigando o infrator a recolher')) {
         return { label:'❌ Recurso Negado / Multa Mantida', cor:'#dc2626', tipo:'aberto', descartado:false };
      }
      return { label:'⚖️ Em Julgamento / Recurso', cor:'#8b5cf6', tipo:'aberto', descartado:false };
    }

    // — Status ativos —
    if (t.includes('não cumprido') || t.includes('nao cumprido') || t.includes('descumprimento'))
      return { label:'❌ Não Cumprido', cor:'#ef4444', tipo:'aberto', descartado:false };

    if (t.includes('auto de infração') || t.includes('lavratura do auto') || t.includes('nai ') || /\bai[\-\s]?\d/.test(t))
      return { label:'🚨 Autuado', cor:'#ef4444', tipo:'aberto', descartado:false };

    if ((t.includes('autu') && (t.includes('empresa') || t.includes('proprietário') || t.includes('infrator') || t.includes('requerente'))) || t.includes('foi autuad'))
      return { label:'🚨 Autuado', cor:'#ef4444', tipo:'aberto', descartado:false };

    if (t.includes('embargo') && !t.includes('levantado') && !t.includes('cancelad'))
      return { label:'🔒 Embargado', cor:'#f97316', tipo:'aberto', descartado:false };

    if (t.includes('interdição') || t.includes('interditad'))
      return { label:'🚫 Interditado', cor:'#ef4444', tipo:'aberto', descartado:false };

    if (t.includes('multa') && (t.includes('ambiental') || t.includes('sema') || t.includes('ibama')))
      return { label:'💸 Multado', cor:'#ef4444', tipo:'aberto', descartado:false };

    if (t.includes('notificad') || (t.includes('notificação') && t.includes('prazo')))
      return { label:'📨 Notificado — Prazo em Aberto', cor:'#f59e0b', tipo:'aberto', descartado:false };

    if (t.includes('indeferid') || t.includes('não aceito') || t.includes('nao aceito') || t.includes('não deferido'))
      return { label:'❌ Indeferido', cor:'#f59e0b', tipo:'verificar', descartado:false };

    if (t.includes('deferido') || t.includes('concedido') || t.includes('aceito'))
      return { label:'✅ Deferido / Aceito', cor:'#22c55e', tipo:'info', descartado:false };

    if (t.includes('irregular') || t.includes('ilegal') || t.includes('clandestino') || t.includes('sem licença') || t.includes('sem outorga'))
      return { label:'⚠️ Irregular / Ilegal', cor:'#f59e0b', tipo:'aberto', descartado:false };

    if (t.includes('prazo') && (t.includes('dias') || t.includes('horas') || t.includes('cumpr')))
      return { label:'⏰ Prazo em Aberto', cor:'#f59e0b', tipo:'aberto', descartado:false };

    // Sem palavras relevantes detectadas = descartar
    const temRelevancia = termosAtivos.some(x => t.includes(x));
    if (!temRelevancia) return { label:null, cor:'#94a3b8', tipo:'descartado', descartado:true };
    return { label:'🔍 Verificar', cor:'#94a3b8', tipo:'verificar', descartado:false };
  }

  // ── Serviços dinâmicos com base no conteúdo do excerto ─────────
  function _sugerirServicos(tipoKey, cfg, texto) {
    const t = texto.toLowerCase();
    const svs = [cfg.servico];
    if ((t.includes('poço') || t.includes('poco')) && tipoKey !== 'poço tubular') {
      if (t.includes('irregular') || t.includes('sem outorga') || t.includes('clandestino'))
        svs.push('💧 Regularização de Poço + Outorga SEMA + Laudo Hidrogeológico');
      else svs.push('💧 Outorga de Captação Subterrânea + Laudo Hidrogeológico');
    }
    if ((t.includes('prad') || (t.includes('recuperação') && t.includes('área'))) && tipoKey !== 'prad')
      svs.push('🌱 PRAD + ART CREA + Monitoramento de Recuperação');
    if ((t.includes('supressão vegetal') || t.includes('asv') || t.includes('desmatamento')) && tipoKey !== 'supressão vegetal')
      svs.push('🌲 Inventário Florestal + ASV + Compensação de Reserva Legal');
    if ((t.includes('topografia') || t.includes('memorial descritivo') || t.includes('georreferenci')) && !['topografia','georref_incra','pericia_topo'].includes(tipoKey))
      svs.push('📐 Levantamento Topográfico + Memorial Descritivo + ART CREA');
    if ((t.includes('efluente') || t.includes('lançamento') || t.includes('ete') || t.includes('eta')) && tipoKey !== 'outorga diluição')
      svs.push('🏭 Projeto de ETE/ETA + Outorga de Diluição + PGRS');
    if ((t.includes('car') || t.includes('cadastro ambiental')) && tipoKey !== 'car')
      svs.push('🗺️ Regularização CAR + Georreferenciamento de APP');
    if ((t.includes('eia') || t.includes('estudo de impacto') || t.includes('rima')) && tipoKey !== 'eia')
      svs.push('📊 Apoio Técnico EIA/RIMA + Complementações');
    if (t.includes('teste de vazão') || t.includes('bombeamento') || t.includes('ensaio hidráulico'))
      svs.push('🗡️ Teste de Vazão + Relatório de Ensaio Hidrogeológico');
    return [...new Set(svs)].slice(0, 4);
  }


  // ── Extrai número de processo / auto de infração do excerto ────
  // Extrai o NUMERO DO PROCESSO (SEMA, SIGA, Auto de Infracao, NAI, Notificacao)
  // EXCLUI: Lei Complementar, Artigo, Inciso, Decreto (que sao citacoes de lei, nao processos)
  function _extrairProcesso(texto) {
    const t = texto.replace(/\n/g, ' ');
    // Primeiro remove referencias a leis para nao confundir com processos
    const semLeis = t
      .replace(/Lei\s+(?:Complementar|Organica|Ordinaria|Federal|Estadual|Municipal)\s*n[º°]?\.?\s*[\d\.\/\-]+/gi, ' ')
      .replace(/(?:Art(?:igo)?|Inciso|Par[áa]grafo|Dec(?:reto)?|Portaria\s+Ministerial)\s*n[º°]?\.?\s*[\d\.\/\-]+/gi, ' ');
    const matches = [];
    const tryMatch = (re, src) => {
      const s = src || semLeis;
      const m = s.match(re);
      if (m && m[0] && m[0].replace(/\D/g,'').length >= 4) matches.push(m[0].trim().replace(/\s+/g,' ').substring(0,75));
    };
    // Auto de Infracao / NAI (maior especificidade - usar texto original)
    tryMatch(/(?:Auto\s+de\s+Infra[çc][ãa]o|Auto\s+de\s+Infra[çc][ãa]o\s+Ambiental|NAI)\s*[,\s\-]+(?:n[º°]?\.?\s*)?(\d[\d.\/\-]{3,})/i, t);
    // Processo SEMA / SIGA / numero de processo
    tryMatch(/Processo\s+(?:SEMA|SIGA|Administrativo|n[º°]?\.?\s*)(\d{2,}[.\d\-\/]{3,})/i, t);
    // Notificacao de autuacao (NAT, Notificacao n)
    tryMatch(/Notifica[çc][ãa]o\s+(?:de\s+)?(?:Autua[çc][ãa]o\s+)?(?:n[º°]?\.?\s*)?(\d[\d.\/\-]{2,})/i, t);
    // Licenca (LAI/LI/LO/LP/LAO) seguida de numero
    tryMatch(/(?:LAI|LI|LO|LP|LS|LAO)\s*[-\/]?\s*(?:n[º°]?\.?\s*)?(\d[\d.\/\-]{2,}(?:\/\d{4})?)/i, t);
    // Outorga de captacao
    tryMatch(/Outorga\s+(?:de\s+(?:Capta[çc][ãa]o|Uso|Direi?to)?\s*)?(?:n[º°]?\.?\s*)?(\d[\d.\/\-]{2,})/i, t);
    // Portaria (exceto ministerial)
    tryMatch(/Portaria\s+(?:SEMA|FEMA|Estadual|Municipal|Conjunta|n[º°]?\.?\s*)(\d+[\/-]\d{4})/i, t);
    // Protocolo / Expediente (SIGA geralmente usa esses formatos)
    tryMatch(/(?:Protocolo|Expediente|Requerimento)\s+(?:n[º°]?\.?\s*)?(\d{4,}[.\d\-\/]*)/i, semLeis);
    return matches.length > 0 ? matches[0] : null;
  }

  // ── Detecta o tipo de publicação ────────────────────────────
  function _detectarTipo(texto) {
    const t = texto.toLowerCase();
    if (t.includes('crime ambiental') || t.includes('ministério público')) return 'crime ambiental';
    if (t.includes('interdiç')) return 'interdição';
    if (t.includes('apreensão') || t.includes('apreensao')) return 'apreensão';
    if (t.includes('multa') && (t.includes('ambiental') || t.includes('sema'))) return 'multa';
    if (t.includes('autu')) return 'autuado';
    if (t.includes('concessão de lavra') || t.includes('concessao de lavra')) return 'lavra';
    if (t.includes('pesquisa mineral') || t.includes('autorização de pesquisa')) return 'pesquisa mineral';
    if (t.includes('garimpo') || t.includes('extração ilegal')) return 'garimpo';
    if (t.includes('anm') || t.includes('dnpm') || t.includes('processo minerário')) return 'anm';
    if (t.includes('sondagem') || t.includes('geotécni') || (t.includes('geolog') && !t.includes('hidrogeolog'))) return 'geologia';

    if (t.includes('recurso administrativo') || t.includes('acórdão') || t.includes('acordao') || t.includes('câmara de julgamento') || t.includes('conselho municipal de meio ambiente')) return 'recurso_adm';
    if (t.includes('credenciamento') || t.includes('chamamento público') || t.includes('cadastro de prestadores')) return 'credenciamento';
    if (t.includes('auto de notificação') || t.includes('notificação fiscal') || t.includes('impugnação fiscal')) return 'notificacao_fiscal';

    if (t.includes('poço') && (t.includes('irregular') || t.includes('clandestino') || t.includes('sem outorga'))) return 'poco_irr';
    if (t.includes('outorga') && (t.includes('poço') || t.includes('tubular') || t.includes('artesiano'))) return 'outorga_poco';
    if (t.includes('teste de vazão') || t.includes('teste de vazao') || t.includes('bombeamento')) return 'teste_vazao';
    if (t.includes('rebaixamento') || t.includes("nível d'água") || t.includes("nivel d'agua") || t.includes("rebaixamento de aquífero")) return 'rebaixamento';
    if ((t.includes('ete') || t.includes('estação de tratamento')) && (t.includes('irregular') || t.includes('descarte') || t.includes('sem licença'))) return 'ete_irr';
    if (t.includes('lançamento') && (t.includes('efluente') || t.includes('esgoto') || t.includes('manancial'))) return 'efluente';
    if (t.includes('irrigação') || t.includes('irrigacao') || t.includes('pivô') || t.includes('pivo')) return 'irrigacao';
    if (t.includes('águas subterrâneas') || t.includes('aguas subterraneas') || t.includes('aquífero') || t.includes('aquifero')) return 'aguas_sub';
    if (t.includes('licença vencida') || t.includes('licenca vencida') || t.includes('licença expirada') || t.includes('sem licença') || t.includes('licença irregular') || t.includes('falta de alvará') || t.includes('falta de licença') || t.includes('ausência de licença') || t.includes('sem alvará') || t.includes('sem a devida licença') || t.includes('desacordo com a licença')) return 'lic_vencida';
    if (t.includes('licenciamento ambiental')) return 'licenciamento';

    // ── Topografia & Geoprocessamento (alta prioridade — detectar antes de genéricos) ──
    if (t.includes('perícia') && (t.includes('topográf') || t.includes('terreno') || t.includes('área') || t.includes('divisa'))) return 'pericia_topo';
    if (t.includes('perito') && (t.includes('topograf') || t.includes('engenheiro') || t.includes('agrimensor'))) return 'pericia_topo';
    if (t.includes('usucapião') || t.includes('usucapiao') || t.includes('ação de usucapião')) return 'usucapiao';
    if (t.includes('regularização fundiária') || t.includes('regularizacao fundiaria') || t.includes('reurb') || t.includes('certidão de regularização fundiária')) return 'reurb';
    if (t.includes('georreferenci') && (t.includes('incra') || t.includes('sigef') || t.includes('rural') || t.includes('imóvel'))) return 'georref_incra';
    if (t.includes('desapropriação') || t.includes('desapropriacao') || (t.includes('avaliação de imóvel') || t.includes('avaliacao de imovel'))) return 'desapropriacao';
    if (t.includes('desmembramento') || t.includes('remembramento') || (t.includes('divisão') && t.includes('imóvel'))) return 'divisao_imovel';
    if (t.includes('drone') || t.includes('vant') || t.includes('aeronave não tripulada') || t.includes('ortofoto') || t.includes('ortomosaico')) return 'drone_orto';
    if (t.includes('levantamento topográf') || t.includes('planialtimétrico') || t.includes('planialtimetrico') || t.includes('levantamento planimétrico') || t.includes('memorial descritivo') || (t.includes('agrimensor') && !t.includes('incra'))) return 'topografia';
    if (t.includes('estudo de impacto') || t.includes('eia') || t.includes('rima')) return 'eia';
    if (t.includes('termo de ajustamento') || t.includes('tac')) return 'tac';
    if (t.includes('compensação ambiental')) return 'compensação';
    if (t.includes('licença de instalação') || t.includes('licença instalação')) return 'licença instalação';
    if (t.includes('licença prévia') || t.includes('licença previa')) return 'licença prévia';
    if (t.includes('licença de operação') || t.includes('licença operação')) return 'licença operação';
    if (t.includes('renovação') && t.includes('licença')) return 'renovação';
    if (t.includes('supressão vegetal') || t.includes('asv') || t.includes('supressao vegetal')) return 'supressão vegetal';
    if (t.includes('área de preservação') || t.includes('app') || t.includes('reserva legal')) return 'app';
    if (t.includes('prad') || (t.includes('recuperação') && t.includes('área'))) return 'prad';
    if (t.includes('cadastro ambiental rural') || (t.includes('car') && t.includes('rural'))) return 'car';
    if (t.includes('embargo') && !t.includes('levantado') && !t.includes('cancelado')) return 'embargo';
    if (t.includes('diluição') || t.includes('efluente') || t.includes('lançamento')) return 'outorga diluição';
    if (t.includes('poço tubular') || t.includes('perfuração') || t.includes('poco tubular')) return 'poço tubular';
    if (t.includes('qualidade') && (t.includes('água') || t.includes('agua'))) return 'qualidade água';
    if (t.includes('bacia hidrográfica') || t.includes('comitê') || t.includes('comite')) return 'bacia hidrográfica';
    if (t.includes('outorga')) return 'outorga';
    return 'default';
  }

  // ── Extrai entidade mencionada no excerto ────────────────────
  function _extrairEntidade(excerto) {
    const matchCNPJ = excerto.match(/\d{2}[\.\ ]?\d{3}[\.\ ]?\d{3}[\/\\\ ]?\d{4}[\-\ ]?\d{2}/);
    const matchNome = excerto.match(/(?:empresa|empreendimento|requerente|interessado|autuado)[:\s]+([A-ZÁÉÍÓÚÀÃÕÂÊÎÔÛÇ][A-Za-záéíóúàãõâêîôûç\s\-\.,&]+(?:LTDA|S\.A\.|SA|EIRELI|ME|EPP)?)/i);
    const matchProcesso = excerto.match(/(?:Processo(?: Administrativo)?(?: SEMA| SIGA)?|Protocolo|Auto de Infracao|Auto de Infra\u00e7\u00e3o)\s*(?:n[º°]?\.?\s*)?(\d{2,}[.\d\-\/]{3,})/i);

      const matchCidade = excerto.match(/(?:município|municipio|localizado em|situado em)[:\s]+([A-ZÁÉÍÓÚÀÃÕÂÊÎÔÛÇ][a-záéíóúàãõâêîôûç\s]+(?:-\s*MT)?)/i);
    return {
      cnpj: matchCNPJ ? matchCNPJ[0] : '',
      nome: matchNome ? matchNome[1].trim() : '',
      cidade: matchCidade ? matchCidade[1].trim() : '',
    };
  }

  function _formatarData(dateStr) {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return dateStr || '—'; }
  }

  function _sinceDias(dias) {
    const d = new Date();
    d.setDate(d.getDate() - parseInt(dias));
    return d.toISOString().split('T')[0];
  }

  // ── Busca na API do Querido Diário ───────────────────────────
  async function _buscarAPI(querystring, dias) {
    const since = _sinceDias(dias);
    const until = new Date().toISOString().split('T')[0]; // hoje = teto da busca

    const params = new URLSearchParams({
      querystring,
      since,
      until,  // ← NOVO: limita resultados até hoje (evita duplicatas futuras)
      size: 60,
      offset: 0,
      pre_tags: '<mark>',
      post_tags: '</mark>',
    });

    // Todos os territórios MT cadastrados no Querido Diário
    const territories = [MT_STATE_TERRITORY, ...MT_TERRITORIES];
    territories.forEach(t => params.append('territory_ids', t));

    const url = `${API}/gazettes?${params.toString()}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      clearTimeout(timeout);
      throw e;
    }
  }

  // ── Renderiza um card de publicação ─────────────────────────
  // status: 'aberto' | 'verificar'
  // score: 0-100 (pontuação de confiança)
  function _renderCard(gazette, excerpt, statusObj) {
    const status = statusObj.tipo;
    const statusLabel = statusObj.label;
    const statusCor = statusObj.cor;
    const tipoKey = _detectarTipo(excerpt);
    const cfg = TIPO_CONFIG[tipoKey] || TIPO_CONFIG['default'];
    const entidade = _extrairEntidade(excerpt);
    const data = _formatarData(gazette.date);
    const excerptoHtml = excerpt
      .replace(/<mark>/g, '<mark style="background:#f59e0b30;color:#f59e0b;padding:0 2px;border-radius:2px;">')
      .substring(0, 800) + (excerpt.length > 800 ? '…' : '');

    const leadData = JSON.stringify({
      nome: entidade.nome || cfg.label,
      cpfcnpj: entidade.cnpj,
      municipio: entidade.cidade || 'MT',
      servico: cfg.servico,
      tipo: 'DIOE — ' + cfg.label,
      urgencia: cfg.urgencia.replace(/[🔴🟡🟢] /,''),
      origem: 'Diário Oficial MT',
      ticket: cfg.ticket,
      obs: `Publicado em ${data}. Excerto: ${excerpt.substring(0, 200)}`,
      followup_acao: 'Pesquisar empresa e entrar em contato',
    }).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    const pdfUrl = gazette.url || '#';
    const numProcesso = _extrairProcesso(excerpt);
    const territorio = gazette.territory_name || 'MT';
    const googleQ = encodeURIComponent(`"${entidade.nome || entidade.cnpj || cfg.label}" ${entidade.cidade || territorio} licença ambiental CNPJ`);
    const iomatQ = encodeURIComponent(entidade.nome || numProcesso || cfg.label);

    // Badge de status — label real (Autuado, Embargado, etc.) sem pontuação
    const statusBadge = statusLabel
      ? `<span style="background:${statusCor}18;color:${statusCor};border:1px solid ${statusCor}48;border-radius:20px;padding:2px 10px;font-size:0.68rem;font-weight:700;margin-left:4px;">${statusLabel}</span>`
      : '';

    const perfilLabel = cfg.perfil === 'execucao'
      ? `<span style="background:#0ea5e920;color:#38bdf8;border:1px solid #38bdf820;border-radius:20px;padding:1px 9px;font-size:0.65rem;font-weight:700;">🔧 Exec. Técnica</span>`
      : `<span style="background:#a78bfa20;color:#a78bfa;border:1px solid #a78bfa20;border-radius:20px;padding:1px 9px;font-size:0.65rem;font-weight:700;">📋 Gestão</span>`;

    const isAberto = (status === 'aberto');
    const cardStyle = isAberto
      ? `background:#1e293b;border:1px solid rgba(148,163,184,0.08);border-left:3px solid ${statusCor};border-radius:10px;padding:13px 15px;margin-bottom:10px;`
      : `background:#1b2337;border:1px solid ${statusCor}18;border-left:3px solid ${statusCor}55;border-radius:10px;padding:13px 15px;margin-bottom:10px;`;

    return `
      <div style="${cardStyle}" data-status="${status}" data-perfil="${cfg.perfil}" data-tipo="${tipoKey}">

        <!-- Header do card -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:7px;">
            <span style="font-size:1.1rem;">${cfg.icon}</span>
            <div>
              <div style="color:#e2e8f0;font-weight:700;font-size:0.85rem;display:flex;align-items:center;flex-wrap:wrap;gap:4px;">
                ${cfg.label}${entidade.nome ? ' — ' + entidade.nome : ''}
                ${statusBadge}
              </div>
              <div style="color:#64748b;font-size:0.71rem;margin-top:3px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                📅 ${data}
                &nbsp;📍 ${territorio}${entidade.cidade && entidade.cidade !== territorio ? ' / ' + entidade.cidade : ''}
                 ${gazette.edition ? `<span style="background:#f59e0b22;color:#f59e0b;border:1px solid #f59e0b55;border-radius:5px;padding:1px 8px;font-size:0.71rem;font-weight:800;" title="N\u00famero da edi\u00e7\u00e3o do Di\u00e1rio Oficial">\ud83d\udcf0 Ed. ${gazette.edition}</span>` : ''}
                ${entidade.cnpj ? ` · 🪪 ${entidade.cnpj}` : ''}
              </div>
              ${numProcesso
                ? `<div style="display:inline-flex;align-items:center;gap:6px;background:#0ea5e915;border:1px solid #0ea5e945;border-radius:6px;padding:3px 10px;margin-top:5px;"><span style="color:#38bdf8;font-size:0.71rem;font-weight:800;">\ud83d\udd0e N\u00ba Proc.: ${numProcesso}</span><button onclick="navigator.clipboard.writeText('${numProcesso}').then(()=>{this.textContent='\u2705 Copiado!';setTimeout(()=>this.textContent='\ud83d\udccb Copiar',1500)})" style="background:#38bdf820;color:#38bdf8;border:1px solid #38bdf840;border-radius:4px;padding:1px 7px;font-size:0.65rem;cursor:pointer;white-space:nowrap;">\ud83d\udccb Copiar</button></div>`
                : `<div style="display:inline-flex;align-items:center;gap:7px;background:#78350f18;border:1px solid #f59e0b30;border-radius:6px;padding:4px 10px;margin-top:5px;">
                    <span style="color:#fbbf24;font-size:0.7rem;">\u26a0\ufe0f N\u00ba de processo n\u00e3o identificado no extrato.</span>
                    ${pdfUrl !== '#' ? `<a href="${pdfUrl}" target="_blank" style="background:#f59e0b;color:#0f172a;border-radius:5px;padding:2px 9px;font-size:0.68rem;font-weight:800;text-decoration:none;white-space:nowrap;">\ud83d\udcc4 Abrir PDF e localizar</a>` : '<span style="color:#64748b;font-size:0.68rem;">PDF n\u00e3o dispon\u00edvel</span>'}
                   </div>`
              }
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
            <span style="background:${cfg.cor}22;color:${cfg.cor};border:1px solid ${cfg.cor}44;border-radius:20px;padding:1px 9px;font-size:0.68rem;font-weight:700;">${cfg.urgencia}</span>
            ${perfilLabel}
            <span style="color:#22c55e;font-size:0.71rem;font-weight:700;">💰 R$ ${Number(cfg.ticket).toLocaleString('pt-BR')}</span>
          </div>
        </div>

        <!-- Excerto expansivel -->
        <div style="background:rgba(15,23,42,0.6);border-radius:7px;padding:9px 11px;margin:9px 0;font-size:0.77rem;color:#94a3b8;line-height:1.55;border:1px solid rgba(255,255,255,0.05);">
          <div id="exc-${gazette.edition}-${excerpt.length}" style="max-height:80px;overflow:hidden;transition:max-height 0.3s ease;">${excerptoHtml}</div>
          <button onclick="const el=this.previousElementSibling; const expanded=el.style.maxHeight==='none'; el.style.maxHeight=expanded?'80px':'none'; this.textContent=expanded?'▼ Ver mais':'▲ Recolher';" style="background:none;border:none;color:#38bdf8;font-size:0.68rem;cursor:pointer;padding:3px 0;margin-top:2px;">▼ Ver mais</button>
        </div>
        <!-- Serviços sugeridos -->
        <div style="font-size:0.74rem;color:#64748b;margin-bottom:${cfg.art ? '6px' : '9px'};">
          🛠️ ${_sugerirServicos(tipoKey, cfg, excerpt).map((s,i) => i===0 ? `<strong style="color:#e2e8f0;">${s}</strong>` : `<span style="display:block;margin-left:16px;color:#94a3b8;font-size:0.7rem;margin-top:2px;">+ ${s}</span>`).join('')}
        </div>

        ${cfg.art ? `
        <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:7px;padding:8px 11px;margin-bottom:9px;font-size:0.73rem;">
          <div style="color:#a5b4fc;font-weight:700;margin-bottom:4px;font-size:0.7rem;letter-spacing:0.04em;">📋 DOCUMENTAÇÃO TÉCNICA NECESSÁRIA</div>
          <div style="color:#c7d2fe;margin-bottom:3px;">${cfg.art}</div>
          ${cfg.cft ? `<div style="color:#c4b5fd;margin-top:2px;">${cfg.cft}</div>` : ''}
        </div>` : ''}

        <!-- Ações -->
        <div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center;">
          ${status === 'aberto'
            ? `<button onclick="window._hidroOpenLeadModal(JSON.parse(this.dataset.lead))" data-lead='${leadData}' style="background:#22c55e;color:#fff;border:none;border-radius:6px;padding:5px 10px;font-size:0.73rem;font-weight:700;cursor:pointer;">💾 Salvar Lead</button>`
            : `<span style="color:${statusCor};font-size:0.72rem;">${statusLabel || '⚠️ Verificar'}</span>`
          }
          <a href="${pdfUrl}" target="_blank" style="background:${pdfUrl !== '#' ? '#0f4c75' : '#334155'};color:#fff;border-radius:6px;padding:5px 9px;font-size:0.73rem;text-decoration:none;border:1px solid #38bdf840;font-weight:700;" title="Abre o PDF original do Diario Oficial - arquivo fonte desta publicacao">📄 Abrir PDF Fonte${pdfUrl === '#' ? ' (indisponivel)' : ''}</a>
          <a href="https://www.iomat.mt.gov.br/index.php?option=com_iomat&view=busca&q=${iomatQ}" target="_blank" style="background:#f59e0b22;color:#f59e0b;border:1px solid #f59e0b44;border-radius:6px;padding:5px 9px;font-size:0.73rem;text-decoration:none;">📋 IOMAT</a>
          <a href="https://www.google.com/search?q=${googleQ}" target="_blank" style="background:#1e40af;color:#fff;border-radius:6px;padding:5px 9px;font-size:0.73rem;text-decoration:none;">🔍 Google</a>
          ${numProcesso ? `<button onclick="navigator.clipboard.writeText('${numProcesso}').then(()=>{window.open('https://portal.sema.mt.gov.br','_blank')}); alert('Número ${numProcesso} copiado! No SIGA, vá em Módulo Responsabilização ou Consultas e cole o número.');" style="background:#22c55e20;color:#22c55e;border:1px solid #22c55e40;border-radius:6px;padding:5px 9px;font-size:0.73rem;cursor:pointer;white-space:nowrap;" title="Copia o nº do processo e abre o Portal SIGA da SEMA">🌿 Consultar SIGA</button>` : ''}
          ${entidade.cnpj ? `<a href="https://cnpj.biz/${entidade.cnpj.replace(/\D/g,'')}" target="_blank" style="background:#7c3aed;color:#fff;border-radius:6px;padding:5px 9px;font-size:0.73rem;text-decoration:none;">🏢 CNPJ</a>` : ''}
        </div>
      </div>`;
  }

  // buffer de descartados para o popup "Ver Filtrados"
  let _descartadosBuffer = [];

  // ── Renderiza todos os resultados ────────────────────────────
  function _renderResultados(data, query) {
    const container = document.getElementById('dioe-resultados');
    const footer = document.getElementById('dioe-footer');
    const stat = document.getElementById('dioe-stat-total');
    if (!container) return;

    const gazettes = data.gazettes || [];
    _descartadosBuffer = []; // reset buffer

    const cards = [];
    let ocultados = 0;

    const dias = parseInt((document.getElementById('dioe-dias') || {}).value || 30);
    const sinceDate = new Date(_sinceDias(dias));

    gazettes.forEach(g => {
      const excerpts = g.excerpts || [];
      const gazetteDate = new Date(g.date);

      // ⛔ Filtro de data: descarta gazettes fora do período selecionado
      if (gazetteDate < sinceDate) {
        ocultados += excerpts.length;
        return;
      }

      excerpts.forEach(exc => {
        if (!exc || exc.trim().length < 50) return;

        const statusObj = _detectarStatus(exc);

        // Status descartado = sem palavras relevantes
        if (statusObj.descartado) {
          _descartadosBuffer.push({ g, exc, statusObj });
          ocultados++;
          return;
        }

        // Filtro: Perfil profissional
        if (_perfilAtivo !== 'todos') {
          const tipoKey = _detectarTipo(exc);
          const perfilCards = PERFIS[_perfilAtivo] || [];
          if (!perfilCards.includes(tipoKey)) {
            ocultados++;
            return;
          }
        }

        // VERIFICAR sempre mostra (toggle não oculta mais — era confuso)
        cards.push(_renderCard(g, exc, statusObj));
      });
    });

    if (cards.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:30px;color:#64748b;font-size:0.82rem;border:1px dashed #334155;border-radius:10px;">
          <div style="font-size:1.5rem;margin-bottom:8px;">🔍</div>
          <strong>Nenhuma publicação encontrada</strong> com os filtros ativos.<br>
          <span style="font-size:0.75rem;margin-top:6px;display:block;">Tente ampliar o período ou alterar o filtro de perfil.</span>
          ${ocultados > 0 ? `<div style="color:#f59e0b;font-size:0.73rem;margin-top:10px;">🔒 ${ocultados} publicações foram filtradas pelo score mínimo.</div>` : ''}
          <div style="margin-top:12px;">
            <a href="https://queridodiario.ok.org.br/pesquisa?terms=${encodeURIComponent(query)}&state=MT" target="_blank" style="color:#38bdf8;font-size:0.75rem;">Abrir busca no Querido Diário ↗</a>
          </div>
        </div>`;
    } else {
      container.innerHTML = cards.join('');
    }

    if (footer && stat) {
      footer.style.display = 'flex';
      const label = `${cards.length} publicação${cards.length !== 1 ? 'ões' : ''} em aberto`;
      const btnFiltrados = _descartadosBuffer.length > 0
        ? ` · <button onclick="DiarioOficial.verFiltrados()" style="background:#334155;color:#94a3b8;border:none;border-radius:5px;padding:2px 9px;font-size:0.68rem;cursor:pointer;">👁 Ver ${_descartadosBuffer.length} filtradas</button>`
        : '';
      stat.innerHTML = `<span style="color:#22c55e;font-weight:700;">${label}</span>${btnFiltrados}`;
    }
  }

  // ── Popup: exibe publicações filtradas (score baixo) ──────────
  function verFiltrados() {
    const existente = document.getElementById('dioe-filtrados-modal');
    if (existente) { existente.remove(); return; }
    if (_descartadosBuffer.length === 0) return;

    const html = _descartadosBuffer.slice(0, 40).map(({ g, exc, score }) =>
      _renderCard(g, exc, { label:'🔍 Verificar', cor:'#94a3b8', tipo:'verificar', descartado:false })
    ).join('');

    const modal = document.createElement('div');
    modal.id = 'dioe-filtrados-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:20px;box-sizing:border-box;overflow-y:auto;';
    modal.innerHTML = `
      <div style="background:#0f172a;border:1px solid rgba(148,163,184,0.15);border-radius:12px;padding:20px;max-width:860px;width:100%;margin:auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <div style="color:#f59e0b;font-weight:700;font-size:0.9rem;">🗑️ Lixeira: Ocultados pelo Sistema (Falsos Positivos e Leis) (${_descartadosBuffer.length} total)</div>
          <button onclick="document.getElementById('dioe-filtrados-modal').remove()" style="background:#334155;color:#e2e8f0;border:none;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:0.8rem;">✕ Fechar</button>
        </div>
        <div style="font-size:0.73rem;color:#64748b;margin-bottom:14px;background:#1e293b;border-radius:7px;padding:9px 12px;">
          📌 Estas publicações <strong>foram julgadas pela inteligência como LIXO / FALSO POSITIVO (Atos Normativos, Licitações, Decretos)</strong> e por isso foram retiradas da sua tela principal. Mostramos aqui apenas para auditoria.
        </div>
        ${html}
      </div>`;
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
  }

  // ── Fallback: API indisponível ────────────────────────────────
  function _renderFallback(query, erro) {
    const container = document.getElementById('dioe-resultados');
    if (!container) return;
    const qDiario = `https://queridodiario.ok.org.br/pesquisa?terms=${encodeURIComponent(query)}&state=MT`;
    const dioeLink = `https://www.iomat.mt.gov.br/`;
    container.innerHTML = `
      <div style="background:#1e293b;border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:20px;text-align:center;">
        <div style="font-size:1.4rem;margin-bottom:10px;">⚠️</div>
        <div style="color:#f59e0b;font-weight:700;margin-bottom:6px;">API Querido Diário temporariamente indisponível</div>
        <div style="color:#64748b;font-size:0.78rem;margin-bottom:16px;">
          ${erro ? `Erro: ${erro}` : 'Não foi possível conectar ao servidor.'}<br>
          Acesse diretamente as fontes abaixo para pesquisar:
        </div>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
          <a href="${qDiario}" target="_blank" style="background:#f59e0b;color:#0f172a;border-radius:7px;padding:8px 16px;font-weight:700;font-size:0.8rem;text-decoration:none;">📰 Querido Diário MT</a>
          <a href="${dioeLink}" target="_blank" style="background:#475569;color:#fff;border-radius:7px;padding:8px 16px;font-weight:700;font-size:0.8rem;text-decoration:none;">📋 IOMAT Oficial</a>
          <a href="https://www.sema.mt.gov.br" target="_blank" style="background:#22c55e;color:#fff;border-radius:7px;padding:8px 16px;font-weight:700;font-size:0.8rem;text-decoration:none;">🌿 SEMA-MT</a>
        </div>
      </div>`;
  }

  function _setLoading(ativo) {
    const loading = document.getElementById('dioe-loading');
    const resultados = document.getElementById('dioe-resultados');
    if (loading) loading.style.display = ativo ? 'block' : 'none';
    if (resultados) resultados.style.display = ativo ? 'none' : 'block';
    _buscando = ativo;
  }

  function _setBadge(texto, cor = '#38bdf8') {
    const badge = document.getElementById('dioe-status-badge');
    if (badge) { badge.textContent = texto; badge.style.color = cor; }
  }

  // ── Busca principal ──────────────────────────────────────────
  async function _buscar(query) {
    if (_buscando) return;
    const dias = parseInt((document.getElementById('dioe-dias') || {}).value || 30);
    _setLoading(true);
    _setBadge('Buscando...', '#f59e0b');

    try {
      const data = await _buscarAPI(query, dias);
      _renderResultados(data, query);
      const total = data.total_gazettes || 0;
      _setBadge(total > 0 ? `✅ ${total} publicações brutas` : '⚠️ Sem resultados', total > 0 ? '#22c55e' : '#f59e0b');
    } catch (e) {
      console.warn('[DiarioOficial] Erro na API:', e.message);
      _renderFallback(query, e.message.includes('abort') ? 'Timeout (15s)' : e.message);
      _setBadge('❌ API indisponível', '#ef4444');
    } finally {
      _setLoading(false);
    }
  }

  // ── API Pública ──────────────────────────────────────────────

  // Timestamp da última busca — evita rebuscar se reabrindo em < 5 min
  let _ultimaBusca = 0;
  const CACHE_MS = 5 * 60 * 1000; // 5 minutos

  function init() {
    // Sincroniza estado inicial dos toggles na UI
    const chkResolvido = document.getElementById('dioe-toggle-resolvidos');
    if (chkResolvido) chkResolvido.checked = !_ocultarResolvidos;

    const agora = Date.now();
    const deveRebuscar = (agora - _ultimaBusca) > CACHE_MS;

    if (deveRebuscar) {
      _ultimaBusca = agora;
      _buscar(_filtroAtivo.query);
    }
  }

  function selecionarFiltro(btn) {
    document.querySelectorAll('.dioe-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    _filtroAtivo = { query: btn.dataset.query, id: btn.dataset.id };
    const inp = document.getElementById('dioe-busca-custom');
    if (inp) inp.value = '';
    _buscar(_filtroAtivo.query);
  }

  function buscarFiltroAtivo() {
    const custom = (document.getElementById('dioe-busca-custom') || {}).value?.trim();
    _buscar(custom || _filtroAtivo.query);
  }

  function buscarCustom() {
    const val = (document.getElementById('dioe-busca-custom') || {}).value?.trim();
    if (!val) return;
    document.querySelectorAll('.dioe-chip').forEach(c => c.classList.remove('active'));
    _buscar(val);
  }

  /** Alterna exibição de publicações possivelmente resolvidas */
  function toggleResolvidos(mostrar) {
    _ocultarResolvidos = !mostrar;
    buscarFiltroAtivo();
  }

  /** Altera filtro por perfil profissional */
  function selecionarPerfil(perfil) {
    _perfilAtivo = perfil;
    document.querySelectorAll('.dioe-perfil-btn').forEach(b => {
      b.style.opacity = b.dataset.perfil === perfil ? '1' : '0.45';
      b.style.transform = b.dataset.perfil === perfil ? 'scale(1.05)' : 'scale(1)';
    });
    buscarFiltroAtivo();
  }

  // ── Busca por município específico (via Querido Diário) ──────────
    function buscarMunicipio(territoryId) {
    const select = document.getElementById('dioe-municipio-select');
    const query = document.getElementById('dioe-busca-custom')?.value ||
      document.querySelector('.dioe-chip.active')?.dataset?.query ||
      'autuado ambiental licenca irregularidade';

    if (!territoryId) {
      _filtroAtivo = { query, id: 'municipio_todos' };
      _buscar(query);
      return;
    }

    _filtroAtivo = { query, id: "municipio_$territoryId" };
    _buscarEExibir(query, territoryId);
  }

  // ── Busca restrita a um território específico ────────────────
  async function _buscarEExibir(querystring, territoryIdFiltro) {
    const dias = parseInt((document.getElementById('dioe-dias') || {}).value || 30);
    const container = document.getElementById('dioe-resultados');
    const loading = document.getElementById('dioe-loading');
    if (!container) return;
    loading.style.display = 'block';
    container.innerHTML = '';
    document.getElementById('dioe-footer').style.display = 'none';

    try {
      const since = _sinceDias(dias);
      const until = new Date().toISOString().split('T')[0];
      const params = new URLSearchParams({ querystring, since, until, size: 60, offset: 0, pre_tags: '<mark>', post_tags: '</mark>' });
      const territories = territoryIdFiltro
        ? [territoryIdFiltro]
        : [MT_STATE_TERRITORY, ...MT_TERRITORIES];
      territories.forEach(t => params.append('territory_ids', t));
      const res = await fetch(`${API}/gazettes?${params}`, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      loading.style.display = 'none';
      _renderResultados(data, querystring);
    } catch (e) {
      loading.style.display = 'none';
      _renderFallback(querystring, e.message);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  //  PARSER DE AUTUAÇÕES EM LOTE
  //  Recebe texto colado do PDF e extrai leads individuais
  // ══════════════════════════════════════════════════════════════════
  function _parsearLinhasLote(texto) {
    const linhas = [];
    // Normaliza espaços e quebras de linha
    const t = texto.replace(/\r?\n/g, ' ').replace(/\s{2,}/g, ' ').trim();

    // Padrão: número de item (opcional) + auto (ex: 086/2025) + descrição + nome + CPF/CNPJ
    const cnpjRe = /\d{2}\.?\d{3}\.?\d{3}[\/\\]?\d{4}-?\d{2}/g;
    const cpfMaskedRe = /\*{2,3}\.?\d{3}\.?\d{3}-\*{2}/g;
    const autoRe = /\b(\d{2,4}\/\d{4})\b/g;

    // Encontra todos os autos no texto
    const autos = [];
    let m;
    while ((m = autoRe.exec(t)) !== null) {
      autos.push({ num: m[1], pos: m.index });
    }

    for (let i = 0; i < autos.length; i++) {
      const start = autos[i].pos + autos[i].num.length;
      const end = i < autos.length - 1 ? autos[i + 1].pos : t.length;
      let segmento = t.substring(start, end).replace(/^\s*\d+\s*/, '').trim(); // remove item# no início

      // Identifica CNPJ ou CPF mascarado no final
      let cnpj = null, cpfMasked = null;
      const cnpjMatch = segmento.match(/\d{2}\.?\d{3}\.?\d{3}[\/\\]?\d{4}-?\d{2}/);
      const cpfMatch = segmento.match(/\*{2,3}\.?\d{3}\.?\d{3}-\*{2}/);

      if (cnpjMatch) {
        cnpj = cnpjMatch[0];
        segmento = segmento.replace(cnpj, '').trim();
      } else if (cpfMatch) {
        cpfMasked = cpfMatch[0];
        segmento = segmento.replace(cpfMasked, '').trim();
      }

      // Remove item number que ficou no segmento
      segmento = segmento.replace(/^\d+\s+/, '').trim();

      // Separa descrição (ALL CAPS) do nome da pessoa
      // Heurística: encontra onde a frase em maiúsculas "parece" terminar
      const descricaoMatch = segmento.match(/^([A-ZÁÉÍÓÚÀÃÕÂÊÎÔÛÇÜÑ\s\,\.\/\d\-]+?)\s{2,}([A-ZÁÉÍÓÚÀÃÕÂÊÎÔÛÇ][a-záéíóúàãõâêîôûç].*?)$/);
      let descricao = segmento, nome = '';

      if (descricaoMatch) {
        descricao = descricaoMatch[1].trim();
        nome = descricaoMatch[2].trim();
      } else {
        // Tentativa alternativa: nome começa quando muda padrão CAPS para mixed
        const mixedIdx = segmento.search(/\b[A-ZÁÉÍÓÚ][a-záéíóú]/);
        if (mixedIdx > 10) {
          descricao = segmento.substring(0, mixedIdx).trim();
          nome = segmento.substring(mixedIdx).trim();
        }
      }

      // Detecta tipo de infração
      const dt = descricao.toLowerCase();
      let tipo = 'Autuação Ambiental';
      let servico = 'Defesa técnica + PRAD + Regularização Ambiental';
      let urgencia = '🔴 URGENTE';
      if (dt.includes('licenciamento') || dt.includes('sem licença') || dt.includes('licença ambiental')) {
        tipo = 'Sem Licença Ambiental';
        servico = 'LP + LI + LO (Regularização completa) + ART CREA/CAU';
        urgencia = '🔴 URGENTE';
      } else if (dt.includes('suprim') || dt.includes('árvore') || dt.includes('vegeta')) {
        tipo = 'Supressão Vegetal';
        servico = 'PRAD + Compensação Florestal + ART CREA';
        urgencia = '🟡 Médio';
      } else if (dt.includes('queimada') || dt.includes('incendi')) {
        tipo = 'Queimada Urbana';
        servico = 'PRAD + ART CREA + Estudo de Impacto';
        urgencia = '🟡 Médio';
      } else if (dt.includes('resíduo') || dt.includes('entulho') || dt.includes('lixo') || dt.includes('depositar')) {
        tipo = 'Resíduos Irregulares';
        servico = 'PGRS (Plano de Ger. de Resíduos) + ART CREA';
        urgencia = '🟡 Médio';
      } else if (dt.includes('efluente') || dt.includes('esgoto') || dt.includes('lançar')) {
        tipo = 'Lançamento de Efluente';
        servico = 'Projeto de ETE + Outorga de Diluição + ART CREA';
        urgencia = '🔴 URGENTE';
      } else if (dt.includes('notificação') || dt.includes('prazo') || dt.includes('descumpri')) {
        tipo = 'Descumprimento de Notificação';
        servico = 'Resposta técnica + Defesa administrativa + PRAD';
        urgencia = '🔴 URGENTE';
      }

      linhas.push({
        auto: autos[i].num,
        descricao: descricao || 'Ver PDF',
        nome: nome || (cnpj ? '' : 'Pessoa Física'),
        cnpj,
        cpfMasked,
        tipo,
        servico,
        urgencia,
        temEmpresa: !!cnpj
      });
    }
    return linhas;
  }

  // ─── Detecta o formato do texto do IOMAT / DO Municipal colado ──
  function _detectarFormatoIOMAT(texto) {
    const t = texto.toLowerCase();
    // NUCAM: tabela com colunas AUTUADO | CPF | PROCURADOR | PROCESSO | AUTO | ATO
    if (t.includes('autuado') && t.includes('cpf/') && (t.includes('procurador') || t.includes('auto de infração'))) return 'nucam';
    // Intimação/Notificação SEMA (CIND, CAPIA, etc.): blocos INTERESSADO + CPF/CNPJ + RESPONSAVEL
    if (t.includes('interessado:') && (t.includes('ofício de pendência') || t.includes('oficio de pendencia'))) return 'intimacao';
    if (t.includes('interessado:') && t.includes('responsav') && t.includes('cpf/cnpj')) return 'intimacao';
    if (t.includes('interessado:') && t.includes('cpf/cnpj:')) return 'intimacao';
    if (t.includes('interessado:') && t.includes('check-list')) return 'intimacao';
    // Municipal: alvará, habite-se, IPTU, obras, vigilância sanitária
    if (t.includes('alvará') || t.includes('habite-se') || t.includes('vigilância sanitária') || t.includes('vigilancia sanitaria')) return 'municipal';
    if (t.includes('cmtur') || t.includes('semma') || t.includes('smma') || t.includes('secretaria municipal de meio ambiente')) return 'municipal';
    if ((t.includes('embargo de obra') || t.includes('auto de embargo') || t.includes('auto de demolição'))) return 'municipal';
    if (t.includes('iptu') && t.includes('inadimplente')) return 'municipal';
    return 'lote'; // formato genérico de autos
  }

  // ─── Parser 1: Tabela NUCAM ────────────────────────────────────────
  // Ex: JOSÉ BUFON JÚNIOR | 489.***.***-91 | Dra. CARLA RACHEL | 189688/2017 | 133597 | Despacho nº 138/2026
  function _parsearNUCAM(texto) {
    const leads = [];
    const linhas = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const cpfRe = /\d{3}[\.\ \*][\*\d]{3}[\.\ \*][\*\d]{3}[-\.][\*\d]{2}/;
    const cnpjRe = /\d{2}[\.\ ]?\d{3}[\.\ ]?\d{3}[\/\\]?\d{4}[-\ ]?\d{2}/;

    linhas.forEach(linha => {
      const hasCpfCnpj = cpfRe.test(linha) || cnpjRe.test(linha);
      if (!hasCpfCnpj) return;

      const cnpjM = linha.match(cnpjRe);
      const cpfM = linha.match(cpfRe);
      const docId = cnpjM ? cnpjM[0] : (cpfM ? cpfM[0] : '');
      const isCnpj = !!cnpjM;

      const partes = linha.split(/\s{2,}|\t/).map(p => p.trim()).filter(Boolean);
      let nome = '', processo = '', autoInfracao = '', ato = '', procurador = '';

      partes.forEach(p => {
        if (cnpjRe.test(p) || cpfRe.test(p)) return;
        if (/^\d{5,}(\/\d{4})?$/.test(p)) { if (!processo) processo = p; else if (!autoInfracao) autoInfracao = p; return; }
        if (/^despacho|^ata|^acórdão|^portaria|^resolução/i.test(p)) { ato = p; return; }
        if (/^(dr|dra|adv|advogado)/i.test(p)) { procurador = p; return; }
        if (!nome && /[A-ZÁÉÍÓÚ]/.test(p) && p.length > 5) nome = p;
      });

      const atoL = ato.toLowerCase();
      let tipo = 'NUCAM — Autuação Ambiental';
      let servico = 'Defesa Administrativa + PRAD + Recurso no NUCAM/SEMA';
      let urgencia = '🔴 URGENTE';
      if (atoL.includes('indeferimento')) { tipo = 'NUCAM — Ata de Indeferimento'; servico = 'Recurso Administrativo + Defesa + Regularização Ambiental'; }
      else if (atoL.includes('despacho')) { tipo = 'NUCAM — Despacho Ambiental'; servico = 'Acompanhamento de Processo + Defesa Técnica + PRAD'; urgencia = '🟡 Médio'; }
      else if (atoL.includes('acórdão') || atoL.includes('acordao')) { tipo = 'NUCAM — Acórdão'; servico = 'Análise de Acórdão + Recurso + Regularização'; urgencia = '🟡 Médio'; }

      leads.push({ formato: 'nucam', nome: nome || 'Ver PDF', doc: docId, isCnpj, processo: processo || autoInfracao || '', autoInfracao, ato, procurador, tipo, servico, urgencia, temEmpresa: isCnpj, textoOriginal: linha });
    });
    return leads;
  }

  // ─── Parser 2: Termos de Intimação / Notificação SEMA ─────────────
  // Suporta CIND, CAPIA, NUCAM, SALARH, etc.
  // Estratégia: divide em blocos por "INTERESSADO:" (mais robusto que dividir por data)
  function _parsearIntimacao(texto) {
    const leads = [];
    // Divide por cada ocorrência de INTERESSADO: — é o marcador real de cada entry
    // Permite processo antes do INTERESSADO na mesma linha ou linha anterior
    const blocos = texto.split(/(?=(?:\d{2,6}\/\d{4}\s*)?INTERESSADO\s*:)/i).filter(b => b.trim().length > 10);

    blocos.forEach(bloco => {
      const t = bloco.trim();
      // Número do processo: padrão NNNN/AAAA no início do bloco
      const processoM = t.match(/^(\d{2,6}\/\d{4})/);
      const processo = processoM ? processoM[1] : '';

      // Interessado
      const interessadoM = t.match(/INTERESSADO\s*:\s*([^\n\r]+)/i);
      const interessado = interessadoM ? interessadoM[1].trim() : '';

      // CPF/CNPJ: aceita mascarado (213.***.***-79) e completo (46.794.754/0001-61)
      const docM = t.match(/CPF\/CNPJ\s*:\s*([\d\*\.\-\/\ ]{6,22})/i);
      const doc = docM ? docM[1].trim() : '';
      const cnpjCheck = /\d{2}\.?\d{3}\.?\d{3}[\/\\]\d{4}-?\d{2}/;
      const isCnpj = cnpjCheck.test(doc);

      // Responsável Técnico
      const respM = t.match(/RESPONS(?:AVEL|ÁVEIS?|ÁVE|ÁVEL)\s*:\s*([^\n\r]+)/i);
      const responsavel = respM ? respM[1].trim() : '';

      // Ofício / Check-list / Relatório
      const oficioM = t.match(/(?:OF[IÍ]CIO(?:\sDE\sPEND[EÊ]NCIA)?|CHECK[-\s]?LIST|RELATÓRIO TÉCNICO|DESPACHO)\s*[:\/]?\s*([^\n\r]{3,})/i);
      const oficio = oficioM ? oficioM[1].trim() : '';

      // Detecta se tem "aguardando protocolo do responsável técnico" (lead QUENTE)
      const aguardando = /aguardando protocolo|aguardando responsável|sem responsável técnico|sem rt|rt não cadastrado/i.test(t);

      if (!interessado && !processo) return;

      // Detecta tipo de pendência pelo conteúdo do bloco
      const tl = t.toLowerCase();
      let tipo = 'SEMA — Pendência de Licenciamento';
      let servico = 'Atendimento de Pendência + RT + Documentação + Protocolo SIGA';
      let urgencia = '🔴 URGENTE';

      if (tl.includes('capia') || tl.includes('pecuária') || tl.includes('pecuaria') || tl.includes('aquicultura') || tl.includes('irrigação') || tl.includes('irrigacao') || tl.includes('check-list')) {
        tipo = 'CAPIA — Pecuária / Irrigação / Aquicultura';
        servico = 'RT Responsável + Outorga de Captação + Laudo Hidrogeológico + Protocolo no SIGA';
      } else if (tl.includes('cind') || tl.includes('indústria') || tl.includes('industria') || tl.includes('frigorí') || tl.includes('frigori') || tl.includes('industrial') || tl.includes('laminados') || tl.includes('destilaria') || tl.includes('entreposto') || tl.includes('alimentos')) {
        tipo = 'CIND — Pendência Industrial';
        servico = 'RT + Licença Ambiental Industrial + PCA + Relatório de Monitoramento';
      } else if (tl.includes('salarh') || tl.includes('recursos hídricos') || tl.includes('outorga') || tl.includes('poço')) {
        tipo = 'SALARH — Recursos Hídricos';
        servico = 'RT Hidrogeólogo + Outorga de Captação + Laudo + Teste de Bombeamento';
      } else if (tl.includes('nucam') || tl.includes('conciliação ambiental') || tl.includes('ata de indeferimento') || tl.includes('despacho') && tl.includes('auto de infração')) {
        tipo = 'NUCAM — Conciliação Ambiental';
        servico = 'Defesa Administrativa + PRAD + Recurso Administrativo';
      } else if (tl.includes('coord') && (tl.includes('florestal') || tl.includes('vegeta') || tl.includes('app') || tl.includes('car'))) {
        tipo = 'Coord. Florestal — Pendência Vegetal';
        servico = 'RT Engenheiro Florestal + ASV + CAR + PRAD';
      } else if (tl.includes('sob pena de indeferimento') || tl.includes('arquivamento definitivo') || tl.includes('inércia') || tl.includes('inercia')) {
        tipo = 'SEMA — Prazo Final (Risco de Arquivamento)';
        servico = 'Resposta URGENTE + RT + Documentação + Protocolo SIGA';
      }

      leads.push({
        formato: 'intimacao',
        nome: interessado || 'Ver PDF',
        doc,
        isCnpj,
        responsavel,
        processo,
        oficio,
        aguardando,
        tipo,
        servico,
        urgencia,
        temEmpresa: isCnpj,
        textoOriginal: t.substring(0, 400),
      });
    });
    return leads;
  }

  // ─── Parser 3: Diário Oficial Municipal — Obras, Fiscal, VS ───────
  // Suporta: alvarás, habite-se, IPTU, embargos de obra, Vigilância Sanitária,
  //          Secretaria Municipal de Meio Ambiente, Editais de Notificação
  function _parsearMunicipal(texto) {
    const leads = [];
    const linhas = texto.split(/\r?\n/);
    const cnpjRe = /\d{2}\.?\d{3}\.?\d{3}[\/\\]?\d{4}-?\d{2}/;
    const cpfMaskRe = /\d{3}[\.\*][\*\d]{3}[\.\*][\*\d]{3}-[\*\d]{2}/;

    // Estratégia: procura blocos com palavras-chave de lead municipal
    const palavrasGatilho = [
      'embargo de obra', 'auto de embargo', 'auto de demolição', 'ordem de demolição',
      'construção irregular', 'obra irregular', 'obra sem licença', 'construção sem licença',
      'sem alvará', 'alvará vencido', 'alvará expirado', 'alvará não renovado',
      'sem habite-se', 'habite-se pendente', 'parcelamento irregular', 'loteamento irregular',
      'uso irregular do solo', 'uso do solo em desacordo',
      'vigilância sanitária', 'auto de infração sanitária', 'alvará sanitário',
      'iptu inadimplente', 'iptu em atraso', 'dívida ativa', 'divida ativa',
      'notificação fiscal', 'auto de infração fiscal', 'débito tributário',
      'secretaria municipal de meio ambiente', 'smma', 'semma', 'cmtur',
      'auto de infração ambiental', 'notificação ambiental municipal',
      'licença ambiental municipal', 'alvará ambiental',
      'poluição sonora', 'poluição visual', 'resíduo sólido irregular',
    ];

    // Agrupa texto em janelas de 5 linhas e analisa cada janela
    for (let i = 0; i < linhas.length; i++) {
      const janela = linhas.slice(Math.max(0, i-1), i+6).join(' ').replace(/\s+/g, ' ');
      const jl = janela.toLowerCase();
      const gatilho = palavrasGatilho.find(p => jl.includes(p));
      if (!gatilho) continue;

      // Evita duplicar (se a linha anterior já gerou lead)
      const cnpjM = janela.match(cnpjRe);
      const cpfM = janela.match(cpfMaskRe);
      const doc = cnpjM ? cnpjM[0] : (cpfM ? cpfM[0] : '');
      const isCnpj = !!cnpjM;

      // Extrai nome/razão social: linha com maiúsculas antes do gatilho
      const nomePotencial = linhas[i] && linhas[i].trim().length > 5 ? linhas[i].trim() : '';

      // Número de processo / auto
      const processoM = janela.match(/(?:Auto|Processo|Prot[.]?|N[º°])\.?\s*(\d{3,}[\/\-]?\d{0,4})/i);
      const processo = processoM ? processoM[1] : '';

      // Detecta tipo e serviço
      let tipo = 'Municipal — Irregular';
      let servico = 'Regularização + Alvará + RT';
      let urgencia = '🔴 URGENTE';

      if (jl.includes('embargo de obra') || jl.includes('auto de embargo') || jl.includes('demolição')) {
        tipo = 'Municipal — Embargo / Demolição de Obra'; servico = 'Defesa Técnica + Regularização de Obra + Alvará + ART CREA/CAU'; urgencia = '🔴 URGENTE';
      } else if (jl.includes('sem alvará') || jl.includes('alvará vencido') || jl.includes('alvará expirado') || jl.includes('construção irregular') || jl.includes('obra irregular')) {
        tipo = 'Municipal — Obra sem Alvará / Irregular'; servico = 'Regularização + Alvará de Construção + Projeto + ART CREA/CAU'; urgencia = '🔴 URGENTE';
      } else if (jl.includes('sem habite-se') || jl.includes('habite-se pendente')) {
        tipo = 'Municipal — Habite-se Pendente'; servico = 'Levantamento Topográfico + Habite-se + AVCB + Memorial Descritivo'; urgencia = '🟡 Médio';
      } else if (jl.includes('loteamento irregular') || jl.includes('parcelamento irregular')) {
        tipo = 'Municipal — Parcelamento Irregular'; servico = 'Regularização Fundiária + Levantamento Topográfico + Registro CRI'; urgencia = '🔴 URGENTE';
      } else if (jl.includes('vigilância sanitária') || jl.includes('alvará sanitário') || jl.includes('auto de infração sanitária')) {
        tipo = 'Vigilância Sanitária — Irregular'; servico = 'Regularização Sanitária + Alvará VS + Projeto de Adequação'; urgencia = '🔴 URGENTE';
      } else if (jl.includes('iptu') || jl.includes('dívida ativa') || jl.includes('divida ativa') || jl.includes('débito')) {
        tipo = 'Municipal — Dívida / IPTU Irregular'; servico = 'Consultoria Tributária + Parcelamento + Regularização Imobiliária'; urgencia = '🟡 Médio';
      } else if (jl.includes('smma') || jl.includes('semma') || jl.includes('secretaria municipal de meio ambiente') || jl.includes('ambiental municipal')) {
        tipo = 'SMMA — Ambiental Municipal'; servico = 'Licença Ambiental Municipal + RT Ambiental + PCA + CAR'; urgencia = '🔴 URGENTE';
      } else if (jl.includes('uso irregular') || jl.includes('uso do solo')) {
        tipo = 'Municipal — Uso Irregular do Solo'; servico = 'Regularização + Alvará + Projeto de Uso do Solo + Levantamento Topo'; urgencia = '🟡 Médio';
      }

      // Pula se não tem empresa/pessoa identificável
      if (!doc && nomePotencial.length < 6) { i += 3; continue; }

      leads.push({
        formato: 'municipal',
        nome: nomePotencial,
        doc,
        isCnpj,
        processo,
        tipo,
        servico,
        urgencia,
        temEmpresa: isCnpj,
        textoOriginal: janela.substring(0, 300),
        gatilho,
      });

      i += 4; // avança para não duplicar
    }
    return leads;
  }

  // ─── Renderiza card de lead IOMAT ─────────────────────────────────
  function _renderCardIOMAT(lead) {
    const urgColor = lead.urgencia.includes('URGENTE') ? '#ef4444' : lead.urgencia.includes('Médio') ? '#f59e0b' : '#22c55e';
    const docLabel = lead.isCnpj ? '🏢 CNPJ' : '👤 CPF';
    const cnpjLink = lead.isCnpj && lead.doc ? `<a href="https://cnpj.biz/${lead.doc.replace(/\D/g,'')}" target="_blank" style="background:#7c3aed;color:#fff;border-radius:6px;padding:4px 9px;font-size:0.7rem;text-decoration:none;font-weight:700;">🏢 Ver CNPJ</a>` : '';
    const googleQ = encodeURIComponent((lead.nome || lead.tipo) + ' ' + (lead.doc || '') + ' Mato Grosso');
    const sigaBtn = lead.processo ? `<button onclick="navigator.clipboard.writeText('${lead.processo}').then(()=>window.open('https://portal.sema.mt.gov.br','_blank')); alert('Número ${lead.processo} copiado! Cole no SIGA/SEMA.');" style="background:#22c55e20;color:#22c55e;border:1px solid #22c55e40;border-radius:6px;padding:4px 9px;font-size:0.7rem;cursor:pointer;">🌿 Consultar SIGA</button>` : '';

    let extraInfo = '';
    if (lead.formato === 'intimacao') {
      extraInfo = `
        ${lead.oficio ? `<div style="color:#38bdf8;font-size:0.71rem;margin-top:3px;">📋 Ofício: <strong>${lead.oficio}</strong></div>` : ''}
        ${lead.responsavel ? `<div style="color:#94a3b8;font-size:0.7rem;margin-top:2px;">👤 Responsável atual: ${lead.responsavel}</div>` : ''}
        <div style="background:#dc262215;border:1px solid #ef444430;border-radius:6px;padding:5px 10px;margin-top:6px;font-size:0.72rem;color:#fca5a5;">
          ⚠️ O responsável técnico ainda não protocolou a documentação. <strong>Você pode oferecer este serviço urgentemente.</strong>
        </div>`;
    } else if (lead.formato === 'nucam') {
      extraInfo = `
        ${lead.ato ? `<div style="color:#f59e0b;font-size:0.71rem;margin-top:3px;">📜 Ato: <strong>${lead.ato}</strong></div>` : ''}
        ${lead.procurador ? `<div style="color:#94a3b8;font-size:0.7rem;margin-top:2px;">⚖️ Procurador atual: ${lead.procurador} <span style="color:#f59e0b;font-size:0.68rem;">(pode haver abertura para novo técnico)</span></div>` : ''}`;
    }

    const leadDataObj = { nome: lead.nome, cpfcnpj: lead.doc, municipio: 'MT', servico: lead.servico, tipo: 'IOMAT — ' + lead.tipo, urgencia: lead.urgencia.replace(/[🔴🟡🟢] /,''), origem: 'Parser IOMAT', ticket: lead.isCnpj ? '10000' : '5000', obs: (lead.textoOriginal || lead.processo || '').substring(0, 200) };
    const leadDataStr = JSON.stringify(leadDataObj).replace(/\\/g,'\\\\').replace(/'/g,"\\'");

    return `
      <div style="background:#1e293b;border:1px solid ${lead.temEmpresa ? '#22c55e30' : 'rgba(148,163,184,0.08)'};border-left:3px solid ${urgColor};border-radius:9px;padding:12px 15px;margin-bottom:9px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:6px;">
          <div style="flex:1;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              ${lead.temEmpresa ? '<span style="background:#22c55e20;color:#22c55e;border:1px solid #22c55e40;border-radius:10px;padding:1px 8px;font-size:0.65rem;font-weight:700;">🏢 Empresa</span>' : '<span style="background:#64748b20;color:#94a3b8;border-radius:10px;padding:1px 8px;font-size:0.65rem;">👤 Pessoa Física</span>'}
              <span style="color:#e2e8f0;font-weight:700;font-size:0.83rem;">${lead.nome || 'Sem nome'}</span>
            </div>
            <div style="color:#64748b;font-size:0.71rem;margin-top:4px;">
              ${lead.processo ? `🔎 <strong style="color:#38bdf8;">Proc. ${lead.processo}</strong> · ` : ''}${lead.doc ? `${docLabel}: <span style="color:#94a3b8;user-select:all;">${lead.doc}</span>` : ''}
            </div>
            <div style="color:#94a3b8;font-size:0.72rem;margin-top:4px;font-weight:600;">${lead.tipo}</div>
            ${extraInfo}
          </div>
          <span style="color:${urgColor};font-size:0.72rem;font-weight:700;white-space:nowrap;">${lead.urgencia}</span>
        </div>
        <div style="color:#64748b;font-size:0.72rem;margin-top:8px;">🛠️ <strong style="color:#cbd5e1;">${lead.servico}</strong></div>
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
          ${lead.temEmpresa ? `<button onclick="window._hidroOpenLeadModal(JSON.parse(this.dataset.lead))" data-lead='${leadDataStr}' style="background:#22c55e;color:#fff;border:none;border-radius:6px;padding:5px 10px;font-size:0.72rem;font-weight:700;cursor:pointer;">💾 Salvar Lead</button>` : ''}
          ${sigaBtn}
          ${cnpjLink}
          <a href="https://www.google.com/search?q=${googleQ}" target="_blank" style="background:#1e40af;color:#fff;border-radius:6px;padding:4px 9px;font-size:0.7rem;text-decoration:none;">🔍 Google</a>
          ${lead.doc ? `<button onclick="navigator.clipboard.writeText('${lead.doc}'); this.textContent='✅ Copiado!'; setTimeout(()=>this.textContent='📋 Copiar',1500)" style="background:#0ea5e920;color:#38bdf8;border:1px solid #38bdf840;border-radius:6px;padding:4px 9px;font-size:0.7rem;cursor:pointer;">📋 Copiar</button>` : ''}
        </div>
      </div>`;
  }

  function abrirParserLote() {
    const existing = document.getElementById('modal-parser-lote');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-parser-lote';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;';
    modal.innerHTML = `
      <div style="background:#0f172a;border:1px solid rgba(148,163,184,0.15);border-radius:14px;width:100%;max-width:920px;margin:auto;padding:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div>
            <div style="color:#f1f5f9;font-size:1.05rem;font-weight:800;">📋 Parser IOMAT — Diário Oficial do Estado MT</div>
            <div style="color:#64748b;font-size:0.75rem;margin-top:2px;">Cole texto do PDF do IOMAT. Detecta automaticamente: tabelas NUCAM, Termos de Intimação SEMA, Notificações CAPIA/CIND e Autos de Infração em lote.</div>
          </div>
          <button onclick="document.getElementById('modal-parser-lote').remove()" style="background:#334155;color:#94a3b8;border:none;border-radius:7px;padding:6px 12px;cursor:pointer;font-size:0.85rem;">✕ Fechar</button>
        </div>

        <div style="background:#78350f18;border:1px solid #f59e0b30;border-radius:9px;padding:11px 14px;margin-bottom:12px;font-size:0.77rem;">
          <div style="color:#fbbf24;font-weight:700;margin-bottom:4px;">💡 Por que usar o Parser Manual?</div>
          <div style="color:#94a3b8;line-height:1.5;">O IOMAT (Diário Oficial do Estado de MT) <strong style="color:#e2e8f0;">não está indexado no Querido Diário</strong> — a busca automática do módulo traz apenas diários municipais. Para extrair leads do IOMAT, <strong style="color:#fbbf24;">copie o texto do PDF e cole aqui.</strong></div>
        </div>

        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
          <span style="background:#1e293b;color:#94a3b8;border:1px solid #334155;border-radius:6px;padding:3px 9px;font-size:0.68rem;">✅ Tabela NUCAM (Autuados + CPF/CNPJ + Processo + Ato)</span>
          <span style="background:#1e293b;color:#94a3b8;border:1px solid #334155;border-radius:6px;padding:3px 9px;font-size:0.68rem;">✅ Termo de Intimação SEMA / CIND / CAPIA / SALARH</span>
          <span style="background:#1e293b;color:#94a3b8;border:1px solid #334155;border-radius:6px;padding:3px 9px;font-size:0.68rem;">✅ Diários Municipais (Alvará, Habite-se, Embargo, SMMA)</span>
          <span style="background:#1e293b;color:#94a3b8;border:1px solid #334155;border-radius:6px;padding:3px 9px;font-size:0.68rem;">✅ Lote de Autos de Infração Geral</span>
          <a href="https://www.iomat.mt.gov.br/" target="_blank" style="background:#0f4c75;color:#fff;border-radius:6px;padding:3px 9px;font-size:0.68rem;text-decoration:none;font-weight:700;">📰 Abrir IOMAT</a>
        </div>

        <textarea id="parser-lote-input" placeholder="Cole aqui o texto do PDF do Diário Oficial (IOMAT ou Municipal). Exemplos:

[NUCAM] JOSÉ BUFON JÚNIOR  489.***.***-91  Dra. CARLA RACHEL  189688/2017  133597  Despacho nº 138/2026

[INTIMAÇÃO SEMA]
186/2025 INTERESSADO: MP BRISSOW
CPF/CNPJ: 46.794.754/0001-61
RESPONSAVEL: MARCIA MARIA FAÇANHA DA COSTA
OFÍCIO DE PENDÊNCIA: 204621/CIND/SUIMIS/2025

[DO CUIABÁ / MUNICIPAL]
Empresa XYZ Ltda | CNPJ 04.763.696/0001-40 | Embargo de obra irregular
ALVARÁ VENCIDO - OBRA SEM LICENÇA - NOTIFICAÇÃO Nº 0432/2026

[LOTE AUTOS]
1 086/2025 SEM LICENÇA AMBIENTAL EMPRESA LTDA 04.763.696/0002-40"
          style="width:100%;height:200px;background:#1e293b;color:#e2e8f0;border:1px solid rgba(148,163,184,0.2);border-radius:8px;padding:12px;font-size:0.78rem;font-family:monospace;resize:vertical;box-sizing:border-box;margin-bottom:10px;outline:none;"></textarea>

        <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
          <button onclick="DiarioOficial._executarParser()" style="background:#22c55e;color:#0f172a;border:none;border-radius:7px;padding:8px 20px;font-weight:800;font-size:0.85rem;cursor:pointer;">⚡ Extrair Leads</button>
          <button onclick="document.getElementById('parser-lote-input').value=''" style="background:#334155;color:#94a3b8;border:none;border-radius:7px;padding:8px 14px;font-size:0.82rem;cursor:pointer;">🗑️ Limpar</button>
        </div>

        <div id="parser-lote-resultados"></div>
      </div>`;
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
  }

  function _executarParser() {
    const texto = document.getElementById('parser-lote-input')?.value || '';
    const container = document.getElementById('parser-lote-resultados');
    if (!container || !texto.trim()) return;

    const formato = _detectarFormatoIOMAT(texto);
    let leads = [];
    if (formato === 'nucam') leads = _parsearNUCAM(texto);
    else if (formato === 'intimacao') leads = _parsearIntimacao(texto);
    else if (formato === 'municipal') leads = _parsearMunicipal(texto);
    else leads = _parsearLinhasLote(texto);

    const formatoLabel = { nucam: '🏛️ NUCAM (Estadual)', intimacao: '📋 Intimação SEMA', municipal: '🏢 Diário Municipal', lote: '⚡ Lote de Autos' }[formato] || formato;

    if (!leads.length) {
      container.innerHTML = `<div style="color:#f59e0b;padding:12px;background:#78350f20;border-radius:8px;border:1px solid #f59e0b30;font-size:0.82rem;">⚠️ Nenhum lead detectado. Verifique se o texto foi copiado corretamente do PDF do IOMAT.<br>Formato detectado: <strong>${formatoLabel}</strong>.</div>`;
      return;
    }

    const empresas = leads.filter(l => l.temEmpresa);
    window._loteLeadsAtual = leads;
    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
        <div>
          <div style="color:#22c55e;font-size:0.8rem;font-weight:700;">✅ ${leads.length} lead(s) extraído(s) · 🏢 ${empresas.length} empresa(s) com CNPJ</div>
          <div style="color:#64748b;font-size:0.69rem;margin-top:2px;">Formato detectado: <strong style="color:#94a3b8;">${formatoLabel}</strong></div>
        </div>
        ${empresas.length > 0 ? `<button onclick="DiarioOficial._salvarTodosLote()" style="background:#22c55e;color:#0f172a;border:none;border-radius:6px;padding:5px 12px;font-weight:800;font-size:0.75rem;cursor:pointer;">💾 Salvar ${empresas.length} empresa(s) no CRM</button>` : ''}
      </div>
      ${leads.map(lead => _renderCardIOMAT(lead)).join('')}`;
  }

  function _salvarTodosLote() {
    const leads = window._loteLeadsAtual || [];
    const empresas = leads.filter(l => l.temEmpresa);
    if (!empresas.length) { alert('Nenhuma empresa com CNPJ encontrada.'); return; }
    if (!window.HidroLeads) { alert('Módulo HidroLeads não carregado.'); return; }
    empresas.forEach(l => {
      HidroLeads.save({
        id: Date.now() + Math.random(),
        nome: l.nome || l.tipo,
        cpfcnpj: l.doc || l.cnpj || '',
        municipio: 'MT',
        servico: l.servico,
        tipo: `IOMAT — ${l.tipo}`,
        urgencia: l.urgencia.replace(/[🔴🟡🟢] /, '').trim(),
        origem: 'Parser IOMAT',
        ticket: l.isCnpj ? 10000 : 5000,
        status: 'Novo',
        obs: `Processo: ${l.processo || l.auto || '—'}. ${(l.textoOriginal || l.descricao || '').substring(0, 150)}`,
        followup_acao: 'Contato urgente — pendência no IOMAT',
        dataCriacao: new Date().toLocaleDateString('pt-BR'),
      });
    });
    alert(`✅ ${empresas.length} empresa(s) salvas no CRM com sucesso!`);
    if (window.Agrageo) Agrageo.renderLeadsSalvos();
  }

  return { init, selecionarFiltro, buscarFiltroAtivo, buscarCustom, toggleResolvidos, selecionarPerfil, buscarMunicipio, verFiltrados, abrirParserLote, _executarParser, _salvarTodosLote };

})();
