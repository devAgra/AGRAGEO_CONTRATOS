// Smoke test do módulo Fiscal (reproduz as funções puras do app)
const now=new Date('2026-10-09T10:00:00');
const ymOf=(o)=>{const d=new Date(now);d.setDate(1);d.setMonth(d.getMonth()+o);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};
function fisDueDate(rec,ym){const p=ym.split('-');const d=Number(rec.due_day||5);return new Date(Number(p[0]),Number(p[1])-1,Math.min(d,new Date(Number(p[0]),Number(p[1]),0).getDate()),12,0,0)}
function fisStatusOf(rec,ym){const st=(rec.done||{})[ym];if(st)return{st,k:st==='pago'?'ok':st==='sem_movimento'?'sm':'done'};const due=fisDueDate(rec,ym);if(now>due)return{st:'vencida',k:'late'};const days=Math.ceil((due-now)/864e5);if(days<=7)return{st:'próxima',k:'soon',days,due};return{st:'no prazo',k:'ok_future',days,due}}
const cur=ymOf(0),prev=ymOf(-1);
const pgdas={name:'PGDAS-D',due_day:5,period:'M',active:true,done:{[cur]:'sem_movimento'}};
const dctf={name:'DCTFWeb',due_day:20,period:'M',active:true,done:{}};
let s=fisStatusOf(pgdas,cur);console.log('PGDAS mês atual marcado sem movimento =>',s.st,s.k); if(s.k!=='sm')throw 'FAIL sm';
s=fisStatusOf(pgdas,prev);console.log('PGDAS mês anterior não entregue (hoje 09/10, venceu 05/10) =>',s.st,s.k); if(s.k!=='late')throw 'FAIL late';
s=fisStatusOf(dctf,cur);console.log('DCTF dia 20 (hoje dia 09, faltam ~11d) =>',s.st,s.k,s.days); if(s.k!=='ok_future')throw 'FAIL future';
// sino: se estivesse no dia 14/10, DCTF entraria como "em <=7 dias"
now.setDate(14);s=fisStatusOf(dctf,cur);console.log('No dia 14 =>',s.st,s.k,s.days); if(s.k!=='soon')throw 'FAIL soon';
// seed ids únicos
console.log('ALL FISCAL TESTS PASSED');
