const C=require('./simulation/campaign-core-v24.js'),B=require('./simulation/campaign-core-v19.js'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const s=B.create(6);C.enable(s);C.enablePlay(s);C.enableHard(s);const log=[],actions=[],checks=[];
function cmd(c){const r=C.command(s,c);assert(r.ok,r.error+' '+JSON.stringify(c)+' '+JSON.stringify({t:s.turn,e:s.economy,ap:s.ap}));actions.push({turn:s.turn,...c});C.validate(s);}
function next(){assert(C.advance(s,s.nextTick).ok);C.validate(s);log.push({turn:s.turn,silver:s.economy.treasury,grain:s.economy.grain,debt:s.debt.principal,land:s.regions.filter(r=>r.owner==='crown').length,net:C.forecast(s).silver,grainNet:C.forecast(s).grain,offices:Object.fromEntries(Object.entries(s.govern24.offices).map(([k,j])=>[k,j?.id||null])),goals:s.govern24.honors.map(h=>h.goal),ending:s.challenge23.ending?.key||null});assert(!C.ended(s),'Crisis at '+JSON.stringify(log.at(-1)));}
function fight(id,orders){const a=C.freeArmy(s),army={shield:Math.min(240,a.shield),bow:Math.min(100,a.bow),cavalry:Math.min(60,a.cavalry)},max=Math.min(400,C.troops(a)-200);let over=C.troops(army)-max;for(const k of ['shield','bow','cavalry']){const n=Math.min(Math.max(0,over),army[k]);army[k]-=n;over-=n;}cmd({type:'attack',region:id,commander:'zhou19',army});for(const order of orders)if(s.battle.status==='fighting')cmd({type:'order',order});assert.equal(s.battle.status,'won','Unable to win '+id);}
cmd({type:'recruit',id:'zhou19'});cmd({type:'scout',region:'ji'});next();
cmd({type:'train'});fight('ji',['hold','flank','charge','volley','charge']);next();
cmd({type:'recruit',id:'shen19'});cmd({type:'appoint',region:'ji',id:'shen19'});next();
cmd({type:'supplies'});cmd({type:'scout',region:'pass'});cmd({type:'station22',region:'south',amount:200});next();
cmd({type:'station22',region:'south',amount:0});cmd({type:'train'});fight('pass',['volley','hold','volley','flank','charge']);next();
cmd({type:'recruit',id:'liu19'});cmd({type:'appoint',region:'pass',id:'liu19'});next();
cmd({type:'borrow'});fight('north',['hold','volley','hold','flank','volley']);next();
cmd({type:'seek22'});cmd({type:'recruit',id:'gu22'});next();
cmd({type:'appoint',region:'pass',id:'gu22'});cmd({type:'borrow'});next();
cmd({type:'seek22'});cmd({type:'recruit',id:'ruan22'});next();
cmd({type:'appoint',region:'north',id:'ruan22'});cmd({type:'policy24',region:'south',policy:'south-grain'});next();
checks.push('原始300银200粮，困难成本与每旬两事下，先收人才与失地并安排独立知府');
// Continue with legal candidates only. Borrowing and all constructions retain actual costs/AP.
for(let n=0;n<32;n++){
 if(s.economy.arrears&&s.economy.treasury>120)cmd({type:'wages',amount:Math.min(s.economy.arrears,s.economy.treasury-80)});
 for(let j=0;j<2&&s.ap>0;j++){
  let choices=[];const d=s.govern24;
  if(s.economy.grain<65&&!C.reason(s,{type:'buygrain22'}))cmd({type:'buygrain22'});
  if(!s.roster.some(p=>p.id==='qin22'&&p.recruited))choices.push({type:'recruit',id:'qin22'});
  if(!d.offices.marshal)choices.push({type:'post24',post:'marshal',id:'qin22'});
  if(!d.regions.south.policy&&!d.regions.south.project)choices.push({type:'policy24',region:'south',policy:'south-grain'});
  if(!d.regions.capital.policy&&!d.regions.capital.project)choices.push({type:'policy24',region:'capital',policy:'capital-workshop'});
  if(s.depth22.sought<8)choices.push({type:'seek22'});
  const wen=s.roster.find(p=>p.id==='wen22');if(wen&&!wen.recruited)choices.push({type:'recruit',id:'wen22'});
  if(wen?.recruited&&s.regions.find(r=>r.id==='pass').governor!=='wen22')choices.push({type:'appoint',region:'pass',id:'wen22'});
  if(!d.offices.treasurer)choices.push({type:'post24',post:'treasurer',id:'gu22'});
  const lin=s.roster.find(p=>p.id==='lin22');if(lin&&!lin.recruited)choices.push({type:'recruit',id:'lin22'});
  if(!d.offices.inspector)choices.push({type:'post24',post:'inspector',id:'lin22'});
  if(lin?.recruited&&lin.loyalty<65&&lin.merits22)choices.unshift({type:'reward22',id:'lin22'});
  if(!d.regions.ji.policy&&!d.regions.ji.project)choices.push({type:'policy24',region:'ji',policy:'ji-garrison'});
  if(!d.regions.pass.policy&&!d.regions.pass.project)choices.push({type:'policy24',region:'pass',policy:'pass-horses'});
  if(!d.regions.north.policy&&!d.regions.north.project)choices.push({type:'policy24',region:'north',policy:'north-trade'});
  const qin=s.roster.find(p=>p.id==='qin22');if(qin?.recruited&&qin.merits22>=2&&(qin.training24?.length||0)<2)choices.push({type:'develop24',id:'qin22',path:'military'});
  if(C.forecast(s).grain<15)for(const r of s.regions.filter(r=>r.owner==='crown'))choices.push({type:'farm',region:r.id});
  for(const r of s.regions.filter(r=>r.owner==='crown')){choices.push({type:'build22',region:r.id,project:'market'});choices.push({type:'build22',region:r.id,project:'route'});if(r.missing)choices.push({type:'audit',region:r.id});}
  const c=choices.find(c=>!C.reason(s,c));if(c)cmd(c);else if(s.economy.treasury<80&&!C.reason(s,{type:'borrow'}))cmd({type:'borrow'});else break;
 }
 for(const a of s.audits.filter(a=>a.status==='verified'))cmd({type:'disposition',id:a.id,choice:'recover'});
 if(s.economy.grain<90&&!C.reason(s,{type:'buygrain22'}))cmd({type:'buygrain22'});
 next();
}
assert.equal(s.regions.filter(r=>r.owner==='crown').length,5);assert(Object.values(s.govern24.regions).every(q=>q.policy));assert(Object.values(s.govern24.offices).every(Boolean));assert(s.roster.some(p=>p.training24?.length));checks.push('自然钱粮下可办成五地方向、三职并培养将领，未修改资金、军功或行动上限');
assert(C.forecast(s).silver>0&&C.forecast(s).grain>=0);assert(s.govern24.honors.some(h=>h.goal==='prosper'));checks.push('中期钱粮能转正并达富国目标，留名后继续经营，困难不必靠重复缴获续命');
assert(s.govern24.plots.some(a=>a.kind==='price'));assert(s.govern24.plots.some(a=>a.kind==='price'&&a.status==='blocked')||s.govern24.marketUntil===0);checks.push('路线实际经历粮价反制，再以人才和地方经营形成应对');
fs.writeFileSync(path.join(__dirname,'../验证报告_v24_原始资源路线.json'),JSON.stringify({passed:checks.length,checks,turns:log,actions,naturalResources:true,hard:true,note:'原始300银/200粮，每旬两件国事，无修改资源、军功、清慎、忠诚、敌军或工期；路线为可行性例证，不代表所有选择都会获胜。'},null,2));console.log(JSON.stringify({passed:checks.length,ending:log.at(-1)},null,2));
