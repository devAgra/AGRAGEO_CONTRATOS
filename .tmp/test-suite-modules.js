// Smoke test: extrai funções puras do módulo (sem DOM) e valida lógica de processos/custos
const fs=require('fs');
const src=fs.readFileSync('frontend/js/agrageo-suite.js','utf8');
// extract needed pure functions/consts
function grab(name){const m=src.match(new RegExp('(?:function|const)\\s+'+name+'[\\s\\S]*?\\n(?=(?:function|const|async function|\\/\\/))'));if(!m)throw new Error('not found '+name);return m[0];}
let code='';
code+=grab('PROC_STATUS')+'\n';
code+='const cache={processes:[]};\n';
code+=grab('nextProcNumber')+'\n';
code+=grab('costsFor')+'\n';
code+=grab('costsSum')+'\n';
code+=grab('profitInfo')+'\n';
code+=grab('eviFor')+'\n';
code+=grab('eviPrintHtml')+'\n'.replace(/\n$/,'')+'\n';
code+='const esc=s=>String(s==null?"":s);\n';
code+='module.exports={PROC_STATUS,nextProcNumber,costsFor,costsSum,profitInfo,eviFor,eviPrintHtml,cache};';
const tmp='/tmp/mod-extract.js';fs.writeFileSync(tmp,code);
const M=require(tmp);
// tests
M.cache.processes=[{number:'PROC-2026-0007'},{number:'PROC-2026-0012'}];
console.assert(M.nextProcNumber()==='PROC-2026-0013','proc numbering');
const doc={value:10500,content:{costs:[{desc:'parceiro',value:2000},{desc:'laboratório',value:1500}],evidences:[{type:'image/jpeg',dataUrl:'x',name:'a.jpg'},{type:'application/pdf',dataUrl:'y',name:'b.pdf'}]}};
console.assert(M.costsSum(doc)===3500,'costs sum');
const p=M.profitInfo(doc);
console.assert(p.res===7000&&p.margin===67,'profit/margin '+JSON.stringify(p));
console.assert(M.eviFor(doc).length===2,'ev for');
const html=M.eviPrintHtml(doc.content);
console.assert(html.includes('EVIDÊNCIAS DE CAMPO (1)')&&html.includes('a.jpg')&&!html.includes('b.pdf'),'print strip images only');
console.assert(M.PROC_STATUS.exigencia==='Exigência pendente','status map');
console.log('ALL MODULE TESTS PASSED');
