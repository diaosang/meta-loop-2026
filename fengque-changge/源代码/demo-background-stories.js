/* Generated once per save: a family fact constrains a life, a life constrains its scenes. */
function storyRoot(){
 if(!state.stories)state.stories={version:'13.4',seed:Math.floor(Math.random()*0xffffffff),families:{},people:{},days:{}};
 return state.stories;
}
function storyPick(list,key){return list[mindHash(String(storyRoot().seed)+':'+key)%list.length];}
function storyOrigin(p,pr){
 const root=storyRoot(),house=pr.household||'house-'+p.id;
 if(root.families[house])return root.families[house];
 const text=(pr.background||'')+' '+(p.eliteEntry?.background||'');
 let key=STORY_DATA.core[p.id]?.origin;
 if(!key){
  if(/琴艺世家|世代习艺|工匠|艺人/.test(text))key='artisan';
  else if(p.eliteEntry?.kind==='门第'||/世家|簪缨|侯府|公府|名门|世族|三代|书香门第/.test(text))key='gentry';
  else if(/家道|中落/.test(text))key='fallen';
  else if(/商贾|经商|商号/.test(text))key='merchant';
  else if(/行伍|军户|将门/.test(text))key='military';
  else key=storyPick(p.official?['scholar','scholar','common','gentry','merchant']:['common','scholar','artisan','merchant','fallen'],'origin:'+house);
 }
 const family={household:house,clan:pr.clan||p.clan||p.faction||p.name.slice(0,1)+'氏',origin:key,
  parents:(pr.parents||[]).slice(),grandparent:pr.grandparent||null,source:'existing-family-and-generated-livelihood'};
 root.families[house]=family;return family;
}
function storyOf(p){
 if(typeof p==='string')p=PEOPLE.find(q=>q.id===p);if(!p||!state.relations[p.id])return null;
 const root=storyRoot();if(root.people[p.id])return root.people[p.id];
 const pr=castProfile(p.id)||{},family=storyOrigin(p,pr),fixed=STORY_DATA.core[p.id];
 const officials=PEOPLE.filter(q=>q.id!==p.id&&q.official&&!state.relations[q.id]?.rank&&state.relations[q.id]?.officer!==false);
 let pool=fixed?[fixed.arc]:p.id==='song'?['blocked','blocked','artist','agent']:p.id==='lu'?['duty','duty','family']:
  p.official||state.relations[p.id].recruited?['office','office','family','benefactor','agent']:
  family.origin==='gentry'?['family','family','artist','agent']:
  family.origin==='fallen'?['restoration','restoration','blocked','benefactor','agent']:
  family.origin==='military'?['duty','family','benefactor']:
  ['blocked','artist','family','benefactor','agent'];
 if(!['琴艺','舞艺','书法','绘事','香事'].includes(pr.specialty||p.specialty))pool=pool.map(k=>k==='artist'?'benefactor':k);
 if(castAge(p)<18||!officials.length)pool=pool.filter(k=>k!=='agent');
 const arc=storyPick(pool,'arc:'+p.id),patron=arc==='agent'?storyPick(officials,'patron:'+p.id):null;
 const s={npc:p.id,family:family.household,origin:family.origin,arc,patron:patron?.id||null,
  born:mindTick(),known:{},status:'unopened',activityDays:0,privateRequests:0,decision:null,due:null,investigation:null};
 root.people[p.id]=s;return s;
}
function storyFill(text,p){
 const s=storyOf(p),family=storyRoot().families[s.family],c=__courtVoiceAudit.context(p),patron=PEOPLE.find(q=>q.id===s.patron);
 return String(text||'').replaceAll('{self}',c.self).replaceAll('{clan}',family.clan).replaceAll('{skill}',c.specialty)
  .replaceAll('{patron}',patron?.name||'原荐引人');
}
function storyArc(p){const s=storyOf(p);return {...STORY_DATA.arcs[s.arc],...(STORY_DATA.core[p.id]||{})};}
function storyText(p,facet){const a=storyArc(p);return storyFill(facet==='origin'?(a.originReply||STORY_DATA.arcs[storyOf(p).arc].origin):a[facet],p);}
function storyPublic(p){const s=storyOf(p),f=storyRoot().families[s.family];return STORY_DATA.core[p.id]?.public||storyFill(STORY_DATA.origins[f.origin].public,p)+storyText(p,'public');}
function storySummary(p){const s=storyOf(p);return s.known.truth?storyText(p,'truth'):s.known.scar?storyText(p,'scar'):storyPublic(p);}
function storyGate(p,facet){
 const s=storyOf(p),r=state.relations[p.id];
 if(!canResumePrivateTalk(p))return '先把眼下的不快说开，再谈旧事。';
 if(facet==='scar'&&(!s.known.origin||socialTier(p)==='stranger'||r.aff<40||r.trust<35))return '先聊来路，待熟悉些，他才愿说旧日难处。';
 if(facet==='truth'&&(!s.known.scar||socialTier(p)!=='trusted'||r.aff<55||r.trust<50))return '这半句话，他还不愿说尽。多些真实相处，再慢慢问。';
 return '';
}
function storyRow(p,facet,category='chat',topic='story:'+facet){
 const s=storyOf(p),tier=socialTier(p),id='story:'+p.id+':'+facet;
 const row={id,semantic:id,category,topic,player:{origin:'你来京以前，家中是怎样的？',scar:'方才那件旧事，你若愿意，可以慢慢说。',truth:'还有没说完的那一句么？'}[facet],
  stage:facet==='origin'?'他听清所问，先将身前的东西收好。':facet==='scar'?'他停了一会儿，终于没有把话岔开。':'他看着你，这回把那半句话说完了。',
  reply:storyText(p,facet),socialTier:tier,storyMark:facet,score:135};
 if(facet==='scar')LISTEN_FOLLOWUPS.rows[id]=storyArc(p).follow.map(([say,reply])=>({say,reply:storyFill(reply,p)}));
 return row;
}
function commitStoryTurn(p,row){
 if(!row.storyMark)return;const s=storyOf(p),facet=row.storyMark;if(s.known[facet])return;
 s.known[facet]=mindTick();s.status=facet==='truth'?'awaiting-choice':'learning';
 rememberMind(p.id,'亲口谈起旧事：'+row.reply,'身世交谈',true);
 if(facet==='origin'&&s.arc==='agent'&&s.patron&&!socialEdgesOf(p.id).some(e=>e.a===s.patron||e.b===s.patron)){
  state.socialEdges.push({a:p.id,b:s.patron,affAB:43,affBA:42,kind:'旧日荐引',origin:'曾受引见，往来先止于荐书；不能据此推断其他用意。'});
 }
}
function storyTalk(facet){
 if(!session||session.left<1||!['origin','scar','truth'].includes(facet))return;
 const p=PEOPLE.find(p=>p.id===session.id),s=storyOf(p),gate=storyGate(p,facet);if(gate){toast(gate);return;}
 if(s.known[facet]){session.response=__courtVoiceAudit.renderTurn(storyRow(p,facet));renderSession();return;}
 __courtVoiceAudit.perform(p,storyRow(p,facet),{aff:2});
 renderSession();save();
}
function storyChoose(raw){
 const [id,key]=String(raw).split('|'),p=PEOPLE.find(p=>p.id===id);if(!p||session?.id!==id||session.left<1)return;
 const s=storyOf(p),arc=storyArc(p),choice=arc.choices.find(c=>c[0]===key);
 if(!choice||!s.known.truth||s.decision||storyGate(p,'truth'))return;
 const row={id:'story-decision:'+id,semantic:'story-decision:'+id,category:'chat',topic:'story:decision',player:choice[1],reply:storyFill(choice[2],p),stage:'',socialTier:socialTier(p)};
 if(!__courtVoiceAudit.perform(p,row,{aff:1}))return;
 s.decision=key;s.status=['test','verify','break'].includes(key)?'pending':'resolved';s.due=s.status==='pending'?mindTick()+2:null;
 if(key==='break')s.channelClosed=true;
 log(p.name+'：'+choice[1]+'。'+(s.due?'后续尚待两日复核。':'未许下未经考校的官职。'),'身世后续',id);
 renderSession();save();
}
function storyInvestigate(id){
 const p=PEOPLE.find(p=>p.id===id),s=p&&storyOf(p);if(!s||!s.known.scar||s.investigation||socialTier(p)==='stranger'||!pay(1))return;
 s.investigation={requested:mindTick(),due:mindTick()+2,done:false};
 log('命人核对'+p.name+'自愿提供的旧物与来往记录，尚未有结论。','身世查证',id);render();storyDossier(id);save();
}
function storyDay(key){
 const root=storyRoot();if(root.days[key])return;root.days[key]=true;
 for(const p of PEOPLE){const s=storyOf(p),r=state.relations[p.id],arc=storyArc(p);
  r.agency=r.agency||{};r.agency.storyGoal=arc.want;
  if(s.investigation&&!s.investigation.done&&mindTick()>=s.investigation.due){
   s.investigation.done=true;s.investigation.result=storyFill(arc.evidence,p);s.investigation.completed= mindTick();
   log(p.name+'旧物查证已回，有据可核，尚未据此定罪。','身世查证',p.id);
  }
  if(s.status==='pending'&&s.due&&mindTick()>=s.due){
   const pr=castProfile(p.id)||{},key=pr.specialtyKey||p.specialtyKey||'literature',ability=(r.skills||p.skills||{})[key]||0;
   s.status='resolved';s.completed=mindTick();
   if(s.decision==='test'){
    s.passed=!!STORY_DATA.core[p.id]||ability>=60||(pr.specialtyLevel||p.specialtyLevel||0)>=5;
    s.result=STORY_DATA.core[p.id]?storyFill(arc.evidence,p):s.passed?'所呈已通过这次考校，评阅意见已存；这只是才学获得认可，未直接授官。':'此次考校仍有不足，已留下具体改进处；他可以继续研习，并未因私情改判通过。';
    r.trust=clamp(r.trust+(s.passed?3:1));shiftMind(p.id,{security:s.passed?4:1});
   }else{
    s.result=storyFill(arc.evidence,p)+(s.decision==='break'?'这两日未再私下回复来笺，旧件已封存，原荐引关系仍待另核。':'已收原笺，不将他的自述单独视为定罪凭据。');
    s.investigation={requested:s.due-2,due:s.due,done:true,completed:mindTick(),result:s.result};
   }
   rememberMind(p.id,s.result,'身世后续',true);log(p.name+'：'+s.result,'身世后续',p.id);
  }
  if(s.arc==='agent'&&!s.channelClosed&&s.status!=='resolved'&&mindHash(root.seed+':request:'+p.id+':'+key)%9===0)s.privateRequests++;
  const entry=state.dailyHistory[key]?.entries[p.id]?.[3];
  if(entry&&!['visit','cooperate','help','disagree','reconcile'].includes(r.mind.lastAction)&&!entry.text.includes('与女帝')&&mindHash(root.seed+':story-day:'+p.id+':'+key)%5===0){
   const text=storyFill(arc.daily,p);entry.text=text;s.activityDays++;
   rememberMind(p.id,text,'自主日常',true);r.agency.plan=text;
   const moment=state.agency?.moments.find(x=>x.key===key&&x.npc===p.id);if(moment){moment.text=text;moment.motive='正在做自己的安排。';}
  }
 }
 for(const k of Object.keys(root.days).slice(0,-90))delete root.days[k];
}
function storyPanel(p){
 const s=storyOf(p),f=storyRoot().families[s.family],esc=mindEscape;
 return '<section class="card section-space story-dossier"><div class="section-heading"><h3>来路与旧事</h3><span class="tag">'+esc(f.clan)+' · '+esc(STORY_DATA.origins[f.origin].name)+'</span></div><p>'+esc(storyPublic(p))+'</p>'+
  (s.known.scar?'<div class="record"><b>他亲口说过</b><p>'+esc(storyText(p,'scar'))+'</p></div>':'<p class="mini">话到旧事，他仍有些保留。来路可以先问，私心要慢慢听。</p>')+
  (s.known.truth?'<div class="record"><b>后来才说尽的话</b><p>'+esc(storyText(p,'truth'))+'</p></div>':'')+
  (s.investigation?.done?'<div class="record"><b>已核对的旧物</b><p>'+esc(s.investigation.result)+'</p></div>':s.investigation?'<p class="mini">旧物正在复核，尚无结论。</p>':'')+
  (s.result?'<div class="record"><b>此后的事</b><p>'+esc(s.result)+'</p></div>':'')+
  '<div class="actions"><button class="btn ghost" data-action="storyMeet" data-id="'+p.id+'">见面问旧事 · 1行动</button><button class="btn ghost" data-action="familyTree" data-id="'+p.id+'">看族谱</button>'+
  (s.known.scar&&!s.investigation?'<button class="btn ghost" data-action="storyInvestigate" data-id="'+p.id+'">核看他愿交出的旧物 · 1行动</button>':'')+'</div></section>';
}
function storyDossier(id){const p=PEOPLE.find(p=>p.id===id);if(!p)return;openModal(p.name+' · 来路与旧事','已经听过、看过的，才记在这里。',storyPanel(p),'人物旧事');}
const storyBaseSocialRows=socialRows;
socialRows=function(p,c,category,topic){
 const rows=storyBaseSocialRows(p,c,category,topic),s=storyOf(p);
 if(category==='chat'&&topic==='home'&&!s.known.origin)rows.push(storyRow(p,'origin',category,topic));
 if(category==='care'&&topic==='listen'&&s.known.origin&&!s.known.scar&&!storyGate(p,'scar'))rows.push(storyRow(p,'scar',category,topic));
 return rows;
};
const storyBaseTopics=topicsFor;
topicsFor=function(category,p,r){const rows=storyBaseTopics(category,p,r);if(category!=='chat')return rows;
 const s=storyOf(p);if(!s.known.origin)rows.push(['story:origin','问问他的来路','先听他愿意说的那一段。']);
 else if(!s.known.scar)rows.push(['story:scar','接着聊那件旧事',storyGate(p,'scar')||'熟悉后，听听他当时没说出口的话。']);
 else if(!s.known.truth)rows.push(['story:truth','听完那半句话',storyGate(p,'truth')||'已经相知，仍由他自己开口。']);
 else if(!s.decision)for(const c of storyArc(p).choices)rows.push(['story:choice:'+c[0],c[1],'会留下不同的后续。']);
 return rows;
};
const storyBaseReason=topicReason;topicReason=function(category,id,p,r){const base=storyBaseReason(category,id,p,r);if(base)return base;if(id.startsWith('story:')&&!id.startsWith('story:choice:'))return storyGate(p,id.slice(6));return '';};
const storyBaseTopic=interactionTopic;interactionTopic=function(id){if(id.startsWith('story:choice:'))return storyChoose(session.id+'|'+id.slice(13));if(id.startsWith('story:'))return storyTalk(id.slice(6));return storyBaseTopic(id);};actions.interactionTopic=interactionTopic;
const storyBaseArchive=archive;archive=function(id){storyBaseArchive(id);const p=PEOPLE.find(p=>p.id===id),body=$('modalBody');if(p&&body)body.insertAdjacentHTML('afterbegin',storyPanel(p));};actions.archive=archive;
haremPerson=function(id){const p=PEOPLE.find(p=>p.id===id);if(!p)return;const r=state.relations[id],h=CAST_HOUSES.find(h=>h.id===state.harem.housing[id]);openModal(p.name+' · 后宫档案',(h?.name||'内廷')+' · '+castMarriageLabel(p),'<div class="talk-banner">'+portrait(p,true)+'<div><span class="tag">'+mindEscape(r.rank||p.role)+'</span><p>好感 '+r.aff+' · 信任 '+r.trust+'</p><small>'+mindEscape(castProfile(id)?.specialty||p.specialty||'所学')+'</small></div></div>'+storyPanel(p)+'<div class="actions"><button class="btn ghost" data-action="dailySchedule" data-id="'+id+'">看今日行迹</button><button class="btn ghost" data-action="archive" data-id="'+id+'">交际与记事</button></div>','后宫人物');};actions.haremPerson=haremPerson;
actions.storyDossier=storyDossier;actions.storyInvestigate=storyInvestigate;actions.storyMeet=id=>{const before=state.ap;visit(id);if(session?.id!==id||state.ap>=before)return;session.section='chat';renderSession();};
const storyBaseBuild=buildDay;buildDay=function(){const key=storyBaseBuild();if(!state.ecology.suspend)storyDay(key);return key;};
for(const p of PEOPLE)storyOf(p);
window.__storyAudit={storyOf,storyDay,storyGate,storyPublic,storyPanel,storyChoose,storyRow};
