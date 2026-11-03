'use strict';
// 最后一层文案与数值校准：把所有可见人物回应统一到古风乙女口吻，并保留旧存档兼容。
const REVISION_INDEX=new Map();
for(const row of (REVISION_DATA?.rows||[]))REVISION_INDEX.set(`${row.personality}|${row.mood}|${row.category}`,row);
function revisionMood(p){try{return currentMind(p);}catch{return '平静';}}
function revisionRow(p,category){
 const mood=revisionMood(p), direct=REVISION_INDEX.get(`${p.type}|${mood}|${category}`);
 if(direct)return direct;
 return REVISION_INDEX.get(`${p.type}|平静|${category}`)||REVISION_DATA?.rows?.find(x=>x.category===category)||null;
}
function revisionLine(p,category,topic){
 const row=revisionRow(p,category);if(!row)return null;
 if(category==='sleep')return row.reply;
 return row.reply;
}
const revisionReadBefore=typeof readFiction==='function'?readFiction:null;
if(revisionReadBefore){
 readFiction=function(p,category,topic){
  const row=revisionRow(p,category);if(!row)return revisionReadBefore(p,category,topic);
  return {id:row.id,stage:row.stage,reply:row.reply,scene:{player:row.player,location:row.location}};
 };
}
// 八类互动的按钮说明也采用古风语气；调情明确写出本次至少±5暧昧度。
const revisionTopicsBefore=topicsFor;
topicsFor=function(category,p,r){
 const a=(revisionTopicsBefore(category,p,r)||[]).map(x=>x.slice());
 if(category==='flirt'){
  for(const x of a){
   if(x[0]==='compliment')x[2]='认真夸他一句；依他此刻心境，暧昧度+6或−5。';
   if(x[0]==='miss')x[2]='问他是否也曾想你；一句话落下，暧昧度+6或−5。';
   if(x[0]==='confess')x[2]='把心意说得明白；暧昧度+8或−6，不能拿玩笑收回。';
  }
 }
 if(category==='sleep')for(const x of a)if(x[0]==='ask')x[2]='先问本人愿不愿意；入宫与否都可私下相约，另耗1行动。';
 return a;
};
const revisionTopicBefore=interactionTopic;
interactionTopic=function(id){
 const sec=session?.section,p=session?PEOPLE.find(x=>x.id===session.id):null;
 revisionTopicBefore(id);
 if(session&&p&&sec&&REVISION_INDEX.size&& !String(id).startsWith('relation:')&&!String(id).startsWith('exclusive:')&&sec!=='sleep'){
  const row=revisionRow(p,sec);if(row){session.response=`“${row.reply}”`;renderSession();}
 }
};
actions.interactionTopic=interactionTopic;
const revisionVisitBefore=visit;
visit=function(id){
 revisionVisitBefore(id);
 const p=session&&PEOPLE.find(x=>x.id===session.id);
 if(session&&p){const row=revisionRow(p,'chat');if(row){session.message=`${row.stage}\n${row.player}\n“${row.reply}”`;session.response='';renderSession();save();}}
};
actions.visit=visit;
const revisionRecruitDialogBefore=openRecruit;
openRecruit=function(p){
 revisionRecruitDialogBefore(p);
 const row=revisionRow(p,'persuade'),box=$('modalBody')?.querySelector('.scene-text');
 if(row&&box)box.textContent=`${row.stage}\n\n“${row.reply}”`;
};
// 调情是一次明确的情感落点，不再被旧的每月成长上限压成1、2点。
const revisionApplyBefore=applyInteraction;
applyInteraction=function(p,category,id,line,effects={},options={}){
 const mood=revisionMood(p),row=revisionRow(p,category),chosen=row?.reply||line;
 const next={...effects};
 const loveBefore=Number(state.relations[p.id]?.love||0);
 if(category==='flirt'){
  const positive=['热恋','安心','期待','平静'].includes(mood);
  next.love=id==='confess'?(positive?8:-6):(positive?6:-5);
  if(next.aff===undefined)next.aff=positive?2:-2;
 }
 revisionApplyBefore(p,category,id,chosen,next,options);
 if(category==='flirt'){
  const r=state.relations[p.id];
  const before=loveBefore;
  const desired=next.love>=0?Math.max(5,next.love):Math.min(-5,next.love);
  // 旧层可能受“本月成长上限”影响，这里补足差值，保证玩家感知到一次完整回应。
  if(Math.abs(r.love-before)<Math.abs(desired))r.love=clamp(before+desired);
  delete r.__revisionLoveBefore;
  if(session){const label=desired>0?`暧昧度+${desired}`:`暧昧度${desired}`;session.history[session.history.length-1]=`${INTERACTION_CATEGORIES.find(x=>x[0]===category)[1]} · ${label}`;}
  render();if(session)renderSession();save();
 }
};
// 入宫是关系跃迁：册封/招入后的初始暧昧度固定在50以上，并带少量随机差异。
function revisionSeed(id){let n=0;for(const c of String(id)+String(state.elapsed)){n=(n*33+c.charCodeAt(0))>>>0;}return n;}
function revisionWelcome(id){const r=state.relations[id];if(!r)return;const before=Number(r.love||0);if(before<50)r.love=50+(revisionSeed(id)%21);r.notes=r.notes||[];r.notes.push({month:state.elapsed,text:`入内廷时，礼部记下初见心意：暧昧度${r.love}。`});}
const revisionRecruitBefore=actions.recruitConfirm;
actions.recruitConfirm=id=>{const r=state.relations[id],was=r?.rank;revisionRecruitBefore(id);if(r&&!was&&r.rank)revisionWelcome(id);};
const revisionAuditionBefore=actions.auditionConfirm;
actions.auditionConfirm=()=>{const au=state.audition,ids=(au?.selected||[]).slice(),old=new Set(ids.filter(id=>state.relations[id]?.rank));revisionAuditionBefore();for(const id of ids){const r=state.relations[id];if(r?.rank&&!old.has(id))revisionWelcome(id);}save();};
// 旧存档沿用原版本号时，第一次打开自动抬到15行动；以后每月仍由nextMonth恢复15。
if(state.apMax!==15){state.apMax=15;if(state.ap===10)state.ap=15;}
// 朝堂入口只在“本日尚未入朝”时消耗1点；退朝后同日不能再召集百官。
function revisionEnterCourt(){
 initExploration();
 if(isAway()){toast('正在巡游，回京后方可入朝。');return false;}
 if(courtStatus()==='left'){toast('今日已退朝，明日再议。');return false;}
 if(courtStatus()!=='open'){
  if(!pay(1))return false;
  state.courtDays[todayKey()]='open';
 }
 return true;
}
const revisionTabBefore=actions.tab;
actions.tab=id=>{
 if(id==='court'){
  if(!revisionEnterCourt())return;
 }else if(state.tab==='court')endAudience();
 revisionTabBefore(id);
};
function revisionStartAudience(){
 initExploration();state.day=state.day||1;state.courtDays=state.courtDays||{};
 if(courtStatus()==='left')state.courtDays[todayKey()]='available';
 if(courtStatus()!=='open'){if(state.ap<1)return false;state.ap-=1;state.courtDays[todayKey()]='open';}
 state.tab='court';return true;
}
const revisionIntroBefore=actions.introDone;
actions.introDone=()=>{state.introSeen=true;closeModal();revisionStartAudience();render();save();};
const revisionMonthBefore=actions.nextMonth;
actions.nextMonth=()=>{revisionMonthBefore();state.day=1;state.courtDays=state.courtDays||{};state.courtDays[todayKey()]='available';revisionStartAudience();render();save();};
// 朝堂“皇室”只打开后宫名单，不跳地图、不触发任务或随机事件。
function revisionConsortRoster(){
 ensureCastState();const list=PEOPLE.filter(p=>state.relations[p.id]?.rank);
 openModal('皇室 · 后宫名册',`当前在宫 ${list.length} 人`,`<p class="mini">这里只记内廷名册；宫室地图、人物心事与日常行迹另在退朝后查看。</p>${list.length?list.map(p=>{const r=state.relations[p.id],h=CAST_HOUSES.find(x=>x.id===state.harem.housing[p.id]);return `<div class="record"><button class="text-btn" data-action="haremPerson" data-id="${p.id}">${haremLabel(p)}</button><span class="tag">${r.rank}</span><p>${h?.name||'未分宫'} · 好感 ${r.aff} · 暧昧 ${r.love} · 忠诚 ${r.loyalty}</p></div>`;}).join(''):'<div class="empty small"><span>阙</span><h3>后宫尚空</h3><p>选秀或日常相处后，名册会在此添上新名字。</p></div>'}`,'内廷名册');
}
const revisionCourtSideBefore=actions.courtSide;
actions.courtSide=id=>{if(id==='family'){revisionConsortRoster();return;}revisionCourtSideBefore(id);};
// 界面上把机械的“皇室”引导语收成更像宫中记录的句子。
const revisionRenderBefore=render;
render=function(){revisionRenderBefore();const ap=$('ap');if(ap)ap.textContent=state.ap;const t=document.querySelector('.court-entry p');if(t)t.textContent='早朝已毕，陛下可在退朝后安排人物、宫内场景与地方巡游。';save();};
ensureInteractionStats();save();
