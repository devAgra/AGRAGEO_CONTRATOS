/**
 * HidroScanner — Supabase Database Setup
 * Run this script ONCE to create all tables and configure auth.
 * Usage: Open in browser console or run with Node.js
 */

const SUPABASE_URL = 'https://qwnkfznflwxzssgmzbor.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3bmtmem5mbHd4enNzZ216Ym9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDIwMDkyOCwiZXhwIjoyMDg5Nzc2OTI4fQ.30eMOg5ONyk3KW3sAHPyrZVZP989X22_RcB_3CqO9GI';

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
};

// ── SQL to create all tables ──
const SQL_MIGRATIONS = `
-- ===========================================
-- HidroScanner — Database Schema
-- ===========================================

-- 1. Poços (dados SIAGAS + CNARH combinados)
CREATE TABLE IF NOT EXISTS pocos (
  id BIGSERIAL PRIMARY KEY,
  codigo_siagas VARCHAR(20) UNIQUE,
  codigo_cnarh BIGINT,
  numero_outorga VARCHAR(50),
  municipio VARCHAR(200),
  cod_ibge_municipio VARCHAR(10),
  uf VARCHAR(2) DEFAULT 'MT',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  profundidade_m DOUBLE PRECISION,
  vazao_m3h DOUBLE PRECISION,
  nivel_estatico DOUBLE PRECISION,
  nivel_dinamico DOUBLE PRECISION,
  situacao VARCHAR(50) DEFAULT 'Regular',
  uso_principal VARCHAR(100),
  aquifero VARCHAR(100),
  fonte_dado VARCHAR(50) DEFAULT 'SIAGAS/SGB',
  
  -- Dados de Outorga (CNARH)
  dt_outorga_inicio DATE,
  dt_outorga_fim DATE,
  outorga_valida BOOLEAN DEFAULT true,
  tipo_ato VARCHAR(100),
  numero_ato VARCHAR(50),
  orgao_gestor VARCHAR(100),
  finalidade VARCHAR(200),
  vazao_outorgada DOUBLE PRECISION,
  volume_anual DOUBLE PRECISION,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Outorgas CNARH (dados brutos da ANA — fonte complementar)
CREATE TABLE IF NOT EXISTS outorgas_cnarh (
  id BIGSERIAL PRIMARY KEY,
  int_cd BIGINT,
  int_nu_cnarh BIGINT,
  int_nu_siagas VARCHAR(20),
  municipio VARCHAR(200),
  uf VARCHAR(2),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  finalidade VARCHAR(200),
  vazao_media DOUBLE PRECISION,
  volume_anual DOUBLE PRECISION,
  profundidade DOUBLE PRECISION,
  dt_outorga_inicio VARCHAR(10),
  dt_outorga_fim VARCHAR(10),
  outorga_valida DOUBLE PRECISION,
  tipo_ato VARCHAR(100),
  numero_ato VARCHAR(50),
  orgao_gestor VARCHAR(100),
  orgao_uf VARCHAR(2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Municípios MT (cache local do IBGE)
CREATE TABLE IF NOT EXISTS municipios (
  id BIGSERIAL PRIMARY KEY,
  cod_ibge VARCHAR(10) UNIQUE,
  nome VARCHAR(200),
  populacao INTEGER,
  area_km2 DOUBLE PRECISION,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  total_pocos INTEGER DEFAULT 0,
  pocos_regulares INTEGER DEFAULT 0,
  pocos_irregulares INTEGER DEFAULT 0,
  pocos_vencidos INTEGER DEFAULT 0,
  deficit_percentual DOUBLE PRECISION DEFAULT 0,
  prioridade VARCHAR(20) DEFAULT 'Baixa',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Logs de ETL
CREATE TABLE IF NOT EXISTS etl_logs (
  id BIGSERIAL PRIMARY KEY,
  fonte VARCHAR(50),
  tipo VARCHAR(20),
  registros_processados INTEGER DEFAULT 0,
  registros_inseridos INTEGER DEFAULT 0,
  registros_atualizados INTEGER DEFAULT 0,
  erro TEXT,
  duracao_segundos DOUBLE PRECISION,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes for performance ──
CREATE INDEX IF NOT EXISTS idx_pocos_municipio ON pocos(municipio);
CREATE INDEX IF NOT EXISTS idx_pocos_situacao ON pocos(situacao);
CREATE INDEX IF NOT EXISTS idx_pocos_uf ON pocos(uf);
CREATE INDEX IF NOT EXISTS idx_pocos_lat_lng ON pocos(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_pocos_cod_ibge ON pocos(cod_ibge_municipio);
CREATE INDEX IF NOT EXISTS idx_pocos_dt_outorga_fim ON pocos(dt_outorga_fim);
CREATE INDEX IF NOT EXISTS idx_outorgas_uf ON outorgas_cnarh(uf);
CREATE INDEX IF NOT EXISTS idx_outorgas_siagas ON outorgas_cnarh(int_nu_siagas);
CREATE INDEX IF NOT EXISTS idx_municipios_cod ON municipios(cod_ibge);

-- ── RLS (Row Level Security) ──
ALTER TABLE pocos ENABLE ROW LEVEL SECURITY;
ALTER TABLE outorgas_cnarh ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipios ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all data
CREATE POLICY IF NOT EXISTS "Allow authenticated read pocos" ON pocos
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY IF NOT EXISTS "Allow authenticated read outorgas" ON outorgas_cnarh
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY IF NOT EXISTS "Allow authenticated read municipios" ON municipios
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY IF NOT EXISTS "Allow authenticated read logs" ON etl_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service_role to write
CREATE POLICY IF NOT EXISTS "Allow service write pocos" ON pocos
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Allow service write outorgas" ON outorgas_cnarh
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Allow service write municipios" ON municipios
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Allow service write logs" ON etl_logs
  FOR ALL USING (auth.role() = 'service_role');
`;

async function runMigration() {
  console.log('🚀 HidroScanner — Criando tabelas no Supabase...\n');

  try {
    // Use the SQL endpoint via the management API 
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    });

    // Since we can't run raw SQL via REST, we'll log the SQL for the user
    console.log('⚠️  O Supabase REST API não suporta SQL direto.');
    console.log('📋 Copie o SQL abaixo e cole no SQL Editor do Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/qwnkfznflwxzssgmzbor/sql/new\n');
    console.log('='.repeat(60));
    console.log(SQL_MIGRATIONS);
    console.log('='.repeat(60));
    console.log('\n✅ Após executar o SQL, o schema estará pronto!');
  } catch (err) {
    console.error('Erro:', err.message);
  }
}

// Export SQL for direct use
console.log(SQL_MIGRATIONS);
