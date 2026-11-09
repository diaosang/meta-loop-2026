/* Integrity and structural validation are independent from browser storage. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FengqueSave=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
 function safe(value,depth=0){if(depth>70)throw Error('这份进度的层级不正常。');if(typeof value==='string'&&(/<\s*(script|iframe|img|svg|object|embed|link|meta|form|input|video|audio|source)\b|\bon[a-z]+\s*=|javascript\s*:/i.test(value)))throw Error('这份进度夹有可执行网页内容，不能直接读取。');if(!value||typeof value!=='object')return;for(const k of Object.keys(value)){if(['__proto__','prototype','constructor'].includes(k))throw Error('这份进度含有不能读取的字段。');safe(value[k],depth+1);}}
 function check(payload){
  safe(payload);if(payload?.version!==3||!payload.relations||!payload.case||!Array.isArray(payload.logs))throw Error('这不是完整游戏进度；经营记录不能当作完整存档读取。');
  for(const k of ['elapsed','ap','money'])if(!Number.isFinite(payload[k])||payload[k]<0)throw Error('日期、安排次数或钱数读不对。');if(!Number.isInteger(payload.elapsed)||!Number.isInteger(payload.ap)||payload.ap>100)throw Error('月份或安排次数读不对。');
  if(payload.day!==undefined&&(!Number.isInteger(payload.day)||payload.day<1||payload.day>30))throw Error('日期不在一至三十日之间。');
  if(Object.keys(payload.relations).length<6||Object.keys(payload.relations).length>5000||!['xu','jiang','xie','ye'].every(id=>payload.relations[id]))throw Error('人物记录不完整。');
  if(payload.frontCourt)for(const k of ['treasury','grain','arrears'])if(!Number.isFinite(payload.frontCourt[k])||payload.frontCourt[k]<0)throw Error('钱粮账读不对。');
  if(payload.campaign19){const s=payload.campaign19,nat=n=>Number.isInteger(n)&&n>=0;if(s.version!==1||s.active!==true||!nat(s.tick)||s.tick!==payload.elapsed*30+(payload.day||1)-1||!nat(s.nextTick)||s.nextTick<=s.tick||!nat(s.ap)||s.ap>2||!s.economy||!['treasury','grain','arrears'].every(k=>nat(s.economy[k])&&s.economy[k]===payload.frontCourt?.[k])||!s.debt||!['principal','paid','overdue','due'].every(k=>nat(s.debt[k]))||!s.army||!['shield','bow','cavalry'].every(k=>nat(s.army[k]))||!s.stories||!Array.isArray(s.stories.resolved)||!s.profiles||!['roster','regions','history','audits','works','petitions'].every(k=>Array.isArray(s[k])))throw Error('山河进度或钱粮日期有误。');if(typeof FengqueCampaign!=='undefined')FengqueCampaign.validate(s);}
  if(payload.world16){const w=payload.world16;if(w.schemaVersion!==1||!w.people||!w.families||!w.history||!w.dynasty||!w.people[w.dynasty.rulerId])throw Error('家族或传承记录不完整。');const ids=new Set();for(const e of w.history){if(!e.id||ids.has(e.id))throw Error('历史编号重复或缺失。');ids.add(e.id);}for(const [id,p]of Object.entries(w.people)){if(p.id!==id||!Array.isArray(p.parents)||!Array.isArray(p.children)||!p.parents.every(key=>w.people[key]))throw Error('人物亲属记录有缺页。');}if(payload.simulation&&w.tick!==payload.simulation.tick)throw Error('人物与经营日期对不上，先换一个完整备份。');}
  if(payload.life20){const l=payload.life20,now=payload.elapsed*30+(payload.day||1)-1;if(l.version!==1||!l.reigns||typeof l.reigns!=='object')throw Error('人物生活记事缺页。');for(const [owner,s]of Object.entries(l.reigns)){if(s.owner!==owner||s.version!==1||!payload.world16?.people[owner]||!Number.isInteger(s.tick)||s.tick<0||s.tick>now||!s.people||!Array.isArray(s.events)||!Array.isArray(s.company)||!Array.isArray(s.souvenirs))throw Error('人物生活的世代或日期不对。');for(const id of Object.keys(s.people))if(!payload.relations[id]&&!payload.world16?.people[id])throw Error('生活记事中有未登记的人物。');if(typeof FengqueLife!=='undefined')FengqueLife.validate(s);}}
  if(payload.npc17){
   const r=payload.npc17;if(r.version!==1||!Number.isInteger(r.serial)||r.serial<0||!r.reigns||typeof r.reigns!=='object')throw Error('人物互动记事不完整。');
   const known=id=>!!payload.relations[id]||!!payload.world16?.people[id];
   for(const [owner,reign]of Object.entries(r.reigns)){
    if(reign.owner!==owner||!reign.people||!reign.stamps||!Array.isArray(reign.requests))throw Error('人物相处的世代记录对不上。');
    for(const [id,p]of Object.entries(reign.people)){
     if(!known(id)||!Array.isArray(p.memories)||!p.stamps||!Number.isFinite(p.respect)||!Number.isFinite(p.guard))throw Error('人物相处记录缺页。');
     const ids=new Set();for(const m of p.memories){if(!m.id||ids.has(m.id)||m.owner!==owner||!Array.isArray(m.actors)||!m.actors.includes(id)||!Number.isFinite(m.tick)||typeof m.reply!=='string')throw Error('人物相处记忆的编号或归属不对。');ids.add(m.id);}
     if(p.invitation&&(!p.invitation.id||!Number.isFinite(p.invitation.requested)))throw Error('邀约记录不完整。');
     if(p.emotion){const e=p.emotion;if(e.version!==1||!Array.isArray(e.days)||!e.days.every(Number.isFinite)||new Set(e.days).size!==e.days.length||!Number.isInteger(e.signals)||e.signals<0||typeof e.mutual!=='boolean'||e.lastApproach!==null&&!Number.isFinite(e.lastApproach))throw Error('情意的相处记录不完整。');}
    }
    for(const q of reign.requests)if(q.owner!==owner||!known(q.npc)||!q.id||!Number.isFinite(q.expires))throw Error('请见小笺的归属不对。');
    if(reign.nights!==undefined){if(!Array.isArray(reign.nights))throw Error('内廷安排缺页。');const ids=new Set(),dates=new Set();for(const n of reign.nights){if(!n.id||ids.has(n.id)||n.owner!==owner||!known(n.npc)||!Number.isInteger(n.due)||n.due<0||!Number.isInteger(n.requested)||n.requested<0||n.due<n.requested||n.due>n.requested+1||!['亥初','子初'].includes(n.time)||!['planned','cancelled','unable','completed','archived'].includes(n.status)||typeof n.consent!=='string')throw Error('内廷安排的日期或归属不对。');ids.add(n.id);if(['planned','completed'].includes(n.status)){if(dates.has(n.due))throw Error('同一夜不能有两份相陪安排。');dates.add(n.due);}if(n.status==='completed'&&(typeof n.scene!=='string'||typeof n.morning!=='string'||!Number.isFinite(n.completed)))throw Error('次晨相处记录不完整。');}}
   }
  }
  return payload;
 }
 function pack(payload,now=Date.now()){const data=JSON.stringify(payload);check(payload);return {format:'fengque-save',schemaVersion:16,savedAt:now,worldSeed:payload.world16?.seed??payload.stories?.seed??null,tick:payload.elapsed*30+(payload.day||1)-1,checksum:hash(data),data};}
 function unpack(input){
  const value=typeof input==='string'?JSON.parse(input):input;if(value?.schemaVersion>16)throw Error('这是更新版本的进度，请先用对应的新版本打开。');
  if(value?.format==='fengque-save'){if(value.schemaVersion!==16||typeof value.data!=='string'||hash(value.data)!==value.checksum)throw Error('这份进度校验没通过，可能缺了一段；原文件不会被覆盖。');return {payload:check(JSON.parse(value.data)),meta:{savedAt:value.savedAt,tick:value.tick,worldSeed:value.worldSeed},legacy:false};}
  const legacy=value?.state||value;return {payload:check(legacy),meta:{savedAt:0,tick:legacy.elapsed*30+(legacy.day||1)-1,worldSeed:legacy.stories?.seed??null},legacy:true};
 }
 return {version:16,hash,check,pack,unpack};
});
