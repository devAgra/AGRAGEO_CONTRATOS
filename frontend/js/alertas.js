/* ================================================================
   HidroScanner — Módulo Alertas Inteligentes
   - Follow-up reminders: notifica leads com data de hoje
   - DIOE monitor: busca automática a cada 24h
   - Toast notifications (sem libs externas)
   ================================================================ */

const HidroAlertas = (() => {

  const KEY_LAST_CHECK = 'hidroscanner_dioe_lastcheck';
  const KEY_SAVED_QUERIES = 'hidroscanner_dioe_queries';
  const KEY_REMINDED = 'hidroscanner_reminded_today';

  // ── Toast nativo (sem dependências) ─────────────────────────
  function _toast(msg, tipo = 'info', duracao = 6000) {
    let container = document.getElementById('hidro-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'hidro-toast-container';
      container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:999999;display:flex;flex-direction:column;gap:8px;max-width:360px;';
      document.body.appendChild(container);
    }
    const cores = { info:'#3b82f6', success:'#22c55e', warning:'#f59e0b', danger:'#ef4444' };
    const icones = { info:'ℹ️', success:'✅', warning:'⚠️', danger:'🚨' };
    const toast = document.createElement('div');
    toast.style.cssText = `background:#1e293b;border:1.5px solid ${cores[tipo]}44;border-left:4px solid ${cores[tipo]};border-radius:10px;padding:12px 16px;color:#e2e8f0;font-size:0.82rem;box-shadow:0 8px 24px rgba(0,0,0,0.4);cursor:pointer;transition:opacity 0.3s;`;
    toast.innerHTML = `<span style="margin-right:7px;">${icones[tipo]}</span>${msg}`;
    toast.onclick = () => toast.remove();
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, duracao);
    return toast;
  }

  // ── Verifica leads com follow-up para hoje ───────────────────
  function verificarFollowUps() {
    if (!window.HidroLeads) return;
    const hoje = new Date().toISOString().split('T')[0];
    const jaLembrou = localStorage.getItem(KEY_REMINDED);
    if (jaLembrou === hoje) return; // já notificou hoje

    const leads = HidroLeads.getAll();
    const vencidos = leads.filter(l => {
      if (!l.followup_data) return false;
      return l.followup_data <= hoje && l.status !== 'Fechado' && l.status !== 'Perdido';
    });

    if (vencidos.length > 0) {
      // Notificação do browser se permitido
      if (Notification.permission === 'granted') {
        const n = new Notification('📅 HidroScanner — Follow-up pendente!', {
          body: `${vencidos.length} lead(s) com follow-up hoje: ${vencidos.slice(0,2).map(l=>l.nome||'Sem nome').join(', ')}${vencidos.length > 2 ? ' e outros...' : ''}`,
          icon: '/favicon.ico',
        });
        n.onclick = () => { window.focus(); if (window.AgRaGeo) AgRaGeo.switchTab('leads'); };
      }

      // Toast in-app
      _toast(
        `📅 <strong>${vencidos.length} follow-up(s)</strong> pendente(s) hoje!<br><span style="font-size:0.75rem;color:#94a3b8;">Abra a aba 🎯 Leads para ver.</span>`,
        'warning', 12000
      );
      localStorage.setItem(KEY_REMINDED, hoje);
    }

    // Prazo de proposta vencendo
    const prazoUrgente = leads.filter(l => {
      if (!l.prazo || l.status === 'Fechado' || l.status === 'Perdido') return false;
      const diff = Math.floor((new Date(l.prazo) - new Date()) / 86400000);
      return diff >= 0 && diff <= 3;
    });
    if (prazoUrgente.length > 0) {
      setTimeout(() => {
        _toast(
          `⏰ <strong>${prazoUrgente.length} lead(s)</strong> com prazo vencendo em até 3 dias!`,
          'danger', 10000
        );
      }, 2000);
    }
  }

  // ── Solicita permissão de notificação ───────────────────────
  function solicitarPermissaoNotificacao() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          _toast('🔔 Notificações ativadas! Você receberá alertas de follow-up.', 'success');
        }
      });
    }
  }

  // ── DIOE Monitor: busca automática a cada 24h ─────────────-
  async function verificarDIOEAutomatico() {
    if (!window.DiarioOficial) return;
    const lastCheck = localStorage.getItem(KEY_LAST_CHECK);
    const agora = Date.now();
    const INTERVALO = 24 * 60 * 60 * 1000; // 24h

    if (lastCheck && (agora - parseInt(lastCheck)) < INTERVALO) return;

    // Busca automática nos filtros salvos
    const queries = JSON.parse(localStorage.getItem(KEY_SAVED_QUERIES) || '[]');
    const defaultQuery = 'autuado SEMA ambiental';
    const queryBuscar = queries[0]?.query || defaultQuery;

    try {
      const params = new URLSearchParams({ querystring: queryBuscar, size: 5, offset: 0 });
      ['5103403','5107925','5107602','5107909','5100000'].forEach(t => params.append('territory_ids', t));
      const since = new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0];
      params.append('since', since);

      const res = await fetch(`https://queridodiario.ok.org.br/api/gazettes?${params}`, {
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) return;
      const data = await res.json();
      const total = data.total_gazettes || 0;

      localStorage.setItem(KEY_LAST_CHECK, String(agora));

      if (total > 0) {
        const toastEl = _toast(
          `📰 <strong>${total} nova(s) publicação(ões)</strong> no DIOE-MT sobre "${queryBuscar}"!<br><span style="font-size:0.74rem;color:#94a3b8;cursor:pointer;" onclick="AgRaGeo.switchTab('dioe');DiarioOficial.init()">👉 Clique aqui para ver</span>`,
          'warning', 15000
        );

        if (Notification.permission === 'granted') {
          const n = new Notification(`📰 DIOE-MT — ${total} nova(s) publicação(ões)`, {
            body: `Encontrado(s) sobre: "${queryBuscar}"`,
          });
          n.onclick = () => { window.focus(); };
        }
      }
    } catch (e) {
      // Silencioso — monitor não pode quebrar o sistema
    }
  }

  // ── Salvar query do DIOE para monitoramento ──────────────────
  function salvarQueryMonitorada(query, label) {
    const queries = JSON.parse(localStorage.getItem(KEY_SAVED_QUERIES) || '[]');
    const existe = queries.find(q => q.query === query);
    if (!existe) {
      queries.unshift({ query, label: label || query, savedAt: Date.now() });
      localStorage.setItem(KEY_SAVED_QUERIES, JSON.stringify(queries.slice(0, 10)));
      _toast(`🔔 Query "${label || query}" salva para monitoramento automático.`, 'success');
    }
  }

  // ── Inicialização principal ──────────────────────────────────
  function init() {
    // Solicita permissão de notificação numa ação do usuário
    document.addEventListener('click', () => solicitarPermissaoNotificacao(), { once: true });

    // Follow-up: verifica imediatamente
    setTimeout(() => verificarFollowUps(), 1500);

    // DIOE monitor: verifica após 3s (não bloquear load)
    setTimeout(() => verificarDIOEAutomatico(), 3000);
  }

  return { init, toast: _toast, salvarQueryMonitorada, verificarFollowUps, verificarDIOEAutomatico };

})();

// Auto-inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => HidroAlertas.init());
} else {
  setTimeout(() => HidroAlertas.init(), 500);
}
