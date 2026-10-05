/* Agrageo Suite — Supabase adapter.
   The browser may safely receive the Supabase project URL and anon/publishable key.
   Never place service_role or database passwords in this file. */
(() => {
  'use strict';
  const cfg = window.__AGRAGEO_CONFIG__ || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) return;
  try {
    window.AgrageoSupabase = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    window.dispatchEvent(new CustomEvent('agrageo:supabase-ready'));
  } catch (error) {
    console.error('[Agrageo] Supabase initialization failed');
  }
})();
