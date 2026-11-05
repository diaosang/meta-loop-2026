/* Continue the same private concern instead of rerolling a new problem on each click. */
function canResumePrivateTalk(p){return !['恼怒','疏离','失望','委屈','吃醋'].includes(currentMind(p));}
(function(){
 const esc=mindEscape;
 const pending=p=>state.relations[p.id].mind.privateTalk;
 const oldTopic=interactionTopic;
 interactionTopic=function(id){
  if(!session||session.section!=='care'||id!=='listen')return oldTopic(id);
  if(typeof EVERYDAY_TALK_DATA!=='undefined')return oldTopic(id);
  const p=PEOPLE.find(x=>x.id===session.id),m=state.relations[p.id].mind,talk=pending(p);
  if(talk&&canResumePrivateTalk(p)&&mindTick()-talk.tick<=3&&(talk.phase==='awaiting'||talk.phase==='done'&&talk.tick===mindTick())){
   session.response=(talk.tick<mindTick()?'<small class="mini">上回没说完的话：</small><br><br>':'')+__courtVoiceAudit.renderTurn(talk.final||talk.opening);renderSession();return;
  }
  if(session.left<1)return;
  const before=session.left;oldTopic(id);
  const opening=m.lastTurn,branches=LISTEN_FOLLOWUPS.rows[opening?.id];
  if(session.left===before-1&&opening?.topic==='listen'&&branches){
   m.privateTalk={id:'private13-'+p.id+'-'+m.turnSeq,tick:mindTick(),phase:'awaiting',opening,branches};renderSession();save();
  }
 };
 actions.interactionTopic=interactionTopic;
 const oldTopics=topicsFor;
 topicsFor=function(category,p,r){
  const rows=oldTopics(category,p,r),t=pending(p);
  if(typeof EVERYDAY_TALK_DATA!=='undefined'||category!=='care'||!t||!canResumePrivateTalk(p)||mindTick()-t.tick>3)return rows;
  return rows.map(x=>x[0]!=='listen'?x:t.phase==='awaiting'?['listen','接着这件事聊','回看不扣次数；选择接话占1次互动。']:t.tick===mindTick()?['listen','回看刚才这段话','不扣互动次数。']:x);
 };
 const oldCategory=interactionCategory;
 interactionCategory=function(id){
  if(typeof EVERYDAY_TALK_DATA==='undefined'&&session&&id==='care'){
   const p=PEOPLE.find(x=>x.id===session.id),t=pending(p);
   if(t&&canResumePrivateTalk(p)&&mindTick()-t.tick<=3&&(t.phase==='awaiting'||t.tick===mindTick())){
    session.response=__courtVoiceAudit.renderTurn(t.final||t.opening);
    if(session.left<=0){session.section='care';renderSession();return;}
   }
  }
  return oldCategory(id);
 };
 actions.interactionCategory=interactionCategory;
 const oldRender=renderSession;
 renderSession=function(){
  if(typeof EVERYDAY_TALK_DATA==='undefined'&&session?.section==='care'&&!session.response){const p=PEOPLE.find(x=>x.id===session.id),t=p&&pending(p);if(t&&canResumePrivateTalk(p)&&mindTick()-t.tick<=3&&(t.phase==='awaiting'||t.tick===mindTick()))session.response=__courtVoiceAudit.renderTurn(t.final||t.opening);}
  oldRender();if(typeof EVERYDAY_TALK_DATA!=='undefined'||!session||session.section!=='care')return;
  const p=PEOPLE.find(x=>x.id===session.id),t=p&&pending(p),body=$('modalBody');
  if(!t||!canResumePrivateTalk(p)||t.phase!=='awaiting'||mindTick()-t.tick>3||!body||body.querySelector('.private-replies'))return;
  // Only attach to the matching opening; other care topics remain independent.
  if(!session.response.includes(esc(t.opening.reply)))return;
  const scene=body.querySelector('.scene-text');if(!scene)return;
  scene.insertAdjacentHTML('afterend','<section class="v13-replies private-replies"><div class="section-heading"><h3>你接道</h3><small class="mini">接话占1次互动</small></div>'+t.branches.map((b,i)=>'<button class="opt" data-action="privateReply" data-id="'+t.id+'|'+i+'" '+(session.left<1?'disabled':'')+'><b>'+esc(b.say)+'</b></button>').join('')+'</section>');
 };
 actions.backSession=renderSession;
 actions.privateReply=raw=>{
  if(typeof EVERYDAY_TALK_DATA!=='undefined')return;
  if(!session||session.left<1||session.section!=='care')return;
  const [id,n]=String(raw).split('|'),p=PEOPLE.find(x=>x.id===session.id),t=pending(p),choice=t?.branches[Number(n)];
  if(!t||!canResumePrivateTalk(p)||t.id!==id||t.phase!=='awaiting'||!choice||mindTick()-t.tick>3)return;
  const turn={id:t.id+':reply',semantic:t.id+':reply',category:'care',topic:'listen-followup',player:choice.say,stage:choice.stage||'',reply:choice.reply,narrative:choice.narrative||false,socialTier:t.opening.socialTier};
  if(!__courtVoiceAudit.perform(p,turn,{aff:1}))return;
  t.phase='done';t.final=turn;t.choice=Number(n);
  rememberMind(p.id,'说起“'+t.opening.reply+'”，女帝回道：“'+choice.say+'”','私下谈心',true);
  renderSession();save();
 };
 const beforeSocialTopics=topicsFor;
 topicsFor=function(category,p,r){
  const tier=socialTier(p);
  return beforeSocialTopics(category,p,r).map(x=>{
   if(category==='care'&&x[0]==='listen'&&!['接着这件事聊','回看刚才这段话'].includes(x[1]))return ['listen',tier==='stranger'?'问候一声，听他说说':tier==='familiar'?'陪他聊一件小事':'听听他藏着的话',tier==='stranger'?'先从眼前的小事聊起。':tier==='familiar'?'熟悉些了，不必句句客套。':'有些话，他只愿私下慢慢说。'];
   if(category==='chat'&&x[0]==='home')return ['home','聊聊家中旧事',tier==='stranger'?'尚拘谨时，只说愿意提的那一点。':'接着聊家中的人与旧事。'];
   return x;
  });
 };
 const beforeSocialGate=topicReason;
 topicReason=function(category,id,p,r){
  const old=beforeSocialGate(category,id,p,r);if(old)return old;
  if(category==='probe'&&id==='family'&&socialTier(p)==='stranger')return '私下尚不熟，先从寻常话聊起。';
  if(id.startsWith('exclusive:')&&socialTier(p)==='stranger'){
   const base=FICTION_DATA.bespoke.find(x=>x.id===id.slice(10)&&x.npc===p.id),ordered=FICTION_DATA.bespoke.filter(x=>x.npc===p.id&&x.state==='平静');
   const i=ordered.findIndex(x=>x.title===base?.title),min={xu:[3],ye:[2],song:[2],lu:[1]};
   if(min[p.id]?.includes(i))return '这件私事，待相处熟悉些再提。';
  }
  return '';
 };
})();
