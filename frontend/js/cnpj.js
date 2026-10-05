/* ================================================================
   HidroScanner — Módulo CNPJ e Inteligência
   Consulta automática de CNPJ usando BrasilAPI
   ================================================================ */

const HidroCNPJ = (() => {

  const _toast = window.HidroAlertas ? HidroAlertas.toast : (msg) => alert(msg.replace(/<[^>]+>/g, ''));

  // CNAEs de alto impacto ambiental/hídrico para sugestão automática
  const CNAES_CRITICOS = [
    { cnae: '1011', servico: 'Outorga Captação + ETE Abatedouro', urgencia: 'Alto' },
    { cnae: '1012', servico: 'Outorga Captação + ETE Abatedouro', urgencia: 'Alto' },
    { cnae: '1051', servico: 'Outorga Diluição Laticínio + PRAD', urgencia: 'Alto' },
    { cnae: '1041', servico: 'Outorga Agroindústria + EIA', urgencia: 'Alto' },
    { cnae: '0710', servico: 'Licença ANM + EIA/RIMA + Outorga', urgencia: 'Crítico' },
    { cnae: '0890', servico: 'Licença ANM + PRAD + Outorga', urgencia: 'Crítico' },
    { cnae: '0810', servico: 'PRAD + Licença de Instalação (Areia/Cascalho)', urgencia: 'Alto' },
    { cnae: '4731', servico: 'Poço Sentinela + PGRSS (Posto de Combustível)', urgencia: 'Alto' },
    { cnae: '0111', servico: 'CAR + Outorga de Irrigação (Soja/Algodão)', urgencia: 'Médio' },
    { cnae: '0115', servico: 'CAR + Outorga de Irrigação (Soja/Algodão)', urgencia: 'Médio' }
  ];

  async function buscarCNPJ() {
    const input = document.getElementById('hlm-cpfcnpj');
    if (!input) return;
    
    let cnpj = input.value.replace(/\D/g, '');
    if (cnpj.length !== 14) {
      _toast('⚠️ Digite um CNPJ válido com 14 dígitos para buscar.', 'warning');
      return;
    }

    _toast('⌛ Consultando Receita Federal...', 'info', 2000);
    const btn = document.getElementById('btn-buscar-cnpj');
    if (btn) btn.innerHTML = '⏳';

    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (!res.ok) throw new Error('CNPJ não encontrado ou erro na API');
      const data = await res.json();

      // Preenche os campos do modal
      const sv = (id, val) => { 
        const el = document.getElementById(id); 
        if (el && !el.value) el.value = val || ''; 
      };

      sv('hlm-nome', data.razao_social);
      sv('hlm-municipio', data.municipio ? `${data.municipio} - ${data.uf}` : '');
      
      if (data.ddd_telefone_1) sv('hlm-telefone', data.ddd_telefone_1);
      if (data.email) sv('hlm-email', data.email.toLowerCase());

      // Observações inteligentes
      let obsAdicional = `📍 CNPJ Ativo desde: ${data.data_inicio_atividade || ''}\n`;
      obsAdicional += `🏢 CNAE Principal: ${data.cnae_fiscal_descricao || ''} (${data.cnae_fiscal || ''})\n`;
      obsAdicional += `📍 Situação Cadastral: ${data.descricao_situacao_cadastral || ''}\n`;
      obsAdicional += `📌 Endereço: ${data.logradouro||''}, ${data.numero||''}, ${data.bairro||''}, ${data.cep||''}\n`;
      
      const elObs = document.getElementById('hlm-obs');
      if (elObs) {
        if (elObs.value && !elObs.value.includes('CNPJ Ativo')) {
          elObs.value = elObs.value + '\n\n' + obsAdicional;
        } else if (!elObs.value) {
          elObs.value = obsAdicional;
        }
      }

      // Sugestão de serviço baseada no CNAE
      if (data.cnae_fiscal) {
        let prefix = String(data.cnae_fiscal).substring(0, 4);
        const match = CNAES_CRITICOS.find(c => c.cnae === prefix);
        if (match) {
          sv('hlm-servico', match.servico);
          if (document.getElementById('hlm-urgencia') && !document.getElementById('hlm-urgencia').value) {
            const u = document.querySelector(`.hlm-ub[data-urg="${match.urgencia}"]`);
            if (u) window._hlmUrg(u, match.urgencia);
          }
          _toast(`🎯 Sugestão de serviço preenchida via CNAE (${prefix}).`, 'success');
        } else {
          _toast('✅ Dados do CNPJ preenchidos com sucesso.', 'success');
        }
      } else {
        _toast('✅ Dados preenchidos com sucesso.', 'success');
      }

    } catch (err) {
      _toast(`❌ Erro: ${err.message}`, 'danger');
    } finally {
      if (btn) btn.innerHTML = '🔍 Buscar';
    }
  }

  return { buscarCNPJ };

})();
