/* First cohort is free; saved performances and sourced warnings never reroll on inspection. */
function selectionReview(){
 const a=state.audition;if(!a||a.status!=='offered'||!a.pool?.length)return null;
 if(!a.review){const c=state.cast||{};a.review={feeWaived:!c.initialSelectionConsumed&&c.lastSelection==null&&(c.nextSelection??2)<=2,performances:{},opened:todayKey()};}
 return a.review;
}
function auditionPlacementCost(a=state.audition){if(a?.status==='offered')selectionReview();return a?.review?.feeWaived?0:(a?.selected?.length||0)*12;}
function auditionFeeCopy(a=state.audition){return a?.review?.feeWaived?'首届殿选免安置费，留宫也不扣内库。':'本届每人安置费12；查看与问话免费。';}
function selectionPerformance(id,live=false){
 const au=state.audition,review=selectionReview(),p=PEOPLE.find(p=>p.id===id),perf=au?.performances?.[id];if(!p||!perf||!review)return;
 if(review.performances[id])return review.performances[id];
 const officials=frontOfficials(),attendees=['xu','jiang','ye'].map(id=>officials.find(p=>p.id===id)).filter(Boolean),d=au.dossiers?.[id]||eliteDossier(p),family=d.clan||p.faction||'门第未详';
 const comments=attendees.map(a=>({id:a.id,name:a.name,text:a.id==='xu'?(perf.falter?'“一处失手，不必便定终身。把方才那段再讲清楚，臣听他如何自解。”':perf.level>=4?'“所学有根底，收势也稳。这一项可记优，仍要分开看品行与意愿。”':'“试艺尚可，离纯熟还有距离。才名与今日所见，应当分记。”'):a.id==='jiang'?'“'+simEsc(family)+'的荐册可再核一遍。才艺在眼前，家中往来却不能只凭一面便下断语。”':perf.level>=4?'“确有拿得出手的本事。宫中要留人，也请礼部把供给和安置逐项列清。”':'“眼前这项不算拔尖。若另有所长，不妨记下，免得只凭一试取人。”'}));
 const item={candidate:id,name:p.name,skill:perf.skill,level:perf.level,falter:perf.falter,day:perf.day,source:live?'殿前亲试':'礼官既存试艺簿',comments,live};review.performances[id]=item;
 if(live){log(p.name+'殿前试'+perf.skill+'；'+comments.map(c=>c.name+'：'+c.text).join(' '),'试艺廷议',id);}
 return item;
}
function selectionWarning(p){
 const au=state.audition,perf=au?.performances?.[p.id],story=storyOf(p),checks=state.selectionChecks||[],check=checks.find(c=>c.key===au.month+':'+p.id),facts=[],clues=[];
 if(au.consent?.[p.id]===false)facts.push('已知：本人已请撤牌，请勿强留。');
 if(perf?.falter)facts.push('亲见：方才试艺有一处失手。怯场与品行无涉，不能据此断他心术。');
 if(perf&&perf.level<3)facts.push('礼官试簿：此项尚未纯熟，未列上等。');
 const rivals=socialEdgesOf(p.id).filter(e=>['争执','决裂'].includes(e.voiceStage)).map(e=>PEOPLE.find(q=>q.id===(e.a===p.id?e.b:e.a))).filter(q=>q&&au.pool.includes(q.id));
 if(rivals.length)facts.push('已有往来记录：与'+rivals.map(q=>q.name).join('、')+'失和，若同留，宜分开安置，不宜凭此责罪。');
 if(story.arc==='agent'&&story.patron){
  if(check?.status==='done')facts.push('已核荐书流转：'+check.result);
  else clues.push('待核：荐书经过外间转递，来路还须对照旧封。尚不能据此断他是暗线，更不能定罪。');
 }
 if(!facts.length&&!clues.length)facts.push('现有簿册未见可确认的过失。奴才不能替谁担保，家世、性情也不能当作罪证。');
 return {facts,clues,check,canCheck:story.arc==='agent'&&!!story.patron&&!check};
}
function selectionCheck(id){
 const au=state.audition,p=PEOPLE.find(p=>p.id===id);if(au?.status!=='offered'||!au.pool.includes(id)||!p)return;
 const w=selectionWarning(p);if(!w.canCheck||!pay(1))return;const st=storyOf(p),patron=PEOPLE.find(p=>p.id===st.patron);
 state.selectionChecks=state.selectionChecks||[];state.selectionChecks.push({key:au.month+':'+id,candidate:id,name:p.name,started:mindTick(),due:mindTick()+2,status:'pending',source:{arc:st.arc,patron:patron?.name||'原荐举人'},result:null});
 log('交谢无咎核对'+p.name+'荐书流转，候两日回册；未凭传闻定罪。','选秀核查',id);auditionInterview(id);save();
}
function selectionChecksDay(){
 for(const c of state.selectionChecks||[])if(c.status==='pending'&&mindTick()>=c.due){c.status='done';c.result='原荐书的转递人与'+c.source.patron+'一线有实际往来，已对上旧封与交收日。只能证实这层荐举关系，尚不能证明受命入宫或怀有恶意。';log(c.name+'荐书核查回册：'+c.result,'选秀核查');}
}
let selectionIsPerforming=null;
const selectionOldPerform=actions.auditionPerform;actions.auditionPerform=id=>{selectionIsPerforming=id;try{selectionOldPerform(id);}finally{selectionIsPerforming=null;}save();};
const selectionOldInterview=auditionInterview;auditionInterview=function(id,answer=''){
 selectionOldInterview(id,answer);const a=state.audition,p=PEOPLE.find(p=>p.id===id);if(a?.status!=='offered'||!p||!a.pool.includes(id))return;
 const perf=selectionPerformance(id,selectionIsPerforming===id),w=selectionWarning(p);
 let html='<section class="card section-space"><h3>谢无咎 · 候选簿提醒</h3>'+w.facts.map(x=>'<p>“'+mindEscape(x)+'”</p>').join('')+w.clues.map(x=>'<p>“'+mindEscape(x)+'”</p>').join('')+(w.check?.status==='pending'?'<p class="mini">已交核荐书，尚需'+Math.max(0,w.check.due-mindTick())+'日；离开选秀也会继续核查。</p>':'')+(w.canCheck?'<button class="btn ghost" data-action="selectionCheck" data-id="'+id+'">交核荐书 · 1行动 / 2日</button>':'')+'</section>';
 if(perf)html+='<section class="card section-space"><h3>'+(perf.live?'试艺后的官员反应':'据旧试簿覆议')+'</h3><p class="mini">'+mindEscape(perf.source)+' · '+mindEscape(perf.skill)+' · 所学'+perf.level+'级'+(perf.falter?' · 当场有失手':' · 当场完成')+'</p>'+perf.comments.map(c=>'<p><b>'+mindEscape(c.name)+'</b> '+mindEscape(c.text)+'</p>').join('')+'<button class="btn ghost" data-action="selectionCompare">比较已试才艺</button></section>';
 $('modalBody').insertAdjacentHTML('beforeend',html);save();
};actions.auditionInterview=id=>auditionInterview(id);
const selectionOldPanel=auditionPanel;auditionPanel=function(){selectionOldPanel();const r=selectionReview();if(!r)return;$('modalBody').insertAdjacentHTML('afterbegin','<p class="effect">'+auditionFeeCopy()+'</p>');if(Object.keys(state.audition.performances||{}).length)$('modalBody').insertAdjacentHTML('beforeend','<button class="btn ghost wide" data-action="selectionCompare">比较已试才艺与廷议</button>');};actions.audition=auditionPanel;
const selectionOldConfirm=actions.auditionConfirm;actions.auditionConfirm=()=>{selectionReview();selectionOldConfirm();if(state.audition?.status==='completed'){state.cast.initialSelectionConsumed=true;save();}};
const selectionOldDecline=actions.auditionDecline;actions.auditionDecline=()=>{selectionOldDecline();if(state.audition?.status==='declined'){state.cast.initialSelectionConsumed=true;save();}};
auditionConfirm=actions.auditionConfirm;
Object.assign(actions,{selectionCheck,selectionCompare:()=>{
 const au=state.audition;if(au?.status!=='offered')return;const entries=Object.keys(au.performances||{}).map(id=>selectionPerformance(id)).filter(Boolean),groups={};for(const p of entries)(groups[p.skill]||(groups[p.skill]=[])).push(p);
 openModal('才艺比试簿','同项所学可比较等第；不同专长各论其长，失手不作道德评断。',Object.entries(groups).map(([skill,rows])=>'<h3>'+mindEscape(skill)+'</h3>'+rows.sort((a,b)=>b.level-a.level).map(p=>'<div class="record"><b>'+mindEscape(p.name)+'</b> · '+p.level+'级'+(p.falter?' · 一度失手':' · 当场完成')+p.comments.map(c=>'<p><b>'+mindEscape(c.name)+'</b> '+mindEscape(c.text)+'</p>').join('')+'<button class="btn ghost" data-action="auditionInterview" data-id="'+p.candidate+'">回看问话与意愿</button></div>').join('')).join('')+'<button class="btn primary wide" data-action="audition">回到名册</button>','殿选 · 试艺廷议');
}});
