/* Optional hard campaign. All consequences derive from settled deliveries and actual raids. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./campaign-core-v22.js'));else root.FengqueCampaign23=factory(root.FengqueCampaign22);})(typeof globalThis!=='undefined'?globalThis:this,function(base){
 'use strict';
 const active=s=>s?.challenge23?.enabled===true,ended=s=>!!s?.challenge23?.ending;
 const endings={famine:{title:'仓廪俱空',text:'三旬军民缺粮，赈济终未接上。州县不再奉诏，宫门之外尽是逃户与乱兵。昭宁的诏书，再送不出京城。'},mutiny:{title:'禁军哗变',text:'欠饷一再积压，催饷的军士终于撞开宫门。禁军改奉新主，御案上的军报再也无人来取。'},capital:{title:'京阙失守',text:'京畿两度被攻破，城防与余兵再撑不住下一轮。敌军入城，白幡尚未褪色的宫门，换了旗号。'},puppet:{title:'垂帘之外',text:'大半税册落入姜氏之手，叶氏旧债久催不还。朝廷的粮道与用度尽受两家节制。群臣请陛下静养，诏令自此由世家代拟。'}};
 function note(s,kind,text){s.history.push({id:'c19-'+(++s.serial),turn:s.turn,tick:s.tick,kind,text});}
 function enableHard(s){if(active(s))return s;if(!base.active(s))throw Error('先接入州府经营，再开启危局。');if(s.battle?.status==='fighting')throw Error('先结束这一仗，再开启危局。');s.challenge23={version:1,enabled:true,startTurn:s.turn,graceUntil:s.turn+2,food:0,wages:0,puppet:0,breaches:0,seenRaids:s.depth22.raids.filter(r=>r.target==='capital'&&r.status==='broke').map(r=>r.id),ledger:[],ending:null,stable:0,medal:null};note(s,'危局开启','危局从本旬起计；留两旬准备。以后每旬额外军需银20、粮20。缺粮三旬、严重欠饷三旬、京畿两次失守或世家长期代掌税册，都会失去皇位。');return s;}
 function reason(s,c){if(ended(s))return '此局已终。可查看记录、导出或读取旧档，不能再发新令。';return base.reason(s,c);}
 function command(s,c){const error=reason(s,c);if(error)return {ok:false,error};return base.command(s,c);}
 function forecast(s){const f=base.forecast(s);if(!active(s)||ended(s))return f;return {...f,silver:f.silver-20,grain:f.grain-20,extra23:{silver:20,grain:20}};}
 function settled(s,settlementArmy){const h=s.challenge23,d=s.depth22,b=d.lastBudget,extraSilver=Math.min(20,s.economy.treasury),extraGrain=Math.min(20,s.economy.grain);s.economy.treasury-=extraSilver;s.economy.grain-=extraGrain;s.economy.arrears+=20-extraSilver;
  const troops=settlementArmy,extra=Math.max(0,Math.ceil((troops-600)/100)),needGrain=80+extra*8,foodMissing=Math.max(0,needGrain-(b?.paidGrain||0))+20-extraGrain;
  const entry={turn:s.turn,paidSilver:extraSilver,paidGrain:extraGrain,missingSilver:20-extraSilver,missingGrain:foodMissing};h.ledger.push(entry);h.ledger=h.ledger.slice(-36);
  note(s,'危局军需','加支军需银'+extraSilver+'/20、粮'+extraGrain+'/20；本旬未供粮'+foodMissing+'，现欠饷'+s.economy.arrears+'。');
  if(s.turn<=h.graceUntil){h.seenRaids=[...new Set([...h.seenRaids,...d.raids.filter(r=>r.target==='capital'&&r.status==='broke').map(r=>r.id)])];return;}
  h.food=foodMissing>0?h.food+1:0;h.wages=s.economy.arrears>=240?h.wages+1:0;
  const lands=s.regions.filter(r=>r.owner==='crown'),seats=lands.filter(r=>r.clanSlots).length;
  h.puppet=seats>lands.length/2&&base.influence(s,'jiang')>=45&&s.debt.overdue>=600?h.puppet+1:0;
  for(const r of d.raids){if(r.target!=='capital'||r.status!=='broke'||h.seenRaids.includes(r.id))continue;h.seenRaids.push(r.id);h.breaches++;note(s,'京畿失守','京畿第'+h.breaches+'次被攻破。第二次失守即亡国，须调回京营兵、修城防，或拔除敌方出兵地。');}
  let key=h.food>=3?'famine':h.wages>=3?'mutiny':h.breaches>=2?'capital':h.puppet>=4?'puppet':null;
  if(key){h.ending={key,...endings[key],turn:s.turn,tick:s.tick,food:h.food,wages:h.wages,breaches:h.breaches,puppet:h.puppet,arrears:s.economy.arrears,debt:s.debt.principal};note(s,'终局',h.ending.title+'：'+h.ending.text);return;}
  const f=forecast(s),stable=lands.length===5&&lands.every(r=>!!r.governor)&&f.silver>=0&&f.grain>=0&&s.debt.principal===0&&s.economy.arrears===0&&h.food===0;
  h.stable=stable?h.stable+1:0;if(h.stable>=2&&!h.medal){h.medal={turn:s.turn,tick:s.tick,title:'重整山河'};note(s,'治世留名','五地归朝、官员齐备、钱粮不亏且旧债欠饷清偿，已连续两旬。获记“重整山河”，往后的王朝仍由陛下与后人继续。');}
 }
 function advance(s,target){if(!active(s))return base.advance(s,target);if(!Number.isInteger(target)||target<s.tick||target-s.tick>3660)return {ok:false,error:'日期有误。'};if(ended(s))return {ok:false,error:'此局已终。'};while(s.tick<target){const end=Math.min(target,s.nextTick),turn=s.turn,settlementArmy=base.troops(s.army),result=base.advance(s,end);if(!result.ok)return result;if(s.turn>turn)settled(s,settlementArmy);if(ended(s))break;}return {ok:true,ended:ended(s)};}
 function risks(s){if(!active(s))return [];const h=s.challenge23;if(h.ending)return [{key:'ending',title:h.ending.title,text:'第'+h.ending.turn+'旬失去皇位。',panel:'records'}];const rows=[];
  if(h.food)rows.push({key:'food',title:'缺粮 '+h.food+' / 3旬',text:'再有'+(3-h.food)+'旬断粮就会民变失国。买粮或恢复产出，让下一旬足额供粮，连续次数便清零。',panel:'funds'});
  if(h.wages||s.economy.arrears>=160)rows.push({key:'wages',title:'欠饷 '+s.economy.arrears+' · 危急 '+h.wages+' / 3旬',text:'欠饷至少240连续三旬，禁军会哗变。实际补到240以下，下次结算重置计数。',panel:'funds'});
  if(h.breaches)rows.push({key:'capital',title:'京畿曾失守 '+h.breaches+' / 2次',text:'再失守即亡国。调回京营兵、加固京畿，或先打掉袭扰出发地。已失守的次数不会因送礼消失。',region:'capital'});
  if(h.puppet)rows.push({key:'puppet',title:'世家代掌 '+h.puppet+' / 4旬',text:'姜氏掌大半税册，且旧债逾期至少600。收回税册或实还逾期款，破掉其中一项便可止住。',panel:'clans'});
  return rows;
 }
 function validate(s){base.validate(s);if(!s.challenge23)return true;const h=s.challenge23,nat=n=>Number.isInteger(n)&&n>=0;if(h.version!==1||h.enabled!==true||!['startTurn','graceUntil','food','wages','puppet','breaches','stable'].every(k=>nat(h[k]))||h.startTurn>s.turn||h.graceUntil!==h.startTurn+2||!Array.isArray(h.seenRaids)||new Set(h.seenRaids).size!==h.seenRaids.length||!h.seenRaids.every(id=>s.depth22.raids.some(r=>r.id===id&&r.target==='capital'&&r.status==='broke'))||!Array.isArray(h.ledger)||h.ledger.length>36)throw Error('危局记录有误。');for(const e of h.ledger)if(!['turn','paidSilver','paidGrain','missingSilver','missingGrain'].every(k=>nat(e[k]))||e.turn>s.turn||e.paidSilver+e.missingSilver!==20||e.paidGrain>20)throw Error('危局军需记录有误。');if(h.ending&&(!endings[h.ending.key]||h.ending.turn!==s.turn||h.ending.tick!==s.tick||h.ending.title!==endings[h.ending.key].title||h.ending.food!==h.food||h.ending.wages!==h.wages||h.ending.puppet!==h.puppet||h.ending.breaches!==h.breaches||!({famine:h.food>=3,mutiny:h.wages>=3,capital:h.breaches>=2,puppet:h.puppet>=4})[h.ending.key]))throw Error('失败结局记录有误。');if(h.medal&&(!nat(h.medal.turn)||h.medal.turn>s.turn||h.medal.title!=='重整山河'))throw Error('治世纪念有误。');return true;}
 return {...base,activeHard:active,ended,enableHard,reason,command,forecast,advance,validate,risks,endings};
});
