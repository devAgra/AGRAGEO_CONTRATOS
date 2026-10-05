/* ============================================================
   HidroScanner — Relatórios Module
   Report listing, preview, and PDF generation
   ============================================================ */

const HidroRelatorios = (() => {

  // ── Generate report HTML for a municipality ─────────────────
  async function generateReportHTML(codIbge) {
    const mun = await HidroAPI.getMunicipio(codIbge);
    if (!mun) return '<p>Município não encontrado.</p>';

    const pocos = await HidroAPI.getPocos({ municipio: mun.nome });
    const clima = await HidroAPI.getDadosClimaticos(codIbge);
    const leads = await HidroAPI.getLeads();
    const lead = leads.find(l => l.cod_ibge_municipio === parseInt(codIbge));

    const regulares = pocos.filter(p => p.situacao === 'Regular').length;
    const irregulares = pocos.filter(p => p.situacao === 'Irregular').length;
    const vencidos = pocos.filter(p => p.situacao === 'Vencido').length;

    const avgPrecip = clima.length > 0
      ? Math.round(clima.reduce((a, c) => a + c.precipitacao_mm, 0) / clima.length)
      : '—';

    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    return `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1e293b;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px; border-bottom: 3px solid #00b4d4; padding-bottom: 24px;">
          <h1 style="font-size: 1.8rem; color: #0f1629; margin-bottom: 4px;">💧 HidroScanner</h1>
          <p style="color: #64748b; font-size: 0.9rem;">Relatório de Análise Hidrogeológica</p>
          <h2 style="font-size: 1.4rem; margin-top: 16px; color: #00586a;">Município: ${mun.nome} — ${mun.uf}</h2>
          <p style="color: #94a3b8; font-size: 0.8rem;">Gerado em: ${dateStr}</p>
        </div>

        <!-- Sumário -->
        <h3 style="color: #00586a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">1. Dados Gerais do Município</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; color: #64748b; width: 40%;">Código IBGE</td><td style="padding: 8px; font-weight: 600;">${mun.cod_ibge}</td></tr>
          <tr style="background: #f8fafc;"><td style="padding: 8px; color: #64748b;">População Total</td><td style="padding: 8px; font-weight: 600;">${(mun.populacao_total || 0).toLocaleString('pt-BR')}</td></tr>
          <tr><td style="padding: 8px; color: #64748b;">População Rural</td><td style="padding: 8px; font-weight: 600;">${(mun.populacao_rural || 0).toLocaleString('pt-BR')}</td></tr>
          <tr style="background: #f8fafc;"><td style="padding: 8px; color: #64748b;">Área</td><td style="padding: 8px; font-weight: 600;">${(mun.area_km2 || 0).toLocaleString('pt-BR')} km²</td></tr>
          <tr><td style="padding: 8px; color: #64748b;">Propriedades Rurais</td><td style="padding: 8px; font-weight: 600;">${(mun.num_propriedades_rurais || 0).toLocaleString('pt-BR')}</td></tr>
        </table>

        <!-- Poços -->
        <h3 style="color: #00586a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">2. Análise de Poços</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; color: #64748b;">Total de Poços Cadastrados</td><td style="padding: 8px; font-weight: 700; font-size: 1.1rem;">${pocos.length}</td></tr>
          <tr style="background: #f0fdf4;"><td style="padding: 8px; color: #16a34a;">✅ Regulares</td><td style="padding: 8px; font-weight: 700; color: #16a34a;">${regulares}</td></tr>
          <tr style="background: #fef2f2;"><td style="padding: 8px; color: #dc2626;">❌ Irregulares (estimados)</td><td style="padding: 8px; font-weight: 700; color: #dc2626;">${irregulares}</td></tr>
          <tr style="background: #fefce8;"><td style="padding: 8px; color: #ca8a04;">⚠️ Vencidos</td><td style="padding: 8px; font-weight: 700; color: #ca8a04;">${vencidos}</td></tr>
        </table>

        ${lead ? `
        <!-- Análise de Déficit -->
        <h3 style="color: #00586a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">3. Análise de Déficit</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; color: #64748b;">Poços Outorgados</td><td style="padding: 8px; font-weight: 600;">${lead.pocos_outorgados_raio}</td></tr>
          <tr style="background: #f8fafc;"><td style="padding: 8px; color: #64748b;">Poços Estimados (algoritmo)</td><td style="padding: 8px; font-weight: 600;">${lead.pocos_estimados}</td></tr>
          <tr><td style="padding: 8px; color: #64748b;">Déficit Estimado</td><td style="padding: 8px; font-weight: 700; color: #dc2626;">${lead.deficit_estimado}</td></tr>
          <tr style="background: ${lead.perc_irregularidade > 40 ? '#fef2f2' : '#fefce8'};"><td style="padding: 8px; color: #64748b;">% Irregularidade</td><td style="padding: 8px; font-weight: 700; color: ${lead.perc_irregularidade > 40 ? '#dc2626' : '#ca8a04'};">${lead.perc_irregularidade}%</td></tr>
          <tr><td style="padding: 8px; color: #64748b;">Prioridade</td><td style="padding: 8px; font-weight: 700;">${lead.prioridade}</td></tr>
          <tr style="background: #f8fafc;"><td style="padding: 8px; color: #64748b;">Potencial Hidrogeológico</td><td style="padding: 8px; font-weight: 600;">${lead.potencial_hidrogeologico}</td></tr>
        </table>
        ` : ''}

        <!-- Clima -->
        <h3 style="color: #00586a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">4. Dados Climáticos</h3>
        <p style="color: #64748b; font-size: 0.85rem;">Precipitação média mensal: <strong>${avgPrecip} mm</strong></p>

        <!-- Disclaimer -->
        <div style="margin-top: 32px; padding: 16px; background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; font-size: 0.78rem; color: #92400e; line-height: 1.5;">
          <strong>NOTA TÉCNICA IMPORTANTE:</strong><br>
          As estimativas de déficit de outorgas apresentadas neste relatório são calculadas
          com base em dados públicos disponibilizados pela ANA, CPRM e IBGE, e representam
          uma análise estatística regional. NÃO constituem confirmação de irregularidade
          individual, infração administrativa ou acusação de qualquer natureza.<br><br>
          A regularização de poços deve ser avaliada caso a caso por profissional habilitado
          (geólogo/engenheiro de minas) com emissão de ART, conforme legislação vigente.
        </div>

        <div style="margin-top: 24px; text-align: center; color: #94a3b8; font-size: 0.75rem;">
          <p>Elaborado por: Agrageo Consultoria | Sistema HidroScanner v1.0</p>
          <p>${dateStr}</p>
        </div>
      </div>
    `;
  }

  // ── Download as PDF (print) ────────────────────────────────
  function downloadPDF(codIbge, munName) {
    generateReportHTML(codIbge).then(html => {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Relatório HidroScanner — ${munName}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            body { margin: 0; padding: 0; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>${html}</body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    });
  }

  // ── Render report list ─────────────────────────────────────
  async function renderReportList(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const leads = await HidroAPI.getLeads();
    const sorted = leads.sort((a, b) => {
      const p = { 'Alta': 0, 'Média': 1, 'Baixa': 2 };
      return (p[a.prioridade] || 3) - (p[b.prioridade] || 3);
    });

    container.innerHTML = sorted.map(lead => `
      <div class="card" style="margin-bottom: 12px; cursor: pointer;">
        <div class="flex items-center justify-between">
          <div>
            <h4 style="font-size: 0.95rem;">${lead.nome_area}</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted);">Déficit: ${lead.perc_irregularidade}% | Potencial: ${lead.potencial_hidrogeologico}</p>
          </div>
          <div class="flex gap-8">
            <span class="badge ${lead.prioridade === 'Alta' ? 'badge-danger' : lead.prioridade === 'Média' ? 'badge-warning' : 'badge-success'}">
              ${lead.prioridade}
            </span>
            <button class="btn btn-sm btn-primary" onclick="HidroRelatorios.downloadPDF(${lead.cod_ibge_municipio}, '${lead.nome_area}')">
              📄 PDF
            </button>
            <button class="btn btn-sm btn-outline" onclick="HidroRelatorios.previewReport(${lead.cod_ibge_municipio})">
              👁️ Ver
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // ── Preview report in modal ────────────────────────────────
  async function previewReport(codIbge) {
    const modal = document.getElementById('reportModal');
    const content = document.getElementById('reportContent');
    if (!modal || !content) return;

    content.innerHTML = '<div style="text-align:center;padding:40px;"><div class="spinner" style="margin:0 auto;"></div><p style="margin-top:16px;color:var(--text-muted);">Gerando relatório...</p></div>';
    modal.classList.add('open');

    const html = await generateReportHTML(codIbge);
    content.innerHTML = html;
  }

  function closeModal() {
    const modal = document.getElementById('reportModal');
    if (modal) modal.classList.remove('open');
  }

  return {
    generateReportHTML,
    downloadPDF,
    renderReportList,
    previewReport,
    closeModal
  };
})();
