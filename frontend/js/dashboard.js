/* ============================================================
   HidroScanner — Dashboard Module
   Chart.js charts + KPI rendering
   ============================================================ */

const HidroDashboard = (() => {
  let charts = {};

  // ── Chart.js global defaults ───────────────────────────────
  function configureChartDefaults() {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.pointStyleWidth = 8;
    Chart.defaults.plugins.legend.labels.padding = 16;
  }

  // ── Initialize all dashboard charts ────────────────────────
  async function init() {
    configureChartDefaults();

    const stats = await HidroAPI.getDashboardStats();

    renderKPIs(stats);
    renderWellsByMunicipioChart(stats);
    renderStatusPieChart(stats);
    renderDeficitBarChart(stats);
    renderUseTypeChart(stats);
    renderLeadsTable(stats);
  }

  // ── KPI Cards ──────────────────────────────────────────────
  function renderKPIs(stats) {
    _setKPI('kpiTotalPocos', stats.totalPocos);
    _setKPI('kpiIrregulares', stats.irregulares);
    _setKPI('kpiAvgDeficit', stats.avgDeficit + '%');
    _setKPI('kpiLeadsAlta', stats.leadsAlta);
  }

  function _setKPI(id, value) {
    const el = document.getElementById(id);
    if (el) {
      // Animate counter
      const target = typeof value === 'number' ? value : parseInt(value) || 0;
      const suffix = typeof value === 'string' && value.includes('%') ? '%' : '';
      _animateValue(el, 0, target, 1200, suffix);
    }
  }

  function _animateValue(el, start, end, duration, suffix = '') {
    const startTime = performance.now();
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = Math.round(start + (end - start) * eased);
      el.textContent = current.toLocaleString('pt-BR') + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // ── Wells by Municipality (horizontal bar) ─────────────────
  function renderWellsByMunicipioChart(stats) {
    const ctx = document.getElementById('chartMunicipio');
    if (!ctx) return;

    const data = stats.pocosPorMunicipio;
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 10);

    charts.municipio = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sorted.map(s => s[0]),
        datasets: [{
          label: 'Poços',
          data: sorted.map(s => s[1]),
          backgroundColor: 'rgba(0, 180, 212, 0.6)',
          borderColor: 'rgba(0, 180, 212, 1)',
          borderWidth: 1,
          borderRadius: 4,
          barThickness: 20
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { font: { size: 11 } }
          },
          y: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
          }
        }
      }
    });
  }

  // ── Status Pie Chart ───────────────────────────────────────
  function renderStatusPieChart(stats) {
    const ctx = document.getElementById('chartStatus');
    if (!ctx) return;

    charts.status = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Regular', 'Irregular', 'Vencido'],
        datasets: [{
          data: [stats.regulares, stats.irregulares, stats.vencidos],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(250, 204, 21, 0.8)'
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(250, 204, 21, 1)'
          ],
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 20, font: { size: 12 } }
          }
        }
      }
    });
  }

  // ── Deficit by Municipality (bar) ──────────────────────────
  function renderDeficitBarChart(stats) {
    const ctx = document.getElementById('chartDeficit');
    if (!ctx) return;

    const deficits = stats.deficits.sort((a, b) => b.perc_irregularidade - a.perc_irregularidade).slice(0, 10);

    charts.deficit = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: deficits.map(d => d.municipio),
        datasets: [
          {
            label: 'Outorgados',
            data: deficits.map(d => d.pocos_outorgados),
            backgroundColor: 'rgba(34, 197, 94, 0.6)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Estimados',
            data: deficits.map(d => d.pocos_estimados),
            backgroundColor: 'rgba(239, 68, 68, 0.3)',
            borderColor: 'rgba(239, 68, 68, 0.8)',
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { size: 11 } }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 }, maxRotation: 45 }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { font: { size: 11 } }
          }
        }
      }
    });
  }

  // ── Use Type Doughnut ──────────────────────────────────────
  function renderUseTypeChart(stats) {
    const ctx = document.getElementById('chartUso');
    if (!ctx) return;

    const data = stats.pocosPorUso;
    const colors = [
      'rgba(0, 180, 212, 0.8)',
      'rgba(45, 212, 191, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(250, 204, 21, 0.8)',
      'rgba(239, 68, 68, 0.8)'
    ];

    charts.uso = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(data),
        datasets: [{
          data: Object.values(data),
          backgroundColor: colors.slice(0, Object.keys(data).length),
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '55%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 12, font: { size: 10 } }
          }
        }
      }
    });
  }

  // ── Leads Table ────────────────────────────────────────────
  async function renderLeadsTable() {
    const tbody = document.getElementById('leadsTableBody');
    if (!tbody) return;

    const leads = await HidroAPI.getLeads();
    const sorted = leads.sort((a, b) => {
      const prio = { 'Alta': 0, 'Média': 1, 'Baixa': 2 };
      return (prio[a.prioridade] || 3) - (prio[b.prioridade] || 3);
    }).slice(0, 10);

    tbody.innerHTML = sorted.map(lead => `
      <tr>
        <td>
          <strong>${lead.nome_area}</strong>
        </td>
        <td>${lead.pocos_outorgados_raio}</td>
        <td>${lead.pocos_estimados}</td>
        <td>
          <span style="color: ${lead.perc_irregularidade > 40 ? '#ef4444' : lead.perc_irregularidade > 20 ? '#f59e0b' : '#22c55e'}; font-weight: 700;">
            ${lead.perc_irregularidade}%
          </span>
        </td>
        <td>
          <span class="lead-priority">
            <span class="dot ${lead.prioridade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}"></span>
            ${lead.prioridade}
          </span>
        </td>
        <td>${lead.potencial_hidrogeologico}</td>
        <td>
          <a href="/pages/municipio.html?cod=${lead.cod_ibge_municipio}" class="btn btn-sm btn-outline">📊</a>
        </td>
      </tr>
    `).join('');
  }

  return { init };
})();
