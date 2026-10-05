// Supabase Edge Function: sema-proxy
// Proxies WFS requests to SEMA-MT GeoServer to bypass CORS/SSL issues
// Deploy: npx supabase functions deploy sema-proxy --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// SEMA-MT GeoServer endpoints (try multiple)
const SEMA_ENDPOINTS = [
  "https://geo.sema.mt.gov.br/geoserver/Geoportal/ows",
  "http://geo.sema.mt.gov.br/geoserver/Geoportal/ows",
];

// Public authkey from SEMA-MT documentation
const SEMA_AUTHKEY = "541085de-9a2e-454e-bdba-eb3d57a2f492";

// Allowed layer names (whitelist to prevent abuse)
const ALLOWED_LAYERS: Record<string, string> = {
  embargadas: "Geoportal:AREAS_EMBARGADAS_SEMA",
  desembargadas: "Geoportal:AREAS_DESEMBARGADAS_SEMA",
  uso_restrito: "Geoportal:AREAS_USO_RESTRITO",
  outorgas_subterraneas: "Geoportal:SIGA2OUTORGA_MVGOUTCONCEDIDOSEMCALCULO",
  outorgas_superficiais: "Geoportal:SIGA2OUTORGA_MVGOUTCONCEDIDOCOMCALCULO",
  captacao_insignificante: "Geoportal:HIDRO_COORDENADA_CIA",
  unidades_conservacao: "Geoportal:UNIDADES_CONSERVACAO",
  nascentes: "Geoportal:CAR_NASCENTE",
  car_propriedades: "Geoportal:CAR_ATP",
  terras_indigenas: "Geoportal:TERRAS_INDIGENAS",
  cursos_dagua: "Geoportal:HID_CURSOS_DAGUA",
  autos_infracao: "Geoportal:AUTOS_DE_INFRACAO_SIGA_PONTO",
  // Licenciamento Ambiental
  licenca_previa: "Geoportal:SIMLAMGEO_LP_ATIVA",
  licenca_instalacao: "Geoportal:SIMLAMGEO_LI_ATIVA",
  licenca_operacao: "Geoportal:SIMLAMGEO_LO_ATIVA",
  // Autorizações e controle
  autorizacao_desmate: "Geoportal:AUTORIZACAO_DESMATE_SEMA",
  drdh: "Geoportal:HIDRO_COORDENADA_DRDH",
  diluicao_efluentes: "Geoportal:HIDRO_COORDENADA_DE",
  captacao_superficial: "Geoportal:HIDRO_COORDENADA_CS",
  // CAR detalhado
  car_app: "Geoportal:CAR_APP",
  car_arl: "Geoportal:CAR_ARL",
  car_arld: "Geoportal:SIMCAR_ARLD",
  car_appd: "Geoportal:CAR_APPD",
  // Assentamentos
  assentamentos: "Geoportal:ASSENTAMENTOS_INCRA",
  // Hidrografia e meio físico
  massa_dagua: "Geoportal:HID_MASSA_DAGUA",
  reservatorios: "Geoportal:SIMCAR_D_RESERVATORIO_ARTIFICIAL",
  veredas: "Geoportal:SIMCAR_D_VEREDAS",
  uso_consolidado: "Geoportal:USO_CONSOLIDADO",
  uc_amortecimento: "Geoportal:UC_AMORTECIMENTO",
  terras_indigenas_sema: "Geoportal:TERRAS_INDIGENAS",
  // Fiscalização e processos
  auto_inspecao: "Geoportal:AUTOS_TERMOS_AUTO_INSPECAO",
  notificacao: "Geoportal:AUTOS_TERMOS_NOTIFICACAO",
  termo_embargo: "Geoportal:TDAD_FISCALIZACAO_TERMO_DE_EMBARGO",
  termo_apreensao: "Geoportal:AUTOS_TERMOS_TERMO_APREENSAO",
  autuacao: "Geoportal:MVW_TIT_AUTUACAO",
  termos_compromisso: "Geoportal:MVW_REQUERIMENTO_TAC",
  embargo_siga_ponto: "Geoportal:AREA_EMBARGADA_SIGA_PONTO",
  embargo_siga_poligono: "Geoportal:AREA_EMBARGADA_SIGA_POLIGONO",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const layer = url.searchParams.get("layer") || "embargadas";
    const maxFeatures = url.searchParams.get("maxFeatures") || "500";
    const cqlFilter = url.searchParams.get("cql_filter") || null;

    // Validate layer name
    const typeName = ALLOWED_LAYERS[layer];
    if (!typeName) {
      return new Response(
        JSON.stringify({
          error: `Layer '${layer}' not allowed. Valid: ${Object.keys(ALLOWED_LAYERS).join(", ")}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build WFS request parameters
    const params = new URLSearchParams({
      service: "WFS",
      version: "1.0.0",
      request: "GetFeature",
      typeName: typeName,
      outputFormat: "application/json",
      maxFeatures: maxFeatures,
      authkey: SEMA_AUTHKEY,
    });

    if (cqlFilter) {
      params.set("CQL_FILTER", cqlFilter);
    }

    console.log(`[sema-proxy] Fetching: ${typeName} (max: ${maxFeatures})`);

    // Try each endpoint
    let lastError = "";
    for (const baseUrl of SEMA_ENDPOINTS) {
      try {
        const wfsUrl = `${baseUrl}?${params.toString()}`;
        console.log(`[sema-proxy] Trying: ${baseUrl}`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(wfsUrl, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          lastError = `HTTP ${response.status}`;
          console.warn(`[sema-proxy] ${baseUrl} returned ${response.status}`);
          continue;
        }

        const data = await response.text();

        let geojson;
        try {
          geojson = JSON.parse(data);
        } catch {
          lastError = "Invalid JSON";
          console.warn(`[sema-proxy] ${baseUrl} returned invalid JSON`);
          continue;
        }

        const featureCount = geojson.features?.length || 0;
        console.log(
          `[sema-proxy] ✅ ${featureCount} features from ${baseUrl}`
        );

        return new Response(JSON.stringify(geojson), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600",
          },
        });
      } catch (err: any) {
        lastError =
          err.name === "AbortError"
            ? "Timeout (30s)"
            : err.message || "Connection error";
        console.warn(`[sema-proxy] ${baseUrl} failed: ${lastError}`);
        continue;
      }
    }

    // All endpoints failed
    return new Response(
      JSON.stringify({
        error: `SEMA-MT indisponível. Última falha: ${lastError}`,
        features: [],
        type: "FeatureCollection",
      }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("[sema-proxy] Fatal:", err);
    return new Response(
      JSON.stringify({
        error: err.message || "Internal error",
        features: [],
        type: "FeatureCollection",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
