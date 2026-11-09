const C=require('./simulation/campaign-core-v22.js'),base=require('./simulation/campaign-core-v19.js'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const s=base.create(6);C.enable(s);const log=[],checks=[];function cmd(c){const r=C.command(s,c);assert(r.ok,r.error+' '+JSON.stringify(c));C.validate(s);}function next(){assert(C.advance(s,s.nextTick).ok);C.validate(s);log.push({turn:s.turn,silver:s.economy.treasury,grain:s.economy.grain,debt:s.debt.principal,land:s.regions.filter(r=>r.owner==='crown').length,net:C.forecast(s).silver,grainNet:C.forecast(s).grain});}function fight(id,orders){const a=C.freeArmy(s),army={shield:Math.min(240,a.shield),bow:Math.min(100,a.bow),cavalry:Math.min(60,a.cavalry)};const max=Math.min(400,C.troops(a)-200);let over=C.troops(army)-max;for(const k of ['shield','bow','cavalry']){const n=Math.min(Math.max(0,over),army[k]);army[k]-=n;over-=n;}cmd({type:'attack',region:id,commander:'zhou19',army});for(const order of orders)if(s.battle.status==='fighting')cmd({type:'order',order});assert.equal(s.battle.status,'won','Unable to win '+id);}
cmd({type:'recruit',id:'zhou19'});cmd({type:'scout',region:'ji'});next();cmd({type:'train'});fight('ji',['hold','flank','charge','volley','charge']);next();cmd({type:'recruit',id:'shen19'});cmd({type:'appoint',region:'ji',id:'shen19'});next();cmd({type:'supplies'});cmd({type:'scout',region:'pass'});cmd({type:'station22',region:'south',amount:200});next();cmd({type:'station22',region:'south',amount:0});cmd({type:'train'});fight('pass',['volley','hold','volley','flank','charge']);next();cmd({type:'recruit',id:'liu19'});cmd({type:'appoint',region:'pass',id:'liu19'});next();cmd({type:'borrow'});fight('north',['hold','volley','hold','flank','volley']);next();cmd({type:'seek22'});cmd({type:'recruit',id:'gu22'});next();cmd({type:'appoint',region:'north',id:'gu22'});next();
checks.push('正常开局钱粮与两件国事限制下，可收回全部三处失地并各任知府');
for(let i=0;i<14;i++){
 for(let j=0;j<2&&s.ap>0;j++){
  const f=C.forecast(s),choices=s.regions.filter(r=>r.owner==='crown');let c;
  if(f.grain<5&&s.economy.treasury>=40&&s.economy.grain>=10){const r=choices.find(r=>r.level<3&&!s.works.some(w=>w.status==='pending'&&w.region===r.id&&!w.project22));if(r)c={type:'farm',region:r.id};}
  if(!c){const r=choices.find(r=>s.depth22.regions[r.id].market<2&&!s.works.some(w=>w.status==='pending'&&w.region===r.id&&w.project22==='market'));if(r&&s.economy.treasury>=50)c={type:'build22',region:r.id,project:'market'};}
  if(!c&&s.economy.treasury>=70&&s.economy.grain>=10){const r=choices.find(r=>!s.depth22.regions[r.id].route&&!s.works.some(w=>w.status==='pending'&&w.region===r.id&&w.project22==='route'));if(r)c={type:'build22',region:r.id,project:'route'};}
  if(!c&&s.economy.treasury>=20){const r=choices.find(r=>r.missing>0&&!s.audits.some(a=>a.region===r.id&&a.status==='pending'));if(r)c={type:'audit',region:r.id};}
  if(c)cmd(c);else break;
 }
 for(const a of s.audits.filter(a=>a.status==='verified'))cmd({type:'disposition',id:a.id,choice:'recover'});
 if(s.economy.grain<90&&s.economy.treasury>=80&&s.depth22.lastGrain!==s.turn&&s.depth22.clans.ye.grain>=80)cmd({type:'buygrain22'});
 next();
}
const f=C.forecast(s);assert(f.silver>0,JSON.stringify(log));assert(f.grain>=0,JSON.stringify(log));checks.push('全部失地可收复，继续开田与集市后钱粮能转正，而非只靠借钱和重复缴获');
assert(s.depth22.loot.length===3);assert(s.depth22.raids.filter(a=>a.status==='preparing').length===0);checks.push('敌据点被逐一拔除后不再凭空刷新敌军，三地各只发一次首收缴获');
fs.writeFileSync(path.join(__dirname,'../验证报告_v22_正常资源平衡.json'),JSON.stringify({passed:checks.length,checks,turns:log,naturalResources:true,note:'纯规则路线使用原始300银/200粮，每旬两事，不改钱粮或战力；路线用于验证可行性，不代表所有玩法都能无代价取胜。'},null,2));console.log(JSON.stringify({passed:checks.length,ending:log.at(-1)},null,2));
