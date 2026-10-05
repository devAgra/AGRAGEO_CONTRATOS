/* ================================================================
   HidroScanner — Módulo Pipeline CRM
   Dashboard visual do funil de vendas com canvas nativo
   Sem libs externas — tudo vanilla JS
   ================================================================ */

const HidroPipeline = (() => {

  const STATUS_ORDER = ['Novo','Em contato','Proposta enviada','Negociação','Fechado','Perdido'];
  const STATUS_COLORS = {
    'Novo':             '#64748b',
    'Em contato':       '#3b82f6',
    'Proposta enviada': '#f59e0b',
    'Negociação':       '#a78bfa',
    'Fechado':          '#22c55e',
    'Perdido':          '#ef4444',
  };

  // ── Formata moeda BRL ────────────────────────────────────────
  function _brl(v) {
    return new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:0 }).format(v);
  }

  // ── Agrupa leads por status ────────────────────────────────--
  function _agrupar(leads) {
    const map = {};
    STATUS_ORDER.forEach(s => {
      map[s] = { leads: [], total: 0 };
    });
    leads.forEach(l => {
      const s = l.status || 'Novo';
      if (!map[s]) map[s] = { leads: [], total: 0 };
      map[s].leads.push(l);
      map[s].total += parseFloat(l.ticket) || 0;
    });
    return map;
  }

  // ── Renderiza gráfico de barras no canvas ────────────────────
  function _renderGrafico(canvasId, grupos) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth || 400;
    const H = canvas.height = 140;
    ctx.clearRect(0, 0, W, H);

    const ativos = STATUS_ORDER.filter(s => s !== 'Perdido');
    const valores = ativos.map(s => grupos[s]?.total || 0);
    const maxVal = Math.max(...valores, 1);
    const barW = Math.floor((W - 40) / ativos.length) - 6;
    const padLeft = 20;

    ativos.forEach((status, i) => {
      const val = valores[i];
      const barH = Math.round((val / maxVal) * (H - 40));
      const x = padLeft + i * (barW + 6);
      const y = H - 30 - barH;
      const cor = STATUS_COLORS[status] || '#64748b';

      // Barra
      ctx.fillStyle = cor + '99';
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 4);
      ctx.fill();

      // Borda
      ctx.strokeStyle = cor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label do eixo X
      ctx.fillStyle = '#64748b';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      const shortLabel = status.replace('Proposta enviada','Proposta').replace('Em contato','Contato').replace('Negociação','Negoc.');
      ctx.fillText(shortLabel, x + barW/2, H - 14);

      // Valor
      if (val > 0) {
        ctx.fillStyle = cor;
        ctx.font = 'bold 9px Inter, sans-serif';
        const label = val >= 1000 ? `R$${(val/1000).toFixed(0)}k` : _brl(val);
        ctx.fillText(label, x + barW/2, Math.max(y - 5, 12));
      }
    });
  }

  // ── Renderiza o painel completo ─────────────────────────────
  function render(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !window.HidroLeads) return;

    const todos = HidroLeads.getAll();
    const grupos = _agrupar(todos);

    // KPIs
    const totalReceita = Object.values(grupos)
      .filter((_, i) => STATUS_ORDER[i] !== 'Perdido')
      .reduce((acc, g) => acc + g.total, 0);
    const fechado = grupos['Fechado']?.total || 0;
    const negociacao = grupos['Negociação']?.total || 0;
    const proposta = grupos['Proposta enviada']?.total || 0;
    const totalAtivos = todos.filter(l => l.status !== 'Fechado' && l.status !== 'Perdido').length;

    // Top 5 por score
    const scored = window.AgRaGeo
      ? todos.map(l => ({ ...l, score: AgRaGeo.calcularScoreLead(l) })).sort((a,b) => b.score - a.score).slice(0, 5)
      : [];

    container.innerHTML = `
      <!-- KPIs -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:16px;">
        ${[
          { label:'💰 Pipeline Total', val: _brl(totalReceita), cor:'#22c55e' },
          { label:'✅ Fechado',         val: _brl(fechado),      cor:'#22c55e' },
          { label:'🤝 Negociação',      val: _brl(negociacao),   cor:'#a78bfa' },
          { label:'📄 Propostas',       val: _brl(proposta),     cor:'#f59e0b' },
          { label:'🎯 Leads Ativos',    val: String(totalAtivos), cor:'#3b82f6' },
        ].map(k => `
          <div style="background:#1e293b;border:1px solid rgba(148,163,184,0.1);border-radius:10px;padding:12px;text-align:center;">
            <div style="font-size:0.68rem;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">${k.label}</div>
            <div style="font-size:1rem;font-weight:800;color:${k.cor};">${k.val}</div>
          </div>`).join('')}
      </div>

      <!-- Gráfico + Funil -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">

        <!-- Gráfico de barras -->
        <div style="background:#1e293b;border:1px solid rgba(148,163,184,0.1);border-radius:10px;padding:14px;">
          <div style="color:#94a3b8;font-size:0.72rem;font-weight:700;text-transform:uppercase;margin-bottom:8px;">📊 Pipeline por Fase (R$)</div>
          <canvas id="pipeline-canvas" style="width:100%;display:block;"></canvas>
        </div>

        <!-- Contagem por status -->
        <div style="background:#1e293b;border:1px solid rgba(148,163,184,0.1);border-radius:10px;padding:14px;">
          <div style="color:#94a3b8;font-size:0.72rem;font-weight:700;text-transform:uppercase;margin-bottom:10px;">🎯 Leads por Status</div>
          ${STATUS_ORDER.map(s => {
            const g = grupos[s];
            const pct = todos.length > 0 ? Math.round((g.leads.length / todos.length) * 100) : 0;
            return `
              <div style="margin-bottom:7px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                  <span style="font-size:0.73rem;color:#e2e8f0;">${s}</span>
                  <span style="font-size:0.73rem;color:${STATUS_COLORS[s]};font-weight:700;">${g.leads.length}</span>
                </div>
                <div style="background:#0f172a;border-radius:20px;height:5px;overflow:hidden;">
                  <div style="background:${STATUS_COLORS[s]};width:${pct}%;height:100%;border-radius:20px;transition:width 0.3s;"></div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Top 5 por Score -->
      ${scored.length > 0 ? `
      <div style="background:#1e293b;border:1px solid rgba(148,163,184,0.1);border-radius:10px;padding:14px;margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <div style="color:#94a3b8;font-size:0.72rem;font-weight:700;text-transform:uppercase;">🏆 Top 5 — Maior Score</div>
          <button onclick="AgRaGeo.exportarLeadsCSV()" style="background:#1e293b;color:#22c55e;border:1px solid #22c55e44;border-radius:6px;padding:4px 10px;font-size:0.72rem;cursor:pointer;">📤 Exportar CSV</button>
        </div>
        ${scored.map((l, i) => {
          const cor = l.score >= 80 ? '#ef4444' : l.score >= 60 ? '#f59e0b' : l.score >= 40 ? '#facc15' : '#22c55e';
          return `
            <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
              <div style="background:${cor}22;color:${cor};border:1px solid ${cor}44;border-radius:6px;padding:2px 7px;font-size:0.72rem;font-weight:800;min-width:42px;text-align:center;">${l.score}</div>
              <div style="flex:1;min-width:0;">
                <div style="color:#e2e8f0;font-size:0.8rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${l.nome || '—'}</div>
                <div style="color:#64748b;font-size:0.71rem;">${l.municipio || ''} · ${l.status || 'Novo'} · ${l.urgencia || ''}</div>
              </div>
              <div style="color:#22c55e;font-size:0.78rem;font-weight:700;white-space:nowrap;">${l.ticket ? 'R$ '+Number(l.ticket).toLocaleString('pt-BR') : '—'}</div>
              <button onclick="AgRaGeo.gerarEmailProspeccao(JSON.parse(this.dataset.lead))" data-lead='${JSON.stringify(l).replace(/'/g,"\\'")}' style="background:#f59e0b;color:#0f172a;border:none;border-radius:5px;padding:3px 8px;font-size:0.7rem;font-weight:700;cursor:pointer;">📧</button>
            </div>`;
        }).join('')}
      </div>
      ` : ''}

      <!-- Botões de ação -->
      <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;">
        <button onclick="AgRaGeo.exportarLeadsCSV()" style="background:#22c55e22;color:#22c55e;border:1px solid #22c55e44;border-radius:7px;padding:7px 14px;font-size:0.79rem;cursor:pointer;">📤 Exportar CSV</button>
        <button onclick="HidroAlertas.verificarFollowUps()" style="background:#f59e0b22;color:#f59e0b;border:1px solid #f59e0b44;border-radius:7px;padding:7px 14px;font-size:0.79rem;cursor:pointer;">🔔 Verificar Follow-ups</button>
        <button onclick="HidroPipeline.render('hidro-pipeline-container')" style="background:#3b82f622;color:#3b82f6;border:1px solid #3b82f644;border-radius:7px;padding:7px 14px;font-size:0.79rem;cursor:pointer;">🔄 Atualizar</button>
      </div>`;

    // Renderiza gráfico após o DOM ser criado
    requestAnimationFrame(() => _renderGrafico('pipeline-canvas', grupos));
  }

  return { render };

})();
