// Teste end-to-end da lógica de "legacy full" replicando o bloco patchado de openDoc
const {JSDOM}=require('jsdom');
const fs=require('fs');
const src=fs.readFileSync('frontend/js/agrageo-suite.js','utf8');
const lines=src.split('\n');
const get=(name)=>{for(const ln of lines){const m=ln.match(new RegExp('^(?:function|const|let)\\s+'+name+'[\\s=(]'));if(m)return ln;}throw new Error('missing '+name);};

// 1) docBase deve expor fullHtml a partir de content.full
const docBaseLine=get('docBase');
console.log('docBase expõe fullHtml:', /fullHtml:\(obj\.content&&typeof obj\.content==='object'&&typeof obj\.content\.full==='string'\)\?obj\.content\.full:''/.test(docBaseLine)?'PASS':'FAIL');

// 2) openDoc: _legacyProp usa opts.fullHtml e força template limpo
const openDocBlock=lines.filter(l=>l.includes('_legacyProp'));
console.log('openDoc detecta via opts.fullHtml:', openDocBlock.some(l=>/isLegacyProposalHtml\(\(opts&&opts\.fullHtml\)\|\|''\)/.test(l))?'PASS':'FAIL');
console.log('openDoc pula applyEditables quando legado:', openDocBlock.some(l=>/if\(obj\.editTexts&&obj\.editTexts\.length&&!_legacyProp\)/.test(l))?'PASS':'FAIL');
console.log('openDoc purga content.full no servidor:', openDocBlock.some(l=>/delete _pc\.full;_c\.from\('documents'\)\.update/.test(l))?'PASS':'FAIL');

// 3) load(): remove content.full legado em cache antes de renderizar
const loadLine=lines.find(l=>l.startsWith('async function load'));
console.log('load limpa content.full legado:', /cache\.proposals\.forEach\(d=>\{if\(d\.content&&typeof d\.content==='object'\)\{if\(isLegacyProposalHtml\(d\.content\.full\|\|''\)\)\{delete d\.content\.full;\}/.test(loadLine)?'PASS':'FAIL');

// 4) sanitizeLegacyDocs: fixFull também purga content.full
const sanLine=get('sanitizeLegacyDocs');
console.log('sanitize purga content.full + editTexts legados:', /fixFull/.test(sanLine)&&/delete pc\.full/.test(sanLine)?'PASS':'FAIL');

// 5) readBack grava tplVersion e doc-save remove full legado antes de salvar
const rb=get('readBack');
console.log('readBack marca tplVersion=3:', /c\.full=p\.innerHTML;c\.tplVersion=3;/.test(rb)?'PASS':'FAIL');
const saveLines=lines.filter(l=>l.includes("doc-save').onclick"));
console.log('doc-save remove full legado ao salvar:', saveLines.some(l=>/isLegacyProposalHtml\(patch\.content&&patch\.content\.full\|\|''\)/.test(l))?'PASS':'FAIL');

// 6) comportamento runtime: com fullHtml legado, o fluxo escolhe template novo
const dom=new JSDOM('<!doctype html><body></body>',{url:'http://localhost'});
const fn=new Function('document',get('isLegacyProposalHtml')+'\nreturn isLegacyProposalHtml;');
const isLegacy=fn(dom.window.document);
const legacyFull='<div class="paper"><h3>CLIENTE</h3><h3>5. COMPOSIÇÃO DOS SERVIÇOS E INVESTIMENTO</h3> Linha do Tempo Sequencial Fase 2 – Campo</div>';
const opts={fullHtml:legacyFull};
const content={full:legacyFull,editTexts:['x']};
const _legacyProp=true&&(isLegacy(opts.fullHtml||'')||isLegacy(content.full||''));
console.log('simulação openDoc legado ->',_legacyProp?'PASS (template novo forçado)':'FAIL');
const modernFull='<h3>5. INVESTIMENTO</h3><table><tr><th>ITEM</th><th>SERVIÇO / ESPECIFICAÇÃO</th><th>TOTAL</th></tr></table>';
console.log('proposta moderna não é marcada legado ->',isLegacy(modernFull)?'FAIL':'PASS');
