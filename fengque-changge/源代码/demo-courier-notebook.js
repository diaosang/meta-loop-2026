/* Official briefs and personal invitations have different sources and thresholds. */
function courierState(){return state.correspondence=state.correspondence||{version:'13.4',sentDays:{},seen:{},migrated:false};}
function storyInvitationEligible(p){
 const r=state.relations[p.id],g=STORY_DATA.invitationRules,s=r?.mind?.social;
 return !!r&&castAge(p)>=18&&r.aff>=g.minAff&&r.trust>=g.minTrust&&s?.days?.length>=g.minDays&&s.count>=3&&
  !['恼怒','疏离','戒备','失望','委屈','吃醋'].includes(currentMind(p));
}
function storyInvitationRoll(p){
 if(!storyInvitationEligible(p))return false;
 const c=courierState(),m=state.relations[p.id].mind,own=state.palaceLife?.people?.[p.id],tick=mindTick();
 const last=Math.max(m.lastPersonalInvite??-999,own?.invitationTick??-999);
 if(tick-last<STORY_DATA.invitationRules.cooldownDays||(c.sentDays[tick]||0)>=2)return false;
 return mindHash(storyRoot().seed+':invitation:'+p.id+':'+tick)%100<STORY_DATA.invitationRules.dailyPercent;
}
function storyInvitationSent(p){const c=courierState(),tick=mindTick();state.relations[p.id].mind.lastPersonalInvite=tick;c.sentDays[tick]=(c.sentDays[tick]||0)+1;for(const k of Object.keys(c.sentDays).slice(0,-90))delete c.sentDays[k];}
function importantNotices(){
 const out=[],seen=courierState().seen,add=n=>{n.unread=!seen[n.id];out.push(n);};
 const c=state.case;if(c&&!c.judgment){
  add({id:'grain:'+c.evidence.length+':'+!!c.secret,title:'北营少粮三百石',
   text:'陛下，北营报缺粮三百石。'+(c.evidence.length?'目前已有'+c.evidence.length+'项入卷证据，尚待核清经手人与银钱来路。':'粮数与签收底册尚待核对，请先验仓、封存原册。'),action:'case'});
 }
 for(const r of (state.courtVoice?.reports||[]).filter(r=>r.stage==='呈报'||r.done).slice(-3)){
  const t=__courtVoiceAudit.template(r);if(!t)continue;
  if(!['doctor','examcheat','envoy','rain'].includes(t.id)&&r.priority!=='urgent')continue;
  add({id:'report:'+r.uid+':'+r.stage,title:t.title,text:r.done?'陛下，此案已回奏：'+r.result:'陛下，'+t.brief,action:'voiceReportOpen',arg:r.uid});
 }
 if((state.strife?.threat||0)>=65)add({id:'border:'+Math.floor(state.strife.threat/10),title:'边情需留意',text:'陛下，边情警度已至'+Math.round(state.strife.threat)+'，请阅军情与现有守备，免误处置时机。',action:'tab',arg:'court'});
 for(const [id,s]of Object.entries(state.stories?.people||{})){
  const p=PEOPLE.find(p=>p.id===id);if(!p||!s.investigation?.done)continue;
  add({id:'story-check:'+id+':'+s.investigation.completed,title:p.name+'的旧物已核',text:'陛下，前命核对的文书已有回报。'+s.investigation.result,action:'storyDossier',arg:id});
 }
 for(const m of (state.ecology?.inbox||[]).filter(m=>!m.done&&m.event?.domain==='前朝').slice(-2)){
  if(!/边|军|粮|灾|疫|赈|科场|舞弊|伤亡|急|使|互市|大案|弹劾|贪|挪/.test(m.event.title))continue;
  add({id:'official-letter:'+m.id,title:m.event.title,text:'陛下，'+(PEOPLE.find(p=>p.id===m.npc)?.name||'有司')+'递来“'+m.event.title+'”一事，尚待召问。',action:'mindLetter',arg:m.id});
 }
 return out;
}
function courierOpen(id){const n=importantNotices().find(n=>n.id===id);if(!n)return;courierState().seen[id]=mindTick();save();if(actions[n.action])actions[n.action](n.arg);}
function notebookHtml(){
 const esc=mindEscape,tab=state.notebookTab||'letters',tabs=[['letters','书信与约定'],['movements','人物动向'],['stories','人物旧事']];
 let inner='';
 if(tab==='letters'){
  const mail=(state.ecology?.inbox||[]).filter(m=>!m.done),life=(state.palaceLife?.episodes||[]).filter(e=>['new','awaiting','scheduled'].includes(e.phase));
  inner='<h4>御前公事</h4>'+importantNotices().filter(n=>n.unread).map(n=>'<div class="record"><b>'+esc(n.title)+'</b><p>'+esc(n.text)+'</p><button class="btn ghost" data-action="courierOpen" data-id="'+esc(n.id)+'">阅报处理</button></div>').join('')+'<button class="text-btn" data-action="randomEvent">例行文书另册查看</button><h4>私人书信</h4><p class="mini">私人邀约须已熟悉、好感50、信任40，并在不同日子相处过；达到条件后仍有概率，非每日必来。</p><div class="actions"><button class="btn primary" data-action="mindLetters">查看来信 · '+mail.length+'</button><button class="btn ghost" data-action="v13Panel">小笺、约定与旧物 · '+life.length+'</button></div>';
 }else if(tab==='movements'){
  const moments=(state.agency?.moments||[]).slice().reverse(),seen=new Set(),list=[];
  for(const x of moments){const key=x.key+'|'+x.npc;if(seen.has(key))continue;seen.add(key);list.push(x);if(list.length===16)break;}
  inner=list.map(x=>'<div class="record"><b>'+esc(x.name||PEOPLE.find(p=>p.id===x.npc)?.name||'人物')+'</b><span class="mini"> · '+esc(x.key)+'</span><p>'+esc(x.text)+'</p><button class="text-btn" data-action="archive" data-id="'+esc(x.npc)+'">看此人的记事</button></div>').join('')||'<p class="mini">今日尚无新行迹。</p>';
 }else{
  const known=PEOPLE.filter(p=>storyOf(p).known.origin);
  inner=known.map(p=>'<div class="record"><b>'+esc(p.name)+'</b><p>'+esc(storyPublic(p))+'</p><button class="btn ghost" data-action="storyDossier" data-id="'+p.id+'">看已知旧事</button></div>').join('')||'<p class="mini">与人闲谈时，可以先问一问他的来路。听过的旧事会收在这里。</p>';
 }
 return '<section class="card notebook"><div class="section-heading"><h3>记事簿</h3><span class="tag">私笺与日常</span></div><div class="actions" role="tablist">'+tabs.map(([id,name])=>'<button class="btn '+(tab===id?'primary':'ghost')+'" data-action="notebookTab" data-id="'+id+'" aria-selected="'+(tab===id)+'">'+name+'</button>').join('')+'</div><div class="notebook-content section-space">'+inner+'</div></section>';
}
const courierBeforeRender=render;
render=function(){
 courierBeforeRender();const screen=$('screen');if(!screen)return;
 const nav=document.querySelector('.nav [data-id="notes"]');if(nav)nav.textContent='记事';
 if(state.tab==='home'){
  for(const el of screen.querySelectorAll('.agency-home,.mind-home,.v13-home'))el.remove();
  for(const title of screen.querySelectorAll('h3'))if(['新呈文书','谢无咎带来的消息','东厂递来的纪要'].includes(title.textContent))title.closest('.card')?.remove();
  if(!screen.querySelector('.notices-home')){
   const notices=importantNotices().filter(n=>n.unread),n=notices[0];
   const html='<section class="card section-space notices-home"><div class="section-heading"><h3>御前要事</h3><span class="tag">谢无咎呈报</span></div>'+
    (n?'<h4>'+mindEscape(n.title)+'</h4><p>“'+mindEscape(n.text)+'”</p><button class="btn primary" data-action="courierOpen" data-id="'+mindEscape(n.id)+'">阅报处理</button>'+(notices.length>1?'<p class="mini">另有'+(notices.length-1)+'件要事，记事簿可继续查看。</p>':''):'<p>今日暂无新的要事待报。</p>')+
    '<button class="text-btn" data-action="tab" data-id="notes">打开记事簿</button></section>';
   const anchor=screen.querySelector('.court-entry');if(anchor)anchor.insertAdjacentHTML('afterend',html);else screen.insertAdjacentHTML('afterbegin',html);
  }
 }
 if(state.tab==='notes'&&!screen.querySelector('.notebook'))screen.insertAdjacentHTML('afterbegin',notebookHtml());
 save();
};
actions.courierOpen=courierOpen;actions.notebookTab=id=>{if(!['letters','movements','stories'].includes(id))return;state.notebookTab=id;state.tab='notes';render();};
const migration=courierState();if(!migration.migrated){
 for(const m of state.ecology?.inbox||[])if(m.kind==='invite'&&!m.done&&!m.life13&&!m.cancelled&&!m.event&&!storyInvitationEligible(PEOPLE.find(p=>p.id===m.npc)||{})){m.done=true;m.resolution='旧版关系未足时生成的小邀约，已收入旧笺，不计失约。';}
 for(const ep of state.palaceLife?.episodes||[])if(ep.kind==='invite'&&ep.phase==='new'&&ep.plan!==undefined&&!storyInvitationEligible(PEOPLE.find(p=>p.id===ep.npc)||{})){ep.phase='expired';ep.migration='关系未足，收入旧笺；不计失约。';}
 migration.migrated=true;
}
window.__courierAudit={importantNotices,eligible:storyInvitationEligible,roll:storyInvitationRoll,notebookHtml};
// Prepare the existing monthly case objects once, before showing any brief.
const courierBeforeBuild=buildDay;buildDay=function(){const key=courierBeforeBuild();__courtVoiceAudit.reports();return key;};
__courtVoiceAudit.reports();
