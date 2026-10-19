// Renderiza propTpl com um objeto de proposta contendo content.full LEGADO e verifica o fluxo completo de openDoc (parte replicada)
const {JSDOM}=require('jsdom');
const fs=require('fs');
const src=fs.readFileSync('frontend/js/agrageo-suite.js','utf8');
const lines=src.split('\n');
const get=(name)=>{for(const ln of lines){let m=ln.match(new RegExp('^(?:function|const|let)\\s+'+name+'[\\s=(]'));if(m)return ln;m=ln.match(new RegExp('^const\\s+[^;]*\\b'+name+'\\s*='));if(m)return ln;}throw new Error('missing '+name);};
global.Node={TEXT_NODE:3,ELEMENT_NODE:1};
const names=['esc','money','propTpl','etHtml','validityText','validityExtenso','numExtenso','cleanValidity','localDataLine','fichaHtml','etItems','etLineTotal','propTotal','dataPorExtenso','rtLineHtml','acLbl','AC_H','AC_ON','secN','execLineHtml','isLegacyProposalHtml'];
let code=names.map(get).join('\n');
const dom=new JSDOM('<!doctype html><body><div id="paper"></div></body>',{url:'http://localhost'});
const fn=new Function('document',code+';return {propTpl,isLegacyProposalHtml};');
const {propTpl,isLegacyProposalHtml}=fn(dom.window.document);

const legacyFull='<h1>PROPOSTA COMERCIAL</h1><p>PROP-2026-0001 • Emitida em 16/10/2026 • Validade: Esta proposta possui validade de Esta proposta possui validade de 15 dias a contar da data de emissão. a contar...</p><h3>CLIENTE</h3><h3>5. COMPOSIÇÃO DOS SERVIÇOS E INVESTIMENTO</h3><p>Linha do Tempo Sequencial</p><p>Fase 2 – Campo: Levantamento topográfico planimétrico</p><h3>CONTRATANTE Nome: ____ CPF/CNPJ: ____</h3>';

const opts={number:'PROP-2026-0001',date:'16/10/2026',company:'AGRAGEO CONSULTORIA',cnpj:'47.570.284/0001-15',addr:'',phone:'(65) 8139-0282',email:'contato@agrageo.com',city:'Várzea Grande - MT',clientName:'Josiane Maria Surdi',clientDoc:'889.919.461-00',clientAddr:'Rua A, Quadra 02, Lote 23',clientPhone:'(65) 9...',clientCity:'Várzea Grande - MT',value:6400,deadline:'',payment:'R$ 6.400,00',validity:'15 dias',scope:'',origin:'',acompanhamento:[],etapas:[{desc:'Levantamento Topografico',prazo:'1 dia',qty:1,value:6400}],execMode:'PRÓPRIO',fichas:[],fullHtml:legacyFull};

// fluxo patchado de openDoc:
const p=dom.window.document.getElementById('paper');
p.innerHTML=propTpl(opts); // docHtml(type,opts) renderiza template novo
const _legacyProp=isLegacyProposalHtml(opts.fullHtml||'')||isLegacyProposalHtml(legacyFull);
if(_legacyProp){/* deleta content.full, pula applyEditables */}
const text=p.innerText;
console.log('_legacyProp detectado:',_legacyProp?'PASS':'FAIL');
console.log('render NÃO contém "Linha do Tempo":',!/Linha do Tempo/.test(text)?'PASS':'FAIL');
console.log('render NÃO contém "Fase 2":',!/Fase 2/.test(text)?'PASS':'FAIL');
console.log('render NÃO contém "COMPOSIÇÃO DOS SERVIÇOS":',!/COMPOSIÇÃO DOS SERVIÇOS/.test(text)?'PASS':'FAIL');
console.log('render NÃO contém bloco CONTRATANTE sublinhado:',!/Nome: ____/.test(text)?'PASS':'FAIL');
console.log('render contém nova seção 5 INVESTIMENTO:',/5\. INVESTIMENTO/.test(text)&&/ITEM/.test(text)&&/VALOR UNITÁRIO/.test(text)?'PASS':'FAIL');
console.log('render contém tabela DADOS DA CONTRATADA E DO CONTRATANTE:',/DADOS DA CONTRATADA E DO CONTRATANTE/.test(text)?'PASS':'FAIL');
console.log('TOTAL calculado R$ 6.400,00 presente:',/TOTAL[\s\S]{0,40}6\.400,00/.test(text)?'PASS':'FAIL');
