/* ============================================================
   HidroScanner — Auth Module
   Handles login/logout/session with mock fallback.
   When Supabase is configured, uses Supabase Auth.
   ============================================================ */

const HidroAuth = (() => {
  // ── Mock credentials ───────────────────────────────────────
  const MOCK_USERS = [
    {
      email: 'alexagra.contato@gmail.com',
      password: 'HidroScanner@2026',
      name: 'Alexandre Agra',
      role: 'admin',
      company: 'Agrageo Consultoria'
    }
  ];

  const SESSION_KEY = 'hidroscanner_session';

  // ── Supabase client (null until configured) ────────────────
  let supabaseClient = null;

  function initSupabase() {
    if (typeof window.SUPABASE_URL !== 'undefined' &&
        typeof window.SUPABASE_KEY !== 'undefined' &&
        window.SUPABASE_URL && window.SUPABASE_KEY) {
      try {
        supabaseClient = window.supabase.createClient(
          window.SUPABASE_URL,
          window.SUPABASE_KEY
        );
        console.log('[HidroAuth] Supabase initialized');
      } catch (e) {
        console.warn('[HidroAuth] Supabase init failed, using mock:', e);
      }
    } else {
      console.log('[HidroAuth] No Supabase config, using mock auth');
    }
  }

  // ── Login ──────────────────────────────────────────────────
  async function login(email, password) {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw new Error(error.message);
      const session = {
        user: {
          email: data.user.email,
          name: data.user.user_metadata?.name || email.split('@')[0],
          role: data.user.user_metadata?.role || 'user',
          company: data.user.user_metadata?.company || ''
        },
        token: data.session.access_token,
        authenticated: true,
        timestamp: Date.now()
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return session;
    }

    // Mock login
    const user = MOCK_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
      throw new Error('Credenciais inválidas. Verifique seu email e senha.');
    }

    const session = {
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company
      },
      token: 'mock_token_' + Date.now(),
      authenticated: true,
      timestamp: Date.now()
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  // ── Logout ─────────────────────────────────────────────────
  async function logout() {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
    localStorage.removeItem(SESSION_KEY);
    window.location.href = '/pages/login.html';
  }

  // ── Session check ──────────────────────────────────────────
  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (!session.authenticated) return null;
      // Session expires after 24h
      if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  function isAuthenticated() {
    return getSession() !== null;
  }

  function getUser() {
    const session = getSession();
    return session ? session.user : null;
  }

  function getUserInitials() {
    const user = getUser();
    if (!user || !user.name) return '??';
    return user.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  // ── Auth guard (redirect to login if not authenticated) ────
  function requireAuth() {
    if (!isAuthenticated()) {
      window.location.href = '/pages/login.html';
      return false;
    }
    return true;
  }

  // ── Initialize ─────────────────────────────────────────────
  function init() {
    initSupabase();
  }

  return {
    init,
    login,
    logout,
    getSession,
    isAuthenticated,
    getUser,
    getUserInitials,
    requireAuth
  };
})();

// Auto-init on load
document.addEventListener('DOMContentLoaded', () => HidroAuth.init());
