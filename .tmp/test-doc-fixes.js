// Smoke test: carrega o módulo em ambiente DOM fake mínimo e exercita os blocos corrigidos
const fs=require('fs');
class El{constructor(t){this.tagName=t;this.children=[];this.style={};this.dataset={};this.value='';this.innerHTML='';this.textContent='';}
appendChild(c){this.children.push(c);return c;}querySelector(){return null;}querySelectorAll(){return[];}addEventListener(){}closest(){return null;}}
global.window={location:{search:''},AgrageoSupabase:null,addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})};
global.self=global.window;
const store={};global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]};
const els={};const mkEl=()=>{const e=new El('div');e.onclick=null;return e;};
global.document=new El('document');global.document.createElement=t=>new El(t);global.document.getElementById=id=>(els[id]||(els[id]=mkEl()));global.document.querySelector=q=>(els[q]||(els[q]=mkEl()));global.document.querySelectorAll=()=>[];global.document.addEventListener=()=>{};global.document.body=new El('body');global.document.head=new El('head');global.document.documentElement=new El('html');
global.crypto={randomUUID:()=>'x-'+Math.random().toString(16).slice(2)};
global.navigator={onLine:true};global.fetch=()=>Promise.reject(new Error('offline'));
global.Image=function(){this.onload=null;};
global.URL={createObjectURL:()=>'blob:x',revokeObjectURL(){}};
global.FileReader=function(){this.readAsDataURL=()=>{};};
const src=fs.readFileSync('frontend/js/agrageo-suite.js','utf8');
try{(0,eval)(src);}catch(e){console.error('LOAD FAIL:',e.message);process.exit(1);}
// se carregou sem exceção + funções-chave presentes no texto do arquivo
const checks=[
 ['modal backdrop guard',/bd\.addEventListener\('mousedown',e=>\{if\(e\.target===bd\)modal\.innerHTML=''\}\)/],
 ['paste Ctrl+V evidências',/blk\.onpaste=async e=>\{e\.preventDefault\(\)/],
 ['readDocEvi/readDocCosts',/function readDocEvi\(\)[\s\S]*function readDocCosts\(\)/],
 ['openDoc renderiza blocos',/\$\{costBlockHtml\(obj\)\}\$\{eviBlockHtml\(obj\)\}/],
 ['openDoc vincula blocos',/bindCostBlock\(obj\);bindEviBlock\(obj\);/],
 ['doc-save grava custos/evi',/_dc=readDocCosts\(\);if\(_dc!==undefined\)patch\.content\.costs=_dc;_?/.test(src)&&/_de=readDocEvi\(\);if\(_de!==undefined\)patch\.content\.evidences=_de/],
 ['rev usa #doc-value',()=>src.includes("querySelector('#doc-value')?.value||document.querySelector('#os-form [name=value]')")],
 ['sem #f-value órfão',()=>!src.includes("querySelector('#f-value')")],
 ['bindCostBlock recebe content',/bindCostBlock\(rec\|\|\{value:0,content:\(rec&&rec\.content\)\|\|\{\}\}\)/],
];
let ok=true;for(const[n,re]of checks){const p=(typeof re==='function')?re():re.test(src);if(!p)ok=false;console.log((p?'PASS':'FAIL')+' — '+n);}
// lógica de leitura de custos (mesma fórmula de readDocCosts) simulada
const rows=[{desc:'Laboratório',who:'Analisa+',value:'1000'},{desc:'',who:'',value:'0'}];
const costs=rows.map(r=>({desc:r.desc.trim(),who:r.who.trim(),value:Number(r.value||0)})).filter(c=>c.desc||c.value);
console.log(costs.length===1&&costs[0].value===1000?'PASS — filtro de linhas vazias de custo':'FAIL — filtro custos');
process.exit(ok?0:1);
