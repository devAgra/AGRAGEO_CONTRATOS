/* ============================================================
   HidroScanner — Map Module
   Leaflet.js map initialization, layers, markers, and heatmap
   ============================================================ */

const HidroMap = (() => {
  let map = null;
  let markersLayer = null;
  let heatLayer = null;
  let aquiferLayer = null;
  let currentPocos = [];

  // ── Color by situação ──────────────────────────────────────
  const SITUACAO_COLORS = {
    'Regular': '#22c55e',
    'Irregular': '#ef4444',
    'Vencido': '#facc15'
  };

  const PRIORIDADE_COLORS = {
    'Alta': '#ef4444',
    'Média': '#f59e0b',
    'Baixa': '#22c55e'
  };

  // ══════════════════════════════════════════════════════════════════
  // 💾 HIDRO LEADS v2 — CRM completo com localStorage
  // ══════════════════════════════════════════════════════════════════
  const LEADS_KEY = 'hidroscanner_leads_v2';
  const PARTNERS_KEY = 'hidroscanner_partners_v1';

  window.HidroLeads = {
    getAll() {
      try {
        const v2 = JSON.parse(localStorage.getItem(LEADS_KEY) || '[]');
        // Migração automática do v1
        const v1 = JSON.parse(localStorage.getItem('hidroscanner_leads_v1') || '[]');
        if (v1.length && !v2.length) {
          localStorage.setItem(LEADS_KEY, JSON.stringify(v1));
          return v1;
        }
        return v2;
      } catch { return []; }
    },
    save(lead) {
      const all = this.getAll();
      lead.id = lead.id || Date.now();
      lead.dataCriacao = lead.dataCriacao || new Date().toLocaleDateString('pt-BR');
      lead.status = lead.status || 'Novo';
      const idx = all.findIndex(l => l.id === lead.id);
      if (idx >= 0) { all[idx] = lead; } else { all.unshift(lead); }
      localStorage.setItem(LEADS_KEY, JSON.stringify(all));
      return lead;
    },
    remove(id) {
      localStorage.setItem(LEADS_KEY, JSON.stringify(this.getAll().filter(l => l.id !== id)));
    },
    updateField(id, field, value) {
      const all = this.getAll();
      const lead = all.find(l => l.id === id);
      if (lead) { lead[field] = value; localStorage.setItem(LEADS_KEY, JSON.stringify(all)); }
    },
    count() { return this.getAll().length; },
    countByStatus(s) { return this.getAll().filter(l => l.status === s).length; },
    getUrgentes() {
      const hoje = new Date();
      return this.getAll().filter(l => {
        if (!l.prazo) return false;
        const dias = (new Date(l.prazo) - hoje) / 86400000;
        return dias >= 0 && dias <= 7;
      });
    }
  };

  window.HidroPartners = {
    getAll() { try { return JSON.parse(localStorage.getItem(PARTNERS_KEY) || '[]'); } catch { return []; } },
    save(p) {
      const all = this.getAll();
      p.id = p.id || Date.now();
      p.dataCadastro = p.dataCadastro || new Date().toLocaleDateString('pt-BR');
      const idx = all.findIndex(x => x.id === p.id);
      if (idx >= 0) { all[idx] = p; } else { all.unshift(p); }
      localStorage.setItem(PARTNERS_KEY, JSON.stringify(all));
      return p;
    },
    remove(id) { localStorage.setItem(PARTNERS_KEY, JSON.stringify(this.getAll().filter(p => p.id !== id))); },
    count() { return this.getAll().length; },
    leadsCount(pid) { return HidroLeads.getAll().filter(l => String(l.parceiro_id) === String(pid)).length; }
  };

  // ── Modal CRM v2 — injeta uma única vez no DOM ──────────────
  function _injectLeadModalOnce() {
    if (document.getElementById('hidroLeadModal')) return;

    const css = `
      #hidroLeadModal{display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.78);align-items:flex-start;justify-content:center;padding:20px 10px;overflow-y:auto}
      #hidroLeadModal.open{display:flex}
      #hidroLeadModalBox{background:#1e293b;border:1px solid rgba(56,189,248,0.3);border-radius:14px;width:min(580px,96vw);box-shadow:0 20px 60px rgba(0,0,0,0.7);margin:auto}
      #hlm-header{padding:16px 20px 12px;border-bottom:1px solid rgba(255,255,255,0.07);display:flex;justify-content:space-between;align-items:center}
      #hlm-header h3{margin:0;color:#e2e8f0;font-size:0.95rem;display:flex;align-items:center;gap:8px}
      #hlm-body{padding:6px 16px 12px;max-height:72vh;overflow-y:auto}
      .hlm-sec{border:1px solid rgba(255,255,255,0.06);border-radius:9px;margin:8px 0;overflow:hidden}
      .hlm-sec-h{background:rgba(15,23,42,0.8);padding:9px 13px;cursor:pointer;display:flex;justify-content:space-between;font-size:0.76rem;font-weight:700;color:#64748b;letter-spacing:0.05em;user-select:none}
      .hlm-sec-h:hover{color:#e2e8f0}
      .hlm-sec-b{padding:10px 13px 13px;display:none}
      .hlm-sec-b.open{display:block}
      .hlm-g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .hlm-g1{display:grid;grid-template-columns:1fr}
      #hidroLeadModal label{display:block;font-size:0.69rem;color:#64748b;margin-top:8px;margin-bottom:2px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em}
      #hidroLeadModal input,#hidroLeadModal textarea,#hidroLeadModal select{width:100%;padding:7px 9px;background:#0f172a;border:1px solid rgba(148,163,184,0.18);border-radius:6px;color:#e2e8f0;font-size:0.79rem;box-sizing:border-box;outline:none;transition:border-color .2s}
      #hidroLeadModal input:focus,#hidroLeadModal select:focus,#hidroLeadModal textarea:focus{border-color:#38bdf8}
      #hidroLeadModal textarea{height:62px;resize:vertical}
      .hlm-urg{display:flex;gap:5px;flex-wrap:wrap;margin-top:5px}
      .hlm-ub{padding:4px 11px;border-radius:20px;border:1px solid;font-size:0.71rem;font-weight:700;cursor:pointer;background:transparent}
      .hlm-ub.sel{color:#0f172a!important;border-color:transparent!important}
      .hlm-foot{padding:12px 20px;border-top:1px solid rgba(255,255,255,0.07);display:flex;gap:8px;justify-content:flex-end}
      .hlm-bsave{background:#22c55e;color:#fff;border:none;border-radius:7px;padding:9px 22px;font-weight:700;font-size:0.83rem;cursor:pointer}
      .hlm-bcancel{background:transparent;color:#64748b;border:1px solid rgba(148,163,184,0.25);border-radius:7px;padding:9px 14px;font-size:0.83rem;cursor:pointer}
      .hlm-badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:0.66rem;font-weight:700;background:#0f172a;color:#38bdf8;border:1px solid rgba(56,189,248,0.3)}
    `;
    const st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);

    const urgColors = {'Crítico':'#ef4444','Alto':'#f59e0b','Médio':'#facc15','Baixo':'#22c55e'};
    const urgBtns = Object.entries(urgColors).map(([k,c]) =>
      `<button class="hlm-ub" data-urg="${k}" style="color:${c};border-color:${c}" onclick="window._hlmUrg(this,'${k}')">${k==='Crítico'?'🔴':k==='Alto'?'🟠':k==='Médio'?'🟡':'🟢'} ${k}</button>`
    ).join('');

    const modal = document.createElement('div');
    modal.id = 'hidroLeadModal';
    modal.innerHTML = `
      <div id="hidroLeadModalBox">
        <div id="hlm-header">
          <h3>💾 Salvar Lead &nbsp;<span id="hlm-tipo-badge" class="hlm-badge">—</span></h3>
          <button onclick="document.getElementById('hidroLeadModal').classList.remove('open')" style="background:none;border:none;color:#64748b;font-size:1.1rem;cursor:pointer;">✕</button>
        </div>
        <div id="hlm-body">

          <div class="hlm-sec">
            <div class="hlm-sec-h" onclick="this.nextElementSibling.classList.toggle('open')">👤 IDENTIFICAÇÃO <span>▾</span></div>
            <div class="hlm-sec-b open">
              <div class="hlm-g1"><label>Nome / Razão Social</label><input id="hlm-nome" placeholder="João Silva / Fazenda Boa Vista Ltda"></div>
              <div class="hlm-g2">
                <div><label>CPF / CNPJ</label><div style="display:flex;gap:4px;"><input id="hlm-cpfcnpj" placeholder="000.000.000-00" style="flex:1;min-width:0;"><button id="btn-buscar-cnpj" onclick="HidroCNPJ.buscarCNPJ()" style="background:#3b82f6;color:#fff;border:none;border-radius:6px;padding:0 10px;font-size:0.75rem;cursor:pointer;" title="Consultar CNPJ">🔍 Buscar</button></div></div>
                <div><label>Telefone</label><input id="hlm-telefone" type="tel" placeholder="(65) 9 9999-9999"></div>
              </div>
              <div class="hlm-g2">
                <div><label>E-mail</label><input id="hlm-email" type="email" placeholder="email@proprietario.com"></div>
                <div><label>Município</label><input id="hlm-municipio" placeholder="Sorriso - MT"></div>
              </div>
            </div>
          </div>

          <div class="hlm-sec">
            <div class="hlm-sec-h" onclick="this.nextElementSibling.classList.toggle('open')">🏡 DADOS DA PROPRIEDADE <span>▾</span></div>
            <div class="hlm-sec-b">
              <div class="hlm-g2">
                <div><label>Número CAR</label><input id="hlm-car" placeholder="MT-5100250-..."></div>
                <div><label>Embargo / Auto Nº</label><input id="hlm-embargo" placeholder="SEMA-12345/2021"></div>
              </div>
              <div class="hlm-g2">
                <div><label>SIGEF / INCRA</label><input id="hlm-sigef" placeholder="MT-123456-7"></div>
                <div><label>Matrícula Cartório</label><input id="hlm-matricula" placeholder="Matrícula 12.345"></div>
              </div>
              <div class="hlm-g1"><label>Nome da Propriedade / Fazenda</label><input id="hlm-fazenda" placeholder="Fazenda Boa Vista"></div>
              <div class="hlm-g2">
                <div><label>Latitude</label><input id="hlm-lat" placeholder="-12.345678"></div>
                <div><label>Longitude</label><input id="hlm-lng" placeholder="-55.123456"></div>
              </div>
            </div>
          </div>

          <div class="hlm-sec">
            <div class="hlm-sec-h" onclick="this.nextElementSibling.classList.toggle('open')">💼 OPORTUNIDADE DE NEGÓCIO <span>▾</span></div>
            <div class="hlm-sec-b">
              <div class="hlm-g1"><label>Serviço / Escopo</label><input id="hlm-servico" placeholder="Regularização de Outorga + Laudo Técnico + PRAD"></div>
              <div class="hlm-g2">
                <div><label>Ticket Estimado (R$)</label><input id="hlm-ticket" type="number" placeholder="4500" min="0"></div>
                <div><label>Prazo / Deadline</label><input id="hlm-prazo" type="date"></div>
              </div>
              <div>
                <label>Urgência</label>
                <div class="hlm-urg">${urgBtns}</div>
                <input type="hidden" id="hlm-urgencia">
              </div>
              <div class="hlm-g2">
                <div><label>Origem do Lead</label>
                  <select id="hlm-origem"><option value="">— Selecione —</option>
                    <option>Mapa SEMA (Embargo)</option><option>Mapa SIAGAS (Poço)</option>
                    <option>Mapa DETER (Desmate)</option><option>Mapa SIGEF/CAR</option>
                    <option>Indicação de Parceiro</option><option>WhatsApp Grupo Rural</option>
                    <option>LinkedIn</option><option>Google</option><option>Indicação Direta</option><option>Outro</option>
                  </select>
                </div>
                <div><label>Parceiro Indicador</label><select id="hlm-parceiro"><option value="">— Nenhum —</option></select></div>
              </div>
              <div class="hlm-g1"><label>Status</label>
                <select id="hlm-status">
                  <option value="Novo">🔵 Novo</option><option value="Contatado">📞 Contatado</option>
                  <option value="Em negociação">🤝 Em negociação</option><option value="Proposta enviada">📄 Proposta enviada</option>
                  <option value="Fechado">✅ Fechado</option><option value="Perdido">❌ Perdido</option>
                </select>
              </div>
            </div>
          </div>

          <div class="hlm-sec">
            <div class="hlm-sec-h" onclick="this.nextElementSibling.classList.toggle('open')">📅 FOLLOW-UP <span>▾</span></div>
            <div class="hlm-sec-b">
              <div class="hlm-g2">
                <div><label>Data do Follow-up</label><input id="hlm-followup-data" type="date"></div>
                <div><label>Próxima Ação</label><input id="hlm-followup-acao" placeholder="Ligar, enviar proposta..."></div>
              </div>
            </div>
          </div>

          <div class="hlm-sec">
            <div class="hlm-sec-h" onclick="this.nextElementSibling.classList.toggle('open')">📝 OBSERVAÇÕES <span>▾</span></div>
            <div class="hlm-sec-b">
              <label>Histórico / Anotações</label>
              <textarea id="hlm-obs" placeholder="Como encontrou, resistências apresentadas, melhor horário de contato..."></textarea>
            </div>
          </div>

        </div>
        <div class="hlm-foot">
          <button class="hlm-bcancel" onclick="document.getElementById('hidroLeadModal').classList.remove('open')">Cancelar</button>
          <button class="hlm-bsave" onclick="window._hidroSaveLead()">💾 Salvar no CRM</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
  }

  const _urgColors = {'Crítico':'#ef4444','Alto':'#f59e0b','Médio':'#facc15','Baixo':'#22c55e'};
  window._hlmUrg = function(btn, val) {
    document.querySelectorAll('.hlm-ub').forEach(b => { b.classList.remove('sel'); const c=_urgColors[b.dataset.urg]||'#fff'; b.style.background='transparent'; b.style.color=c; b.style.borderColor=c; });
    btn.classList.add('sel'); btn.style.background=_urgColors[val]||'#fff'; btn.style.color='#0f172a'; btn.style.borderColor='transparent';
    document.getElementById('hlm-urgencia').value = val;
  };

  window._hidroOpenLeadModal = function(data = {}) {
    _injectLeadModalOnce();
    const prts = window.HidroPartners ? HidroPartners.getAll() : [];
    const sel = document.getElementById('hlm-parceiro');
    if (sel) sel.innerHTML = '<option value="">— Nenhum —</option>' +
      prts.map(p=>`<option value="${p.id}"${String(data.parceiro_id)===String(p.id)?' selected':''}>${p.nome} (${p.profissao||'Parceiro'})</option>`).join('');

    const sv = (id,v) => { const el=document.getElementById(id); if(el) el.value=v||''; };
    sv('hlm-nome',data.nome); sv('hlm-cpfcnpj',data.cpfcnpj); sv('hlm-telefone',data.telefone);
    sv('hlm-email',data.email); sv('hlm-municipio',data.municipio);
    sv('hlm-car',data.car); sv('hlm-embargo',data.embargo); sv('hlm-sigef',data.sigef);
    sv('hlm-matricula',data.matricula); sv('hlm-lat',data.lat); sv('hlm-lng',data.lng); sv('hlm-fazenda',data.fazenda);
    sv('hlm-servico',data.servico); sv('hlm-ticket',data.ticket); sv('hlm-prazo',data.prazo);
    sv('hlm-urgencia',data.urgencia||''); sv('hlm-origem',data.origem); sv('hlm-status',data.status||'Novo');
    sv('hlm-followup-data',data.followup_data); sv('hlm-followup-acao',data.followup_acao); sv('hlm-obs',data.obs);
    document.getElementById('hlm-tipo-badge').textContent = data.tipo || 'Lead';

    document.querySelectorAll('.hlm-ub').forEach(b => { b.classList.remove('sel'); const c=_urgColors[b.dataset.urg]; b.style.background='transparent'; b.style.color=c; b.style.borderColor=c; });
    if (data.urgencia) { const u=document.querySelector(`.hlm-ub[data-urg="${data.urgencia}"]`); if(u) window._hlmUrg(u,data.urgencia); }

    window._hidroLeadEditId = data.id || null;
    window._hidroLeadTipoAtual = data.tipo || 'Lead';
    document.getElementById('hidroLeadModal').classList.add('open');
  };

  window._hidroSaveLead = function() {
    const g = id => { const el=document.getElementById(id); return el?el.value.trim():''; };
    const lead = {
      id: window._hidroLeadEditId || Date.now(), tipo: window._hidroLeadTipoAtual || 'Lead',
      nome:g('hlm-nome'), cpfcnpj:g('hlm-cpfcnpj'), telefone:g('hlm-telefone'), email:g('hlm-email'), municipio:g('hlm-municipio'),
      car:g('hlm-car'), embargo:g('hlm-embargo'), sigef:g('hlm-sigef'), matricula:g('hlm-matricula'), lat:g('hlm-lat'), lng:g('hlm-lng'), fazenda:g('hlm-fazenda'),
      servico:g('hlm-servico'), ticket:g('hlm-ticket'), prazo:g('hlm-prazo'), urgencia:g('hlm-urgencia'), origem:g('hlm-origem'),
      parceiro_id:g('hlm-parceiro'), status:g('hlm-status'), followup_data:g('hlm-followup-data'), followup_acao:g('hlm-followup-acao'), obs:g('hlm-obs'),
    };
    if (!lead.nome && !lead.telefone && !lead.email && !lead.cpfcnpj) {
      alert('⚠️ Preencha pelo menos nome, CPF/CNPJ, telefone ou e-mail.'); return;
    }
    HidroLeads.save(lead);
    document.getElementById('hidroLeadModal').classList.remove('open');
    const nm = lead.nome || lead.email || lead.telefone || 'Lead';
    const toast = document.getElementById('toast-message');
    if (toast) { toast.textContent = `✅ Lead "${nm}" salvo no CRM!`; setTimeout(()=>toast.textContent='',3000); }
    if (window.AgRaGeo && window.AgRaGeo.refreshLeadsBadge) window.AgRaGeo.refreshLeadsBadge();
    if (window.AgRaGeo && window.AgRaGeo.renderLeadsSalvos) window.AgRaGeo.renderLeadsSalvos();
  };

  // ── Gera botão "💾 Salvar Lead" para qualquer popup ──────────
  function _saveLeadBtn(data = {}) {
    const safe = JSON.stringify(data).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    return `<button onclick="window._hidroOpenLeadModal(JSON.parse(this.dataset.lead))" data-lead='${safe}' style="background:#22c55e;color:#fff;border:none;border-radius:6px;padding:5px 10px;font-size:0.74rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">💾 Salvar Lead</button>`;
  }


  // ── Prospecção multi-canal (wa.me + Copiar + Google) ────────────
  const WHATSAPP_NUMBER = '5565813902820'; // Número da AgRaGeo sem formatação

  function _buildAbordagem(nome, municipio, servico, situacao) {
    return `Olá! Meu nome é Alex, da AgRaGeo Consultoria em Várzea Grande - MT.

Estou entrando em contato porque, ao analisar dados públicos da região, identifiquei que ${nome || 'sua propriedade'} em *${municipio || 'MT'}* pode se beneficiar de uma regularização:

_${situacao || 'Situação identificada nos registros públicos'}_

Podemos ajudar com: *${servico || 'regularização e suporte técnico'}*.

Nada de burocracia complicada — é algo que a gente resolve de forma tranquila e rápida. Posso te explicar melhor em uma conversa de 10 minutinhos?

Fico à disposição!
Alex | AgRaGeo Consultoria
(65) 8139-0282`;
  }

  function _buildWhatsAppUrl(nome, municipio, servico, situacao) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(_buildAbordagem(nome, municipio, servico, situacao))}`;
  }

  function _prospeccionButtons(nome, municipio, servico, situacao) {
    const msg = _buildAbordagem(nome, municipio, servico, situacao);
    const waUrl = _buildWhatsAppUrl(nome, municipio, servico, situacao);
    const googleQuery = encodeURIComponent(`"${nome || municipio}" ${municipio || 'Mato Grosso'} poço tubular propriedade rural contato`);
    const googleUrl = `https://www.google.com/search?q=${googleQuery}`;
    const msgId = 'msg_' + Math.random().toString(36).substr(2, 8);

    return `
      <div style="margin-top:2px;font-size:0.68rem;color:#f59e0b;padding:3px 0 4px;font-style:italic;">
        ⚠️ Telefones do SIAGAS são dados históricos — podem estar desatualizados. Use os canais abaixo:
      </div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:4px;">
        <button onclick="(function(){var t=document.getElementById('${msgId}');t.select();document.execCommand('copy');this.textContent='✅ Copiado!';setTimeout(()=>this.textContent='📋 Copiar Script',1800)}).call(this)" style="background:#3b82f6;color:#fff;border:none;border-radius:6px;padding:5px 9px;font-size:0.74rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:4px;">📋 Copiar Script</button>
        <a href="${waUrl}" target="_blank" style="background:#25d366;color:#fff;border-radius:6px;padding:5px 9px;font-size:0.74rem;font-weight:600;text-decoration:none;display:flex;align-items:center;gap:4px;">📱 WhatsApp Web</a>
        <a href="${googleUrl}" target="_blank" style="background:#475569;color:#fff;border-radius:6px;padding:5px 9px;font-size:0.74rem;font-weight:600;text-decoration:none;display:flex;align-items:center;gap:4px;">🔍 Pesquisar</a>
      </div>
      <textarea id="${msgId}" style="position:absolute;left:-9999px;opacity:0;" readonly>${msg}</textarea>`;
  }

  // Mantida para compatibilidade com outros pontos do código
  function _whatsappBtn(nome, municipio, servico, situacao) {
    return _prospeccionButtons(nome, municipio, servico, situacao);
  }

  // ── Initialize map ─────────────────────────────────────────
  function init(containerId = 'map') {
    map = L.map(containerId, {
      center: [-13.0, -55.5], // Center of Mato Grosso
      zoom: 7,
      zoomControl: false,
      attributionControl: true
    });

    // Zoom control on bottom-left
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // ── Base tile layers ───────────────────────────────────────
    const osmDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> | CartoDB',
      maxZoom: 19
    });

    const osmLight = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19
    });

    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri',
      maxZoom: 18
    });

    osmDark.addTo(map);

    // Layer control
    const baseLayers = {
      '🌑 Escuro': osmDark,
      '☀️ Claro': osmLight,
      '🛰️ Satélite': satellite
    };
    L.control.layers(baseLayers, null, { position: 'topright' }).addTo(map);

    // Marker cluster group
    markersLayer = L.layerGroup().addTo(map);

    // Force Leaflet to recalculate after flex layout settles
    setTimeout(() => { map.invalidateSize(); }, 200);
    setTimeout(() => { map.invalidateSize(); }, 1000);

    // Geocodificação reversa com botão direito
    map.on('contextmenu', async (e) => {
      const toast = window.HidroAlertas ? HidroAlertas.toast : (msg) => console.log(msg);
      toast('⌛ Recuperando endereço do local clicado...', 'info', 2000);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&zoom=18&addressdetails=1`);
        const data = await res.json();
        const mun = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || 'MT';
        let end = data.address?.road || '';
        if(data.address?.suburb) end += ', ' + data.address.suburb;
        
        window._hidroOpenLeadModal({
          lat: e.latlng.lat.toFixed(6),
          lng: e.latlng.lng.toFixed(6),
          municipio: mun,
          origem: 'Clique no Mapa',
          obs: end ? `📍 Endereço aproximado: ${end}` : ''
        });
      } catch(err) {
        window._hidroOpenLeadModal({ lat: e.latlng.lat.toFixed(6), lng: e.latlng.lng.toFixed(6), origem: 'Clique no Mapa' });
      }
    });

    return map;
  }

  // ── Add well markers ───────────────────────────────────────
  function setPocos(pocos) {
    currentPocos = pocos;
    markersLayer.clearLayers();

    pocos.forEach(poco => {
      if (!poco.latitude || !poco.longitude) return;

      const color = SITUACAO_COLORS[poco.situacao] || '#94a3b8';

      const marker = L.circleMarker([poco.latitude, poco.longitude], {
        radius: 7,
        fillColor: color,
        fillOpacity: 0.8,
        color: 'rgba(255,255,255,0.3)',
        weight: 1
      });

      // ── Build service recommendation based on situation ──
      let servicoHTML = '';
      if (poco.situacao === 'Irregular') {
        servicoHTML = `
          <div class="popup-row" style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.08)">
            <span class="key" style="color:#ef4444">🚨 Lead</span><span class="val" style="color:#ef4444">IRREGULAR — Precisa regularizar</span>
          </div>
          <div class="popup-row"><span class="key">🛠️ Serviço</span><span class="val">Regularização: Outorga + Teste Bombeamento + Laudo</span></div>
          <div class="popup-row"><span class="key">💰 Valor</span><span class="val">R$ 3.000-8.000</span></div>
          <div class="popup-row"><span class="key">👷 RT</span><span class="val">Geólogo (obrigatório)</span></div>`;
      } else if (poco.situacao === 'Vencido' || poco.situacao === 'Vencida') {
        servicoHTML = `
          <div class="popup-row" style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.08)">
            <span class="key" style="color:#facc15">⚠️ Lead</span><span class="val" style="color:#facc15">VENCIDO — Renovação obrigatória</span>
          </div>
          <div class="popup-row"><span class="key">🛠️ Serviço</span><span class="val">Renovação de Outorga + Teste Bombeamento Atualizado</span></div>
          <div class="popup-row"><span class="key">💰 Valor</span><span class="val">R$ 2.500-6.000</span></div>`;
      } else {
        servicoHTML = `
          <div class="popup-row" style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.08)">
            <span class="key" style="color:#22c55e">✅ Status</span><span class="val" style="color:#22c55e">Regular</span>
          </div>
          <div class="popup-row"><span class="key">🛠️ Oportunidade</span><span class="val">Manutenção preventiva ou novo poço na região</span></div>
          <div class="popup-row"><span class="key">💰 Valor</span><span class="val">R$ 2.000-5.000 (manutenção)</span></div>`;
      }

      marker.bindPopup(`
        <div class="popup-header">
          <h4>🔵 ${poco.municipio || 'Município N/I'}</h4>
          <div class="popup-sub">${poco.fonte_dado || 'SIAGAS/SGB'}</div>
        </div>
        <div class="popup-body">
          <div class="popup-row"><span class="key">Situação</span><span class="val" style="color:${color}">${poco.situacao}</span></div>
          <div class="popup-row"><span class="key">Uso</span><span class="val">${poco.uso_principal || '—'}</span></div>
          <div class="popup-row"><span class="key">Vazão</span><span class="val">${poco.vazao_m3h ? poco.vazao_m3h + ' m³/h' : '—'}</span></div>
          <div class="popup-row"><span class="key">Profundidade</span><span class="val">${poco.profundidade_m ? poco.profundidade_m + ' m' : '—'}</span></div>
          <div class="popup-row"><span class="key">Nível Estático</span><span class="val">${poco.nivel_estatico_m != null ? poco.nivel_estatico_m + ' m' : '—'}</span></div>
          <div class="popup-row"><span class="key">Nível Dinâmico</span><span class="val">${poco.nivel_dinamico_m != null ? poco.nivel_dinamico_m + ' m' : '—'}</span></div>
          <div class="popup-row"><span class="key">Vazão Específica</span><span class="val">${poco.vazao_especifica != null ? poco.vazao_especifica + ' m³/h/m' : '—'}</span></div>
          <div class="popup-row"><span class="key">Transmissividade</span><span class="val">${poco.transmissividade != null ? poco.transmissividade + ' m²/d' : '—'}</span></div>
          <div class="popup-row"><span class="key">Bacia</span><span class="val">${poco.bacia || '—'}</span></div>
          <div class="popup-row"><span class="key">Natureza</span><span class="val">${poco.natureza || '—'}</span></div>
          <div class="popup-row"><span class="key">Perfurador</span><span class="val">${poco.perfurador || '—'}</span></div>
          <div class="popup-row"><span class="key">Data Instalação</span><span class="val">${poco.data_outorga || '—'}</span></div>
          ${servicoHTML}
        </div>
        <div class="popup-actions" style="flex-wrap:wrap;gap:5px;">
          <button class="btn btn-sm btn-primary" onclick="window.location.href='/pages/municipio.html?nome=${encodeURIComponent(poco.municipio || '')}'">📊 Ver Município</button>
          <button class="btn btn-sm btn-outline" onclick="window.location.href='/pages/relatorio.html?nome=${encodeURIComponent(poco.municipio || '')}'">📄 Relatório</button>
          ${(poco.situacao === 'Irregular' || poco.situacao === 'Vencido') ? _whatsappBtn(poco.nome_proprietario || '', poco.municipio, poco.situacao === 'Irregular' ? 'Regularização de Outorga + Teste de Bombeamento + Laudo Técnico' : 'Renovação de Outorga + Laudo de Situação do Poço', poco.situacao === 'Irregular' ? 'Poço tubular irregular — sem outorga nos registros públicos.' : 'Outorga vencida — necessita renovação urgente.') : ''}
          ${_saveLeadBtn({nome: poco.nome_proprietario || '', municipio: poco.municipio || '', servico: poco.situacao === 'Irregular' ? 'Regularização de Outorga + Laudo Geológico' : poco.situacao === 'Vencido' ? 'Renovação de Outorga' : 'Consultoria Hidrogeológica', tipo: 'Poço SIAGAS — ' + (poco.situacao || 'Verificar')})}
        </div>
      `);

      markersLayer.addLayer(marker);
    });
  }

  // ── Add lead markers (deficit heatmap-style) ───────────────
  function setLeads(leads) {
    if (heatLayer) {
      map.removeLayer(heatLayer);
    }
    heatLayer = L.layerGroup();

    leads.forEach(lead => {
      const color = PRIORIDADE_COLORS[lead.prioridade] || '#94a3b8';
      const radius = Math.max(15, Math.min(40, lead.perc_irregularidade * 0.8));

      // Pulsing circle for high priority
      const circle = L.circleMarker([lead.latitude_centroide, lead.longitude_centroide], {
        radius: radius,
        fillColor: color,
        fillOpacity: 0.15,
        color: color,
        weight: 2,
        opacity: 0.6,
        className: lead.prioridade === 'Alta' ? 'pulse-marker' : ''
      });

      circle.bindPopup(`
        <div class="popup-header">
          <h4>📍 ${lead.nome_area}</h4>
          <div class="popup-sub">Lead — Prioridade ${lead.prioridade}</div>
        </div>
        <div class="popup-body">
          <div class="popup-row"><span class="key">Poços Outorgados</span><span class="val">${lead.pocos_outorgados_raio}</span></div>
          <div class="popup-row"><span class="key">Poços Estimados</span><span class="val">${lead.pocos_estimados}</span></div>
          <div class="popup-row"><span class="key">Déficit</span><span class="val" style="color:${color}">${lead.deficit_estimado}</span></div>
          <div class="popup-row"><span class="key">% Irregularidade</span><span class="val" style="color:${color}">${lead.perc_irregularidade}%</span></div>
          <div class="popup-row"><span class="key">Potencial</span><span class="val">${lead.potencial_hidrogeologico}</span></div>
        </div>
        <div class="popup-actions" style="flex-wrap:wrap;gap:5px;">
          <button class="btn btn-sm btn-primary" onclick="window.location.href='/pages/municipio.html?cod=${lead.cod_ibge_municipio}'">📊 Análise Completa</button>
          ${_saveLeadBtn({municipio: lead.nome_area || '', servico: 'Prospecção de mercado — área de alta irregularidade', tipo: 'Área Déficit Hídrico — Prioridade ' + (lead.prioridade || '')})}
        </div>
      `);

      heatLayer.addLayer(circle);
    });

    heatLayer.addTo(map);
  }

  // ── Add aquifer regions ────────────────────────────────────
  function setAquiferos(aquiferos) {
    if (aquiferLayer) {
      map.removeLayer(aquiferLayer);
    }
    aquiferLayer = L.layerGroup();

    const prodColors = {
      'Alta': 'rgba(0, 180, 212, 0.15)',
      'Média': 'rgba(45, 212, 191, 0.10)',
      'Baixa': 'rgba(100, 116, 139, 0.08)'
    };

    aquiferos.forEach(aq => {
      // Approximate with a large circle
      const radius = Math.sqrt(aq.area_km2) * 500;
      const circle = L.circle([aq.lat, aq.lng], {
        radius: radius,
        fillColor: prodColors[aq.produtividade] || 'rgba(100,116,139,0.08)',
        fillOpacity: 1,
        color: 'rgba(0, 180, 212, 0.3)',
        weight: 1,
        dashArray: '5, 5'
      });

      circle.bindPopup(`
        <div class="popup-header">
          <h4>🗺️ ${aq.nome}</h4>
          <div class="popup-sub">${aq.sistema_aquifero}</div>
        </div>
        <div class="popup-body">
          <div class="popup-row"><span class="key">Tipo</span><span class="val">${aq.tipo}</span></div>
          <div class="popup-row"><span class="key">Produtividade</span><span class="val">${aq.produtividade}</span></div>
          <div class="popup-row"><span class="key">Área</span><span class="val">${aq.area_km2.toLocaleString()} km²</span></div>
        </div>
      `);

      aquiferLayer.addLayer(circle);
    });

    aquiferLayer.addTo(map);
  }

  // ── Dynamic WFS/GeoJSON layers ────────────────────────────
  const dynamicLayers = {};

  function setGeoJSONLayer(name, features, style = {}, label = '') {
    // Remove existing layer if present
    if (dynamicLayers[name]) {
      map.removeLayer(dynamicLayers[name]);
    }

    if (!features || features.length === 0) {
      console.warn(`[HidroMap] Camada "${name}": sem features`);
      return;
    }

    // WFS features come as individual feature objects, wrap in FeatureCollection
    const geojson = {
      type: 'FeatureCollection',
      features: features.map(f => ({
        type: 'Feature',
        geometry: f.geometry,
        properties: f.properties || {}
      }))
    };

    const layer = L.geoJSON(geojson, {
      style: () => ({
        color: style.color || '#3b82f6',
        fillColor: style.fillColor || '#3b82f6',
        fillOpacity: style.fillOpacity || 0.1,
        weight: style.weight || 1.5,
        opacity: style.opacity || 0.8,
        dashArray: style.dashArray || null,
      }),
      pointToLayer: (feature, latlng) => {
        return L.circleMarker(latlng, {
          radius: style.radius || 6,
          fillColor: style.fillColor || '#f59e0b',
          fillOpacity: style.fillOpacity || 0.7,
          color: style.color || '#f59e0b',
          weight: style.weight || 1
        });
      },
      onEachFeature: (feature, featureLayer) => {
        const props = feature.properties;
        let popupContent = `<div class="popup-header"><h4>📍 ${label || name}</h4></div>`;
        popupContent += '<div class="popup-body">';

        // Show relevant properties with smart layout
        const skipKeys = ['objectid', 'fid', 'id', 'gid', 'id_1', 'parent_id',
          'shape_area', 'shape_leng', 'shape_length', 'geom', 'geometry',
          'lat', 'long', 'latitude', 'longitude', 'label', 'name'];
        const fullWidthKeys = ['base legal', 'recomenda', 'risco', 'fundamenta',
          'servico', 'serviço', 'oportunidade', 'escopo', 'impacto', 'descricao',
          'ocorrencia', 'dispositivo', 'pop. jusante', 'outorga'];
        const fonteKey = 'fonte';

        // Detect lead-type layers (have 'Score' or 'Recomendação' fields)
        const isLeadLayer = props['Score'] !== undefined || props['💡 Recomendação'] !== undefined ||
          props['🛠️ Serviço'] !== undefined;

        // Format raw WFS field names: NUM_AUTO_TERM → Num Auto Term
        function formatFieldName(key) {
          return key
            .replace(/^str_|^num_|^dat_/, '')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .replace(/\bUf\b/, 'UF')
            .replace(/\bCpf\b/, 'CPF')
            .replace(/\bCnpj\b/, 'CNPJ')
            .replace(/\bDrdh\b/, 'DRDH')
            .replace(/\bCar\b/, 'CAR')
            .replace(/\bAnm\b/, 'ANM')
            .replace(/\bSema\b/, 'SEMA');
        }

        // Extract key fields for WhatsApp button
        let _nome = props['Nome'] || props['Empreendedor'] || props['Proprietário'] ||
          props['🏭 Nome'] || props['⛽ Posto'] || props['📐 Imóvel'] ||
          props['🏘️ Assentamento'] || props['🪓 Proprietário'] || props['⛏️ Mineração'] ||
          props['🥩 Frigorífico'] || '';
        let _municipio = props['Município'] || props['municipio'] || '';
        let _servico = props['🛠️ Serviço'] || props['Serviço'] || '';
        let _situacao = props['💡 Recomendação'] || props['Recomendação'] || props['Situação'] || '';

        Object.entries(props).forEach(([key, val]) => {
          if (val && !skipKeys.includes(key.toLowerCase()) && typeof val !== 'object') {
            const cleanKey = formatFieldName(key);
            let valStr = String(val);
            const keyLower = cleanKey.toLowerCase();

            // Skip "Não se aplica" repetitive values
            if (valStr.startsWith('Não se aplica')) return;

            // Truncate very long values
            if (valStr.length > 200) {
              valStr = valStr.substring(0, 197) + '...';
            }

            // Detect if this is a source attribution row
            if (keyLower.includes(fonteKey)) {
              popupContent += `<div class="popup-row fonte"><span class="key">${cleanKey}</span><span class="val">${valStr}</span></div>`;
            }
            // Detect long-form values that need full width
            else if (valStr.length > 50 || fullWidthKeys.some(k => keyLower.includes(k))) {
              popupContent += `<div class="popup-row full-width"><span class="key">${cleanKey}</span><span class="val">${valStr}</span></div>`;
            }
            // Short key-value pair: side-by-side
            else {
              popupContent += `<div class="popup-row"><span class="key">${cleanKey}</span><span class="val">${valStr}</span></div>`;
            }
          }
        });

        popupContent += '</div>';

        // ── Actions panel ──
        if (isLeadLayer) {
          let encodedProps = '';
          try { encodedProps = encodeURIComponent(JSON.stringify(props)); } catch(e){}
          
          popupContent += `<div class="popup-actions" style="justify-content:flex-start;gap:6px;flex-wrap:wrap">`;
          popupContent += _whatsappBtn(_nome, _municipio, _servico, _situacao);
          popupContent += `<button class="btn btn-sm btn-outline" style="border-color:#ef4444;color:#ef4444" onclick="if(window.AgRaGeo) AgRaGeo._runRadarDiagnostico('${encodedProps}')">📄 PDF</button>`;
          popupContent += _saveLeadBtn({nome: _nome, municipio: _municipio, servico: _servico, tipo: label || name});
          popupContent += `</div>`;
        }

        featureLayer.bindPopup(popupContent, { maxWidth: 500 });
      }
    });

    dynamicLayers[name] = layer;
    layer.addTo(map);
    console.log(`[HidroMap] ✅ Camada "${name}" adicionada: ${features.length} features`);
  }

  // ── Toggle layers ──────────────────────────────────────────
  function toggleLayer(layerName, visible) {
    switch(layerName) {
      case 'pocos':
        visible ? map.addLayer(markersLayer) : map.removeLayer(markersLayer);
        break;
      case 'heatmap':
        if (heatLayer) visible ? map.addLayer(heatLayer) : map.removeLayer(heatLayer);
        break;
      case 'aquiferos':
        if (aquiferLayer) visible ? map.addLayer(aquiferLayer) : map.removeLayer(aquiferLayer);
        break;
      default:
        // Dynamic layers (embargadas, bacias, indigenas, etc.)
        if (dynamicLayers[layerName]) {
          visible ? map.addLayer(dynamicLayers[layerName]) : map.removeLayer(dynamicLayers[layerName]);
        }
        break;
    }
  }

  // ── Filter markers by callback ─────────────────────────────
  function filterPocos(filterFn) {
    const filtered = currentPocos.filter(filterFn);
    setPocos(filtered);
    return filtered.length;
  }

  // ── Get map instance ───────────────────────────────────────
  function getMap() { return map; }

  // ── Custom layer (WMS, etc.) ──────────────────────────────
  function setCustomLayer(name, layer) {
    if (dynamicLayers[name]) {
      map.removeLayer(dynamicLayers[name]);
    }
    dynamicLayers[name] = layer;
    layer.addTo(map);
    console.log(`[HidroMap] ✅ Custom layer "${name}" adicionada`);
  }

  // ── Clear ALL layers from map ──────────────────────────────
  function clearAllLayers() {
    // Remove poços
    if (markersLayer) map.removeLayer(markersLayer);
    // Remove heatmap
    if (heatLayer) map.removeLayer(heatLayer);
    // Remove aquíferos
    if (aquiferLayer) map.removeLayer(aquiferLayer);
    // Remove all dynamic/custom layers
    Object.keys(dynamicLayers).forEach(name => {
      if (dynamicLayers[name]) {
        map.removeLayer(dynamicLayers[name]);
        delete dynamicLayers[name];
      }
    });
    console.log('[HidroMap] 🧹 Todas as camadas removidas');
  }

  // ── INCRA / SIGEF WMS layers ──────────────────────────────
  function createINCRAWMS(layerName, style = {}) {
    const wmsUrl = 'https://acervofundiario.incra.gov.br/acervo/acv_geoserver/wms';
    return L.tileLayer.wms(wmsUrl, {
      layers: layerName,
      format: 'image/png',
      transparent: true,
      version: '1.1.1',
      opacity: style.opacity || 0.6,
      maxZoom: 18,
      attribution: '&copy; INCRA/SIGEF'
    });
  }

  return {
    init,
    setPocos,
    setLeads,
    setAquiferos,
    setGeoJSONLayer,
    setCustomLayer,
    toggleLayer,
    filterPocos,
    getMap,
    clearAllLayers,
    createINCRAWMS
  };
})();
