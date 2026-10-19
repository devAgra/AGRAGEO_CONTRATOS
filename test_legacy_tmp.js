const {JSDOM}=require('jsdom');
const fs=require('fs');
const src=fs.readFileSync('frontend/js/agrageo-suite.js','utf8');

// extrai as funções necessárias por linha (arquivo é 1 função/linha)
const lines=src.split('\n');
const get=(name)=>{for(const ln of lines){const m=ln.match(new RegExp('^(?:function|const|let)\\s+'+name+'[\\s=(]'));if(m)return ln;}throw new Error('missing '+name);};

const needed=['esc','money','isLegacyProposalHtml','applyEditables'];
let code=needed.map(get).join('\n');

const dom=new JSDOM('<!doctype html><body><div id="paper"><h3>5. INVESTIMENTO</h3><table class="tbl"><tr><td>novo</td></tr></table></div></body>',{url:'http://localhost'});
const fn=new Function('document',code+';return {applyEditables,isLegacyProposalHtml};');
const {applyEditables,isLegacyProposalHtml}=fn(dom.window.document);

const p=dom.window.document.getElementById('paper');
const fresh=p.innerHTML;

// Caso 1: proposta legada com editTexts antigos -> deve ser FORÇADAMENTE limpa via forceFresh
p.innerHTML=fresh;
applyEditables(p,['Linha do Tempo Sequencial','Fase 2 – Campo: Levantamento topográfico planimétrico'],true);
console.log('forceFresh descarta legados:', !/Linha do Tempo/.test(p.innerText)&&p._discardEditables===true?'PASS':'FAIL');

// Caso 2: detecção de HTML legado salvo em content.full
const legacy='<div><h3>CLIENTE</h3><p>Josiane</p><h3>5. COMPOSIÇÃO DOS SERVIÇOS E INVESTIMENTO</h3><p>Linha do Tempo Sequencial</p></div>';
const modern='<h3>5. INVESTIMENTO</h3><table><tr><th>ITEM</th><th>SERVIÇO / ESPECIFICAÇÃO</th></tr></table>';
console.log('detect legacy full:', isLegacyProposalHtml(legacy)?'PASS':'FAIL');
console.log('modern full ok:', isLegacyProposalHtml(modern)?'FAIL':'PASS');
console.log('detect header duplicado:', isLegacyProposalHtml('PROP-2026-0001 • Emitida em 16/10/2026 Validade: Esta proposta possui validade de')?'PASS':'FAIL');

// Caso 3: edições modernas compatíveis continuam preservadas
p.innerHTML=fresh;
const texts=['Apresentamos a nossa Proposta...','<tr><td>Editado pelo usuário</td></tr>'];
applyEditables(p,texts,false);
console.log('edições compatíveis preservadas:', /Editado pelo usuário/.test(p.innerHTML)?'PASS':'CHECK');
