const fs=require('fs');const src=fs.readFileSync('/workspace/frontend/js/agrageo-suite.js','utf8');
const m=src.match(/const SERVICES_CATALOG=(\[[\s\S]*?\]);\n/); if(!m) throw 'no catalog';
const CAT=eval(m[1]);
const fns=src.match(/const CAT_PROFS=[\s\S]*?function servicesGrid/)[0].replace(/function servicesGrid$/,'');
global.esc=s=>String(s==null?'':s); global.money=v=>'R$'+v;
global.PROF_ICONE={'GEOLOGIA':'⛏️','MEIO AMBIENTE':'🌱','GEOPROCESSAMENTO / SR':'🛰️','TOPOGRAFIA / GEODÉSIA':'📐'};
global.SERVICES_CATALOG=CAT; global.rowActions=()=>'';
new Function(fns+';this.svcMeta=svcMeta;this.servicesView=servicesView;').call(global);
const rows=[
 {name:'Requerimentos e Processos ANM',category:'GEOLOGIA / MEIO AMBIENTE — Mineração e Prospecção Mineral',codes:'CFO 231, CFO 232'},
 {name:'Processo de Licenciamento Ambiental (LP/LO/LI)',category:'MEIO AMBIENTE — Licenciamento e Conformidade',codes:'CFT',responsible:'Técnico em Meio Ambiente'},
 {name:'Fotogrametria com Drone (VANT)',category:'GEOPROCESSAMENTO / SR — Sensoriamento Remoto',codes:'Geoprocessamento, Fotogrametria, SR'},
 {name:'Nivelamento de Precisão',category:'TOPOGRAFIA / GEODÉSIA — Levantamentos',codes:'Topografia — Nivelamento, CFT'},
 {name:'Modelo Digital de Elevação',category:'Geoprocessamento',codes:''},
 {name:'Consultoria ambiental',category:'Meio Ambiente',codes:''},
 {name:'Levantamento cadastral',category:'Topografia',codes:''},
 {name:'Inventário florestal',category:'Parceiros',codes:''},
 {name:'WebGIS',category:'',codes:'Geoprocessamento'},
];
global.cache={services:rows};
let fails=0;
const profOf=n=>{const r=rows.find(x=>x.name===n);return r?global.svcMeta(r).prof:'?';};
for(const prof of ['GEOLOGIA','MEIO AMBIENTE','GEOPROCESSAMENTO / SR','TOPOGRAFIA / GEODÉSIA']){
  const v=global.servicesView(prof);const shown=rows.filter(r=>v.html.includes('<strong>'+r.name+'</strong>')).map(r=>r.name);
  const wrong=shown.filter(n=>profOf(n)!==prof);
  if(wrong.length){fails++;console.log('FAIL',prof,'shows wrong:',wrong);}else console.log('OK',prof,'->',shown.length,'items');
}
const all=global.servicesView('all').html;
if(all.includes('Inventário florestal')&&all.includes('WebGIS'))console.log('OK all shows OUTROS too');else{fails++;console.log('FAIL all');}
const gp=global.servicesView('GEOPROCESSAMENTO / SR').html;
const okGp=gp.includes('Modelo Digital de Elevação')&&gp.includes('WebGIS')&&!gp.includes('Inventário florestal');
console.log(okGp?'OK plain categories routed (Geoprocessamento/WebGIS via codes)':'FAIL GP plain');if(!okGp)fails++;
const ma=global.servicesView('MEIO AMBIENTE').html;
const okMa=ma.includes('Consultoria ambiental')&&!ma.includes('Requerimentos');
console.log(okMa?'OK plain Meio Ambiente routed; GEOLOGIA / MEIO AMBIENTE went to Geologia':'FAIL MA');if(!okMa)fails++;
process.exit(fails?1:0);
