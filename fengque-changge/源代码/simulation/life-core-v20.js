/* Persistent personal lives. Read operations never advance time or grant rewards. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FengqueLife=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x)),hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
 function event(s,p,kind,extra={}){const e={id:'life20-'+s.owner+'-'+(++s.serial),npc:p?.id||null,tick:s.tick,kind,...extra};s.events.push(e);if(s.events.length>360)s.events.shift();if(p){p.facts.push(clone(e));if(p.facts.length>12){const i=p.facts.findIndex(q=>q.kind==='conversation'||q.kind==='followup');p.facts.splice(i<0?0:i,1);}}return e;}
 function addPerson(s,p){if(s.people[p.id])return s.people[p.id];return s.people[p.id]={id:p.id,kind:p.kind||'book',cycle:0,progress:0,started:s.tick,nextWork:s.tick+2+hash(p.id)%2,readyAt:null,shared:false,approach:null,waiting:false,pending:null,used:{},spoken:{},days:[],facts:[],archive:[],lastLetter:null,publicSeen:[]};}
 function create(input){const s={version:1,owner:input.owner,seed:input.seed>>>0,tick:input.tick,started:input.tick,serial:0,people:{},events:[],company:[],souvenirs:[]};for(const p of input.people||[])if(p.alive&&p.adult)addPerson(s,p);return s;}
 function advance(s,target,people){if(!Number.isInteger(target)||target<s.tick||target-s.tick>3660)throw Error('人物日期有误。');const actual=new Map(people.map(p=>[p.id,p]));for(const p of people)if(p.alive&&p.adult)addPerson(s,p);
  while(s.tick<target){s.tick++;for(const p of Object.values(s.people)){const a=actual.get(p.id);if(!a?.alive||!a.adult)continue;if(p.pending&&s.tick>p.pending.expires)p.pending=null;
   if(p.readyAt!==null&&s.tick-p.readyAt>=12){p.archive.push({cycle:p.cycle,readyAt:p.readyAt,shared:p.shared});if(p.archive.length>6)p.archive.shift();p.cycle++;p.progress=0;p.readyAt=null;p.shared=false;p.waiting=false;p.started=s.tick;p.nextWork=s.tick+3;p.approach=null;p.workingTogether=false;event(s,p,'new-project',{cycle:p.cycle});}
   if(p.readyAt!==null||s.tick<p.nextWork||a.busy||a.health<45||a.stress>=65)continue;
   p.progress++;p.nextWork=s.tick+2+(hash(s.seed+p.id+p.cycle+p.progress)%2);
   if(p.progress>=3){p.progress=3;p.readyAt=s.tick;event(s,p,'project-ready',{cycle:p.cycle});}else event(s,p,'project-progress',{cycle:p.cycle,progress:p.progress});
  }}return s;
 }
 function commitTalk(s,id,key,reply,pending=null){const p=s.people[id];if(!p||typeof reply!=='string')return false;const stamp=s.tick+':'+key;if(p.spoken[stamp])return false;p.spoken[stamp]=true;if(key.startsWith('chat:'))p.discussedCycle=p.cycle;p.used[key]=(p.used[key]||0)+1;if(!p.days.includes(s.tick))p.days.push(s.tick);p.days=p.days.slice(-30);for(const k of Object.keys(p.spoken))if(Number(k.split(':')[0])<s.tick-30)delete p.spoken[k];
  const e=event(s,p,'conversation',{key,reply,cycle:p.cycle});if(pending)p.pending={...clone(pending),source:e.id,cycle:p.cycle,created:s.tick,expires:s.tick+3};return e;
 }
 function follow(s,id,source,choice){const p=s.people[id],q=p?.pending;if(!q||q.source!==source||s.tick>q.expires||q.cycle!==p.cycle||!['look','wait','listen'].includes(choice))return false;p.pending=null;if(choice==='wait'){p.waiting=true;p.approach='patient';}else if(choice==='look'){p.approach='involved';if(p.readyAt===null&&!p.workingTogether){p.nextWork=Math.min(p.nextWork,s.tick+1);p.workingTogether=true;}}else p.approach='listen';return event(s,p,'followup',{source,choice,cycle:p.cycle});}
 function share(s,id,source,name){const p=s.people[id],fact=p?.facts.find(e=>e.id===source&&e.kind==='project-ready');if(!p||!fact||fact.cycle!==p.cycle||p.shared||p.readyAt===null)return false;p.shared=true;const item={id:'souvenir20-'+s.owner+'-'+(++s.serial),npc:id,owner:s.owner,name,source,cycle:p.cycle,tick:s.tick};s.souvenirs.push(item);if(s.souvenirs.length>80)s.souvenirs.shift();event(s,p,'shared',{source,item:item.id,cycle:p.cycle});return item;}
 function company(s,id,activity,witnesses){const key=s.tick+':'+id+':'+activity;if(s.company.some(e=>e.key===key))return false;const e={id:'company20-'+s.owner+'-'+(++s.serial),key,npc:id,activity,tick:s.tick,witnesses:[...new Set(witnesses)].filter(q=>q!==id)};s.company.push(e);s.company=s.company.filter(e=>s.tick-e.tick<=14);return e;}
 function validate(s){const nat=n=>Number.isInteger(n)&&n>=0;if(s?.version!==1||typeof s.owner!=='string'||!nat(s.tick)||!nat(s.serial)||!s.people||!Array.isArray(s.events)||!Array.isArray(s.company)||!Array.isArray(s.souvenirs))throw Error('人物生活记事缺页。');
  const ids=new Set();for(const e of s.events){if(!e.id||ids.has(e.id)||!nat(e.tick)||e.tick>s.tick)throw Error('人物经历编号或日期有误。');ids.add(e.id);}
  for(const [id,p]of Object.entries(s.people)){if(p.id!==id||!nat(p.cycle)||!nat(p.progress)||p.progress>3||!Array.isArray(p.days)||!Array.isArray(p.facts)||!p.spoken||!p.used||!Array.isArray(p.archive)||p.readyAt!==null&&!nat(p.readyAt))throw Error('人物私事进度有误。');if(p.pending&&(!p.pending.source||!nat(p.pending.expires)||!nat(p.pending.cycle)||!['project'].includes(p.pending.kind)))throw Error('未完的话题记录有误。');}
  for(const c of s.company)if(!c.id||!nat(c.tick)||!Array.isArray(c.witnesses))throw Error('相陪的见证记录有误。');return true;
 }
 return {create,advance,addPerson,commitTalk,follow,share,company,validate,event,hash,clone};
});
