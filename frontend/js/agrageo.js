'use strict';

const Agrageo = window.Agrageo = (() => {

  /* ── Company Data ── */
  const EMPRESA = {
    nome:      'Alex da Silva Agra',
    fantasia:  'AGRAGEO CONSULTORIA',
    cnpj:      '47.570.284/0001-15',
    endereco:  'R Rio Negro, Quadra 05 Lote 11, Ikaray',
    cep:       '78.130-631',
    cidade:    'Várzea Grande - MT',
    celular:   '(65) 8139-0282',
    email:     'agrageoconsultoria@gmail.com',
    site:      'www.agrageoconsultoria.com',
    pix:       '47.570.284/0001-15', // CNPJ da empresa
    logo:      localStorage.getItem('ag_logo') || '../assets/logo-agrageo.png?v=2',
  };

  let currentLead = null;

  /* ── Catálogo de Serviços Base ── */
  const DEFAULT_CATALOGO = [
    { id: 'geo1', cat: 'CREA', nome: 'Estudo Hidrogeológico (Outorga)', valor: 7200, passo: '🎯 FLUXO DE EXECUÇÃO:\n\n1. ANÁLISE PRÉVIA: Verificação de reserva natural via SIAGAS/CPRM num raio de 5km.\n2. VISTORIA: Check-list em área sobre isolamento sanitário, status da bomba e hidrômetro.\n3. ENSAIO: Direcionar cliente no Teste de Bombeamento e criar Curva de Rebaixamento.\n4. GEOPROCESSAMENTO: Locar o poço via QGIS em Planta de Situação (Usando perímetro SICAR).\n5. LEGAL: Gerar laudo hidrogeológico preenchido + ART técnica e protocolar no órgão SEMA.' },
    { id: 'geo2', cat: 'CREA', nome: 'Laudo Geológico / Parecer Técnico', valor: 6000, passo: '🎯 FLUXO DE EXECUÇÃO:\n\n1. PROGRAMAÇÃO: Verificação de anomalias radiométricas e mapas de frentes pregressas.\n2. VISTORIA: Coleta de amostras litoestruturais de campo (strike, dip, fraturamento).\n3. GEOPROCESSAMENTO: Elaboração do Mapa Geológico local e modelo sig-topográfico.\n4. LEGAL: Emissão do Relatório Geológico detalhado contendo a correlação de dados + ART.' },
    { id: 'geo3', cat: 'CREA', nome: 'Locação de Poço Tubular Profundo', valor: 2400, passo: '🎯 FLUXO DE EXECUÇÃO:\n\n1. PROSPECÇÃO 1: Análise estrutural prévia e leitura de mapas geomorfológicos.\n2. PROSPECÇÃO 2: Caminhamento e investigação de pontos anômalos no terreno do cliente.\n3. MARCAÇÃO: Cravação da estaca com amarração via GPS de navegação.\n4. FINALIZAÇÃO: Entrega de relatório sucinto PDF justificando tectônica para a perfuradora.' },
    { id: 'geo4', cat: 'CREA', nome: 'Relatório Final de Pesquisa Mineral (ANM)', valor: 120000, passo: '🎯 FLUXO DE EXECUÇÃO:\n\n1. ACERVO: Compilação de pesquisas publicadas na poligonal e mapas geofísicos (CPRM).\n2. GERAÇÃO DE DADOS: Coleta/acompanhamento geológico e topografia restrita.\n3. ESTIMATIVA: Cálculo rigoroso das reservas Cúbicas/Toneladas por métodos clássicos.\n4. AUTUAÇÃO: Entrega obrigatória de mapas estruturais sob PADRÃO ANM + ART integral.' },
    { id: 'cft1', cat: 'CFT', nome: 'Georreferenciamento de Imóveis (SIGEF/INCRA)', valor: 4500, passo: '🎯 FLUXO DE EXECUÇÃO:\n\n1. INICIAL: Assinatura de Cartas de Anuência e Acordo com vizinhos.\n2. CAMPO: Posicionar GPS (RTK/PPK) e materialização dos Marcos Geodésicos de limite.\n3. ESCRITÓRIO: Descarregar RINEX no PPP IBGE ou TopoGRAPH e realizar planimetria.\n4. CADASTRO: Geração de Memoriais Descritivos, arquivo .ODS e upload direto no SIGEF.\n5. FINAL: Averbação dos mapas TRT validados no Cartório.' },
    { id: 'cft2', cat: 'CFT', nome: 'Levantamento Planialtimétrico Cadastral', valor: 3000, passo: '🎯 FLUXO DE EXECUÇÃO:\n\n1. CAMPO: Varredura com Estação Total ou RTK em rede cravando limites visuais.\n2. BACKOFFICE: Exportação e processamento para AutoCAD e desenho de contornos.\n3. GEOPROCESSAMENTO: Interpolação de pontos gerando curvas de nível fluídas a 1 metro.\n4. ENTREGA: Fornecer .DWG, Planta de Localização em PDF A3 + TRT de demarcação.' },
    { id: 'cft3', cat: 'CFT', nome: 'Mapeamento com Drone (Ortofoto/MDT)', valor: 2500, passo: '🎯 FLUXO DE EXECUÇÃO:\n\n1. LOGÍSTICA: Estruturar voo automático em grid (DroneDeploy/Litchi).\n2. REFERÊNCIA: Fixação de Pontos de Controle no Solo (GCP) com spray visível e coordenada.\n3. VOO CEGO: Cobertura da área recolhendo overlap exigido de ortofotos limpas.\n4. RENDERIZAÇÃO: Costura via Agisoft/WebODM gerando MDE, MDT e Ortomosaico Final.\n5. ENTREGA: Link do visualizador online, TIFF georreferenciada e arquivo KMZ.' },
    { id: 'cft4', cat: 'CFT', nome: 'Projeto de Loteamento / Desmembramento', valor: 6500, passo: '🎯 FLUXO DE EXECUÇÃO:\n\n1. ANÁLISE: Verificação do plano diretor e restrições da SEMA.\n2. TOPOGRAFIA: Levantamento planialtimétrico completo das divisas e arruamento.\n3. PROJETO: Desenho urbanístico/rural de parcelamento de solo CAD/GIS.\n4. LEGAL: Emissão de Memoriais Descritivos, Plantas e pagamento de TRT CFT para cartório.' },
    { id: 'cft5', cat: 'CFT', nome: 'Levantamento Batimétrico (Lagos/Rios)', valor: 5000, passo: '🎯 FLUXO DE EXECUÇÃO:\n\n1. PLANEJAMENTO: Estabelecer malha de navegação e amarrações de controle.\n2. CAMPO: Navegação embarcada com Ecobatímetro acoplado ao GNSS RTK.\n3. PROCESSAMENTO: Filtragem de falsos ecos acústicos e geração do perfil de leito.\n4. RENDERIZAÇÃO: Modelagem Digital de Elevação do leito e emissão de Planta Batimétrica + TRT.' },
    { id: 'cft6', cat: 'CFT', nome: 'Cadastro Florestal de Imóveis Rurais (CEFIR/CAR)', valor: 2500, passo: '🎯 FLUXO DE EXECUÇÃO:\n\n1. INICIAL: Obtenção de matrículas, CCIR e documentação dominial.\n2. GIS: Vetorização minuciosa de hidrografia, APP, RL e Uso Consolidado da propriedade.\n3. LANÇAMENTO: Lançamento de atributos em Módulos Nacionais (SICAR/CEFIR).\n4. FINALIZAÇÃO: Download do Recibo Ambiental e emissão do TRT técnico de Geoprocessamento.' },
    { id: 'cft7', cat: 'CFT', nome: 'Locação Geodésica de Obras Civis e Terraplenagem', valor: 3500, passo: '🎯 FLUXO DE EXECUÇÃO:\n\n1. EXPORTAÇÃO: Extração de vértices DWG de projeto (eixos, pilares, greide) via AutoCAD Civil.\n2. GABARITO: Upload de coordenadas da nuvem para as Coletoras Topográficas GNSS.\n3. CAMPO: Locação real cravada em terreno (Materialização do esquadro da obra civil).\n4. ENTREGA: Caderneta técnica de campo entregue à empreiteira sob emissão de TRT ativa.' },
    { id: 'amb1', cat: 'AMBOS', nome: 'Cadastro Ambiental Rural (CAR)', valor: 1800, passo: '🎯 FLUXO DE EXECUÇÃO:\n\n1. IDENTIFICAÇÃO: Aquisição de certidão de inteiro teor atual e base INCRA.\n2. GEOPROCESSAMENTO: Usar QGIS para espelhar Limites e vetorizar APPs/Reserva Legal.\n3. HISTÓRIA: Analisar uso consolidado pré-2008 usando coleções Satélite.\n4. LANÇAMENTO: Up do shapefile poligonizado no sistema SICAR do Governo.\n5. GESTÃO: Requerer o recibo estadual, preencher ART técnica e protocolar faturamento.' },
    { id: 'amb2', cat: 'AMBOS', nome: 'Plano de Recuperação de Área (PRAD)', valor: 4000, passo: '🎯 FLUXO DE EXECUÇÃO:\n\n1. CONTINGÊNCIA: Averiguação do auto de embargo apontando a coordenada e o bioma danificado.\n2. ARRANJO: Dimensionar mix de espécies arbóreas nativas (pioneiras x clímax).\n3. TÉCNICA: Justificação de isolamento da área e técnicas (semeadura ou plantio).\n4. FINANCEIRO: Imprimir tabela de estimativa de custos contendo cerca e EPIs necessários.\n5. PROPOSTA DE TERMO: Assinatura, protocolo legal + contrato de 3 anos de monitoramento.' },
    { id: 'amb3', cat: 'AMBOS', nome: 'Defesa de Auto de Infração SEMA', valor: 3000, passo: '🎯 FLUXO DE EXECUÇÃO:\n\n1. NOTIFICAÇÃO: Investigar prazo decadencial de resposta ambiental.\n2. GEOPROCESSAMENTO 1: Baixar polígono do alerta DETER no Ibama/Inpe e inserir no QGIS.\n3. GEOPROCESSAMENTO 2: Aplicar série histórica de imagens landsat comprovando supressão remota (Pré-2008).\n4. PARECER: Criar o layout da argumentação defensiva derrubando a imputação da multa.\n5. JUDICIAL: Entregar ao advogado tributário ou via protocolo SISPASS/Siga + Recibo.' }
  ];

  let CAT_SERVICOS = JSON.parse(localStorage.getItem('ag_catalogo_v4')) || [...DEFAULT_CATALOGO];

  function saveCatalogo() {
    localStorage.setItem('ag_catalogo_v4', JSON.stringify(CAT_SERVICOS));
    populateDatalist();
  }

  function resetCatalogo() {
    if(confirm('Isso vai reverter a tabela aos valores padrão (Tabela AGEMAT 2025). Continuar?')){
      CAT_SERVICOS = JSON.parse(JSON.stringify(DEFAULT_CATALOGO));
      saveCatalogo();
      renderCatalogo();
    }
  }

  function updateCatItem(id, key, value) {
    const item = CAT_SERVICOS.find(x => x.id === id);
    if(item) {
      if(key==='valor') item[key] = parseFloat(value) || 0;
      else item[key] = value;
      saveCatalogo();
    }
  }

  function renderCatalogo() {
    const el = document.getElementById('ag-catalogo-content');
    if (!el) return;
    
    // Group by category
    const trs = CAT_SERVICOS.map(s => {
      const badgeClass = s.cat === 'CREA' ? 'badge-crea' : s.cat === 'CFT' ? 'badge-cft' : 'badge-ambos';
      const catLabel = s.cat === 'CREA' ? 'Geólogo (ART)' : s.cat === 'CFT' ? 'Técnico (TRT)' : 'Qualquer (ART/TRT)';
      return `
      <tr style="border-bottom:none;">
        <td style="width:120px; border-bottom:none;"><span class="${badgeClass}">${catLabel}</span></td>
        <td style="border-bottom:none;"><input type="text" class="ag-cat-inp" title="Nome do Serviço" value="${s.nome}" onchange="Agrageo.updateCatItem('${s.id}', 'nome', this.value)"></td>
        <td style="width:150px; border-bottom:none;">
          R$ <input type="number" class="ag-cat-inp ag-cat-inp-price" title="Valor (Base)" step="100" value="${s.valor}" onchange="Agrageo.updateCatItem('${s.id}', 'valor', this.value)">
        </td>
      </tr>
      <tr>
        <td colspan="3" style="padding-top:2px; padding-bottom:12px;">
          <textarea class="ag-cat-inp" style="min-height:100px; height:auto; resize:vertical; padding: 12px; line-height: 1.5; font-size: 0.78rem; font-family: monospace; color: #a1a1aa; background: #0f172a; border: 1px dashed #334155; border-radius: 8px; margin-bottom: 8px; margin-top:8px; width:100%; box-sizing: border-box;" placeholder="Orientações e fluxo passo a passo para execução..." onchange="Agrageo.updateCatItem('${s.id}', 'passo', this.value)">${s.passo || ''}</textarea>
        </td>
      </tr>`;
    }).join('');

    el.innerHTML = `
      <table class="ag-cat-table">
        <thead>
          <tr>
            <th>Responsabilidade</th>
            <th>Descrição do Serviço</th>
            <th>Valor Base (R$)</th>
          </tr>
        </thead>
        <tbody>
          ${trs}
        </tbody>
      </table>
    `;
    populateDatalist();
  }

  function populateDatalist() {
    const dl = document.getElementById('servicos-lista');
    if(dl) {
      dl.innerHTML = CAT_SERVICOS.map(s => `<option value="${s.nome}" data-exec="${s.cat === 'CFT' ? 'Técnico (TRT CFT)' : s.cat === 'CREA' ? 'Geólogo (ART CREA)' : 'Resp. Técnico'}" data-valor="${s.valor}"></option>`).join('');
    }
  }

  /* ── View Switching ── */
  function show() {
    document.getElementById('agrageo-view').classList.add('ag-active');
    const pw = document.querySelector('.page-wrapper');
    if (pw) pw.style.display = 'none';
    document.getElementById('btnAgrageo').classList.add('ag-active-btn');
    renderLeadsSalvos();
    renderCatalogo();
  }

  function hide() {
    document.getElementById('agrageo-view').classList.remove('ag-active');
    const pw = document.querySelector('.page-wrapper');
    if (pw) pw.style.display = '';
    document.getElementById('btnAgrageo').classList.remove('ag-active-btn');
  }

  /* ── Tabs ── */
  function switchTab(tabId) {
    document.querySelectorAll('.ag-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.ag-tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelector(`.ag-tab[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(`ag-panel-${tabId}`).classList.add('active');
    // Inicializa painel Remote quando aberto pela primeira vez
    if (tabId === 'remote') {
      const grid = document.getElementById('ag-remote-cards');
      if (grid && !grid.hasChildNodes()) renderRemote('todos');
    }
    // Inicializa métricas e leads salvos quando aba Leads é aberta
    if (tabId === 'leads') {
      renderMetricasReceita('ag-receita-painel');
      renderLeadsSalvos();
    }
  }

  /* ── Leads Salvos do Mapa — CRM v2 ── */
  const STATUS_COLORS = {
    'Novo':'#3b82f6','Contatado':'#f59e0b','Em negociação':'#8b5cf6',
    'Proposta enviada':'#06b6d4','Fechado':'#22c55e','Perdido':'#ef4444'
  };
  const URG_COLORS = {'Crítico':'#ef4444','Alto':'#f59e0b','Médio':'#facc15','Baixo':'#22c55e'};

  function refreshLeadsBadge() {
    const count = window.HidroLeads ? HidroLeads.count() : 0;
    const el = document.getElementById('ag-leads-salvo-count');
    if (el) el.textContent = count;
    const tabBtn = document.querySelector('.ag-tab[data-tab="leads"]');
    if (tabBtn) tabBtn.textContent = count > 0 ? `🎯 Leads Salvos (${count})` : '🎯 Leads Salvos';
  }

  function clearLeads() {
    if (!confirm('⚠️ Tem certeza que deseja apagar TODOS os leads? Esta ação não pode ser desfeita.')) return;
    if (window.HidroLeads) {
      const todos = HidroLeads.getAll();
      todos.forEach(l => HidroLeads.remove(l.id));
    }
    renderLeadsSalvos();
    alert('✅ Todos os leads foram removidos.');
  }

  function renderLeadsSalvos() {
    refreshLeadsBadge();
    const container = document.getElementById('ag-leads-salvos-lista');
    if (!container || !window.HidroLeads) return;

    const filtroStatus = (document.getElementById('ag-leads-status-filter')||{}).value || '';
    let leads = HidroLeads.getAll();
    if (filtroStatus) leads = leads.filter(l => l.status === filtroStatus);

    if (leads.length === 0) {
      container.innerHTML = `<div style="color:#475569;font-size:0.8rem;text-align:center;padding:20px;border:1px dashed #334155;border-radius:8px;">Nenhum lead salvo ainda. Clique em <strong style="color:#22c55e;">💾 Salvar Lead</strong> em qualquer popup do mapa para começar.</div>`;
      return;
    }

    const hoje = new Date();
    const parceirosMap = {};
    if (window.HidroPartners) HidroPartners.getAll().forEach(p => parceirosMap[p.id] = p.nome);

    container.innerHTML = leads.map(l => {
      const cor = STATUS_COLORS[l.status] || '#64748b';
      const urgCor = URG_COLORS[l.urgencia] || null;
      const nomeCliente = l.nome || l.email || l.telefone || l.cpfcnpj || '(sem identificação)';

      // Calcula prazo
      let prazoAlert = '';
      if (l.prazo) {
        const dias = Math.ceil((new Date(l.prazo) - hoje) / 86400000);
        if (dias < 0) prazoAlert = `<span style="color:#ef4444;font-weight:700;">⚠️ VENCIDO há ${Math.abs(dias)}d</span>`;
        else if (dias <= 7) prazoAlert = `<span style="color:#f59e0b;font-weight:700;">⏰ Vence em ${dias}d!</span>`;
        else prazoAlert = `<span style="color:#64748b;">📅 ${new Date(l.prazo).toLocaleDateString('pt-BR')}</span>`;
      }

      const parceiro = l.parceiro_id && parceirosMap[l.parceiro_id] ? `🤝 <span style="color:#a78bfa;">${parceirosMap[l.parceiro_id]}</span>` : '';
      const bordaCor = l.urgencia === 'Crítico' ? '#ef4444' : cor;
      const leadJson = JSON.stringify(l).replace(/"/g, '&quot;');

      return `
        <div style="background:#1e293b;border:1px solid rgba(148,163,184,0.1);border-left:3px solid ${bordaCor};border-radius:10px;padding:13px 15px;margin-bottom:10px;${l.urgencia==='Crítico'?'box-shadow:0 0 0 1px rgba(239,68,68,0.2);':''}">

          <!-- Linha 1: Nome + Status -->
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:6px;">
            <div>
              <div style="color:#e2e8f0;font-weight:700;font-size:0.9rem;">${nomeCliente}</div>
              <div style="color:#64748b;font-size:0.71rem;margin-top:2px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                <span>${l.tipo || 'Lead'}</span>
                <span>·</span><span>${l.dataCriacao || l.data || '—'}</span>
                ${l.municipio ? `<span>·</span><span>📍 ${l.municipio}</span>` : ''}
                ${l.origem ? `<span>·</span><span>🎯 ${l.origem}</span>` : ''}
                ${parceiro ? `<span>·</span>${parceiro}` : ''}
              </div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
              <span style="background:${cor}22;color:${cor};border:1px solid ${cor}44;border-radius:20px;padding:2px 10px;font-size:0.7rem;font-weight:700;">${l.status}</span>
              ${l.urgencia ? `<span style="background:${urgCor}22;color:${urgCor};border-radius:20px;padding:1px 8px;font-size:0.67rem;font-weight:700;">${l.urgencia}</span>` : ''}
            </div>
          </div>

          <!-- Linha 2: Contatos + Propriedade -->
          <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:9px;font-size:0.77rem;color:#94a3b8;">
            ${l.cpfcnpj ? `<span>🪪 ${l.cpfcnpj}</span>` : ''}
            ${l.telefone ? `<span>📞 ${l.telefone}</span>` : ''}
            ${l.email ? `<span>✉️ <a href="mailto:${l.email}" style="color:#38bdf8;text-decoration:none;">${l.email}</a></span>` : ''}
            ${l.fazenda ? `<span>🏡 ${l.fazenda}</span>` : ''}
            ${l.car ? `<span style="color:#a78bfa;">CAR: ${l.car.substring(0,20)}...</span>` : ''}
            ${l.embargo ? `<span style="color:#fb923c;">Embargo: ${l.embargo}</span>` : ''}
            ${l.sigef ? `<span style="color:#34d399;">SIGEF: ${l.sigef}</span>` : ''}
          </div>

          <!-- Linha 3: Negócio -->
          ${(l.servico || l.ticket || l.prazo) ? `
          <div style="background:rgba(15,23,42,0.5);border-radius:7px;padding:8px 10px;margin-top:8px;font-size:0.77rem;">
            ${l.servico ? `<div style="color:#e2e8f0;margin-bottom:4px;">🛠️ ${l.servico}</div>` : ''}
            <div style="display:flex;gap:14px;color:#64748b;flex-wrap:wrap;">
              ${l.ticket ? `<span style="color:#22c55e;font-weight:700;">💰 R$ ${Number(l.ticket).toLocaleString('pt-BR')}</span>` : ''}
              ${prazoAlert}
            </div>
          </div>` : ''}

          <!-- Linha 4: Follow-up -->
          ${(l.followup_data || l.followup_acao) ? `
          <div style="font-size:0.74rem;color:#64748b;margin-top:6px;border-top:1px solid rgba(255,255,255,0.05);padding-top:6px;">
            📅 Follow-up: ${l.followup_data ? new Date(l.followup_data).toLocaleDateString('pt-BR') : ''} — ${l.followup_acao || ''}
          </div>` : ''}

          <!-- Linha 5: Obs -->
          ${l.obs ? `<div style="font-size:0.73rem;color:#64748b;margin-top:5px;font-style:italic;">💬 ${l.obs}</div>` : ''}

          <!-- Linha 6: Timeline -->
          ${(l.timeline && l.timeline.length > 0) ? `
          <div style="font-size:0.73rem;color:#94a3b8;margin-top:8px;padding-left:8px;border-left:2px solid #334155;">
            <div style="font-weight:700;margin-bottom:3px;color:#cbd5e1;">⏳ Interações:</div>
            ${l.timeline.map(t => `<div style="margin-bottom:2px;"><span style="color:#64748b;">${t.data}:</span> ${t.texto}</div>`).join('')}
          </div>` : ''}

          <!-- Ações -->
          <div style="display:flex;gap:5px;margin-top:10px;flex-wrap:wrap;align-items:center;">
            <select onchange="window.HidroLeads.updateField(${l.id},'status',this.value);Agrageo.renderLeadsSalvos()" style="background:#0f172a;border:1px solid rgba(148,163,184,0.2);color:#e2e8f0;border-radius:6px;padding:4px 7px;font-size:0.71rem;">
              ${['Novo','Contatado','Em negociação','Proposta enviada','Fechado','Perdido'].map(s=>`<option value="${s}"${l.status===s?' selected':''}>${s}</option>`).join('')}
            </select>
            <button onclick="window._hidroOpenLeadModal(JSON.parse(this.dataset.lead))" data-lead='${JSON.stringify(l).replace(/'/g,"\\'")}' style="background:#475569;color:#fff;border:none;border-radius:6px;padding:4px 9px;font-size:0.71rem;cursor:pointer;">✏️ Editar</button>
            <button onclick="Agrageo.addInteracao(${l.id})" style="background:#475569;color:#fff;border:none;border-radius:6px;padding:4px 9px;font-size:0.71rem;cursor:pointer;">➕ Interação</button>
            <button onclick="Agrageo.preencherClienteDoLead(${leadJson})" style="background:#3b82f6;color:#fff;border:none;border-radius:6px;padding:4px 9px;font-size:0.71rem;cursor:pointer;">📄 Proposta</button>
            ${l.telefone ? `<a href="https://wa.me/55${l.telefone.replace(/\D/g,'')}" target="_blank" style="background:#25d366;color:#fff;border-radius:6px;padding:4px 8px;font-size:0.71rem;text-decoration:none;">📱 WA</a>` : ''}
            ${l.email ? `<a href="mailto:${l.email}" style="background:#6366f1;color:#fff;border-radius:6px;padding:4px 8px;font-size:0.71rem;text-decoration:none;">✉️</a>` : ''}
            ${l.lat && l.lng ? `<a href="https://www.google.com/maps?q=${l.lat},${l.lng}" target="_blank" style="background:#0ea5e9;color:#fff;border-radius:6px;padding:4px 8px;font-size:0.71rem;text-decoration:none;">🗺️</a>` : ''}
            <button onclick="if(confirm('Remover lead?')){window.HidroLeads.remove(${l.id});Agrageo.renderLeadsSalvos()}" style="background:transparent;color:#ef4444;border:1px solid #ef444433;border-radius:6px;padding:4px 7px;font-size:0.71rem;cursor:pointer;margin-left:auto;">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ── Parceiros — Cadastro e listagem ── */
  function renderParceiros() {
    const container = document.getElementById('ag-parceiros-lista');
    if (!container || !window.HidroPartners) return;
    const parceiros = HidroPartners.getAll();
    if (parceiros.length === 0) {
      container.innerHTML = `<div style="color:#475569;font-size:0.8rem;text-align:center;padding:16px;border:1px dashed #334155;border-radius:8px;">Nenhum parceiro cadastrado ainda.</div>`;
      return;
    }
    container.innerHTML = parceiros.map(p => {
      const leads = HidroPartners.leadsCount(p.id);
      const profColors = {'Advogado':'#8b5cf6','Contador':'#3b82f6','Banco/Crédito':'#22c55e','Corretor Rural':'#f59e0b','Cartório':'#06b6d4','Outro':'#64748b'};
      const cor = profColors[p.profissao] || '#64748b';
      return `
        <div style="background:#1e293b;border:1px solid rgba(148,163,184,0.1);border-left:3px solid ${cor};border-radius:10px;padding:12px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div>
            <div style="color:#e2e8f0;font-weight:700;font-size:0.88rem;">${p.nome}</div>
            <div style="color:#64748b;font-size:0.72rem;margin-top:2px;">${p.profissao||''} ${p.especialidade?`· ${p.especialidade}`:''} ${p.municipio?`· ${p.municipio}`:''}</div>
            <div style="display:flex;gap:10px;margin-top:5px;font-size:0.75rem;color:#94a3b8;flex-wrap:wrap;">
              ${p.telefone?`<span>📞 ${p.telefone}</span>`:''}${p.email?`<span>✉️ ${p.email}</span>`:''}
              <span style="color:${cor};font-weight:700;">🎯 ${leads} lead${leads!==1?'s':''} indicado${leads!==1?'s':''}</span>
            </div>
          </div>
          <div style="display:flex;gap:5px;">
            ${p.telefone?`<a href="https://wa.me/55${p.telefone.replace(/\D/g,'')}" target="_blank" style="background:#25d366;color:#fff;border-radius:6px;padding:4px 9px;font-size:0.72rem;text-decoration:none;">📱</a>`:''}
            ${p.email?`<a href="mailto:${p.email}" style="background:#6366f1;color:#fff;border-radius:6px;padding:4px 9px;font-size:0.72rem;text-decoration:none;">✉️</a>`:''}
            <button onclick="if(confirm('Remover parceiro?')){window.HidroPartners.remove(${p.id});Agrageo.renderParceiros()}" style="background:transparent;color:#ef4444;border:1px solid #ef444433;border-radius:6px;padding:4px 8px;font-size:0.72rem;cursor:pointer;">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function salvarParceiro() {
    const g = id => { const el=document.getElementById(id); return el?el.value.trim():''; };
    const p = { nome:g('prt-nome'), profissao:g('prt-profissao'), especialidade:g('prt-especialidade'), telefone:g('prt-telefone'), email:g('prt-email'), municipio:g('prt-municipio'), obs:g('prt-obs') };
    if (!p.nome) { alert('⚠️ Informe o nome do parceiro.'); return; }
    HidroPartners.save(p);
    ['prt-nome','prt-especialidade','prt-telefone','prt-email','prt-municipio','prt-obs'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    renderParceiros();
    const count = document.getElementById('ag-parceiros-count');
    if (count) count.textContent = HidroPartners.count();
  }

  /* Preenche proposta com dados do lead salvo */
  function preencherClienteDoLead(lead) {
    switchTab('propostas');
    setTimeout(() => {
      const campos = {
        'clienteNome': lead.nome || '',
        'clienteEmail': lead.email || '',
        'clienteTelefone': lead.telefone || '',
        'clienteMunicipio': lead.municipio || '',
        'clienteCNPJ': lead.cpfcnpj || '',
      };
      Object.entries(campos).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el && val) el.value = val;
      });
      const toast = document.getElementById('toast-message');
      if (toast) { toast.textContent = `✅ Dados de "${lead.nome||'cliente'}" preenchidos na Proposta!`; setTimeout(()=>toast.textContent='',3000); }
    }, 200);
  }

  /* ─── EXPORTAR LEADS PARA CSV ─────────────────────────────── */
  function exportarLeadsCSV() {
    if (!window.HidroLeads) return;
    const leads = HidroLeads.getAll();
    if (leads.length === 0) {
      alert('Nenhum lead para exportar.');
      return;
    }
    const cols = [
      'nome','cpfcnpj','telefone','email','municipio',
      'car','embargo','sigef','matricula','fazenda','lat','lng',
      'servico','ticket','prazo','urgencia','status','origem','parceiro',
      'followup_data','followup_acao','obs','createdAt'
    ];
    const header = cols.join(';');
    const rows = leads.map(l =>
      cols.map(k => {
        const v = l[k] || '';
        return `"${String(v).replace(/"/g,'""')}"`;
      }).join(';')
    );
    const csv = '\uFEFF' + [header, ...rows].join('\n'); // BOM para Excel
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HidroLeads_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ─── IMPORTAR LEADS CSV ─────────────────────────────── */
  function importarLeadsCSV(e) {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target.result;
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      if(lines.length < 2) return alert('O CSV parece vazio ou inválido.');
      
      const cols = lines[0].split(';').map(c => c.trim().replace(/^"|"$/g,'').replace(/^\uFEFF/, ''));
      let imported = 0;
      
      for(let i = 1; i < lines.length; i++) {
        // Regex para parse de CSV ignorando delimitador dentro de aspas
        const cells = lines[i].match(/(".*?"|[^";\s]+)(?=\s*;|\s*$)/g) || lines[i].split(';');
        const l = {};
        cells.forEach((val, idx) => {
          if (cols[idx]) l[cols[idx]] = val.replace(/^"|"$/g, '').trim();
        });
        if(l.nome || l.cpfcnpj || l.telefone || l.email) {
          l.id = Date.now() + i;
          if(l.timeline && typeof l.timeline === 'string') {
            try { l.timeline = JSON.parse(l.timeline.replace(/""/g,'"')); } catch(err){ l.timeline = []; }
          }
          HidroLeads.save(l);
          imported++;
        }
      }
      alert(`✅ ${imported} leads importados com sucesso!`);
      if (document.getElementById('hidro-pipeline-container')?.innerHTML) {
        if(window.HidroPipeline) window.HidroPipeline.render('hidro-pipeline-container');
      }
      renderLeadsSalvos();
      e.target.value = ''; // reset
    };
    reader.readAsText(file);
  }

  /* ─── RELATÓRIO PDF (NATIVO BROWSER) ─────────────────────────── */
  function gerarRelatorioPDF() {
    // Solução simples para impressão em PDF do Dashboard/Pipeline e Lista
    window.print();
  }

  /* ─── CALCULADORA DE HONORÁRIOS ────────────────────────────── */
  function atualizarCalculadora() {
    const gv = id => parseFloat(document.getElementById(id).value) || 0;
    
    const servico = gv('calc-servico');
    const custoKm = gv('calc-km') * gv('calc-custo-km');
    const custoDiaria = gv('calc-diarias') * gv('calc-valor-diaria');
    const taxas = gv('calc-taxas');
    
    // Custo base estimado: se o serviço da tabela tem valor X, o custo basal (sem viagem e taxas) é ~40% do valor de tabela
    const custoTotal = (servico === 0 ? 0 : servico * 0.4) + custoKm + custoDiaria + taxas; 
    
    // Valor Bruto de Venda
    let venda = servico > 0 ? (servico + custoKm + custoDiaria + taxas) : (custoTotal * 2.5);
    
    // Aplica desconto / margem flexível
    const desconto = gv('calc-desconto');
    venda = venda * (1 - (desconto / 100));
    
    const lucro = venda - custoTotal;

    const elCustoTotal = document.getElementById('calc-custo-total');
    if(elCustoTotal) elCustoTotal.innerText = custoTotal.toLocaleString('pt-BR', {style:'currency',currency:'BRL'});
    const elValorFinal = document.getElementById('calc-valor-final')
    if(elValorFinal) elValorFinal.innerText = venda.toLocaleString('pt-BR', {style:'currency',currency:'BRL'});
    const elLucro = document.getElementById('calc-margem-lucro');
    if(elLucro) elLucro.innerText = `Lucro Bruto: ${lucro.toLocaleString('pt-BR', {style:'currency',currency:'BRL'})}`;
  }

  /* ─── CALCULAR SCORE DO LEAD (0–100) ─────────────────────── */
  function calcularScoreLead(lead) {
    let score = 0;
    // Urgência (0-30)
    const urgMap = { 'Crítico':30, 'Alto':22, 'Médio':14, 'Baixo':6 };
    score += urgMap[lead.urgencia] || 0;
    // Ticket estimado (0-20)
    const ticket = parseFloat(lead.ticket) || 0;
    if (ticket >= 20000)      score += 20;
    else if (ticket >= 10000) score += 15;
    else if (ticket >= 5000)  score += 10;
    else if (ticket > 0)      score += 5;
    // Prazo próximo (0-20): quanto mais perto, maior o score
    if (lead.prazo) {
      const diff = Math.floor((new Date(lead.prazo) - new Date()) / 86400000);
      if (diff <= 0)       score += 20; // vencido
      else if (diff <= 7)  score += 18;
      else if (diff <= 15) score += 14;
      else if (diff <= 30) score += 10;
      else if (diff <= 60) score += 5;
    }
    // Campos preenchidos (0-20): mais dados = lead mais maduro
    const camposChave = ['nome','cpfcnpj','telefone','email','municipio','car','lat','parceiro'];
    const preenchidos = camposChave.filter(k => lead[k] && lead[k].trim?.()).length;
    score += Math.round((preenchidos / camposChave.length) * 20);
    // Status (0-10)
    const stMap = { 'Novo':5, 'Em contato':7, 'Proposta enviada':9, 'Negociação':10, 'Fechado':0, 'Perdido':0 };
    score += stMap[lead.status] || 3;
    return Math.min(100, score);
  }

  function _scoreCor(score) {
    if (score >= 80) return '#ef4444';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#facc15';
    return '#22c55e';
  }

  /* ─── GERAR EMAIL DE PROSPECÇÃO ──────────────────────────── */
  function gerarEmailProspeccao(lead) {
    const nome = lead.nome || 'Prezado(a)';
    const municipio = lead.municipio || 'sua região';
    const servico = lead.servico || 'consultoria ambiental';
    const tipo = lead.tipo || lead.origem || 'publicação do Diário Oficial';
    const empresa = window.AgrageoConfig?.EMPRESA?.nome || 'Agrageo Consultoria';
    const telefone = window.AgrageoConfig?.EMPRESA?.telefone || '';
    const email = window.AgrageoConfig?.EMPRESA?.email || '';

    const assunto = `Assessoria Técnica Ambiental — ${municipio}`;
    const corpo = `Prezado(a) ${nome},

Tomo a liberdade de entrar em contato em razão de publicação recente no Diário Oficial relacionada à sua empresa/propriedade em ${municipio}.

Identificamos uma oportunidade de assessoria técnica ambiental em sua situação, especificamente relacionada a: ${servico}.

A ${empresa} é especializada em regularizações ambientais e hídricas no Mato Grosso, com experiência em:
• Outorgas de uso de água (superficial e subterrânea)
• Licenciamento Ambiental (LP, LAI, LAO)
• Planos de Recuperação de Áreas Degradadas (PRAD)
• Defesa técnica em autos de infração ambiental
• Georreferenciamento e cadastro CAR

Podemos agendar uma conversa rápida para verificar a situação atual e apresentar as melhores soluções para sua demanda?

Atenciosamente,
${empresa}
${telefone ? '📱 ' + telefone : ''}
${email ? '✉️ ' + email : ''}`;

    // Modal para exibir o email
    let modal = document.getElementById('hidro-email-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'hidro-email-modal';
      modal.style.cssText = 'position:fixed;z-index:99999;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;padding:20px;';
      document.body.appendChild(modal);
    }
    modal.innerHTML = `
      <div style="background:#1e293b;border:1.5px solid rgba(245,158,11,0.3);border-radius:14px;padding:22px;width:100%;max-width:600px;max-height:90vh;display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="color:#f59e0b;font-weight:800;font-size:0.95rem;">📧 Rascunho de E-mail de Prospecção</div>
          <button onclick="document.getElementById('hidro-email-modal').style.display='none'" style="background:transparent;color:#64748b;border:none;font-size:1.2rem;cursor:pointer;">✕</button>
        </div>
        <div>
          <div style="font-size:0.7rem;color:#64748b;font-weight:700;text-transform:uppercase;margin-bottom:3px;">Assunto</div>
          <input id="email-assunto" value="${assunto}" style="width:100%;padding:6px 10px;background:#0f172a;border:1px solid rgba(148,163,184,0.2);border-radius:6px;color:#e2e8f0;font-size:0.8rem;box-sizing:border-box;">
        </div>
        <div style="flex:1;">
          <div style="font-size:0.7rem;color:#64748b;font-weight:700;text-transform:uppercase;margin-bottom:3px;">Corpo</div>
          <textarea id="email-corpo" style="width:100%;height:280px;padding:10px;background:#0f172a;border:1px solid rgba(148,163,184,0.2);border-radius:6px;color:#e2e8f0;font-size:0.79rem;box-sizing:border-box;resize:vertical;line-height:1.55;">${corpo}</textarea>
        </div>
        <div style="display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap;">
          <button onclick="navigator.clipboard.writeText(document.getElementById('email-corpo').value);this.textContent='✅ Copiado!';setTimeout(()=>this.textContent='📋 Copiar Corpo',2000)" style="background:#475569;color:#fff;border:none;border-radius:7px;padding:7px 14px;font-size:0.78rem;cursor:pointer;">📋 Copiar Corpo</button>
          <button onclick="navigator.clipboard.writeText('Assunto: '+document.getElementById('email-assunto').value+'\\n\\n'+document.getElementById('email-corpo').value);this.textContent='✅ Copiado!';setTimeout(()=>this.textContent='📋 Copiar Tudo',2000)" style="background:#7c3aed;color:#fff;border:none;border-radius:7px;padding:7px 14px;font-size:0.78rem;cursor:pointer;">📋 Copiar Tudo</button>
          <a href="mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}" style="background:#f59e0b;color:#0f172a;border-radius:7px;padding:7px 14px;font-size:0.78rem;font-weight:700;text-decoration:none;display:inline-block;">📬 Abrir no Gmail/Outlook</a>
          <button onclick="document.getElementById('hidro-email-modal').style.display='none'" style="background:transparent;color:#64748b;border:1px solid rgba(148,163,184,0.2);border-radius:7px;padding:7px 12px;font-size:0.78rem;cursor:pointer;">Fechar</button>
        </div>
      </div>`;
    modal.style.display = 'flex';
  }

  function logoHtml(size = 170) {
    if (EMPRESA.logo) return `<img src="${EMPRESA.logo}" class="doc-logo-img" style="width:${size}px;height:${size}px;">`;
    return `<div class="doc-logo-box" style="width:${size}px;height:${size}px;font-size:${size*0.55}px;">🌍</div>`;
  }

  /* ── Document Header (shared) ── */
  function docHeader(propNum) {
    const hoje = new Date().toLocaleDateString('pt-BR');
    return `
    <div class="doc-header">
      <div class="doc-logo-area">
        ${logoHtml(170)}
        <div class="doc-brand-text">
          <div class="doc-cname">AGRAGEO CONSULTORIA</div>
          <div class="doc-ctag">Geologia, topografia e meio ambiente.</div>
        </div>
      </div>
      <div class="doc-hinfo">
        CNPJ: ${EMPRESA.cnpj}<br>
        ${EMPRESA.cidade}<br>
        ${EMPRESA.celular}<br>
        ${EMPRESA.email}
      </div>
    </div>
    <div class="doc-meta-bar">
      <span><strong>Proposta Nº:</strong> <input class="doc-inp" style="width:90px" placeholder="${propNum || 'XXX/2025'}"></span>
      <span><strong>Data:</strong> ${hoje}</span>
      <span><strong>Validade:</strong> <input class="doc-inp" style="width:80px" value="15 dias"></span>
    </div>`;
  }

  /* ── Client / Lead Section (shared) ── */
  function clientSection(prefill = {}) {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const num = String(Date.now()).slice(-5);
    return `
    <div class="md-meta" contenteditable="false">
      <span>📄 Proposta: #${num}</span>
      <span>📅 Data: ${hoje}</span>
      <span>⏳ Válida por: 15 dias</span>
    </div>
    <div class="md-h2">1. Dados do Cliente / Local</div>
    <div class="md-grid2">
      <div>
        <div class="doc-field"><label>Razão Social / Nome</label><input class="doc-inp" value="${prefill.nome || ''}" placeholder="Nome do Cliente"></div>
        <div class="doc-field"><label>Endereço</label><input class="doc-inp" value="${prefill.endereco || ''}" placeholder="Av. Principal, 100"></div>
        <div class="doc-field"><label>CPF / CNPJ</label><input class="doc-inp" value="${prefill.cnpj || ''}" placeholder="00.000.000/0001-00"></div>
      </div>
      <div>
        <div class="doc-field"><label>Município</label><input class="doc-inp" value="${prefill.municipio || ''}" placeholder="Município - MT"></div>
        <div class="doc-field"><label>Telefone / WhatsApp</label><input class="doc-inp" placeholder="(65) 99999-9999"></div>
        <div class="doc-field"><label>E-mail</label><input class="doc-inp" placeholder="contato@empresa.com.br"></div>
      </div>
    </div>`;
  }

  /* ── Services Table (shared) ── */
  function servicesTable(rows = []) {
    const defaultRows = rows.length ? rows : [
      ['Diagnóstico técnico e visita ao imóvel', 'Agrageo', '0,00'],
      ['', '', ''],
    ];
    const trs = defaultRows.map((r, i) => `
      <tr>
        <td>
          <input class="doc-inp-inline doc-inp-desc" list="servicos-lista" value="${r[0]}" placeholder="Busque um serviço no catálogo" onchange="Agrageo.fillRowFromCat(this)">
        </td>
        <td style="width:140px"><input class="doc-inp-inline doc-inp-exec" value="${r[1] || 'Agrageo'}" placeholder="Executante"></td>
        <td style="width:110px"><input class="doc-inp-inline doc-inp-val" value="${r[2]}" placeholder="0,00" oninput="Agrageo.calcTotal()" onblur="Agrageo.formatVal(this);Agrageo.calcTotal();"></td>
        <td style="width:32px;text-align:center;"><button title="Remover" onclick="this.closest('tr').remove();Agrageo.calcTotal();" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:1.1rem;line-height:1;">&#x2715;</button></td>
      </tr>`).join('');
    return `
    <table class="doc-table" id="ag-svc-table">
      <thead><tr><th>Descrição do Serviço (Busque no Catálogo)</th><th style="width:140px">Executante / Resp.</th><th style="text-align:right">Valor (R$)</th></tr></thead>
      <tbody id="ag-svc-tbody">${trs}</tbody>
    </table>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
        <button class="ag-add-row-btn" onclick="Agrageo.addRow()">+ Adicionar Serviço</button>
        <div class="doc-total-row" style="margin-top:0">
          <span>VALOR TOTAL:</span>
          <input class="doc-total-inp" id="ag-total" readonly value="R$ 0,00">
        </div>
    </div>`;
  }

  /* ── Calculadora Logics (restore) ── */
  function addRow() {
    const tbody = document.getElementById('ag-svc-tbody');
    if (!tbody) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <input class="doc-inp-inline doc-inp-desc" list="servicos-lista" placeholder="Busque um serviço no catálogo" onchange="Agrageo.fillRowFromCat(this)">
      </td>
      <td style="width:140px"><input class="doc-inp-inline doc-inp-exec" value="Agrageo" placeholder="Executante"></td>
      <td style="width:110px"><input class="doc-inp-inline doc-inp-val" value="" placeholder="0,00" oninput="Agrageo.calcTotal()" onblur="Agrageo.formatVal(this);Agrageo.calcTotal();"></td>
      <td style="width:32px;text-align:center;"><button title="Remover" onclick="this.closest('tr').remove();Agrageo.calcTotal();" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:1.1rem;line-height:1;">&#x2715;</button></td>
    `;
    tbody.appendChild(tr);
  }

  function calcTotal() {
    let total = 0;
    document.querySelectorAll('.doc-inp-val').forEach(inp => {
      let val = inp.value.replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.');
      if (val && !isNaN(parseFloat(val))) total += parseFloat(val);
    });
    const totInp = document.getElementById('ag-total');
    if (totInp) totInp.value = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatVal(el) {
    let val = el.value.replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.');
    if (val && !isNaN(parseFloat(val))) {
      el.value = parseFloat(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  }

  function fillRowFromCat(el) {
    let valStr = "0,00";
    const v = el.value.toLowerCase();
    if (v.includes('prad') || v.includes('recuperação')) valStr = '4.000,00';
    if (v.includes('outorga')) valStr = '3.500,00';
    if (v.includes('car ') || v.includes('cadastro ambiental')) valStr = '1.800,00';
    if (v.includes('topografia') || v.includes('levantamento')) valStr = '3.000,00';
    if (v.includes('licença') || v.includes('lai') || v.includes('lao') || v.includes('lp')) valStr = '3.500,00';
    
    let nextVal = el.closest('tr').querySelector('.doc-inp-val');
    if (nextVal && (!nextVal.value || nextVal.value === '0,00' || nextVal.value === 'R$ 0,00')) {
      nextVal.value = valStr;
      calcTotal();
    }
  }

  /* ── Signatures (shared) ── */
  function signaturesHtml(clientName = '') {
    const hoje = new Date().toLocaleDateString('pt-BR');
    return `
    <div class="md-sigs" style="margin-top: 40px;">
      <div class="md-sig">
        <div class="md-sig-line"></div>
        <div class="md-sig-name">${EMPRESA.nome}</div>
        <div class="md-sig-info"><input class="doc-inp" placeholder="CREA-MT Nº" style="text-align:center;font-size:0.74rem;width:160px;margin:auto;display:block"></div>
        <div class="md-sig-info" style="font-weight:700;color:#1e3a5f">${EMPRESA.fantasia}</div>
        <div class="md-sig-info">CNPJ: ${EMPRESA.cnpj}</div>
      </div>
      <div class="md-sig">
        <div class="md-sig-line"></div>
        <div class="md-sig-name"><input class="doc-inp" value="${clientName}" placeholder="Nome do Representante" style="text-align:center;margin:auto;display:block"></div>
        <div class="md-sig-info"><input class="doc-inp" placeholder="CPF / CNPJ" style="text-align:center;font-size:0.74rem;color:#475569;margin:auto;display:block"></div>
        <div class="md-sig-info"><input class="doc-inp" placeholder="Empresa" style="text-align:center;font-size:0.74rem;color:#475569;margin:auto;display:block"></div>
      </div>
    </div>`;
  }

  /* ══════════════════════════════════════
     PROPOSTAS
  ══════════════════════════════════════ */

  function openProposta(tipo, prefill = {}) {
    if (localStorage.getItem('ag_saved_proposta')) {
      if (confirm('📄 Você tem uma proposta salva anteriormente. Deseja continuar editando ela?\n\n(Clique OK para abrir a salva, ou Cancelar para criar uma Nova)')) {
        document.getElementById('ag-proposta-editor-title').textContent = '📄 Proposta Comercial (Salva)';
        document.getElementById('ag-proposta-content').innerHTML = localStorage.getItem('ag_saved_proposta');
        document.getElementById('ag-propostas-grid').style.display = 'none';
        document.getElementById('ag-proposta-editor').classList.add('active');
        return;
      } else {
        localStorage.removeItem('ag_saved_proposta');
      }
    }

    const titles = {
      ambiental:      '🌿 Proposta — Regularização Ambiental',
      hidrogeologico: '💧 Proposta — Estudo Hidrogeológico',
      geoprocessamento:'🗺️ Proposta — Geoprocessamento e Cartografia',
      topografia:     '📐 Proposta — Topografia e Geodésia',
    };

    const scopeRows = {
      ambiental: [
        ['Diagnóstico técnico: análise de embargo', 'Geólogo (ART)', '1200'],
        ['Plano de Recuperação de Área Degradada (PRAD)', 'Qualquer (ART/TRT)', '4000'],
        ['Cadastro Ambiental Rural (CAR)', 'Qualquer (ART/TRT)', '1800'],
        ['Defesa de Auto de Infração / Embargo SEMA', 'Geólogo (ART)', '3500'],
      ],
      hidrogeologico: [
        ['Estudo Hidrogeológico (Outorga)', 'Geólogo (ART)', '3500'],
        ['Locação de Poço Tubular Profundo', 'Geólogo (ART)', '1500'],
        ['Laudo Geológico', 'Geólogo (ART)', '2500'],
      ],
      geoprocessamento: [
        ['Mapeamento com Drone (Ortofoto/MDT)', 'Técnico (TRT CFT)', '2500'],
        ['Georreferenciamento de Imóveis Rurais (SIGEF/INCRA)', 'Técnico (TRT CFT)', '4500'],
      ],
      topografia: [
        ['Levantamento Topográfico Planialtimétrico', 'Técnico (TRT CFT)', '3000'],
        ['Georreferenciamento de Imóveis Rurais (SIGEF/INCRA)', 'Técnico (TRT CFT)', '4500'],
      ],
    };

    const obs = {
      ambiental: 'Esta proposta não inclui taxas, emolumentos ou custas processuais junto a órgãos públicos. Eventuais serviços adicionais identificados durante a execução serão orçados separadamente e aprovados pelo cliente.',
      hidrogeologico: 'Os prazos podem variar conforme a complexidade geológica da área. Não estão incluídas as despesas com perfuração do poço.',
      geoprocessamento: 'Imagens de satélite de terceiros, quando necessárias, são cobradas à parte conforme disponibilidade.',
      topografia: 'Não inclui regularização fundiária ou averbação em cartório.',
    };

    const content = `
    <div class="doc-a4" id="ag-doc-print">
      <img src="${EMPRESA.logo}" class="ag-watermark" alt="watermark">
      ${docHeader()}
      <div class="md-h1">PROPOSTA COMERCIAL E DE SERVIÇOS
        <span class="md-h1-badge">${titles[tipo]}</span>
      </div>
      ${clientSection(prefill)}
      ${prefill.situacao ? `
      <div class="doc-section" style="margin-top:10px;">
        <div class="md-h2">2. Diagnóstico da Situação</div>
        <div class="md-cl">
          <div class="md-p" contenteditable="true">${prefill.situacao}</div>
        </div>
      </div>` : ''}

      <div class="md-h2">${prefill.situacao ? '3' : '2'}. Escopo de Serviços e Investimento</div>
      <div class="md-cl">
        ${servicesTable(scopeRows[tipo])}
      </div>

      <div class="md-h2">${prefill.situacao ? '4' : '3'}. Condições de Pagamento</div>
      <div class="md-cl">
        <ul class="md-ol" style="list-style-type: decimal;" contenteditable="true">
          <li><strong>50% no ato da assinatura</strong> (entrada) ou aceitação;</li>
          <li><strong>50% na finalização</strong> ou entrega dos protocolos do processo.</li>
        </ul>
        <div class="md-p" contenteditable="true">Forma de pagamento estabelecida: <strong>PIX (Chave CNPJ: ${EMPRESA.pix || EMPRESA.cnpj})</strong></div>
      </div>

      <div class="md-h2">${prefill.situacao ? '5' : '4'}. Prazo de Execução</div>
      <div class="md-cl">
        <div class="md-p" contenteditable="true">Prazo estimado: <strong>[XX]</strong> dias úteis a partir da assinatura conjunta e pagamento do sinal de entrada.</div>
      </div>

      <div class="md-alerta" style="margin-top:16px;">⚠️ <em>${obs[tipo]}</em></div>
      ${signaturesHtml(prefill.nome || '')}
    </div>`;

    document.getElementById('ag-proposta-editor-title').textContent = titles[tipo];
    document.getElementById('ag-proposta-content').innerHTML = content;
    document.getElementById('ag-propostas-grid').style.display = 'none';
    document.getElementById('ag-proposta-editor').classList.add('active');
    calcTotal();
  }

  function saveDoc(aba) {
    function syncInputs(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.querySelectorAll('input, textarea').forEach(el => {
        if(el.type === 'checkbox' || el.type === 'radio') {
          if(el.checked) el.setAttribute('checked', 'checked');
          else el.removeAttribute('checked');
        } else {
          el.setAttribute('value', el.value);
          if(el.tagName === 'TEXTAREA') el.innerHTML = el.value;
        }
      });
    }

    if (aba === 'proposta') {
      syncInputs('ag-proposta-content');
      localStorage.setItem('ag_saved_proposta', document.getElementById('ag-proposta-content').innerHTML);
      alert('✅ Proposta salva no seu navegador!');
    } else if (aba === 'contrato') {
      syncInputs('ag-contrato-content');
      localStorage.setItem('ag_saved_contrato', document.getElementById('ag-contrato-content').innerHTML);
      alert('✅ Contrato salvo no seu navegador!');
    }
  }

  function closeDoc(aba) {
    if (aba === 'proposta') {
      document.getElementById('ag-proposta-editor').classList.remove('active');
      document.getElementById('ag-propostas-grid').style.display = 'grid';
    } else if (aba === 'contrato') {
      document.getElementById('ag-contrato-editor').classList.remove('active');
      document.getElementById('ag-contratos-grid').style.display = 'grid';
    }
  }

  function clearDoc(aba) {
    if (aba === 'proposta') localStorage.removeItem('ag_saved_proposta');
    if (aba === 'contrato') localStorage.removeItem('ag_saved_contrato');
    closeDoc(aba);
  }

  /* ══════════════════════════════════════
     CONTRATOS
  ══════════════════════════════════════ */

  function openContrato(tipo, prefill = {}) {
    if (localStorage.getItem('ag_saved_contrato')) {
      if (confirm('📋 Você tem um contrato salvo anteriormente. Deseja continuar editando ele?\n\n(Clique OK para abrir o salvo, ou Cancelar para criar um Novo)')) {
        document.getElementById('ag-contrato-editor-title').textContent = '📋 Contrato (Salvo)';
        document.getElementById('ag-contrato-content').innerHTML = localStorage.getItem('ag_saved_contrato');
        document.getElementById('ag-contratos-grid').style.display = 'none';
        document.getElementById('ag-contrato-editor').classList.add('active');
        return;
      } else {
        localStorage.removeItem('ag_saved_contrato');
      }
    }

    const hoje = new Date().toLocaleDateString('pt-BR');
    const num = String(Date.now()).slice(-6);
    const logo = EMPRESA.logo;

    if (tipo === 'prestacao') {
      const nome    = prefill.nome || '[NOME/RAZÃO SOCIAL DO CLIENTE]';
      const cnpj    = prefill.cnpj || '[CPF/CNPJ]';
      const end     = prefill.endereco || '[ENDEREÇO DO CLIENTE]';
      const municipio = prefill.municipio || '[MUNICÍPIO - MT]';
      const servico = prefill.servico || '[DESCREVER O SERVIÇO]';
      const valor   = prefill.valor || '[R$ XXXXX,XX]';
      const prazo   = prefill.prazo || '[XX] dias úteis';

      const corpo = `
        <div class="doc-a4" id="ag-doc-print" contenteditable="true">
          <img src="${logo}" class="ag-watermark" alt="watermark">
          ${docHeader()}

          <div class="md-h1">CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE CONSULTORIA E GESTÃO AMBIENTAL
            <span class="md-h1-badge">Nº ${num} · ${hoje}</span>
          </div>

          <div class="md-meta" contenteditable="false">
            <span>📄 Contrato nº: ${num}</span>
            <span>📅 Data de emissão: ${hoje}</span>
            <span>🏙️ Local: Várzea Grande – MT</span>
          </div>

          <div class="md-h2">1. Das Partes</div>
          <div class="md-grid2">
            <div>
              <div class="md-fl">Contratante (Cliente)</div>
              <div class="md-f"><div class="md-fv">${nome}</div></div>
              <div class="md-f"><div class="md-fl">CPF / CNPJ</div><div class="md-fv">${cnpj}</div></div>
              <div class="md-f"><div class="md-fl">Endereço</div><div class="md-fv">${end}</div></div>
              <div class="md-f"><div class="md-fl">Município / Estado</div><div class="md-fv">${municipio} – MT</div></div>
            </div>
            <div>
              <div class="md-fl">Contratada (Prestadora)</div>
              <div class="md-f"><div class="md-fv">${EMPRESA.nome}</div></div>
              <div class="md-f"><div class="md-fl">CNPJ</div><div class="md-fv">${EMPRESA.cnpj}</div></div>
              <div class="md-f"><div class="md-fl">Representante Legal</div><div class="md-fv">${EMPRESA.nome} — Geólogo CREA-MT</div></div>
              <div class="md-f"><div class="md-fl">Endereço</div><div class="md-fv">${EMPRESA.endereco}, ${EMPRESA.cidade}</div></div>
            </div>
          </div>

          <div class="md-h2">2. Do Objeto</div>
          <div class="md-cl">
            <div class="md-p"><span class="md-cl-num">2.1.</span> O presente contrato tem por objeto a prestação de serviços de <strong>Consultoria, Gestão e Coordenação de Projetos Ambientais</strong>, consistindo em:</div>
            <div class="md-f" style="grid-column:span 2"><div class="md-fl">Serviço / Escopo Contratado</div><div class="md-fv" style="min-height:30px;">${servico}</div></div>
            <div class="md-p" style="margin-top:8px;"><span class="md-cl-num">2.2.</span> Os serviços serão prestados em regime remoto e/ou presencial, conforme a natureza de cada etapa, incluindo a coordenação de profissionais técnicos habilitados quando necessário.</div>
            <div class="md-alerta" contenteditable="false">⚖️ <strong>Limitação de responsabilidade técnica:</strong> A CONTRATADA atua como <strong>gestora e coordenadora</strong> do processo. A responsabilidade técnica pelos laudos, relatórios e documentos assinados com ART/TRT é exclusiva do profissional habilitado contratado para cada especialidade, conforme exigência do respectivo Conselho de Classe.</div>
          </div>

          <div class="md-h2">3. Do Prazo</div>
          <div class="md-cl">
            <div class="md-p"><span class="md-cl-num">3.1.</span> O prazo estimado para conclusão dos serviços é de <strong>${prazo}</strong>, contados a partir da data de assinatura deste contrato e do recebimento de todos os documentos necessários pela CONTRATADA.</div>
            <div class="md-p"><span class="md-cl-num">3.2.</span> O prazo poderá ser suspenso nos seguintes casos, sem ônus à CONTRATADA:
            <ul class="md-ol" style="list-style-type: disc;">
              <li>Atraso na entrega de documentos pelo CONTRATANTE;</li>
              <li>Exigências adicionais formuladas pelo órgão ambiental após o protocolo inicial;</li>
              <li>Força maior (greve, desastre natural, paralisação de sistemas governamentais ou instabilidade dos portais SEMA/IBAMA).</li>
            </ul></div>
          </div>

          <div class="md-h2">4. Do Valor e Forma de Pagamento</div>
          <div class="md-cl">
            <div class="md-f"><div class="md-fl">Valor Total dos Serviços</div><div class="md-fv" style="font-size:11pt;font-weight:900;color:#15803d;">${valor}</div></div>
            <div class="md-p"><span class="md-cl-num">4.1.</span> O pagamento será efetuado da seguinte forma:</div>
            <ul class="md-ol" style="list-style-type: decimal;">
              <li><strong>50% no ato da assinatura</strong> deste contrato (entrada): valor correspondente à mobilização e início dos trabalhos;</li>
              <li><strong>50% na entrega dos documentos finais</strong> protocolados ou prontos para protocolo junto ao órgão ambiental.</li>
            </ul>
            <div class="md-p"><span class="md-cl-num">4.2.</span> O pagamento deverá ser realizado via PIX CNPJ <strong>${EMPRESA.pix}</strong> ou transferência bancária.</div>
            <div class="md-vermelho" contenteditable="false">⚠️ <strong>Inadimplência e Encargos:</strong> O atraso no pagamento superior a 05 (cinco) dias úteis acarretará multa de 2% (dois por cento) sobre o valor da parcela, acrescido de juros de mora de 1% (um por cento) ao mês. A inadimplência confere à CONTRATADA o direito de reter documentos técnicos e relatórios elaborados até a devida quitação.</div>
            <div class="md-alerta" contenteditable="false">💵 <strong>Despesas Acessórias:</strong> Taxas administrativas (DARE SEMA, IBAMA, INCRA), pagamento de ART/TRT e recolhimentos sindicais ou de cartórios <strong>NÃO</strong> estão incluídos no valor total e serão arcados exclusivamente pelo CONTRATANTE.</div>
          </div>

          <div style="page-break-before: always;"></div>

          <div class="md-h2">5. Das Obrigações Adicionais e Defesa de Direitos</div>
          <div class="md-cl">
            <div class="md-p"><span class="md-cl-num">5.1.</span> <strong>Direitos da Contratada:</strong> A CONTRATADA manterá o sigilo absoluto das informações financeiras e estratégicas do CONTRATANTE, limitando o uso dos dados fornecidos estritamente para os fins processos dos órgãos governamentais descritos no objeto. O nome do empreendimento poderá ser citado apenas em portfólio.</div>
            <div class="md-p"><span class="md-cl-num">5.2.</span> <strong>Direitos do Contratante:</strong> O CONTRATANTE possui o direito de exigir a entrega de cópias de protocolos, planilhas e relatórios produzidos no âmbito deste contrato a qualquer tempo, exigindo clareza na prestação dos serviços de coordenação.</div>
            <div class="md-p"><span class="md-cl-num">5.3.</span> <strong>Obrigações Mútuas:</strong> Constituem prerrogativas de ambos o fornecimento ágil de documentos e o pronto atendimento às convocações, prezando pela boa-fé e probidade. Não são permitidas abordagens diretas a terceirizados da CONTRATADA para negociações alheias a este contrato, configurando quebra ética.</div>
          </div>

          <div class="md-h2">6. Da Rescisão</div>
          <div class="md-cl">
            <div class="md-p"><span class="md-cl-num">6.1.</span> O contrato poderá ser rescindido por qualquer das partes mediante aviso prévio expresso de <strong>10 (dez) dias úteis</strong>.</div>
            <div class="md-p"><span class="md-cl-num">6.2.</span> Em caso de rescisão pelo CONTRATANTE após o início dos trabalhos, sem culpa da CONTRATADA, será devida remuneração proporcional ao trabalho já realizado, além de <strong>multa rescisória de 20% (vinte por cento)</strong> sobre o saldo devedor do contrato.</div>
          </div>

          <div class="md-h2">7. Do Foro</div>
          <div class="md-p">Fica eleito o foro da Comarca de <strong>Várzea Grande – MT</strong> para dirimir quaisquer litígios oriundos deste instrumento, com renúncia expressa a qualquer outro.</div>

          <div class="md-sigs">
            <div class="md-sig">
              <div class="md-sig-line"></div>
              <div class="md-sig-name">${nome}</div>
              <div class="md-sig-info">CPF/CNPJ: ${cnpj}</div>
              <div class="md-sig-info">CONTRATANTE</div>
            </div>
            <div class="md-sig">
              <div class="md-sig-line"></div>
              <div class="md-sig-name">AGRAGEO CONSULTORIA</div>
              <div class="md-sig-info">CNPJ: ${EMPRESA.cnpj}</div>
              <div class="md-sig-info">CONTRATADA</div>
            </div>
          </div>

          <div class="md-footer">Agrageo Consultoria | CNPJ: ${EMPRESA.cnpj} | Contrato nº ${num} · Emitido em ${hoje}</div>
        </div>
      `;

      document.getElementById('ag-contrato-editor-title').textContent = '📋 Contrato de Prestação de Serviços';
      document.getElementById('ag-contrato-content').innerHTML = corpo;
      document.getElementById('ag-contratos-grid').style.display = 'none';
      document.getElementById('ag-contrato-editor').classList.add('active');

    }
    else if (tipo === 'parceria') {
      const profNome   = prefill.profNome || '[NOME DO PROFISSIONAL]';
      const profCracha = prefill.profCracha || '[CREA/CFBio nº XXXXXX]';
      const profCpf    = prefill.profCpf || '[CPF/CNPJ do Profissional]';
      const profEspecialidade = prefill.profEspecialidade || '[Engenheiro Ambiental / Biólogo / etc.]';
      const servico    = prefill.servico || '[PRAD / PGRS / Laudo Comercial]';
      const clienteRef = prefill.clienteRef || '[Nome do Cliente Final / Processo nº]';
      const valor      = prefill.valor || '[R$ XXXXX,XX]';
      const prazo      = prefill.prazo || '[XX] dias úteis';

      const corpo = `
        <div class="doc-a4" id="ag-doc-print" contenteditable="true">
          <img src="${logo}" class="ag-watermark" alt="watermark">
          ${docHeader()}

          <div class="md-h1">CONTRATO DE PARCERIA TÉCNICA ESPECIALIZADA
            <span class="md-h1-badge">Nº ${num} · ${hoje}</span>
          </div>

          <div class="md-meta" contenteditable="false">
            <span>📄 Contrato nº: ${num}</span>
            <span>📅 Data: ${hoje}</span>
            <span>🏙️ Local: Várzea Grande – MT</span>
          </div>

          <div class="md-h2">1. Das Partes</div>
          <div class="md-grid2">
            <div>
              <div class="md-fl">Contratante (Gestora)</div>
              <div class="md-f"><div class="md-fv">AGRAGEO CONSULTORIA</div></div>
              <div class="md-f"><div class="md-fl">CNPJ</div><div class="md-fv">${EMPRESA.cnpj}</div></div>
              <div class="md-f"><div class="md-fl">Representante</div><div class="md-fv">${EMPRESA.nome} — Geólogo CREA-MT</div></div>
              <div class="md-f"><div class="md-fl">Endereço</div><div class="md-fv">${EMPRESA.endereco}, ${EMPRESA.cidade}</div></div>
            </div>
            <div>
              <div class="md-fl">Contratado(a) (Especialista Técnico)</div>
              <div class="md-f"><div class="md-fv">${profNome}</div></div>
              <div class="md-f"><div class="md-fl">Especialidade / Registro</div><div class="md-fv">${profEspecialidade} - ${profCracha}</div></div>
              <div class="md-f"><div class="md-fl">CPF / CNPJ</div><div class="md-fv">${profCpf}</div></div>
            </div>
          </div>

          <div class="md-h2">2. Do Objeto e Escopo</div>
          <div class="md-cl">
            <div class="md-p"><span class="md-cl-num">2.1.</span> A CONTRATANTE acorda a terceirização do <strong>${servico}</strong>, referente ao processo do cliente final <strong>${clienteRef}</strong>.</div>
            <div class="md-p"><span class="md-cl-num">2.2.</span> O escopo abrange a execução total das visitas necessárias, acompanhamentos presenciais junto à SEMA-MT quando convocado e emissão formal de ART.</div>
            <div class="md-alerta" contenteditable="false">⚙️ <strong>Independência Técnica:</strong> O(a) CONTRATADO(A) terá total autonomia na condução científica e elaboração do respectivo relatório, responsabilizando-se na íntegra por metodologias e cálculos, isentando a CONTRATANTE de erros por imperícia.</div>
          </div>

          <div class="md-h2">3. Dos Honorários e Condições</div>
          <div class="md-cl">
            <div class="md-f"><div class="md-fl">Remuneração Global Final</div><div class="md-fv" style="font-size:11pt;font-weight:900;color:#15803d;">${valor}</div></div>
            <div class="md-p"><span class="md-cl-num">3.1.</span> A remuneração definida abrange custeio próprio das taxas de responsabilidade técnica (ART). Não existirão repasses extraordinários, salvo escopo aditivo.</div>
            <div class="md-vermelho" contenteditable="false">🚫 <strong>Vedação:</strong> É expressamente proibido ao CONTRATADO(A) realizar proferimentos, abordagens, negociações ou fechamento posterior com o cliente final discriminado sem aviso à CONTRATANTE (Non-Circumvention Rule), sujeito à rescisão e reparações legais.</div>
          </div>

          <div class="md-h2">4. Do Prazo</div>
          <div class="md-cl">
            <div class="md-p"><span class="md-cl-num">4.1.</span> O prazo convencionado para a apresentação do documento é de <strong>${prazo}</strong> contados a partir da entrega do material basal pala Gestora.</div>
          </div>

          <div style="page-break-before: always;"></div>

          <div class="md-h2">5. Do Foro</div>
          <div class="md-p">As partes elegem o foro de <strong>Várzea Grande - MT</strong> como cabível para dirimir contenciosos oriundos desta parceria técnica.</div>

          <div class="md-sigs">
            <div class="md-sig">
              <div class="md-sig-line"></div>
              <div class="md-sig-name">AGRAGEO CONSULTORIA</div>
              <div class="md-sig-info">CNPJ: ${EMPRESA.cnpj}</div>
              <div class="md-sig-info">CONTRATANTE</div>
            </div>
            <div class="md-sig">
              <div class="md-sig-line"></div>
              <div class="md-sig-name">${profNome}</div>
              <div class="md-sig-info">CPF/CNPJ: ${profCpf}</div>
              <div class="md-sig-info">CONTRATADA (Especialista)</div>
            </div>
          </div>

          <div class="md-footer">Agrageo Consultoria | CNPJ: ${EMPRESA.cnpj} | Parceiro Técnico nº ${num} · Emitido em ${hoje}</div>
        </div>
      `;

      document.getElementById('ag-contrato-editor-title').textContent = '🤝 Contrato de Parceria Técnica';
      document.getElementById('ag-contrato-content').innerHTML = corpo;
      document.getElementById('ag-contratos-grid').style.display = 'none';
      document.getElementById('ag-contrato-editor').classList.add('active');
    }
  }


  function downloadPDF() {
    const propostaEditor = document.getElementById('ag-proposta-editor');
    const contratoEditor = document.getElementById('ag-contrato-editor');
    let contentEl = null;

    if (propostaEditor && propostaEditor.classList.contains('active')) {
      contentEl = document.getElementById('ag-proposta-content');
    } else if (contratoEditor && contratoEditor.classList.contains('active')) {
      contentEl = document.getElementById('ag-contrato-content');
    }
    if (!contentEl) { alert('Nenhum documento aberto.'); return; }
    const docEl = contentEl.querySelector('.doc-a4');
    if (!docEl) { alert('Documento não encontrado.'); return; }

    // Sincroniza inputs para que os valores apareçam no print
    contentEl.querySelectorAll('input').forEach(i => i.setAttribute('value', i.value));
    contentEl.querySelectorAll('textarea').forEach(t => { t.innerHTML = t.value; });

    // Clona o documento com URLs de imagem absolutas
    const clone = docEl.cloneNode(true);
    clone.querySelectorAll('img').forEach(img => { if (img.src) img.setAttribute('src', img.src); });

    // ── Passo 1: Cria ou atualiza a área de impressão no body principal ──
    let printArea = document.getElementById('ag-print-area');
    if (!printArea) {
      printArea = document.createElement('div');
      printArea.id = 'ag-print-area';
      document.body.appendChild(printArea);
    }
    printArea.innerHTML = '';
    printArea.appendChild(clone);

    // ── Passo 2: Injeta CSS de impressão que esconde TUDO exceto o documento ──
    let printStyle = document.getElementById('ag-print-style');
    if (!printStyle) {
      printStyle = document.createElement('style');
      printStyle.id = 'ag-print-style';
      document.head.appendChild(printStyle);
    }
    printStyle.textContent = `
      @media print {
        @page { size: A4 portrait; margin: 15mm 15mm 15mm 15mm; }

        /* Oculta TUDO do body exceto a área de impressão */
        body > *:not(#ag-print-area) {
          display: none !important;
          visibility: hidden !important;
        }

        /* A área de impressão ocupa o fluxo normal — NÃO usa position:fixed */
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }
        #ag-print-area {
          display: block !important;
          visibility: visible !important;
          position: static !important;
          width: 100% !important;
          background: white !important;
        }

        /* O documento A4 em si */
        #ag-print-area .doc-a4 {
          box-shadow: none !important;
          border-radius: 0 !important;
          overflow: visible !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          page-break-inside: auto;
        }

        /* Preserva cores exatas (backgrounds coloridos, logos) */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Limpa inputs/selects/botões */
        #ag-print-area input,
        #ag-print-area textarea {
          background: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }
        #ag-print-area button,
        #ag-print-area select { display: none !important; }

        /* Evita quebrar assinaturas e tabelas */
        #ag-print-area .md-sigs,
        #ag-print-area .doc-sigs { break-inside: avoid; page-break-inside: avoid; }
        #ag-print-area tr       { break-inside: avoid; page-break-inside: avoid; }
        #ag-print-area .doc-header { break-inside: avoid; }
      }
    `;


    // ── Passo 3: Imprime e limpa ──
    const btn = document.querySelector('[onclick*="downloadPDF"]');
    const origText = btn ? btn.innerHTML : '';
    if (btn) btn.innerHTML = '🖨️ Abrindo impressão...';

    setTimeout(function() {
      window.print();
      // Limpa após o diálogo de impressão fechar
      setTimeout(function() {
        printArea.innerHTML = '';
        printStyle.textContent = '';
        if (btn) btn.innerHTML = origText;
      }, 1500);
    }, 200);
  }

  function propostaAceita(dadosProposta = {}) {

    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
    modal.innerHTML = `
      <div style="background:#0f172a;border:1px solid rgba(148,163,184,0.15);border-radius:14px;width:100%;max-width:560px;padding:28px;">
        <div style="text-align:center;margin-bottom:20px;">
          <div style="font-size:2rem;">🎉</div>
          <div style="color:#22c55e;font-size:1.1rem;font-weight:900;margin-top:6px;">Proposta Aceita!</div>
          <div style="color:#64748b;font-size:0.78rem;margin-top:4px;">Agora gere os dois contratos necessários</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
          <div style="background:#1e293b;border:1px solid #22c55e40;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:1.4rem;">📋</div>
            <div style="color:#e2e8f0;font-weight:800;font-size:0.88rem;margin:8px 0 4px;">Contrato com o Cliente</div>
            <div style="color:#64748b;font-size:0.72rem;margin-bottom:12px;">Formaliza o serviço que você vai entregar — protege você legalmente</div>
            <button onclick="this.closest('div[style*=fixed]').remove(); Agrageo.openContrato('prestacao', ${JSON.stringify(dadosProposta).replace(/'/g,'"')})" style="background:#22c55e;color:#0f172a;border:none;border-radius:7px;padding:8px 16px;font-weight:800;font-size:0.8rem;cursor:pointer;width:100%;">📄 Gerar Agora</button>
          </div>
          <div style="background:#1e293b;border:1px solid #7c3aed40;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:1.4rem;">🤝</div>
            <div style="color:#e2e8f0;font-weight:800;font-size:0.88rem;margin:8px 0 4px;">Contrato com o Especialista</div>
            <div style="color:#64748b;font-size:0.72rem;margin-bottom:12px;">Obriga o técnico a fazer monitoramentos, ART e relatórios</div>
            <button onclick="this.closest('div[style*=fixed]').remove(); Agrageo.openContrato('parceria', {})" style="background:#7c3aed;color:#fff;border:none;border-radius:7px;padding:8px 16px;font-weight:800;font-size:0.8rem;cursor:pointer;width:100%;">📄 Gerar Agora</button>
          </div>
        </div>
        <div style="background:#1e3a5f20;border:1px solid #1e40af40;border-radius:8px;padding:12px;font-size:0.78rem;color:#93c5fd;margin-bottom:16px;">
          💡 <strong>Fluxo correto:</strong> 1) Gere e assine o contrato com o cliente → 2) Gere e assine o contrato com o especialista → 3) Transfira o lead para o estágio "Em Execução" no CRM
        </div>
        <button onclick="this.closest('div[style*=fixed]').remove()" style="background:#334155;color:#94a3b8;border:none;border-radius:7px;padding:8px 16px;cursor:pointer;width:100%;font-size:0.82rem;">Fechar</button>
      </div>`;
    document.body.appendChild(modal);
  }



  function gerarRecibo(prefill = {}) {
    const rClient = document.getElementById('admin-rec-cliente') ? document.getElementById('admin-rec-cliente').value : '';
    const rValor = document.getElementById('admin-rec-valor') ? document.getElementById('admin-rec-valor').value : '';
    const rRef = document.getElementById('admin-rec-ref') ? document.getElementById('admin-rec-ref').value : '';

    prefill.cliente = prefill.cliente || rClient || '';
    prefill.valor = prefill.valor || rValor || '';
    prefill.servico = prefill.servico || rRef || '';

    const hoje = new Date().toLocaleDateString('pt-BR');
    const num = String(Date.now()).slice(-5);
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
      <title>Recibo ${num}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:40px;color:#1e293b;font-size:11pt;max-width:700px;margin:auto}
        h2{color:#1e3a5f;font-size:13pt;margin:0}
        .hdr{display:flex;align-items:center;gap:20px;margin-bottom:20px;border-bottom:2px solid #1e3a5f;padding-bottom:14px}
        .badge{background:#1e3a5f;color:#fff;border-radius:6px;padding:4px 14px;font-size:9pt;font-weight:700}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;margin:18px 0}
        .item{display:flex;flex-direction:column;gap:2px}
        .lbl{font-size:8pt;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.04em}
        .val{font-size:10.5pt;border-bottom:1px solid #e2e8f0;padding-bottom:3px;min-height:20px}
        .valor-box{background:#f0fdf4;border:2px solid #16a34a;border-radius:8px;padding:12px 18px;margin:16px 0;display:flex;justify-content:space-between;align-items:center}
        .valor-lbl{font-size:9pt;color:#166534;font-weight:700}
        .valor-num{font-size:16pt;font-weight:900;color:#15803d}
        .forma{font-size:9pt;color:#475569;margin-top:4px}
        .sigs{display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:50px}
        .sig{text-align:center}
        .sig-line{border-top:1px solid #334155;margin-bottom:6px}
        .sig-name{font-size:9pt;font-weight:700}
        .sig-doc{font-size:8pt;color:#64748b}
        .footer{font-size:8pt;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px;margin-top:32px}
        @media print{body{padding:20px}}
      </style></head><body>
      <div class="hdr">
        <img src="${EMPRESA.logo}" height="90" style="object-fit:contain">
        <div><h2>AGRAGEO CONSULTORIA</h2>
        <div style="font-size:9pt;color:#64748b">Geologia, topografia e meio ambiente</div>
        <div style="font-size:8pt;color:#94a3b8">CNPJ: ${EMPRESA.cnpj}</div></div>
        <div style="margin-left:auto"><div class="badge">RECIBO Nº ${num}</div>
        <div style="font-size:8pt;color:#64748b;margin-top:4px">Emitido em: ${hoje}</div></div>
      </div>
      <div style="font-weight:700;color:#1e3a5f;font-size:11pt;margin-bottom:10px">RECIBO DE PAGAMENTO</div>
      <div class="grid">
        <div class="item"><span class="lbl">Recebemos de (Cliente)</span>
          <span class="val">${prefill.cliente || '&nbsp;'}</span></div>
        <div class="item"><span class="lbl">CPF / CNPJ</span>
          <span class="val">${prefill.cpf_cnpj || '&nbsp;'}</span></div>
        <div class="item" style="grid-column:1/-1"><span class="lbl">Referente a (Serviço Prestado)</span>
          <span class="val" style="min-height:30px">${prefill.servico || '&nbsp;'}</span></div>
      </div>
      <div class="valor-box">
        <div><div class="valor-lbl">VALOR RECEBIDO</div>
        <div class="forma">Forma de pagamento: ${prefill.forma || 'PIX / Transferência'}</div></div>
        <div class="valor-num">R$ ${prefill.valor ? parseFloat(prefill.valor).toLocaleString('pt-BR',{minimumFractionDigits:2}) : '_________'}</div>
      </div>
      <div style="font-size:9pt;color:#475569;margin-top:8px">
        Por ser verdade, firmamos o presente recibo.
      </div>
      <div class="sigs">
        <div class="sig"><div class="sig-line"></div>
        <div class="sig-name">${prefill.cliente || 'CONTRATANTE'}</div>
        <div class="sig-doc">${prefill.cpf_cnpj || ''}</div></div>
        <div class="sig"><div class="sig-line"></div>
        <div class="sig-name">${EMPRESA.nome}</div>
        <div class="sig-doc">AGRAGEO CONSULTORIA | CREA MT-6780/D</div></div>
      </div>
      <div class="footer">
        ${EMPRESA.fantasia} | ${EMPRESA.endereco}, ${EMPRESA.cidade} | ${EMPRESA.celular} | ${EMPRESA.email} | ${EMPRESA.site}
      </div>
    </body></html>`;

    if (typeof html2pdf !== 'undefined') {
      const el = document.createElement('div'); el.innerHTML = html;
      html2pdf().set({ margin:10, filename:`recibo-${num}.pdf`, jsPDF:{format:'a4'} }).from(el).save();
    } else {
      const w = window.open('','_blank'); w.document.write(html); w.document.close();
      setTimeout(() => w.print(), 600);
    }
  }

  /* ═══════════════════════════════════════════════════════
     📋 ORDEM DE SERVIÇO (OS)
  ═══════════════════════════════════════════════════════ */
  function gerarOS(prefill = {}) {
    const oClient = document.getElementById('admin-os-cliente') ? document.getElementById('admin-os-cliente').value : '';
    const oServ = document.getElementById('admin-os-servico') ? document.getElementById('admin-os-servico').value : '';
    const oPrazo = document.getElementById('admin-os-prazo') ? document.getElementById('admin-os-prazo').value : '';

    const hoje = new Date().toLocaleDateString('pt-BR');
    const num = 'OS-' + String(Date.now()).slice(-5);
    const srv = prefill.servico || oServ || '—';
    const entregaveis = prefill.entregaveis || 'Relatório técnico em PDF + ART';
    const prazo = prefill.prazo || oPrazo || '7 dias úteis';
    const clienteNome = prefill.cliente || oClient || 'Cliente não identificado';
    const instrucoes = prefill.instrucoes || 'Analisar os documentos enviados pelo cliente.\nElaborar o relatório técnico, mapas e memorial conforme especificado.\nEmitir ART CREA/CFT.\nEntregar por e-mail em PDF.';
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
      <title>${num}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:40px;color:#1e293b;font-size:10.5pt;max-width:720px;margin:auto}
        .hdr{display:flex;align-items:center;gap:20px;margin-bottom:16px;border-bottom:2px solid #1e3a5f;padding-bottom:12px}
        h2{color:#1e3a5f;font-size:12.5pt;margin:0}
        .os-badge{background:#1e3a5f;color:#fff;border-radius:6px;padding:4px 14px;font-size:9pt;font-weight:700}
        .section{margin-bottom:16px}
        .sec-title{font-size:9pt;font-weight:900;text-transform:uppercase;letter-spacing:0.06em;color:#1e3a5f;border-bottom:1px solid #cbd5e1;padding-bottom:4px;margin-bottom:8px}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px}
        .item{display:flex;flex-direction:column;gap:2px}
        .lbl{font-size:7.5pt;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.04em}
        .val{font-size:10pt;border-bottom:1px solid #e2e8f0;padding-bottom:2px;min-height:18px}
        .passo{display:flex;gap:8px;margin-bottom:6px;font-size:9.5pt}
        .passo-num{background:#1e3a5f;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:8pt;font-weight:900;flex-shrink:0;margin-top:1px}
        .sig-line{border-top:1px solid #334155;width:60%;margin:50px auto 6px}
        .sig-name{text-align:center;font-size:9pt;font-weight:700}
        .footer{font-size:7.5pt;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px;margin-top:24px}
        @media print{body{padding:20px}}
      </style></head><body>
      <div class="hdr">
        <img src="${EMPRESA.logo}" height="90" style="object-fit:contain">
        <div><h2>AGRAGEO CONSULTORIA</h2>
        <div style="font-size:8.5pt;color:#64748b">Geologia, topografia e meio ambiente</div></div>
        <div style="margin-left:auto;text-align:right">
          <div class="os-badge">${num}</div>
          <div style="font-size:8pt;color:#94a3b8;margin-top:4px">Emitido: ${hoje}</div>
        </div>
      </div>
      <div class="section">
        <div class="sec-title">Identificação do Serviço</div>
        <div class="grid">
          <div class="item" style="grid-column:1/-1"><span class="lbl">Serviço</span>
            <span class="val" style="font-weight:700;font-size:11pt">${srv}</span></div>
          <div class="item"><span class="lbl">Cliente</span><span class="val">${clienteNome}</span></div>
          <div class="item"><span class="lbl">Município</span><span class="val">${prefill.municipio||'&nbsp;'}</span></div>
          <div class="item"><span class="lbl">CAR / Processo</span><span class="val">${prefill.car||'&nbsp;'}</span></div>
          <div class="item"><span class="lbl">Prazo de Entrega</span><span class="val">${prazo}</span></div>
        </div>
      </div>
      <div class="section">
        <div class="sec-title">Passo a Passo de Execução</div>
        ${instrucoes.split('\n').filter(Boolean).map((p,i) =>
          `<div class="passo"><div class="passo-num">${i+1}</div><div>${p.trim()}</div></div>`
        ).join('')}
      </div>
      <div class="section">
        <div class="sec-title">Entregáveis ao Cliente</div>
        ${entregaveis.split('\n').filter(Boolean).map(e =>
          `<div style="display:flex;gap:6px;font-size:9.5pt;margin-bottom:4px"><span style="color:#16a34a;font-weight:900">✓</span><span>${e.trim()}</span></div>`
        ).join('')}
      </div>
      <div class="section">
        <div class="sec-title">Responsável Técnico</div>
        <div class="grid">
          <div class="item"><span class="lbl">Nome</span><span class="val">${EMPRESA.nome}</span></div>
          <div class="item"><span class="lbl">Título</span><span class="val">Geólogo / Técnico em Geoprocessamento</span></div>
        </div>
      </div>
      <div class="sig-line"></div>
      <div class="sig-name">${EMPRESA.nome} — Responsável Técnico</div>
      <div style="text-align:center;font-size:8pt;color:#64748b">AGRAGEO CONSULTORIA | CREA MT-6780/D</div>
      <div class="footer">
        ${EMPRESA.fantasia} | ${EMPRESA.endereco}, ${EMPRESA.cidade} | ${EMPRESA.celular} | ${EMPRESA.email} | ${EMPRESA.site}
      </div>
    </body></html>`;

    if (typeof html2pdf !== 'undefined') {
      const el = document.createElement('div'); el.innerHTML = html;
      html2pdf().set({ margin:10, filename:`${num}.pdf`, jsPDF:{format:'a4'} }).from(el).save();
    } else {
      const w = window.open('','_blank'); w.document.write(html); w.document.close();
      setTimeout(() => w.print(), 600);
    }
  }

  /* ═══════════════════════════════════════════════════════
     📜 CONTRATO REMOTE (Serviços Digitais)
  ═══════════════════════════════════════════════════════ */
  function gerarContratoRemote(prefill = {}) {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const num = 'CTR-' + String(Date.now()).slice(-5);
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
      <title>Contrato Remote ${num}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:40px;color:#1e293b;font-size:10pt;max-width:720px;margin:auto;line-height:1.6}
        .hdr{display:flex;align-items:center;gap:20px;margin-bottom:16px;border-bottom:2px solid #1e3a5f;padding-bottom:12px}
        h2{color:#1e3a5f;font-size:12pt;margin:0}
        .title{text-align:center;font-weight:900;font-size:12pt;color:#1e3a5f;margin:16px 0;text-transform:uppercase;letter-spacing:0.05em}
        .clause{margin-bottom:14px}
        .clause-title{font-weight:900;text-transform:uppercase;font-size:9pt;color:#1e3a5f;letter-spacing:0.04em;margin-bottom:4px}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;margin:10px 0}
        .item{display:flex;flex-direction:column;gap:2px}
        .lbl{font-size:7.5pt;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.04em}
        .val{font-size:10pt;border-bottom:1px solid #e2e8f0;padding-bottom:2px;min-height:18px}
        .sigs{display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:50px}
        .sig{text-align:center}.sig-line{border-top:1px solid #334155;margin-bottom:6px}
        .sig-name{font-size:9pt;font-weight:700}.sig-doc{font-size:8pt;color:#64748b}
        .footer{font-size:7.5pt;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px;margin-top:24px}
        @media print{body{padding:20px}}
      </style></head><body>
      <div class="hdr">
        <img src="${EMPRESA.logo}" height="90" style="object-fit:contain">
        <div><h2>AGRAGEO CONSULTORIA</h2>
        <div style="font-size:8.5pt;color:#64748b">Geologia, topografia e meio ambiente</div>
        <div style="font-size:8pt;color:#94a3b8">CNPJ: ${EMPRESA.cnpj}</div></div>
      </div>
      <div class="title">Contrato de Prestação de Serviços Técnicos Remotos<br>
        <span style="font-size:9pt;color:#64748b;font-weight:400">Nº ${num} — ${hoje}</span>
      </div>
      <div class="clause">
        <div class="clause-title">Cláusula 1 — Das Partes</div>
        <div class="grid">
          <div class="item"><span class="lbl">Contratante</span><span class="val">${prefill.cliente||'&nbsp;'}</span></div>
          <div class="item"><span class="lbl">CPF / CNPJ</span><span class="val">${prefill.cpf_cnpj||'&nbsp;'}</span></div>
          <div class="item"><span class="lbl">Contratada</span><span class="val">AGRAGEO CONSULTORIA — ${EMPRESA.cnpj}</span></div>
          <div class="item"><span class="lbl">Responsável Técnico</span><span class="val">${EMPRESA.nome} — CREA MT-6780/D</span></div>
        </div>
      </div>
      <div class="clause"><div class="clause-title">Cláusula 2 — Do Objeto</div>
        <p>O presente contrato tem por objeto a prestação do seguinte serviço técnico na modalidade <strong>home-office / remota</strong>, sem necessidade de visita a campo: <strong>${prefill.servico||'[Serviço a especificar]'}</strong>.</p>
      </div>
      <div class="clause"><div class="clause-title">Cláusula 3 — Da Entrega e Prazo</div>
        <p>O prazo de entrega é de <strong>${prefill.prazo||'[__] dias úteis'}</strong> a contar do recebimento de todos os documentos e materiais listados no Briefing de Projeto assinado. Os entregáveis serão enviados por e-mail em formato PDF e arquivos digitais acordados.</p>
      </div>
      <div class="clause"><div class="clause-title">Cláusula 4 — Do Valor e Condição de Pagamento</div>
        <p>O valor total do serviço é de <strong>R$ ${prefill.valor||'__________'}</strong>. Fica estabelecido o pagamento de <strong>50% a título de entrada na assinatura</strong>, imprescindível para o início dos trabalhos, e os <strong>50% restantes condicionados à entrega final eletrônica</strong>. Os referidos pagamentos devem ser depositados via transferência <strong>PIX na chave CNPJ: ${EMPRESA.pix || EMPRESA.cnpj}</strong>.</p>
      </div>
      <div class="clause"><div class="clause-title">Cláusula 5 — Da Liberação de Arquivos e Validade Técnica</div>
        <p>A apresentação dos trabalhos concluídos será feita ao Contratante por meio de visualização ou arquivos bloqueados em caráter "Preliminar". O fornecimento dos <strong>laudos limpos, PDFs finais, vetores (shapefiles/DWG)</strong> e imperativamente a <strong>emissão/assinatura do Termo de Responsabilidade Técnica (TRT CFT)</strong> ou protocolo no governo (SICAR/SEMA/INCRA) estão estritamente condicionados à <strong>confirmação da quitação integral da segunda parcela</strong>. Sem o respectivo TRT e recolhimento junto ao conselho federal, o documento em posse do contratante é nulo de validade jurídica perante órgãos competentes.</p>
      </div>
      <div class="clause"><div class="clause-title">Cláusula 6 — Das Revisões</div>
        <p>Estão incluídas <strong>até 2 (duas) rodadas de revisão</strong> sem custo adicional, desde que os documentos fornecidos pelo contratante estejam completos e corretos. Revisões adicionais exigidas pelo Contratante após aprovação serão orçadas separadamente.</p>
      </div>
      <div class="clause"><div class="clause-title">Cláusula 7 — Da Propriedade Intelectual</div>
        <p>Os arquivos entregues são de propriedade do Contratante para o fim contratado. A Contratada reserva-se o direito de usar recortes parciais do projeto como portfólio profissional (geoprocessamento em nuvem), vedado o uso de dados pessoais da LGPD do Contratante.</p>
      </div>
      <div class="clause"><div class="clause-title">Cláusula 8 — Da Rescisão</div>
        <p>Em caso de rescisão antes do início dos trabalhos, o valor antecipado será devolvido integralmente. Após o início, será cobrado proporcionalmente ao trabalho executado e faturado.</p>
      </div>
      <div class="clause"><div class="clause-title">Cláusula 9 — Do Foro</div>
        <p>Fica eleito o foro da Comarca do prestador para dirimir quaisquer controvérsias decorrentes deste contrato.</p>
      </div>
      <div class="sigs">
        <div class="sig"><div class="sig-line"></div>
        <div class="sig-name">${prefill.cliente||'CONTRATANTE'}</div>
        <div class="sig-doc">${prefill.cpf_cnpj||''}</div></div>
        <div class="sig"><div class="sig-line"></div>
        <div class="sig-name">${EMPRESA.nome}</div>
        <div class="sig-doc">AGRAGEO CONSULTORIA | CNPJ: ${EMPRESA.cnpj}</div></div>
      </div>
      <div class="footer">
        ${EMPRESA.fantasia} | ${EMPRESA.endereco}, ${EMPRESA.cidade} | Celular: ${EMPRESA.celular} | E-mail: ${EMPRESA.email} | Site: ${EMPRESA.site}
      </div>
    </body></html>`;

    if (typeof html2pdf !== 'undefined') {
      const el = document.createElement('div'); el.innerHTML = html;
      html2pdf().set({ margin:10, filename:`${num}.pdf`, jsPDF:{format:'a4'} }).from(el).save();
    } else {
      const w = window.open('','_blank'); w.document.write(html); w.document.close();
      setTimeout(() => w.print(), 600);
    }
  }

  /* ═══════════════════════════════════════════════════════
     📂 DOWNLOAD DE MODELO DE LAUDO WORD/LIBREOFFICE
  ═══════════════════════════════════════════════════════ */
  function baixarModeloLaudo() {
    const data = new Date().toLocaleDateString('pt-BR');
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Laudo Técnico Multitemporal</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        h1 { font-size: 14pt; font-weight: bold; text-align: center; margin-bottom: 20px; }
        h2 { font-size: 12pt; font-weight: bold; margin-top: 20px; }
        p { text-align: justify; line-height: 1.5; text-indent: 1.5cm; }
        .signature { text-align: center; margin-top: 50px; }
      </style>
      </head>
      <body>
        <div class="header">
          <!-- A logo será carregada da URL local/base64 -->
          <img src="${EMPRESA.logo}" height="90" /><br>
          <b>${EMPRESA.fantasia}</b><br>
          CNPJ: ${EMPRESA.cnpj} | Celular: ${EMPRESA.celular} | Site: ${EMPRESA.site}<br>
          ${EMPRESA.endereco}, ${EMPRESA.cidade}
        </div>
        
        <h1>RELATÓRIO TÉCNICO MULTITEMPORAL DE COBERTURA VEGETAL<br>(DEFESA PERICIAL DE AUTO DE INFRAÇÃO)</h1>
        
        <h2>1. IDENTIFICAÇÃO DO PROPRIETÁRIO E DO IMÓVEL</h2>
        <p><b>Proprietário:</b> [NOME DO DESPACHANTE OU DONO]<br>
        <b>CPF/CNPJ:</b> [000.000.000-00]<br>
        <b>Município-UF:</b> [MUNICIPIO] - MT<br>
        <b>Coordenadas Centrais (SIRGAS 2000):</b> [LAT, LON]<br>
        <b>Auto de Infração / Embargo SEMA-MT:</b> [Nº DO AUTO / OFÍCIO]</p>

        <h2>2. OBJETIVO DO RELATÓRIO</h2>
        <p>O presente laudo técnico pericial tem por escopo apresentar uma análise espacial multitemporal da cobertura vegetal no polígono correspondente ao Auto de Infração/Embargo supracitado. O objetivo central é atestar de forma retroativa, via Sensoriamento Remoto, a cronologia de antropização (uso do solo) da área avaliada, embasando a defesa técnica e/ou o pedido de levantamento de embargo frente ao órgão ambiental competente.</p>

        <h2>3. METODOLOGIA E MATERIAL EMPREGADO</h2>
        <p>Para a elaboração desta defesa técnica, procedeu-se com a vetorização e processamento digital de imagens orbitais retrospectivas (satélites da série Landsat - TM / ETM+ / OLI) e mosaicos analíticos da Coleção MapBiomas, sob o datum geocêntrico SIRGAS 2000. O escrutínio temporal focalizou especialmente o período adjacente a 22 de julho de 2008, data que marca a consolidação preestabelecida pelo Novo Código Florestal Brasileiro (Lei nº 12.651).</p>

        <h2>4. DESENVOLVIMENTO: ANÁLISE TEMPORAL DA VEGETAÇÃO</h2>
        <p>O polígono embargado foi recoberto pelas cenas orbitais de anos pretéritos com intuito de dirimir a real dinâmica da alteração do uso do solo frente à cronologia imputada pela Fiscalização Ambiental.</p>
        <p><i>[INSERIR MAPA/PRINT 01 DO QGIS: IMAGEM DE 2007 (ANTES DE 22/07/2008) COM O POLÍGONO DE EMBARGO SOBREPOSTO EM VERMELHO]</i></p>
        <p>A Figura 01 constata que, no transcorrer do ano de [2007], a área poligonal embargada já expunha sinais indubitáveis de atividade antrópica (supressão para pasto ou gradagem). Logo, a fisionomia observada não correspondia à vegetação primária (bioma denso intacto).</p>
        <p><i>[INSERIR MAPA/PRINT 02 DO QGIS: IMAGEM REFERENTE AO ANO DO AUTO DE INFRAÇÃO / DETER]</i></p>
        <p>Em contraponto espacial, a Figura 02 apresenta a composição orbital contemporânea relativa à lavratura do Auto de Infração. No mapeamento realizado, não observou-se atividade de corte raso ou desmatamento florestal primário, limitando-se as alterações na cor/textura da imagem a mera limpeza de área consolidada (manejo de pastagem suja intrínseca à atividade agropecuária).</p>

        <h2>5. CONCLUSÃO E PARECER TÉCNICO</h2>
        <p>Fundamentado na espacialização, geometria de sobreposição das bandas orbitais multiespectrais e nos recortes sazonais aqui demonstrados, atesta-se conclusiva e irrevogavelmente que:</p>
        <ul>
          <li>O polígono alvo (área embargada) encontra-se em uso antropizado de caráter consolidado preexistente à égide do marco legal de 22 de julho de 2008.</li>
          <li>A alteração na paisagem apontada de forma autônoma pelos algoritmos do PRODES/DETER referem-se à conservação/limpeza de pasto em áreas degradadas subjacentes, não havendo nova supressão florestal qualificada que justifique as sanções pecuniárias.</li>
        </ul>
        <p>Conforme o exposto, as análises de geoprocessamento infirmam a assertividade do embasamento punitivo da Fiscalização, servindo este Relatório Multitemporal e respectiva TRT (Termo de Responsabilidade Técnica CFT) de lastro para o competente pedido jurídico de Nulidade do Auto de Infração e imediato Desembargo da área em tela.</p>

        <div class="signature">
          Várzea Grande - MT, ${data}<br><br>
          _______________________________________________________<br>
          <b>${EMPRESA.nome}</b><br>
          Técnico em Geoprocessamento / CFT Geologia<br>
          TRT (Anotação de Responsabilidade Técnica)<br>
          Atestado eletronicamente em conformidade normativa
        </div>
      </body>
      </html>`;
    
    // Converte a string HTML para UTF-8 BOM para garantir os acentos no LibreOffice
    const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `1_Laudo_Pericial_Defesa_Sema_${Date.now()}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /* ═══════════════════════════════════════════════════════
     💰 MÉTRICAS DE RECEITA (Dashboard Financeiro)
  ═══════════════════════════════════════════════════════ */
  function calcMetricasReceita() {
    const leads     = JSON.parse(localStorage.getItem('ag_leads')     || '[]');
    const propostas = JSON.parse(localStorage.getItem('ag_propostas') || '[]');
    const contratos = JSON.parse(localStorage.getItem('ag_contratos') || '[]');

    const total = leads.length;
    const emAbordagem = leads.filter(l => l.estagio === 'abordagem').length;
    const negociando  = leads.filter(l => l.estagio === 'negociando').length;
    const fechados    = leads.filter(l => l.estagio === 'fechado' || l.estagio === 'execucao').length;
    const perdidos    = leads.filter(l => l.estagio === 'perdido').length;

    const faturamentoEstimado = leads.reduce((acc, l) => {
      const t = parseFloat((l.ticket || '0').replace(/[^\d.]/g,'')) || 0;
      return acc + t;
    }, 0);
    const faturamentoFechado = leads.filter(l => l.estagio === 'fechado' || l.estagio === 'execucao').reduce((acc, l) => {
      const t = parseFloat((l.ticket || '0').replace(/[^\d.]/g,'')) || 0;
      return acc + t;
    }, 0);
    const taxaConversao = total ? Math.round(fechados / total * 100) : 0;
    const ticketMedio = fechados ? Math.round(faturamentoFechado / fechados) : 0;

    // Top serviços por frequência
    const servicoCount = {};
    leads.forEach(l => {
      const s = l.servico || l.tipo || 'Não especificado';
      servicoCount[s] = (servicoCount[s] || 0) + 1;
    });
    const topServicos = Object.entries(servicoCount).sort((a,b) => b[1]-a[1]).slice(0,5);

    return { total, emAbordagem, negociando, fechados, perdidos,
      faturamentoEstimado, faturamentoFechado, taxaConversao, ticketMedio, topServicos,
      totalPropostas: propostas.length, totalContratos: contratos.length };
  }

  function renderMetricasReceita(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const m = calcMetricasReceita();
    const fmt = (v) => v.toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
    const pctAbordagem = m.total ? (m.emAbordagem / m.total)*100 : 0;
    const pctNegoc = m.total ? (m.negociando / m.total)*100 : 0;
    const pctFechado = m.total ? (m.fechados / m.total)*100 : 0;

    el.innerHTML = `
      <div style="margin-bottom:20px;">
         <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:#94a3b8;font-weight:700;margin-bottom:4px;text-transform:uppercase;">
            <span>Aberto (${m.emAbordagem})</span><span>Negociando (${m.negociando})</span><span style="color:#4ade80">Ganhos (${m.fechados})</span>
         </div>
         <div style="width:100%;height:10px;display:flex;border-radius:5px;overflow:hidden;background:#0f172a;">
           <div style="width:${pctAbordagem}%;background:#60a5fa;transition:width 0.5s;"></div>
           <div style="width:${pctNegoc}%;background:#a78bfa;transition:width 0.5s;"></div>
           <div style="width:${pctFechado}%;background:#4ade80;transition:width 0.5s;"></div>
         </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:20px">
        ${[
          ['💰 Receita Fechada',    fmt(m.faturamentoFechado),  '#10b981'],
          ['📈 Pipeline Total',     fmt(m.faturamentoEstimado), '#f59e0b'],
          ['🎯 Leads Ativos',       m.total + ' leads',         '#60a5fa'],
          ['✅ Fechados',           m.fechados + ' clientes',   '#4ade80'],
          ['📊 Conversão',          m.taxaConversao + '%',      '#a78bfa'],
          ['🧾 Ticket Médio',       fmt(m.ticketMedio),         '#fb923c'],
        ].map(([lbl,val,cor]) => `
          <div style="background:linear-gradient(135deg,#1e2d3d,#162236);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px;border-left:3px solid ${cor}">
            <div style="font-size:0.7rem;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">${lbl}</div>
            <div style="color:${cor};font-size:1rem;font-weight:800">${val}</div>
          </div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div style="background:#1e2d3d;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:16px">
          <div style="color:#e2e8f0;font-weight:700;font-size:0.85rem;margin-bottom:12px">📊 Funil de Conversão</div>
          ${[
            ['Leads totais',    m.total,         '#60a5fa'],
            ['Em abordagem',   m.emAbordagem,    '#f59e0b'],
            ['Negociando',     m.negociando,     '#a78bfa'],
            ['Fechados',       m.fechados,        '#4ade80'],
            ['Perdidos',       m.perdidos,        '#f87171'],
          ].map(([lbl,n,cor]) => `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span style="font-size:0.78rem;color:#94a3b8">${lbl}</span>
              <div style="display:flex;align-items:center;gap:8px">
                <div style="width:100px;height:6px;background:#1e293b;border-radius:3px;overflow:hidden">
                  <div style="width:${m.total?Math.round(n/m.total*100):0}%;height:100%;background:${cor};border-radius:3px"></div>
                </div>
                <span style="font-size:0.82rem;font-weight:700;color:${cor};width:24px;text-align:right">${n}</span>
              </div>
            </div>`).join('')}
        </div>
        <div style="background:#1e2d3d;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:16px">
          <div style="color:#e2e8f0;font-weight:700;font-size:0.85rem;margin-bottom:12px">🏆 Top Serviços</div>
          ${m.topServicos.length ? m.topServicos.map(([s,n],i) => `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:0.78rem">
              <span style="color:#94a3b8;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${s}">${['🥇','🥈','🥉','4️⃣','5️⃣'][i]} ${s}</span>
              <span style="color:#f59e0b;font-weight:700;flex-shrink:0;margin-left:8px">${n}x</span>
            </div>`).join('')
          : '<div style="color:#475569;font-size:0.8rem;text-align:center;padding:20px 0">Nenhum lead salvo ainda</div>'}
        </div>
      </div>
      <div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">
        <button class="ag-btn ag-btn-secondary ag-btn-sm" style="background:#0f172a;color:#fb923c;border-color:#fb923c" onclick="Agrageo.baixarModeloLaudo()">📂 Modelo LibreOffice/Word.doc</button>
        <button class="ag-btn ag-btn-secondary ag-btn-sm" onclick="Agrageo.gerarRecibo()">🧾 Novo Recibo</button>
        <button class="ag-btn ag-btn-secondary ag-btn-sm" onclick="Agrageo.gerarOS()">📋 Nova OS</button>
        <button class="ag-btn ag-btn-primary ag-btn-sm" onclick="Agrageo.gerarContratoRemote()">📜 Contrato Remote</button>
      </div>`;
  }

  /* ════════════════════════════════════════════════════════
     PAINEL REMOTE — Serviços 100% Home-Office
     Geólogo + Técnico em Geoprocessamento
  ═══════════════════════════════════════════════════════ */

  const REMOTE_SERVICOS = [
    // ── Geoprocessamento Digital ──
    {
      id: 'rem_geo1', cat: 'geoprocessamento', icon: '🗺️',
      nome: 'Análise Multitemporal de Cobertura Vegetal',
      desc: 'Comparação de imagens de satélite em diferentes datas (MapBiomas, INPE) para detectar desmatamento, regeneração ou mudança de uso do solo.',
      ferramentas: 'QGIS + MapBiomas + Google Earth Engine',
      prazo: '3–5 dias úteis',
      oque_cliente_envia: ['Número do CAR ou coordenadas da propriedade', 'Datas de interesse (ex: 2012 e 2024)', 'Objetivo (defesa SEMA, CAR, PRAD?)'],
      entregaveis: ['Relatório PDF com mapas comparativos', 'Shapefiles das classes de uso do solo', 'ART do responsável técnico'],
      ticket: 'R$ 800 – R$ 2.500'
    },
    {
      id: 'rem_geo2', cat: 'geoprocessamento', icon: '📐',
      nome: 'Delimitação de APP e Reserva Legal via Satélite',
      desc: 'Vetorização de Área de Preservação Permanente (APP) e Reserva Legal usando imagens de satélite e limites do CAR, sem necessidade de campo.',
      ferramentas: 'QGIS + SICAR + Imagens Planet/Sentinel',
      prazo: '2–4 dias úteis',
      oque_cliente_envia: ['Código CAR do imóvel', 'Número da matrícula/ADA', 'Relevo aproximado (qual bioma: Cerrado ou Amazônia?)'],
      entregaveis: ['Shapefile das APPs e RL delimitadas', 'Planta georreferenciada em PDF', 'Memorial descritivo simplificado', 'ART'],
      ticket: 'R$ 600 – R$ 1.800'
    },
    {
      id: 'rem_geo3', cat: 'geoprocessamento', icon: '📊',
      nome: 'Mapa Temático Personalizado',
      desc: 'Elaboração de mapas de solos, uso do solo, declividade, hipsometria ou qualquer tema solicitado, a partir de dados públicos.',
      ferramentas: 'QGIS + SRTM + IBGE + SGB',
      prazo: '1–3 dias úteis',
      oque_cliente_envia: ['Área de interesse (shapefile ou coordenadas)', 'Tema desejado', 'Escala e finalidade do mapa'],
      entregaveis: ['Arquivo shapefile do tema', 'Mapa finalizado em PDF/PNG', 'Legenda e metadados'],
      ticket: 'R$ 400 – R$ 1.500'
    },
    {
      id: 'rem_geo4', cat: 'geoprocessamento', icon: '🛰️',
      nome: 'Cruzamento de Dados Ambientais (CAR × DETER × SEMA)',
      desc: 'Interseção espacial de bancos de dados públicos para identificar sobreposições, embargos, alertas de desmatamento ou áreas de risco.',
      ferramentas: 'QGIS + Python (GeoPandas) + TerraBrasilis INPE',
      prazo: '2–4 dias úteis',
      oque_cliente_envia: ['Área de interesse ou número do CAR', 'Objetivo da análise (defesa, consultoria, licença)'],
      entregaveis: ['Relatório de sobreposições com mapas', 'Tabela de resultados por camada', 'ART opcional'],
      ticket: 'R$ 800 – R$ 2.000'
    },
    // ── Laudos Geológicos e Técnicos ──
    {
      id: 'rem_lau1', cat: 'laudo', icon: '📋',
      nome: 'Parecer Geológico de Viabilidade de Poço',
      desc: 'Análise técnica remota de viabilidade hidrogeológica a partir de dados SIAGAS, cartas geológicas e imagens de satélite. Sem ir a campo.',
      ferramentas: 'SIAGAS/SGB + Cartas SGB + Google Earth',
      prazo: '2–3 dias úteis',
      oque_cliente_envia: ['Coordenadas do terreno (latitude/longitude)', 'Município e área aproximada', 'Uso pretendido da água'],
      entregaveis: ['Parecer técnico em PDF', 'Mapa de localização e contexto geológico', 'ART CREA'],
      ticket: 'R$ 600 – R$ 1.500'
    },
    {
      id: 'rem_lau2', cat: 'laudo', icon: '🔍',
      nome: 'Interpretação de Perfil Litológico de Poço',
      desc: 'O perfurador coleta e envia o boletim de perfuração. Você analisa remotamente e emite o laudo técnico geológico.',
      ferramentas: 'Excel + Word + dados SIAGAS comparativos',
      prazo: '1–2 dias úteis',
      oque_cliente_envia: ['Boletim de perfuração preenchido pelo perfurador', 'Localização do poço', 'Equipamentos instalados (bomba, colunas)'],
      entregaveis: ['Laudo geológico do poço em PDF', 'Gráfico do perfil litológico', 'ART CREA'],
      ticket: 'R$ 300 – R$ 700'
    },
    {
      id: 'rem_lau3', cat: 'laudo', icon: '💧',
      nome: 'Relatório de Análise de Qualidade de Água',
      desc: 'Interpretação de laudo laboratorial enviado pelo cliente, com parecer técnico sobre potabilidade, corrosividade e enquadramento legal.',
      ferramentas: 'Excel + Word + Portaria 888/2021 MS',
      prazo: '1–2 dias úteis',
      oque_cliente_envia: ['Laudo laboratorial (PDF ou foto legível)', 'Finalidade da água (consumo humano, pecuária, irrigação?)', 'Localização do poço'],
      entregaveis: ['Parecer técnico sobre qualidade', 'Tabela comparativa com padrões MS/CEHIDRO-MT', 'Recomendações de tratamento + ART'],
      ticket: 'R$ 300 – R$ 700'
    },
    // ── Ambiental/CAR ──
    {
      id: 'rem_amb1', cat: 'ambiental', icon: '🌿',
      nome: 'Atualização / Recadastramento de CAR',
      desc: 'Revisão, correção e reenvio de CAR com novas delimitações de APP, RL e área consolidada, usando SICAR online.',
      ferramentas: 'SICAR + QGIS + Google Earth',
      prazo: '3–5 dias úteis',
      oque_cliente_envia: ['Número do CAR atual', 'Matrícula ou ADA do imóvel', 'Situação atual: o que precisa corrigir'],
      entregaveis: ['CAR atualizado com recibo SICAR', 'Planta de localização', 'ART CFT/CREA'],
      ticket: 'R$ 500 – R$ 1.500'
    },
    {
      id: 'rem_amb2', cat: 'ambiental', icon: '⚖️',
      nome: 'Defesa Técnica de Auto de Infração SEMA',
      desc: 'Elaboração de laudo técnico para defesa administrativa usando imagens históricas, sobreposição CAR e argumentação jurídico-ambiental.',
      ferramentas: 'MapBiomas + QGIS + Google Earth Engine + Word',
      prazo: '5–10 dias úteis',
      oque_cliente_envia: ['Cópia do Auto de Infração (AIT)', 'Coordenadas / código CAR da área', 'Fotos da área (se houver)', 'Histórico da propriedade'],
      entregaveis: ['Laudo técnico pericial em PDF', 'Mapas de cobertura vegetal histórica', 'ART CREA + assinatura digital'],
      ticket: 'R$ 1.500 – R$ 5.000'
    },
    {
      id: 'rem_amb3', cat: 'ambiental', icon: '🪓',
      nome: 'Laudo Multitemporal para Desembargo',
      desc: 'Prova técnica de regeneração natural para requerer o levantamento de embargo ao IBAMA/SEMA. Baseado em análise de satélite.',
      ferramentas: 'MapBiomas + Google Earth Engine + QGIS',
      prazo: '5–8 dias úteis',
      oque_cliente_envia: ['Cópia do Termo de Embargo', 'Código CAR ou coordenadas', 'Datas de referência do embargo'],
      entregaveis: ['Laudo multitemporal com mapas de regeneração', 'Comparativo de cobertura vegetal por data', 'ART CREA para protocolar na SEMA/IBAMA'],
      ticket: 'R$ 2.000 – R$ 5.000'
    },
    // ── Hidrogeologia Remota ──
    {
      id: 'rem_hid1', cat: 'hidrogeologia', icon: '📝',
      nome: 'Elaboração de Requerimento de Outorga',
      desc: 'Preenchimento e envio do requerimento de outorga subterrânea na SEMA-MT online, com memorial descritivo e planta de localização.',
      ferramentas: 'SEMA-MT sistema online + QGIS + Word',
      prazo: '2–4 dias úteis',
      oque_cliente_envia: ['Boletim do poço existente (perfurador)', 'Dados do proprietário (CPF/CNPJ)', 'Coordenadas + município + uso pretendido', 'Vazão e profundidade do poço'],
      entregaveis: ['Requerimento protocolado na SEMA', 'Planta de localização', 'Memorial descritivo', 'ART CREA'],
      ticket: 'R$ 500 – R$ 1.200'
    },
    {
      id: 'rem_hid2', cat: 'hidrogeologia', icon: '📈',
      nome: 'Análise de Dados de Bombeamento (Cliente Envia)',
      desc: 'O cliente contrata outra empresa para fazer o bombeamento e te manda os dados brutos. Você processa, calcula e emite o laudo.',
      ferramentas: 'Excel + AquiferTest/AQTESOLV online + Word',
      prazo: '2–3 dias úteis',
      oque_cliente_envia: ['Planilha de dados do ensaio (tempo × rebaixamento)', 'Diâmetro, profundidade e coluna do poço', 'Posição dos poços de observação (se houver)'],
      entregaveis: ['Laudo do ensaio de bombeamento com gráficos', 'Parâmetros aquífero: T, S, Kh', 'ART CREA'],
      ticket: 'R$ 600 – R$ 1.500'
    },
    // ── Topografia Remota ──
    {
      id: 'rem_top1', cat: 'topografia', icon: '🗂️',
      nome: 'Memorial Descritivo de Imóvel Rural (Polígono Pronto)',
      desc: 'O cliente já tem os vértices do SIGEF. Você redige o memorial descritivo padrão INCRA para registro em cartório.',
      ferramentas: 'SIGEF + Word + planilha de coordenadas UTM',
      prazo: '1–2 dias úteis',
      oque_cliente_envia: ['Relatório do SIGEF com vértices e coordenadas', 'Dados do imóvel (matrícula, área, confrontantes)'],
      entregaveis: ['Memorial descritivo padrão INCRA em PDF', 'Planta de situação e localização', 'ART CFT assinada'],
      ticket: 'R$ 300 – R$ 800'
    },
    {
      id: 'rem_top2', cat: 'topografia', icon: '🌍',
      nome: 'Planta de Situação e Localização de Imóvel',
      desc: 'Elaboração de planta técnica com coordenadas, escala gráfica, norte e localização municipal para protocolos e licenciamentos.',
      ferramentas: 'QGIS + Inkscape/CorelDRAW',
      prazo: '1–2 dias úteis',
      oque_cliente_envia: ['Shapefile ou KML do imóvel', 'Dados do proprietário e município'],
      entregaveis: ['Planta A3/A4 em PDF georreferenciado', 'Arquivo editável (DXF/QGIS)', 'ART CFT se necessário'],
      ticket: 'R$ 300 – R$ 700'
    },
    // ── Consultoria Remota ──
    {
      id: 'rem_con1', cat: 'consultoria', icon: '💡',
      nome: 'Consultoria Online (WhatsApp / Google Meet)',
      desc: 'Reunião técnica de até 1h para orientar sobre regularização, licença, CAR, outorga ou viabilidade de projeto. Por chamada de vídeo.',
      ferramentas: 'WhatsApp / Google Meet',
      prazo: 'Agendamento em 24–48h',
      oque_cliente_envia: ['Descrição do problema ou dúvida por escrito antes da reunião', 'Documentos relevantes para visualizarmos juntos'],
      entregaveis: ['1h de reunião técnica gravada (opcional)', 'Resumo executivo por escrito após a reunião', 'Indicação de próximos passos'],
      ticket: 'R$ 150 – R$ 300 / hora'
    },
    {
      id: 'rem_con2', cat: 'consultoria', icon: '📖',
      nome: 'Revisão Técnica de Projetos de Terceiros',
      desc: 'Análise crítica de laudos, relatórios e projetos ambientais elaborados por outros técnicos, com emissão de parecer formal.',
      ferramentas: 'Adobe Reader + Word + QGIS',
      prazo: '2–4 dias úteis',
      oque_cliente_envia: ['Documento a ser revisado (PDF ou Word)', 'Objetivo: aprovação, contestação ou complementação?'],
      entregaveis: ['Parecer técnico de revisão em PDF', 'Anotações e sugestões de correção', 'ART CREA se houver responsabilidade técnica'],
      ticket: 'R$ 400 – R$ 900'
    },
    {
      id: 'rem_con3', cat: 'consultoria', icon: '🎓',
      nome: 'Treinamento Online de QGIS para Produtores',
      desc: 'Curso prático online para produtores rurais aprenderem a visualizar o CAR, APP, RL e mapas da propriedade no QGIS.',
      ferramentas: 'Google Meet + QGIS + material didático próprio',
      prazo: 'Módulos de 2h',
      oque_cliente_envia: ['Computador com QGIS instalado', 'Shapefile ou KML da propriedade'],
      entregaveis: ['Aulas gravadas enviadas', 'Material PDF de apoio', 'Suporte por 30 dias via WhatsApp'],
      ticket: 'R$ 250 – R$ 600 / módulo'
    },
    {
      id: 'rem_con4', cat: 'consultoria', icon: '🔬',
      nome: 'Interpretação de Dados Geofísicos (Enviados pelo Cliente)',
      desc: 'A empresa de geofísica vai a campo e te envia os dados brutos. Você processa ERT/SEV remotamente e emite o relatório.',
      ferramentas: 'RES2DINV + IPI2WIN + QGIS + Word',
      prazo: '3–5 dias úteis',
      oque_cliente_envia: ['Arquivo de dados brutos da geofísica (DAT, TXT)', 'Coordenadas do perfil e espaçamento entre eletrodos', 'Informações sobre o aquífero esperado'],
      entregaveis: ['Seção geoelétrica invertida em PDF', 'Interpretação litológica por resistividade', 'Recomendação de ponto de poço', 'ART CREA'],
      ticket: 'R$ 1.000 – R$ 2.500'
    },
  ];

  let _remoteFiltroAtivo = 'todos';

  function renderRemote(filtro) {
    const container = document.getElementById('ag-remote-cards');
    if (!container) return;
    _remoteFiltroAtivo = filtro || _remoteFiltroAtivo;

    const lista = REMOTE_SERVICOS.filter(s =>
      _remoteFiltroAtivo === 'todos' || s.cat === _remoteFiltroAtivo
    );

    const catLabel = {
      geoprocessamento: ['Geoprocessamento', 'badge-geo'],
      laudo:            ['Laudos',           'badge-laudo'],
      ambiental:        ['Ambiental',        'badge-ambiental'],
      hidrogeologia:    ['Hidrogeologia',    'badge-hidrogeologia'],
      topografia:       ['Topografia',       'badge-topografia'],
      consultoria:      ['Consultoria',      'badge-consultoria'],
    };

    container.innerHTML = lista.map(s => {
      const [catNome, catBadge] = catLabel[s.cat] || ['Outro', 'badge-geo'];
      const clienteItems = (s.oque_cliente_envia || []).map(i => `<li>${i}</li>`).join('');
      const entregaveisItems = (s.entregaveis || []).map(i => `<li>${i}</li>`).join('');

      return `
        <div class="ag-remote-card" data-cat="${s.cat}">
          <div class="ag-remote-card-header">
            <div style="display:flex;align-items:flex-start;gap:10px;flex:1;">
              <span class="ag-remote-card-icon">${s.icon}</span>
              <div>
                <div class="ag-remote-card-title">${s.nome}</div>
                <span class="ag-remote-cat-badge ${catBadge}">${catNome}</span>
              </div>
            </div>
          </div>
          <div class="ag-remote-card-desc">${s.desc}</div>
          <div class="ag-remote-card-meta">
            <div class="ag-remote-meta-row">
              <span class="ag-remote-meta-label">🛠️ Ferramenta</span>
              <span class="ag-remote-meta-val" style="text-align:right;font-size:0.72rem;">${s.ferramentas}</span>
            </div>
            <div class="ag-remote-meta-row">
              <span class="ag-remote-meta-label">⏱️ Prazo</span>
              <span class="ag-remote-meta-val">${s.prazo}</span>
            </div>
          </div>
          <details style="cursor:pointer;">
            <summary style="font-size:0.74rem;color:#64748b;font-weight:700;list-style:none;padding:4px 0;">→ O que o cliente precisa enviar</summary>
            <ul class="ag-remote-briefing-items" style="margin-top:6px;">${clienteItems}</ul>
          </details>
          <details style="cursor:pointer;">
            <summary style="font-size:0.74rem;color:#64748b;font-weight:700;list-style:none;padding:4px 0;">✓ Entregáveis</summary>
            <ul class="ag-remote-checklist" style="margin-top:6px;">${entregaveisItems}</ul>
          </details>
          <div class="ag-remote-ticket">
            <span class="ag-remote-ticket-label">Ticket Estimado</span>
            <span class="ag-remote-ticket-val">${s.ticket}</span>
          </div>
          <div class="ag-remote-card-actions">
            <button class="ag-btn ag-btn-secondary ag-btn-sm" onclick="Agrageo.abrirBriefingRemote('${s.nome}')">📋 Briefing</button>
            <button class="ag-btn ag-btn-primary ag-btn-sm" onclick="Agrageo.gerarPropostaRemote('${s.id}')">📄 Proposta</button>
          </div>
        </div>`;
    }).join('');

    if (!lista.length) {
      container.innerHTML = '<div style="color:#475569;text-align:center;padding:40px 0;font-size:0.85rem;">Nenhum serviço nessa categoria.</div>';
    }
  }

  function filtrarRemote(cat) {
    _remoteFiltroAtivo = cat;
    // Atualiza botões
    document.querySelectorAll('.ag-remote-cat-btn').forEach(btn => btn.classList.remove('active'));
    const mapa = { todos: 'remote-cat-todos', geoprocessamento: 'remote-cat-geo', laudo: 'remote-cat-laudo',
      ambiental: 'remote-cat-amb', hidrogeologia: 'remote-cat-hidro', topografia: 'remote-cat-topo', consultoria: 'remote-cat-cons' };
    const el = document.getElementById(mapa[cat]);
    if (el) el.classList.add('active');
    renderRemote(cat);
  }

  function abrirBriefingRemote(nomeServico) {
    const brf = document.getElementById('ag-remote-briefing');
    if (!brf) return;
    brf.style.display = 'block';
    brf.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (nomeServico) {
      const inp = document.getElementById('brf-servico');
      if (inp) inp.value = nomeServico;
    }
  }

  function copiarBriefing() {
    const servico  = document.getElementById('brf-servico')?.value  || '—';
    const cliente  = document.getElementById('brf-cliente')?.value  || '—';
    const car      = document.getElementById('brf-car')?.value      || '—';
    const municipio= document.getElementById('brf-municipio')?.value|| '—';
    const area     = document.getElementById('brf-area')?.value     || '—';
    const prazo    = document.getElementById('brf-prazo')?.value    || '—';
    const situacao = document.getElementById('brf-situacao')?.value || '—';

    const texto = `📋 BRIEFING DE PROJETO — Agrageo Consultoria\n\n` +
      `Serviço: ${servico}\n` +
      `Cliente: ${cliente}\n` +
      `CAR / Processo: ${car}\n` +
      `Município: ${municipio}\n` +
      `Área: ${area} ha\n` +
      `Prazo desejado: ${prazo}\n` +
      `\nSituação / Contexto:\n${situacao}\n\n` +
      `---\nAgrageo Consultoria | (65) 8139-0282 | agrageoconsultoria@gmail.com`;

    navigator.clipboard.writeText(texto)
      .then(() => alert('✅ Briefing copiado para a área de transferência!'))
      .catch(() => alert('Não foi possível copiar. Selecione e copie manualmente.'));
  }

  function gerarPDFBriefing() {
    const servico  = document.getElementById('brf-servico')?.value  || '—';
    const cliente  = document.getElementById('brf-cliente')?.value  || '—';
    const car      = document.getElementById('brf-car')?.value      || '—';
    const municipio= document.getElementById('brf-municipio')?.value|| '—';
    const area     = document.getElementById('brf-area')?.value     || '—';
    const prazo    = document.getElementById('brf-prazo')?.value    || '—';
    const situacao = (document.getElementById('brf-situacao')?.value || '—').replace(/\n/g,'<br>');
    const logoSrc  = EMPRESA.logo;

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
      <title>Briefing Remote — ${servico}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;color:#1e293b;font-size:11pt;}
        h1{color:#1e3a5f;font-size:14pt;border-bottom:2px solid #1e3a5f;padding-bottom:6px;}
        .hdr{display:flex;align-items:center;gap:20px;margin-bottom:24px;}
        .info{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;margin-bottom:16px;}
        .row{display:flex;flex-direction:column;}
        .lbl{font-size:8pt;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;}
        .val{font-size:10pt;color:#1e293b;border-bottom:1px solid #e2e8f0;padding-bottom:2px;min-height:18px;}
        .sit{margin-top:12px;}
        .footer{margin-top:32px;font-size:8pt;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px;}
      </style></head><body>
      <div class="hdr">
        <img src="${logoSrc}" height="90" style="object-fit:contain;"/>
        <div><div style="font-size:13pt;font-weight:900;color:#1e3a5f;">AGRAGEO CONSULTORIA</div>
        <div style="font-size:9pt;color:#64748b;">Geologia, topografia e meio ambiente</div></div>
      </div>
      <h1>📋 BRIEFING DE PROJETO REMOTE</h1>
      <div class="info">
        <div class="row"><span class="lbl">Serviço Solicitado</span><span class="val">${servico}</span></div>
        <div class="row"><span class="lbl">Cliente</span><span class="val">${cliente}</span></div>
        <div class="row"><span class="lbl">CAR / Processo</span><span class="val">${car}</span></div>
        <div class="row"><span class="lbl">Município</span><span class="val">${municipio}</span></div>
        <div class="row"><span class="lbl">Área (ha)</span><span class="val">${area}</span></div>
        <div class="row"><span class="lbl">Prazo Desejado</span><span class="val">${prazo}</span></div>
      </div>
      <div class="sit">
        <div class="lbl">Situação / Contexto</div>
        <div style="border:1px solid #e2e8f0;border-radius:6px;padding:10px;margin-top:4px;min-height:60px;font-size:10pt;">${situacao}</div>
      </div>
      <div class="footer">
        Agrageo Consultoria | CNPJ: ${EMPRESA.cnpj} | Tel: ${EMPRESA.celular} | ${EMPRESA.email} | Site: ${EMPRESA.site}
        <br>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
      </div>
    </body></html>`;

    if (typeof html2pdf !== 'undefined') {
      const el = document.createElement('div');
      el.innerHTML = html;
      html2pdf().set({ margin:10, filename:`briefing-remote-${Date.now()}.pdf`, jsPDF:{format:'a4'} }).from(el).save();
    } else {
      const w = window.open('', '_blank');
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 600);
    }
  }

  function gerarPropostaRemote(serviceId) {
    const srv = REMOTE_SERVICOS.find(s => s.id === serviceId);
    if (!srv) return;
    // Pré-preenche a aba de propostas e muda de aba
    switchTab('propostas');
    setTimeout(() => {
      const inp = document.getElementById('prop-objeto');
      if (inp) inp.value = srv.nome;
      const inp2 = document.getElementById('row-desc-0');
      if (inp2) inp2.value = srv.nome;
      const inp3 = document.getElementById('row-val-0');
      // Pega o valor mínimo do ticket se possível
      const match = srv.ticket.match(/R\$\s*([\d.,]+)/);
      if (inp3 && match) inp3.value = parseFloat(match[1].replace('.','').replace(',','.')) || '';
      const inp4 = document.getElementById('row-desc-1');
      if (inp4) inp4.value = 'ART / TRT (Responsabilidade Técnica do Profissional)';
    }, 200);
  }

  // ====== CALCULADORA SIG ======
  let calcSigValorAtual = 0;
  let calcSigDescAtual = '';

  function calcularHonorarioSIG() {
    const selTipo = document.getElementById('calc-sig-tipo');
    const inpArea = document.getElementById('calc-sig-area');
    const selDif = document.getElementById('calc-sig-dificuldade');
    if(!selTipo || !inpArea || !selDif) return;

    let base = 0; let desc = '';
    let val = selTipo.value;
    if(val === 'mapa_tematico') { base = 400; desc = 'Mapeamento Temático / Planta de Situação'; }
    else if(val === 'retificacao_car') { base = 800; desc = 'Retificação de CAR por Sobreposição (Planta+Memorial)'; }
    else if(val === 'defesa_ambiental') { base = 1500; desc = 'Laudo Técnico de Defesa Multitemporal (Até 5 Anos)'; }
    else if(val === 'georreferenciamento') { base = 2000; desc = 'Levantamento Remoto Integrado CAR x SIGEF'; }

    let area = parseFloat(inpArea.value) || 0;
    // Agrega R$ 2,50 por hectare como variável "escala"
    let extraArea = area * 2.50; 
    let dif = parseFloat(selDif.value) || 1.0;
    
    let baseLote = (base + extraArea) * dif;
    let finalValor = baseLote;

    // Checagem de Multirão/B2B
    let checkB2B = document.getElementById('calc-sig-mutirao');
    let inpLotes = document.getElementById('calc-sig-lotes');
    let nLotes = 1;
    if(checkB2B && checkB2B.checked && inpLotes) {
       nLotes = parseInt(inpLotes.value) || 1;
       if(nLotes > 1) {
          // Lote 1 paga 100%. Lotes excedentes pagam 40%
          finalValor = baseLote + (baseLote * 0.4 * (nLotes - 1));
       }
    }

    calcSigValorAtual = finalValor;
    
    let nivelText = selDif.options[selDif.selectedIndex].text.split(' ')[0];
    if(nLotes > 1) {
      calcSigDescAtual = `${desc} (Mutirão B2B: ${nLotes} Lotes - Área Média: ${area}ha, Complexidade: ${nivelText})`;
    } else {
      calcSigDescAtual = `${desc} (Área de Referência: ${area}ha, Complexidade: ${nivelText})`;
    }

    const res = document.getElementById('calc-sig-resultado');
    if(res) res.innerText = finalValor.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
  }

  function puxarParaProposta() {
    if(calcSigValorAtual === 0) {
      alert("⚠️ Calcule os honorários primeiro acima.");
      return;
    }
    const inpObjeto = document.getElementById('prop-objeto');
    if (inpObjeto) inpObjeto.value = calcSigDescAtual;
    
    const inpServ = document.getElementById('row-desc-0');
    if (inpServ) inpServ.value = calcSigDescAtual;
    
    const inpVal = document.getElementById('row-val-0');
    if (inpVal) inpVal.value = calcSigValorAtual.toFixed(2);
    
    // Auto-calcula
    calcTotal();
    alert("✅ Orçamento de SIG transcrito para a linha 1 da Proposta abaixo! Ajuste o resto se necessário.");
  }


    // ══════════════════════════════════════════════════════════════════
  //  GERADOR DE DOCUMENTOS TÉCNICOS — PRAD e PGRS
  //  Com logomarca, marca d'água e estrutura normativa MT
  // ══════════════════════════════════════════════════════════════════
  function _docCss() {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:'Inter',Arial,sans-serif;color:#1e293b;font-size:10.5pt;background:#fff;padding:0;}
      .page{position:relative;padding:28mm 20mm 22mm 25mm;min-height:297mm;page-break-after:always;}
      .watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);opacity:0.045;z-index:0;pointer-events:none;}
      .watermark img{width:420px;}
      .content{position:relative;z-index:1;}
      .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1e3a5f;padding-bottom:14px;margin-bottom:20px;}
      .header-logo img{height:80px;object-fit:contain;}
      .header-info{text-align:right;}
      .header-fantasia{font-size:14pt;font-weight:900;color:#1e3a5f;letter-spacing:0.02em;}
      .header-sub{font-size:8pt;color:#64748b;margin-top:2px;}
      .doc-title{text-align:center;background:#1e3a5f;color:#fff;border-radius:6px;padding:12px 20px;margin:18px 0;}
      .doc-title h1{font-size:14pt;font-weight:900;letter-spacing:0.03em;}
      .doc-title p{font-size:8.5pt;opacity:0.8;margin-top:4px;}
      .badge-norma{display:inline-block;background:#f1f5f9;color:#475569;border:1px solid #cbd5e1;border-radius:4px;padding:2px 8px;font-size:7.5pt;font-weight:700;margin:2px;}
      .section{margin-top:18px;}
      .section-title{font-size:11pt;font-weight:800;color:#1e3a5f;border-left:4px solid #1e3a5f;padding-left:10px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.04em;}
      .sub-title{font-size:9.5pt;font-weight:700;color:#334155;margin:10px 0 5px 0;}
      .field-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;}
      .field{border-bottom:1px solid #cbd5e1;padding:4px 0 2px;margin-bottom:6px;}
      .field-label{font-size:7.5pt;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;}
      .field-value{font-size:9.5pt;color:#1e293b;min-height:16px;font-weight:500;}
      .table-doc{width:100%;border-collapse:collapse;margin:8px 0;font-size:9pt;}
      .table-doc th{background:#1e3a5f;color:#fff;padding:7px 10px;font-weight:700;text-align:left;font-size:8.5pt;}
      .table-doc td{padding:6px 10px;border-bottom:1px solid #e2e8f0;}
      .table-doc tr:nth-child(even) td{background:#f8fafc;}
      .obs-box{background:#fffbeb;border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:6px;padding:10px 14px;font-size:9pt;margin:10px 0;}
      .sign-area{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:30px;}
      .sign-line{border-top:1px solid #334155;padding-top:6px;text-align:center;font-size:8.5pt;color:#475569;}
      .footer{position:running(footer);text-align:center;font-size:7.5pt;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:6px;margin-top:24px;}
      .art-box{background:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid #22c55e;border-radius:6px;padding:10px 14px;font-size:9pt;margin:10px 0;}
      ul.doc-list{margin:6px 0 6px 20px;}
      ul.doc-list li{margin-bottom:4px;font-size:9.5pt;}
      .cronograma th{background:#334155;}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
    `;
  }

  function _docHeader(logoSrc) {
    return `
      <div class="watermark"><img src="${logoSrc}" alt="watermark"></div>
      <div class="header">
        <div class="header-logo"><img src="${logoSrc}" alt="Agrageo Logo"></div>
        <div class="header-info">
          <div class="header-fantasia">AGRAGEO CONSULTORIA</div>
          <div class="header-sub">Geologia · Meio Ambiente · Geoprocessamento</div>
          <div class="header-sub">CNPJ: ${EMPRESA.cnpj} · CREa-MT ${EMPRESA.nome}</div>
          <div class="header-sub">${EMPRESA.celular} · ${EMPRESA.email}</div>
        </div>
      </div>`;
  }

  function _docFooter(docTipo, numPag) {
    const hoje = new Date().toLocaleDateString('pt-BR');
    return `
      <div class="footer">
        ${docTipo} — Elaborado por Agrageo Consultoria | ${EMPRESA.celular} | ${EMPRESA.site} | Data de emissão: ${hoje} | Pág. ${numPag}
      </div>`;
  }

  function abrirModalPRAD() {
    const existing = document.getElementById('modal-prad-gen');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'modal-prad-gen';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:9998;display:flex;align-items:center;justify-content:center;padding:16px;';
    modal.innerHTML = `
      <div style="background:#0f172a;border:1px solid rgba(148,163,184,0.15);border-radius:14px;width:100%;max-width:820px;max-height:93vh;overflow-y:auto;padding:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div>
            <div style="color:#22c55e;font-size:1rem;font-weight:800;">🌿 Gerador de PRAD — Plano de Recuperação de Área Degradada</div>
            <div style="color:#64748b;font-size:0.73rem;margin-top:2px;">IN SEMA-MT 09/2006 · CONAMA 429/2011 · Lei 12.651/2012</div>
          </div>
          <button onclick="document.getElementById('modal-prad-gen').remove()" style="background:#334155;color:#94a3b8;border:none;border-radius:7px;padding:6px 12px;cursor:pointer;">✕</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
          <div><label style="color:#64748b;font-size:0.72rem;font-weight:700;display:block;margin-bottom:3px;">REQUERENTE (nome/empresa)</label><input id="prad-requerente" style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;padding:7px 10px;font-size:0.82rem;outline:none;" placeholder="Nome ou Razão Social"></div>
          <div><label style="color:#64748b;font-size:0.72rem;font-weight:700;display:block;margin-bottom:3px;">CPF / CNPJ</label><input id="prad-cpfcnpj" style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;padding:7px 10px;font-size:0.82rem;outline:none;" placeholder="000.000.000-00 ou 00.000.000/0001-00"></div>
          <div><label style="color:#64748b;font-size:0.72rem;font-weight:700;display:block;margin-bottom:3px;">IMÓVEL / PROPRIEDADE</label><input id="prad-imovel" style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;padding:7px 10px;font-size:0.82rem;outline:none;" placeholder="Nome da Fazenda ou endereço"></div>
          <div><label style="color:#64748b;font-size:0.72rem;font-weight:700;display:block;margin-bottom:3px;">MUNICÍPIO - MT</label><input id="prad-municipio" style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;padding:7px 10px;font-size:0.82rem;outline:none;" placeholder="Ex: Rondonópolis"></div>
          <div><label style="color:#64748b;font-size:0.72rem;font-weight:700;display:block;margin-bottom:3px;">Nº AUTO DE INFRAÇÃO / PROCESSO</label><input id="prad-processo" style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;padding:7px 10px;font-size:0.82rem;outline:none;" placeholder="Ex: AI 136/2025 ou Proc. 038.223/2022"></div>
          <div><label style="color:#64748b;font-size:0.72rem;font-weight:700;display:block;margin-bottom:3px;">ÁREA DEGRADADA (ha)</label><input id="prad-area" type="number" style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;padding:7px 10px;font-size:0.82rem;outline:none;" placeholder="Ex: 2.5"></div>
          <div><label style="color:#64748b;font-size:0.72rem;font-weight:700;display:block;margin-bottom:3px;">CAUSA DA DEGRADAÇÃO</label><input id="prad-causa" style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;padding:7px 10px;font-size:0.82rem;outline:none;" placeholder="Ex: supressão vegetal sem autorização"></div>
          <div><label style="color:#64748b;font-size:0.72rem;font-weight:700;display:block;margin-bottom:3px;">BIOMA / FITOFISIONOMIA</label><select id="prad-bioma" style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;padding:7px 10px;font-size:0.82rem;outline:none;"><option>Cerrado — Savana</option><option>Cerrado — Mata Ciliar</option><option>Cerrado — Campo Rupestre</option><option>Amazônia — Floresta Ombrófila</option><option>Amazônia — Mata de Galeria</option><option>APP — Margem de Curso d'Água</option></select></div>
          <div><label style="color:#64748b;font-size:0.72rem;font-weight:700;display:block;margin-bottom:3px;">MÉTODO DE RECUPERAÇÃO</label><select id="prad-metodo" style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;padding:7px 10px;font-size:0.82rem;outline:none;"><option>Regeneração natural conduzida</option><option>Plantio de mudas de espécies nativas</option><option>Hidrossemeadura de espécies nativas</option><option>Nucleação (poleiros + propágulos)</option><option>Combinado: plantio + regeneração</option></select></div>
          <div><label style="color:#64748b;font-size:0.72rem;font-weight:700;display:block;margin-bottom:3px;">PRAZO DE EXECUÇÃO (meses)</label><input id="prad-prazo" type="number" style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;padding:7px 10px;font-size:0.82rem;outline:none;" value="24" placeholder="24"></div>
          <div style="grid-column:span 2;"><label style="color:#64748b;font-size:0.72rem;font-weight:700;display:block;margin-bottom:3px;">PROFISSIONAL RESPONSÁVEL (Engenheiro/Biólogo contratado)</label><input id="prad-resp" style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;padding:7px 10px;font-size:0.82rem;outline:none;" placeholder="Ex: João Silva — Eng. Ambiental — CREA-MT 12345"></div>
          <div><label style="color:#64748b;font-size:0.72rem;font-weight:700;display:block;margin-bottom:3px;">Nº ART</label><input id="prad-art" style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;padding:7px 10px;font-size:0.82rem;outline:none;" placeholder="ART nº XXXXXXXXXX"></div>
          <div><label style="color:#64748b;font-size:0.72rem;font-weight:700;display:block;margin-bottom:3px;">COORDENADAS (LAT/LONG)</label><input id="prad-coords" style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;padding:7px 10px;font-size:0.82rem;outline:none;" placeholder="Ex: -15.123456, -55.654321"></div>
        </div>
        <div style="display:flex;gap:8px;margin-top:4px;">
          <button onclick="Agrageo._gerarDocPRAD()" style="background:#22c55e;color:#0f172a;border:none;border-radius:7px;padding:9px 22px;font-weight:800;font-size:0.88rem;cursor:pointer;flex:1;">🖨️ Gerar PRAD — Abrir para Imprimir / PDF</button>
          <button onclick="document.getElementById('modal-prad-gen').remove()" style="background:#334155;color:#94a3b8;border:none;border-radius:7px;padding:9px 14px;font-size:0.82rem;cursor:pointer;">Cancelar</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }

  function _gerarDocPRAD() {
    const v = id => (document.getElementById(id)?.value || '').trim() || '[NÃO INFORMADO]';
    const requerente = v('prad-requerente'), cpfcnpj = v('prad-cpfcnpj'), imovel = v('prad-imovel'),
          municipio = v('prad-municipio'), processo = v('prad-processo'), area = v('prad-area'),
          causa = v('prad-causa'), bioma = v('prad-bioma'), metodo = v('prad-metodo'),
          prazo = v('prad-prazo'), resp = v('prad-resp'), art = v('prad-art'), coords = v('prad-coords');
    const logo = EMPRESA.logo;
    const hoje = new Date().toLocaleDateString('pt-BR');
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
      <title>PRAD — ${requerente} — ${municipio}</title>
      <style>${_docCss()}</style></head><body>
      <div class="page"><div class="content">
        ${_docHeader(logo)}
        <div class="doc-title">
          <h1>PLANO DE RECUPERAÇÃO DE ÁREA DEGRADADA — PRAD</h1>
          <p>
            <span class="badge-norma">IN SEMA-MT 09/2006</span>
            <span class="badge-norma">CONAMA 429/2011</span>
            <span class="badge-norma">Lei Federal 12.651/2012</span>
            <span class="badge-norma">Res. CONAMA 001/86</span>
          </p>
        </div>

        <div class="section">
          <div class="section-title">1. Identificação do Requerente e do Imóvel</div>
          <div class="field-row">
            <div class="field"><div class="field-label">Requerente (Autuado)</div><div class="field-value">${requerente}</div></div>
            <div class="field"><div class="field-label">CPF / CNPJ</div><div class="field-value">${cpfcnpj}</div></div>
            <div class="field"><div class="field-label">Imóvel / Propriedade</div><div class="field-value">${imovel}</div></div>
            <div class="field"><div class="field-label">Município / Estado</div><div class="field-value">${municipio} – MT</div></div>
            <div class="field"><div class="field-label">Nº Auto de Infração / Processo</div><div class="field-value">${processo}</div></div>
            <div class="field"><div class="field-label">Coordenadas (LAT/LONG)</div><div class="field-value">${coords}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">2. Caracterização da Área Degradada</div>
          <div class="field-row">
            <div class="field"><div class="field-label">Área total a recuperar</div><div class="field-value">${area} hectares (ha)</div></div>
            <div class="field"><div class="field-label">Bioma / Fitofisionomia</div><div class="field-value">${bioma}</div></div>
          </div>
          <div class="field"><div class="field-label">Causa e origem da degradação</div><div class="field-value">${causa}</div></div>
          <div class="obs-box">
            ⚠️ <strong>Diagnóstico complementar:</strong> Deverão ser anexados ao presente Plano: (a) mapa de localização em escala adequada; (b) registro fotográfico da área degradada; (c) sobreposição com CAR e áreas de APP/RL; (d) análise de solo (quando exigido pelo órgão ambiental).
          </div>
        </div>

        <div class="section">
          <div class="section-title">3. Objetivos do Plano</div>
          <ul class="doc-list">
            <li>Promover a recuperação da cobertura vegetal nativa na área degradada de <strong>${area} ha</strong>, localizada em ${imovel}, município de ${municipio}–MT;</li>
            <li>Restabelecer as funções ecológicas pertinentes à fitofisionomia de <strong>${bioma}</strong>;</li>
            <li>Atender às exigências previstas na Instrução Normativa SEMA-MT nº 09/2006 e na Resolução CONAMA nº 429/2011;</li>
            <li>Regularizar a situação ambiental do imóvel perante os órgãos competentes.</li>
          </ul>
        </div>

        <div class="section">
          <div class="section-title">4. Metodologia de Recuperação</div>
          <div class="field"><div class="field-label">Método selecionado</div><div class="field-value">${metodo}</div></div>
          <div class="sub-title">4.1 — Preparo da Área</div>
          <ul class="doc-list">
            <li>Controle de espécies invasoras (capim braquiária, capim gordura e outras) mediante roçada mecanizada ou herbicida conforme indicação técnica;</li>
            <li>Controle de formigas cortadeiras precedendo o plantio (aplicação de iscas granuladas);</li>
            <li>Alinhamento e coveamento conforme espaçamento previsto.</li>
          </ul>
          <div class="sub-title">4.2 — Espécies Nativas a Utilizar (Referência para ${bioma})</div>
          <table class="table-doc">
            <thead><tr><th>#</th><th>Nome Científico</th><th>Nome Popular</th><th>Categoria</th><th>Qtd. estimada/ha</th></tr></thead>
            <tbody>
              <tr><td>1</td><td>Anadenanthera peregrina</td><td>Angico</td><td>Pioneira rápida</td><td>80–100</td></tr>
              <tr><td>2</td><td>Calophyllum brasiliense</td><td>Guanandi</td><td>Não pioneira</td><td>60–80</td></tr>
              <tr><td>3</td><td>Hymenaea courbaril</td><td>Jatobá</td><td>Climácica</td><td>40–60</td></tr>
              <tr><td>4</td><td>Copaifera langsdorffii</td><td>Copaíba</td><td>Climácica</td><td>30–50</td></tr>
              <tr><td>5</td><td>Cedrela fissilis</td><td>Cedro</td><td>Não pioneira</td><td>40–60</td></tr>
              <tr><td>6</td><td>Dipteryx alata</td><td>Baru</td><td>Climácica</td><td>30–40</td></tr>
              <tr><td colspan="5" style="font-size:8pt;color:#64748b;font-style:italic;">* Lista a ser complementada/substituída pelo profissional habilitado conforme levantamento florístico in situ.</td></tr>
            </tbody>
          </table>
          <div class="sub-title">4.3 — Adubação e Irrigação</div>
          <ul class="doc-list">
            <li>Adubação de cova com adubo orgânico (esterco curtido ou composto) + NPK conforme análise de solo;</li>
            <li>Irrigação suplementar nos primeiros 60 dias (2× por semana em períodos secos) até estabelecimento das mudas.</li>
          </ul>
        </div>

        ${_docFooter('PRAD', '1/2')}
      </div></div>

      <div class="page"><div class="content">
        ${_docHeader(logo)}

        <div class="section">
          <div class="section-title">5. Cronograma de Execução</div>
          <table class="table-doc cronograma">
            <thead><tr><th>Atividade</th><th>Mês 1–3</th><th>Mês 4–6</th><th>Mês 7–12</th><th>Mês 13–${prazo}</th></tr></thead>
            <tbody>
              <tr><td>Diagnóstico e levantamento florístico</td><td>✓</td><td></td><td></td><td></td></tr>
              <tr><td>Controle de invasoras e preparo do terreno</td><td>✓</td><td></td><td></td><td></td></tr>
              <tr><td>Controle de formigas cortadeiras</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
              <tr><td>Aquisição de mudas / sementes</td><td>✓</td><td></td><td></td><td></td></tr>
              <tr><td>Plantio das mudas / hidrossemeadura</td><td></td><td>✓</td><td></td><td></td></tr>
              <tr><td>Irrigação suplementar (período seco)</td><td></td><td>✓</td><td>✓</td><td></td></tr>
              <tr><td>Replantio de falhas (taxa &lt; 10%)</td><td></td><td></td><td>✓</td><td></td></tr>
              <tr><td>Monitoramento semestral + relatório</td><td></td><td></td><td>✓</td><td>✓</td></tr>
              <tr><td>Manutenção geral (roçada, adubação)</td><td></td><td></td><td>✓</td><td>✓</td></tr>
              <tr><td>Relatório final de consolidação</td><td></td><td></td><td></td><td>✓</td></tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">6. Indicadores de Monitoramento e Sucesso</div>
          <table class="table-doc">
            <thead><tr><th>Indicador</th><th>Meta (até ${prazo} meses)</th><th>Critério de Avaliação</th></tr></thead>
            <tbody>
              <tr><td>Taxa de sobrevivência de mudas</td><td>≥ 80%</td><td>Contagem in loco semestral</td></tr>
              <tr><td>Cobertura do dossel</td><td>≥ 60%</td><td>Análise de imagem de satélite / fishhook</td></tr>
              <tr><td>Densidade de espécies nativas</td><td>≥ 80% das plantadas</td><td>Inventário florestal</td></tr>
              <tr><td>Ausência de erosão ativa</td><td>100%</td><td>Vistoria técnica semestral</td></tr>
              <tr><td>Controle de espécies invasoras</td><td>&lt; 20% de cobertura</td><td>Análise visual / fitopatológica</td></tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">7. Responsabilidade Técnica</div>
          <div class="art-box">
            ✅ <strong>Profissional Responsável:</strong> ${resp}<br>
            <strong>Anotação de Responsabilidade Técnica (ART):</strong> ${art}<br>
            <span style="font-size:8.5pt;color:#475569;">A ART, emitida junto ao Conselho Regional competente, integra obrigatoriamente o presente Plano e é documento essencial para protocolo junto ao órgão ambiental.</span>
          </div>
          <div class="field"><div class="field-label">Elaborado por (Gestão de Projeto)</div>
            <div class="field-value">Agrageo Consultoria — CNPJ ${EMPRESA.cnpj} | ${EMPRESA.celular} | ${EMPRESA.email}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">8. Declaração do Requerente</div>
          <p style="font-size:9.5pt;line-height:1.7;">
            Eu, <strong>${requerente}</strong>, CPF/CNPJ <strong>${cpfcnpj}</strong>, declaro estar ciente das obrigações previstas no presente Plano de Recuperação de Área Degradada e me comprometo a executar todas as atividades no prazo de <strong>${prazo} meses</strong>, bem como a apresentar os relatórios de monitoramento periódicos ao órgão ambiental competente, conforme exigido por lei.
          </p>
        </div>

        <div class="sign-area" style="margin-top:40px;">
          <div>
            <div class="sign-line">${municipio} – MT, ${hoje}<br><br>${requerente}<br>${cpfcnpj}<br><em>Requerente / Autuado</em></div>
          </div>
          <div>
            <div class="sign-line">${municipio} – MT, ${hoje}<br><br>${resp}<br>${art}<br><em>Responsável Técnico</em></div>
          </div>
        </div>

        ${_docFooter('PRAD', '2/2')}
      </div></div>
    </body></html>`;

    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 800);
  }

  // ── PGRS ──────────────────────────────────────────────────────────
  function abrirModalPGRS() {
    const existing = document.getElementById('modal-pgrs-gen');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'modal-pgrs-gen';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:9998;display:flex;align-items:center;justify-content:center;padding:16px;';
    modal.innerHTML = `
      <div style="background:#0f172a;border:1px solid rgba(148,163,184,0.15);border-radius:14px;width:100%;max-width:820px;max-height:93vh;overflow-y:auto;padding:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div>
            <div style="color:#f59e0b;font-size:1rem;font-weight:800;">♻️ Gerador de PGRS — Plano de Gerenciamento de Resíduos Sólidos</div>
            <div style="color:#64748b;font-size:0.73rem;margin-top:2px;">Lei 12.305/2010 · CONAMA 307/2002 · ABNT NBR 10.004</div>
          </div>
          <button onclick="document.getElementById('modal-pgrs-gen').remove()" style="background:#334155;color:#94a3b8;border:none;border-radius:7px;padding:6px 12px;cursor:pointer;">✕</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
          <div><label style="color:#64748b;font-size:0.72rem;font-weight:700;display:block;margin-bottom:3px;">RAZÃO SOCIAL / NOME</label><input id="pgrs-razao" style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;padding:7px 10px;font-size:0.82rem;outline:none;" placeholder="Nome ou Razão Social"></div>
          <div><label style="color:#64748b;font-size:0.72rem;font-weight:700;display:block;margin-bottom:3px;">CNPJ</label><input id="pgrs-cnpj" style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;padding:7px 10px;font-size:0.82rem;outline:none;" placeholder="00.000.000/0001-00"></div>
          <div><label style="color:#64748b;font-size:0.72rem;font-weight:700;display:block;margin-bottom:3px;">ENDEREÇO DO ESTABELECIMENTO</label><input id="pgrs-endereco" style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;padding:7px 10px;font-size:0.82rem;outline:none;" placeholder="Rua, Nº, Bairro, CEP"></div>
          <div><label style="color:#64748b;font-size:0.72rem;font-weight:700;display:block;margin-bottom:3px;">MUNICÍPIO - MT</label><input id="pgrs-municipio" style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;padding:7px 10px;font-size:0.82rem;outline:none;" placeholder="Ex: Rondonópolis"></div>
          <div><label style="color:#64748b;font-size:0.72rem;font-weight:700;display:block;margin-bottom:3px;">ATIVIDADE / RAMO</label><input id="pgrs-atividade" style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;padding:7px 10px;font-size:0.82rem;outline:none;" placeholder="Ex: Comércio atacadista de agroquímicos"></div>
          <div><label style="color:#64748b;font-size:0.72rem;font-weight:700;display:block;margin-bottom:3px;">Nº AUTO / PROCESSO</label><input id="pgrs-processo" style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;padding:7px 10px;font-size:0.82rem;outline:none;" placeholder="Ex: AI 179/2025"></div>
          <div><label style="color:#64748b;font-size:0.72rem;font-weight:700;display:block;margin-bottom:3px;">GERAÇÃO ESTIMADA DE RESÍDUOS (kg/mês)</label><input id="pgrs-geracao" style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;padding:7px 10px;font-size:0.82rem;outline:none;" placeholder="Ex: 500"></div>
          <div><label style="color:#64748b;font-size:0.72rem;font-weight:700;display:block;margin-bottom:3px;">EMPRESA COLETORA LICENCIADA</label><input id="pgrs-coletora" style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;padding:7px 10px;font-size:0.82rem;outline:none;" placeholder="Nome da empresa + nº licença ambiental"></div>
          <div style="grid-column:span 2;"><label style="color:#64748b;font-size:0.72rem;font-weight:700;display:block;margin-bottom:3px;">PROFISSIONAL RESPONSÁVEL (CREA/CFBio contratado)</label><input id="pgrs-resp" style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;padding:7px 10px;font-size:0.82rem;outline:none;" placeholder="Ex: Maria Souza — Eng. Sanitária — CREA-MT 67890"></div>
          <div><label style="color:#64748b;font-size:0.72rem;font-weight:700;display:block;margin-bottom:3px;">Nº ART</label><input id="pgrs-art" style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;padding:7px 10px;font-size:0.82rem;outline:none;" placeholder="ART nº XXXXXXXXXX"></div>
          <div><label style="color:#64748b;font-size:0.72rem;font-weight:700;display:block;margin-bottom:3px;">RESPONSÁVEL PELO PLANO (na empresa)</label><input id="pgrs-responsavel-empresa" style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;padding:7px 10px;font-size:0.82rem;outline:none;" placeholder="Nome + cargo (ex: Gerente Ambiental)"></div>
        </div>
        <div style="display:flex;gap:8px;margin-top:4px;">
          <button onclick="Agrageo._gerarDocPGRS()" style="background:#f59e0b;color:#0f172a;border:none;border-radius:7px;padding:9px 22px;font-weight:800;font-size:0.88rem;cursor:pointer;flex:1;">🖨️ Gerar PGRS — Abrir para Imprimir / PDF</button>
          <button onclick="document.getElementById('modal-pgrs-gen').remove()" style="background:#334155;color:#94a3b8;border:none;border-radius:7px;padding:9px 14px;font-size:0.82rem;cursor:pointer;">Cancelar</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }

  function _gerarDocPGRS() {
    const v = id => (document.getElementById(id)?.value || '').trim() || '[NÃO INFORMADO]';
    const razao=v('pgrs-razao'), cnpj=v('pgrs-cnpj'), endereco=v('pgrs-endereco'),
          municipio=v('pgrs-municipio'), atividade=v('pgrs-atividade'), processo=v('pgrs-processo'),
          geracao=v('pgrs-geracao'), coletora=v('pgrs-coletora'), resp=v('pgrs-resp'),
          art=v('pgrs-art'), respEmpresa=v('pgrs-responsavel-empresa');
    const logo = EMPRESA.logo;
    const hoje = new Date().toLocaleDateString('pt-BR');
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
      <title>PGRS — ${razao} — ${municipio}</title>
      <style>${_docCss()}</style></head><body>
      <div class="page"><div class="content">
        ${_docHeader(logo)}
        <div class="doc-title" style="background:#92400e;">
          <h1>PLANO DE GERENCIAMENTO DE RESÍDUOS SÓLIDOS — PGRS</h1>
          <p>
            <span class="badge-norma">Lei 12.305/2010 — PNRS</span>
            <span class="badge-norma">CONAMA 307/2002</span>
            <span class="badge-norma">ABNT NBR 10.004</span>
            <span class="badge-norma">Decreto 7.404/2010</span>
          </p>
        </div>

        <div class="section">
          <div class="section-title">1. Identificação do Empreendimento</div>
          <div class="field-row">
            <div class="field"><div class="field-label">Razão Social</div><div class="field-value">${razao}</div></div>
            <div class="field"><div class="field-label">CNPJ</div><div class="field-value">${cnpj}</div></div>
            <div class="field"><div class="field-label">Endereço do Estabelecimento</div><div class="field-value">${endereco}</div></div>
            <div class="field"><div class="field-label">Município / Estado</div><div class="field-value">${municipio} – MT</div></div>
            <div class="field"><div class="field-label">Atividade / Ramo</div><div class="field-value">${atividade}</div></div>
            <div class="field"><div class="field-label">Nº Auto / Processo</div><div class="field-value">${processo}</div></div>
            <div class="field"><div class="field-label">Responsável na Empresa</div><div class="field-value">${respEmpresa}</div></div>
            <div class="field"><div class="field-label">Geração estimada de resíduos</div><div class="field-value">${geracao} kg / mês</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">2. Diagnóstico e Classificação dos Resíduos Gerados</div>
          <table class="table-doc">
            <thead><tr><th>#</th><th>Tipo de Resíduo</th><th>Classificação ABNT 10.004</th><th>Origem</th><th>Qtd. Estimada</th></tr></thead>
            <tbody>
              <tr><td>1</td><td>Resíduos comuns (papel, papelão, plástico-emb.)</td><td>Classe II-B (Inerte)</td><td>Escritório / expedição</td><td>__ kg/mês</td></tr>
              <tr><td>2</td><td>Resíduos recicláveis (alumínio, vidro, plástico)</td><td>Classe II-B (Inerte)</td><td>Processos internos</td><td>__ kg/mês</td></tr>
              <tr><td>3</td><td>Resíduos orgânicos</td><td>Classe II-A (Não-perigoso)</td><td>Refeitório / almoxarifado</td><td>__ kg/mês</td></tr>
              <tr><td>4</td><td>Embalagens contaminadas (produto químico)</td><td>Classe I (Perigoso)</td><td>Operação principal</td><td>__ kg/mês</td></tr>
              <tr><td>5</td><td>Óleos lubrificantes usados</td><td>Classe I (Perigoso)</td><td>Manutenção</td><td>__ L/mês</td></tr>
              <tr><td>6</td><td>Resíduos de construção e demolição (RCC)</td><td>Classe A/B (CONAMA 307)</td><td>Manutenção predial</td><td>__ kg/mês</td></tr>
              <tr><td colspan="5" style="font-size:8pt;color:#64748b;font-style:italic;">* Tabela a ser complementada pelo responsável técnico com base em inventário in loco.</td></tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">3. Segregação na Fonte</div>
          <ul class="doc-list">
            <li><strong>Resíduos Classe I (Perigosos):</strong> segregados em recipientes específicos, devidamente rotulados conforme ABNT NBR 7500, em área coberta com piso impermeabilizado, longe de redes pluviais;</li>
            <li><strong>Resíduos Classe II-A (Não-perigosos e não-inertes):</strong> recipientes identificados com cor amarela ou etiqueta padronizada;</li>
            <li><strong>Resíduos Classe II-B (Inertes / Recicláveis):</strong> recipientes identificados conforme resolução CONAMA 275/2001 (cores: azul-papel, vermelho-plástico, amarelo-metal, verde-vidro);</li>
            <li><strong>Resíduos orgânicos:</strong> lixeiras específicas com tampa, coletados diariamente no refeitório.</li>
          </ul>
          <div class="obs-box">⚠️ <strong>Proibições:</strong> É expressamente vedado: misturar resíduos de diferentes classes; descartar embalagens de agroquímicos em lixo comum; queimar ou enterrar quaisquer resíduos nas dependências do estabelecimento.</div>
        </div>

        ${_docFooter('PGRS', '1/2')}
      </div></div>

      <div class="page"><div class="content">
        ${_docHeader(logo)}

        <div class="section">
          <div class="section-title">4. Acondicionamento, Coleta, Transporte e Destinação Final</div>
          <table class="table-doc">
            <thead><tr><th>Resíduo</th><th>Acondicionamento</th><th>Frequência de Coleta</th><th>Transportador</th><th>Destinação Final</th></tr></thead>
            <tbody>
              <tr><td>Resíduos comuns</td><td>Sacos plásticos / containers</td><td>Semanal</td><td>Coleta municipal</td><td>Aterro sanitário municipal</td></tr>
              <tr><td>Recicláveis</td><td>Containers identificados</td><td>Quinzenal</td><td>Cooperativa de reciclagem</td><td>Reciclagem industrial</td></tr>
              <tr><td>Orgânicos</td><td>Container c/ tampa - refrigerado ou não</td><td>Diária / 3x semana</td><td>Coleta municipal</td><td>Compostagem ou aterro</td></tr>
              <tr><td>Emb. contaminadas (Classe I)</td><td>Tambores fechados / bigbag impermeável</td><td>Mensal / quando cheios</td><td>${coletora}</td><td>Coprocessamento / incineração licenciada</td></tr>
              <tr><td>Óleo lubrificante usado</td><td>Bombonas plásticas 200 L</td><td>Quando cheias</td><td>Rerefinadora licenciada</td><td>Rerefinamento (CONAMA 362/05)</td></tr>
              <tr><td>RCC (entulho)</td><td>Caçamba estacionária</td><td>Quando cheio</td><td>Empresa licenciada</td><td>Aterro Classe A (CONAMA 307)</td></tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">5. Cronograma de Implantação</div>
          <table class="table-doc">
            <thead><tr><th>Ação</th><th>M1</th><th>M2</th><th>M3</th><th>M6</th><th>M12</th></tr></thead>
            <tbody>
              <tr><td>Treinamento de funcionários sobre segregação</td><td>✓</td><td></td><td></td><td>Repr.</td><td>Repr.</td></tr>
              <tr><td>Instalação de recipientes / containers identificados</td><td>✓</td><td></td><td></td><td></td><td></td></tr>
              <tr><td>Contratação de empresa coletora licenciada</td><td>✓</td><td></td><td></td><td></td><td></td></tr>
              <tr><td>Início da segregação por classe</td><td></td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
              <tr><td>Registro e controle de manifesto de resíduos</td><td></td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
              <tr><td>Auditoria interna do PGRS</td><td></td><td></td><td></td><td>✓</td><td>✓</td></tr>
              <tr><td>Revisão e atualização do plano</td><td></td><td></td><td></td><td></td><td>✓</td></tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">6. Responsabilidade Técnica</div>
          <div class="art-box">
            ✅ <strong>Profissional Responsável:</strong> ${resp}<br>
            <strong>Anotação de Responsabilidade Técnica (ART):</strong> ${art}<br>
            <span style="font-size:8.5pt;color:#475569;">A ART é documento obrigatório e integra este PGRS para protocolo junto ao órgão ambiental.</span>
          </div>
          <div class="field"><div class="field-label">Gestão e Coordenação do Projeto</div>
            <div class="field-value">Agrageo Consultoria — CNPJ ${EMPRESA.cnpj} | ${EMPRESA.celular} | ${EMPRESA.email}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">7. Declaração do Responsável</div>
          <p style="font-size:9.5pt;line-height:1.7;">
            Eu, <strong>${respEmpresa}</strong>, representante de <strong>${razao}</strong>, CNPJ <strong>${cnpj}</strong>, declaro estar ciente das obrigações estabelecidas no presente Plano de Gerenciamento de Resíduos Sólidos e comprometo-me a implementar todas as medidas previstas, manter os registros atualizados e apresentar ao órgão ambiental as informações solicitadas, conforme disposto na Lei Federal nº 12.305/2010 e legislação complementar.
          </p>
        </div>

        <div class="sign-area" style="margin-top:36px;">
          <div><div class="sign-line">${municipio} – MT, ${hoje}<br><br>${respEmpresa}<br>${cnpj}<br><em>Responsável Legal da Empresa</em></div></div>
          <div><div class="sign-line">${municipio} – MT, ${hoje}<br><br>${resp}<br>${art}<br><em>Responsável Técnico</em></div></div>
        </div>

        ${_docFooter('PGRS', '2/2')}
      </div></div>
    </body></html>`;

    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 800);
  }

  // ====== RADAR DE LEADS ========
  function buildRadarTabela() {
    const container = document.getElementById('ag-radar-table-container');
    if(!container) return;

    if(!window.HidroMap || !window.HidroMap._layers) {
      container.innerHTML = '<div style="padding:20px;text-align:center;color:#ef4444;">Mapa não inicializado.</div>';
      return;
    }

    let leadsEncontrados = [];
    for (let key in window.HidroMap._layers) {
      const layer = window.HidroMap._layers[key];
      if (layer && layer.feature && layer.feature.properties) {
        let p = layer.feature.properties;
        // Filtra apenas features que tenham apelo de VENDA (ticket, escopo, urgencia)
        if (p['🚨 Urgência'] || p['🎯 Escopo'] || p['Serviço Sugerido'] || p['fase_info']) {
          leadsEncontrados.push(p);
        }
      }
    }

    if (leadsEncontrados.length === 0) {
      container.innerHTML = '<div style="padding:20px;text-align:center;color:#94a3b8;">Nenhum lead quente encontrado no mapa.<br>Ative as camadas da aba <b>Leads por Categoria</b> ou <b>Smart Crossings</b> no mapa para escanear.</div>';
      return;
    }

    let html = `
      <table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:0.8rem;text-align:left;">
        <thead>
          <tr style="border-bottom:1px solid #334155;color:#94a3b8;">
            <th style="padding:10px;">Relevância</th>
            <th style="padding:10px;">Alvo</th>
            <th style="padding:10px;">Ticket Estimado</th>
            <th style="padding:10px;text-align:right;">Ação de Prospecção</th>
          </tr>
        </thead>
        <tbody>
    `;

    leadsEncontrados.forEach((p) => {
      let urgencia = p['🚨 Urgência'] || p['fase_info'] || 'Oportunidade';
      let svc = p['🎯 Escopo'] || p['Serviço Sugerido'] || 'Consultoria Técnica';
      let ticket = p['💰 Ticket Est.'] || p['Ticket Estimado'] || 'A orçar';
      let name = p['propriedade'] || p['nome_area'] || p['municipio'] || p['Nome'] || 'Propriedade Identificada';

      let color = '#3b82f6';
      if(/urgente|crítico|vencendo|30 d|🔴/i.test(urgencia)) color = '#ef4444';
      else if(/alta|60 d|🟠/i.test(urgencia)) color = '#f97316';
      else if(/90 d|🟡/i.test(urgencia)) color = '#eab308';
      
      html += `
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);transition:background 0.2s;">
          <td style="padding:12px 10px;color:${color};font-weight:600;">⚠️ ${urgencia.substring(0, 30)}</td>
          <td style="padding:12px 10px;color:#e2e8f0;font-weight:500;">📍 ${name.substring(0, 30)}...</td>
          <td style="padding:12px 10px;color:#94a3b8;">${svc}<br><span style="color:#22c55e;font-size:0.75rem">${ticket}</span></td>
          <td style="padding:12px 10px;text-align:right;display:flex;gap:6px;justify-content:flex-end;">
            <button class="ag-btn ag-btn-primary ag-btn-sm" onclick="Agrageo._runRadarDiagnostico('${encodeURIComponent(JSON.stringify(p))}')" style="background:#dc2626;padding:4px 8px;font-size:0.7rem;margin-bottom:0">📄 PDF</button>
            <a class="ag-btn ag-btn-primary ag-btn-sm" href="https://wa.me/?text=Ol%C3%A1%2C%20fizemos%20um%20diagn%C3%B3stico%20satelital%20da%20%C3%A1rea%20${encodeURIComponent(name)}%20e%20identificamos%20um%20risco.%20Segue%20o%20laudo%20preliminar." target="_blank" style="background:#25d366;padding:4px 8px;font-size:0.7rem;text-decoration:none">💬 Wpp Frio</a>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
  }

  function _runRadarDiagnostico(propsStr) {
    try {
      let p = JSON.parse(decodeURIComponent(propsStr));
      gerarDiagnostico(p);
    } catch(e) {
      console.error(e);
      alert('Erro ao decodificar propriedades do Lead.');
    }
  }

  function gerarDiagnostico(p) {
    if (typeof html2pdf === 'undefined') {
      alert("Carregando o gerador de PDF, aguarde um segundo e tente novamente.");
      return;
    }

    let dadosEl = document.getElementById('print-diag-dados');
    let riscosEl = document.getElementById('print-diag-riscos');
    let solucaoEl = document.getElementById('print-diag-solucao');
    let dataEl = document.getElementById('print-diag-data');

    if(!dadosEl || !riscosEl || !solucaoEl || !dataEl) return;

    const dataAtual = new Date().toLocaleDateString('pt-BR');
    dataEl.innerText = dataAtual;

    let dadosHtml = `<b>Data da Análise Espacial:</b> ${dataAtual}<br>`;
    for (let key in p) {
      if (key.includes('Escopo') || key.includes('Urgênc') || key.includes('Ticket') || key.includes('Abordagem')) continue;
      if (key === 'geometry' || key === 'id' || key === 'fase_info') continue;
      if (!p[key] || p[key] === 'N/A' || p[key] === 'null' || typeof p[key] === 'object') continue;
      
      let val = p[key].toString().substring(0, 120);
      dadosHtml += `<b style="color:#334155;">${key.toUpperCase()}:</b> ${val}<br>`;
    }
    dadosEl.innerHTML = dadosHtml;

    let urg = p['🚨 Urgência'] || p['fase_info'] || 'Desconformidade Geoespacial';
    riscosEl.innerHTML = `⚠️ Foi identificado no monitoramento de uso do solo e restrição ambiental a seguinte contingência:<br><br><b style="font-size:16px;">🔥 ${urg}</b>`;

    let sol = p['🎯 Escopo'] || p['Serviço Sugerido'] || 'Serviço Técnico Especializado (Engenharia/SIG)';
    let tick = p['💰 Ticket Est.'] || p['Ticket Estimado'] || '';
    solucaoEl.innerHTML = `<ul style="margin:0;padding-left:18px;">
      <li>${sol}</li>
      <li style="margin-top:6px;font-size:12px;color:#475569;">Valor de Mercado Estimado p/ Regularização: <b>${tick}</b></li>
    </ul>`;

    const container = document.getElementById('print-template-container');
    container.style.display = 'block';

    const element = document.getElementById('ag-diagnostico-print-template');
    
    html2pdf().set({
      margin: 0,
      filename: 'Diagnostico_Preliminar_Agrageo.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(element).save().then(() => {
      container.style.display = 'none';
    });
  }

  return {
    // Navegação
    show,
    hide,
    switchTab,

    // Catálogo de Serviços
    saveCatalogo,
    resetCatalogo,
    updateCatItem,
    renderCatalogo,
    populateDatalist,

    // Leads Salvos (HidroLeads CRM)
    renderLeadsSalvos,
    refreshLeadsBadge,
    preencherClienteDoLead,
    exportarLeadsCSV,
    importarLeadsCSV,
    gerarRelatorioPDF,
    clearLeads,
    atualizarCalculadora,
    calcularScoreLead,
    gerarEmailProspeccao,

    // Parceiros / Indicadores
    renderParceiros,
    salvarParceiro,
    addInteracao,

    // Documentos — Proposta e Contrato
    openProposta,
    openContrato,
    propostaAceita,
    downloadPDF,
    saveDoc,
    closeDoc,
    clearDoc,

    // Documentos internos (helpers usados pelo HTML)
    logoHtml,
    docHeader,
    clientSection,
    servicesTable,
    signaturesHtml,

    // Honorários / Calculadora
    calcularHonorarioSIG,
    puxarParaProposta,
    addRow,
    calcTotal,
    formatVal,
    fillRowFromCat,

    // Novos Documentos
    gerarRecibo,
    gerarOS,
    gerarContratoRemote,

    // Serviços Remote
    renderRemote,
    filtrarRemote,
    abrirBriefingRemote,
    copiarBriefing,
    gerarPDFBriefing,
    gerarPropostaRemote,

    // Radar / Diagnóstico
    buildRadarTabela,
    gerarDiagnostico,
    _runRadarDiagnostico,

    // Métricas de Receita
    renderMetricasReceita,
    calcMetricasReceita,
    baixarModeloLaudo,

    // Geradores PRAD / PGRS
    abrirModalPRAD,
    _gerarDocPRAD,
    abrirModalPGRS,
    _gerarDocPGRS,
  };

  function addInteracao(id) {
    const t = prompt('Registrar nova interação (ex: Ligou, enviou email, reunião):');
    if (!t) return;
    const leads = window.HidroLeads.getAll();
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    if (!lead.timeline) lead.timeline = [];
    lead.timeline.unshift({ data: new Date().toLocaleDateString('pt-BR'), texto: t });
    window.HidroLeads.save(lead);
    renderLeadsSalvos();
  }

})();

// ── GLOBAL KEYBOARD SHORTCUTS (PWA & Desktop) ──
document.addEventListener('keydown', (e) => {
  // Ignora se estiver digitando num input/textarea
  if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;

  // Alt + C: Abrir/Fechar Painel CRM
  if (e.altKey && e.key.toLowerCase() === 'c') {
    e.preventDefault();
    const panel = document.getElementById('agrageo-view');
    if(panel && panel.classList.contains('ag-active')) Agrageo.hide();
    else Agrageo.show();
  }
  // Alt + L: Novo Lead
  if (e.altKey && e.key.toLowerCase() === 'l') {
    e.preventDefault();
    if(window._hidroOpenLeadModal) window._hidroOpenLeadModal();
  }
  // Alt + P: Abrir Dashboard de Diário Oficial
  if (e.altKey && e.key.toLowerCase() === 'p') {
    e.preventDefault();
    Agrageo.show();
    Agrageo.switchTab('dioe');
    if(window.DiarioOficial) DiarioOficial.init();
  }
});
