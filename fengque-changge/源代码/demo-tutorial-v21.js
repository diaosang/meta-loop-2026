/* Optional, save-backed onboarding. Navigation never issues a paid command. */
const GUIDE21_COURSES = {
  basics: [
    ['看清手里的钱粮', '库银用于国事，内帑供宫中私用。存粮养兵，欠叶氏是要逐笔归还的借款。每日六次日常、每旬两件国事，各算各的。', '只看账面，不花钱、不经过时间。'],
    ['先见一个人', '从人物档案点“关心”，再选“问问近况”。一次会面用一次日常安排，能聊三回；查看档案免费。', '忙碌的人不必强求，可以换个人，或明日再见。'],
    ['上朝，试用一位人才', '先到奉天殿，再从“选人”打开人才册。看带兵、理事与出身，亲自选一人实试任用。', '任用一人：库银20、1件国事。带兵强的适合领军，理事强的适合管地方。'],
    ['看地图，先探敌情', '在疆域图点尚未收复的州城，再点“派斥候探路”。先知道敌军怎样布阵，打仗才有凭据。', '探路：库银20、1件国事。这一步不用出征，也不损兵。'],
    ['过一旬，查收回报', '国事安排妥当后，点“过到下一旬”，看清提示再确认。到时收支、查账与人物日程一起推进，随后看看山河记事。', '过一天恢复当日安排；到下一旬才补回两件国事。私人约定也会随时间经过。'],
    ['把进度收好', '打开“存档 / 读档”。游戏会自动存档；还可下载完整进度，或存入手动格。换设备前，记得下载一份。', '本教程不要求下载文件。看清入口后，便可自由游玩。']
  ],
  realm: [
    ['到军营看看', '持盾兵顶正面，弓手远射，轻骑走侧路。补兵能多留一些守军，也会增加往后的养兵开销。', '补兵一百：库银30、存粮20、1件国事。也可先用现有兵马。'],
    ['亲自配兵出征', '到尚未收复的地方，选已经任用且未在地方任职的将领，再填写三类兵数。京畿至少留二百人。', '确认出征才花库银60、存粮30、1件国事。这里只带你看配置，是否出兵由你决定。'],
    ['看敌军动向，下军令', '每回合看敌军动向再下令：压桥时先守阵，换弓阵时可走侧路。战报会记实际折兵，不能只顾进攻。', '每仗最多五令。可以撤回余部；败退后可整军再来，教程不会替你取胜。'],
    ['收回地方，还要派人管', '收复以后，选一位已任用、未另任职的人做知府。有人经手，地方才会逐旬交钱粮；出身与忠诚也要一起看。', '授地方印用1件国事。任官后可看实际收入、修田、查亏空；查清后再决定追款。']
  ]
};
const guide21Before = {render, open:openModal, close:closeModal, start:c19Start, panel:c19Panel, care:v20CommitTalk};
let guide21Timer = 0;
let guide21Updating = false;
function guide21State() { return state.guide21 || null; }
function guide21Modal() { return !!$('modal')?.classList?.contains?.('show'); }
function guide21Step() { const g=guide21State(); return g ? GUIDE21_COURSES[g.course]?.[g.step] : null; }
function guide21Fresh(status='active', course='basics') {
  return {version:1,status,course,step:0,done:[],skipped:[],started:simTick(),entryTurn:state.campaign19.turn,careSeen:false,hallSeen:false,recordsSeen:false,vaultSeen:false,finishedNotice:false};
}
function guide21Commit() { save(); guide21Schedule(); }
function guide21Advance(skip=false) {
  const g=guide21State(); if(!g || g.status!=='active' || !guide21Step()) return;
  const key=g.course+':'+g.step;
  (skip?g.skipped:g.done).push(key); g.step++;
  g.entryTurn=state.campaign19.turn; g.recordsSeen=false; g.vaultSeen=false;
  if(g.step>=GUIDE21_COURSES[g.course].length) {g.status='done'; g.finishedNotice=true;}
  guide21Commit();
}
function guide21Observe() {
  const g=guide21State(),s=state.campaign19;
  if(!c19Active() || g?.status!=='active') return;
  if(state.tab==='court'&&!g.hallSeen) {g.hallSeen=true;save();}
  let complete=false;
  if(g.course==='basics') {
    if(g.step===1) complete=g.careSeen;
    if(g.step===2) complete=g.hallSeen && s.roster.some(p=>p.recruited&&p.alive!==false);
    if(g.step===3) complete=s.scouts.length>0 || s.regions.every(r=>r.owner==='crown');
    if(g.step===4) complete=s.turn>g.entryTurn && g.recordsSeen;
  } else {
    if(g.step===1) complete=!!s.battle&&['fighting','won'].includes(s.battle.status);
    if(g.step===2) complete=s.battle?.status==='won';
    if(g.step===3) complete=s.regions.some(r=>!['capital','south'].includes(r.id)&&r.owner==='crown'&&r.governor);
  }
  if(complete) guide21Advance();
}
function guide21TargetRegion() {
  const s=state.campaign19;
  return s.regions.find(r=>r.owner!=='crown'&&r.id!=='north') || s.regions.find(r=>r.owner!=='crown');
}
function guide21Context() {
  const g=guide21State(),s=state.campaign19;
  if(!g || !guide21Step()) return {text:'',selector:''};
  const key=g.course+':'+g.step;
  const targets={
    'basics:0':'.v20-metrics',
    'basics:1':'.v20-section-button[data-id$="|care"],.v20-section-button[data-id="care"],[data-action="npc17Action"][data-id="greet"]',
    'basics:2':'.audience-depts [data-id="people"],[data-action="c19Command"][data-id^="recruit|"]:not(:disabled)',
    'basics:3':'[data-action="c19Command"][data-id^="scout|"]:not(:disabled),.c19-city.rebels,.c19-city.enemy',
    'basics:4':'[data-action="c19Advance"],#monthButton',
    'basics:5':'[data-action="vaultDownload"],[data-action="vaultManualSave"]',
    'realm:0':'[data-action="c19Command"][data-id="train"]',
    'realm:1':'#c19Commander,[data-action="c19Attack"]',
    'realm:2':'[data-action="c19Order"]',
    'realm:3':'#c19Governor,[data-action="c19Appoint"]'
  };
  let text='';
  const paid=['basics:2','basics:3','realm:0','realm:1','realm:3'].includes(key);
  if(paid && s.ap===0) text='本旬两件国事已经用完。可先见人，或点下方“到下一旬”查看确认页；这里不会替你换旬。';
  else if(paid && s.economy.treasury<60) text='手头库银不多，先看本步实际花费。钱不够时可去“钱粮与借据”清点旧库；借款会增加欠账。';
  if(key==='basics:1'&&state.ap<1) text='今日的日常安排已用完。过一天可恢复六次；过日子也会推进人物行程。';
  if(key==='basics:2'&&!g.hallSeen) text='先到奉天殿认一认布局，再从底部“选人”进入人才册。';
  if(key==='basics:4') text='当前第'+s.turn+'旬，距结算还有'+(s.nextTick-simTick())+'日。'+(s.turn>g.entryTurn?'已进入下一旬，打开旬账看这次实际收支。':'确认以后才经过这些日子。');
  if(key==='realm:1') {
    if(s.battle?.status==='fighting') text='已有军队在外，先回战场下令。';
    else if(!s.roster.some(p=>p.recruited&&p.alive!==false&&!FengqueCampaign.busy(s,p.id))) text='尚无可领军的人：先任用一位人才，已任知府的人不能同时领军。';
    else if(!guide21TargetRegion()) text='失地已经全部收回。本步可以跳过，再去看地方与账目。';
    else if(FengqueCampaign.troops(s.army)<400) text='现有兵力不足以同时出征与留守。先补兵，至少二百出征、二百守京畿。';
  }
  if(key==='realm:2') {
    const b=s.battle;
    if(b?.status==='fighting') text='当前敌军'+['压向桥头','弓手换阵','追击前队','收缩守阵'][b.round%4]+'，我军余'+FengqueCampaign.troops(b.remaining)+'人。军令由你亲自选。';
    else text='这一仗尚未收复土地。可以回军营补兵、重新配兵再战，或收起教程，稍后回来。';
  }
  if(key==='realm:3'&&!s.regions.some(r=>!['capital','south'].includes(r.id)&&r.owner==='crown')) text='还没有新收复的地方，先打一仗收回土地。已有土地的任命可以在疆域图查看。';
  if(s.battle?.status==='fighting'&&key!=='realm:2') text='军中正在等令；先结束这场战斗或撤回余部，才能安排其他国事与下一旬。';
  const selector=key==='basics:1'&&session?.npc17Section!=='care'?'.v20-section-button[data-id$="|care"],.v20-section-button[data-id="care"]':targets[key]||'';
  return {text,selector};
}
function guide21Button(action,label,id='') {return v20Button(action,id,label);}
function guide21PanelHTML() {
  const g=guide21State(); if(!g || !c19Active()) return '';
  if(g.status==='done'&&g.finishedNotice) return '<div class="guide21-finish"><p class="v20-kicker">新手小引 · 本段已结束</p><h3>'+(g.course==='basics'?'已经走过入门几步':'接下来的山河，交给陛下')+'</h3><p>先见人，再任事；收地以后派人管，收入不对再查账。教程没有另送钱粮，也没有替你作决定。</p><div class="guide21-controls">'+(g.course==='basics'?guide21Button('guide21Start','继续学调兵与任官','realm'):'')+guide21Button('guide21Dismiss','自由游玩')+guide21Button('guide21Book','翻看操作小册')+'</div></div>';
  const step=guide21Step(); if(g.status!=='active'||!step) return '';
  if(session?.npc17&&guide21Modal()&&!(g.course==='basics'&&g.step===1))return '<div class="guide21-head"><div><p class="v20-kicker">新手小引 · 可以稍后继续</p><p>先听完他的话。下一步：'+step[0]+'。</p></div><div class="guide21-controls">'+guide21Button('guide21Continue','听完了，接着学')+'<button class="guide21-text" data-action="guide21Pause">收起</button></div></div>';
  const context=guide21Context(),key=g.course+':'+g.step;
  const manual=key==='basics:0'||key==='basics:5'||key==='realm:0';
  const needsStateWork=['basics:2','basics:3','realm:0','realm:1','realm:3'].includes(key);
  const canAck=key==='basics:0'?state.tab==='home'&&!guide21Modal():key==='basics:5'?g.vaultSeen:true;
  return '<div><div class="guide21-head"><p class="v20-kicker">'+(g.course==='basics'?'入门':'用兵与地方')+' · '+(g.step+1)+' / '+GUIDE21_COURSES[g.course].length+'</p><button class="guide21-text" data-action="guide21Pause">收起</button></div><h3>'+step[0]+'</h3><p>'+step[1]+'</p><p class="guide21-cost">'+step[2]+'</p>'+(context.text?'<p class="guide21-context">'+v20Esc(context.text)+'</p>':'')+'<div class="guide21-controls">'+guide21Button('guide21Go',key==='basics:4'&&state.campaign19.turn>g.entryTurn?'去看本旬回报':'带我去')+(manual?'<button class="btn primary" data-action="guide21Ack"'+(!canAck?' disabled':'')+'>'+(key==='realm:0'?'兵马已看过，继续':key==='basics:5'?'知道怎么存了':'看明白了')+'</button>':'')+(state.campaign19.ap===0&&needsStateWork?guide21Button('guide21NextTurn','到下一旬'):'')+'<details class="guide21-other"><summary>其他</summary>'+guide21Button('guide21SkipStep','跳过这一步')+guide21Button('guide21Stop','结束引导')+guide21Button('guide21Book','操作小册')+'</details></div></div>';
}
function guide21Draw() {
  if(guide21Updating) return; guide21Updating=true;
  try {
    document.querySelectorAll('.guide21-highlight').forEach(n=>n.classList.remove('guide21-highlight'));
    let panel=document.querySelector('#guide21Panel');
    let help=document.getElementById('guide21Help');
    if(!help || !document.querySelector('#guide21Help')) {
      const host=document.querySelector('.v20-header-right')||document.querySelector('.top .status');
      if(host){help=document.createElement('button');help.id='guide21Help';help.className='guide21-help';help.dataset.action='guide21Book';host.appendChild(help);}
    }
    const g=guide21State();
    if(help){help.textContent=g?.status==='paused'?'继续教程':'新手小引';help.setAttribute('aria-label','打开新手教程与操作小册');}
    const html=guide21PanelHTML();
    if(!html || guide21Modal()&&$('modalBody').dataset.guide21Page) {panel?.remove();return;}
    const host=guide21Modal()?$('modalBody').parentNode:$('screen');
    if(panel?.parentNode!==host){panel?.remove();panel=null;}
    if(!panel){panel=document.createElement('section');panel.id='guide21Panel';panel.className='guide21-panel';panel.setAttribute('aria-label','当前新手引导');if(guide21Modal())host?.insertBefore(panel,$('modalBody'));else host?.prepend?.(panel);}
    if(panel.dataset.markup!==html){panel.innerHTML=html;panel.dataset.markup=html;}
    const selector=guide21Context().selector;
    if(selector)document.querySelectorAll(selector).forEach(n=>{if(n.getClientRects?.().length && (!guide21Modal()||$('modal').contains(n)))n.classList.add('guide21-highlight');});
  } finally {guide21Updating=false;}
}
function guide21Schedule() {
  clearTimeout(guide21Timer);
  guide21Timer=setTimeout(()=>{
    guide21Observe();guide21Draw();
    if(c19Active()&&guide21State()?.status==='offered'&&!guide21Modal()&&state.tab==='home'&&FQVault.ready)guide21Welcome();
  },0);
}
function guide21Welcome() {
  guide21Before.open('先走几步，再理天下','','<div class="guide21-welcome"><p class="guide21-speaker">谢无咎将几册薄账放在案边。</p><p class="scene-text">“陛下先认清手里的钱粮，再试着任用一人。旁的事，不必今日全定完。”</p><p>入门共六步，一次只教眼前一件。实际见人、任用、探路照常花费，按钮会写明；可以收起或跳过。</p><div class="guide21-controls">'+guide21Button('guide21Start','带我走一遍','basics')+guide21Button('guide21Stop','我自己试试')+'</div><p class="mini">初次荐选免费，留零至两人均可；教程不替你选人，也不改变候诏结果。</p></div>','新手小引');
  $('modalBody').dataset.guide21Page='welcome';
}
function guide21Book() {
  const g=guide21State();
  if(!c19Active()) return guide21Before.open('操作小册','','<p>这份进度沿用旧版玩法，请以各按钮写明的实际花费与日程规则为准。</p><p>记事可看人物往来，存档处可保存完整进度。分步调兵教程适用于昭宁山河玩法，不会为了教程替换你的旧进度。</p>'+guide21Button('vaultPanel','打开存档')+guide21Button('close','收好小册'),'新手小引');
  let body='<p>想先学哪段就从哪段开始。教程只指路，扣钱、任用、出兵与换旬都要你亲自按。</p><div class="guide21-controls">'+(g&&['paused','active'].includes(g.status)?guide21Button('guide21Resume','接着上次那一步'):'')+guide21Button('guide21Start','从入门开始','basics')+guide21Button('guide21Start','学调兵与任官','realm')+'</div>';
  for(const [course,steps]of Object.entries(GUIDE21_COURSES))body+='<details class="guide21-chapter"'+(course==='basics'?' open':'')+'><summary>'+ (course==='basics'?'入门 · 认钱粮、见人、任事':'用兵与地方 · 配兵、下令、任官')+'</summary>'+steps.map((step,i)=>'<article><h3>'+(i+1)+'　'+step[0]+'</h3><p>'+step[1]+'</p><p class="guide21-cost">'+step[2]+'</p></article>').join('')+'</details>';
  body+='<details class="guide21-chapter"><summary>选秀、相处与世家，先记这几句</summary><p>初荐免费，先问本人意思，留名只是在外苑候诏；入内廷仍要另问意愿。</p><p>关心问近况，闲谈接手边的事；选择等他做完，下次可以接着聊。私交好不等于政治忠诚。</p><p>把地方交给谁，就是让谁经手钱粮。姜氏的税吏席位会影响地方收入；欠叶氏的钱，实还多少才少多少。亏空先查出实据，再追款。</p><p>不必每天把所有按钮点完。先定一件国事，也给想见的人留一点时候。</p></details>'+guide21Button('close','收好小册');
  guide21Before.open('新手小引 · 随时翻看','',body,'操作小册');$('modalBody').dataset.guide21Page='book';guide21Draw();
}
function guide21Go() {
  const g=guide21State();if(g?.status!=='active')return;
  const key=g.course+':'+g.step,s=state.campaign19;
  if(s.battle?.status==='fighting'&&!['basics:0','basics:1','basics:5'].includes(key)){actions.c19Battle();return;}
  if(key==='basics:0')return actions.c19Home();
  if(key==='basics:1') {
    if(state.ap<1){actions.c19Home();return;}
    const p=['xu','jiang','xie','song','lu'].map(npc17Person).find(p=>p&&npc17Living(p)&&!npc17Busy(p)&&v20Present(p));
    if(!p){actions.tab('people');toast('眼下几位熟面孔都未得闲，可以看看行程，或明日再见。');return;}
    closeModal();state.tab='people';render();actions.visit(p.id);return;
  }
  if(key==='basics:2') {if(!g.hallSeen){closeModal();actions.tab('court');}else actions.c19Panel('people');return;}
  if(key==='basics:3'){actions.c19Map();const r=guide21TargetRegion();if(r)actions.c19Region(r.id);return;}
  if(key==='basics:4')return s.turn>g.entryTurn?actions.c19Panel('records'):actions.c19Next();
  if(key==='basics:5')return actions.vaultPanel();
  if(key==='realm:0')return actions.c19Panel('army');
  if(key==='realm:1'||key==='realm:2'){
    if(!s.roster.some(p=>p.recruited&&p.alive!==false&&!FengqueCampaign.busy(s,p.id)))return actions.c19Panel('people');
    if(FengqueCampaign.troops(s.army)<400)return actions.c19Panel('army');
    actions.c19Map();const r=guide21TargetRegion();if(r)actions.c19Region(r.id);return;
  }
  if(key==='realm:3'){actions.c19Map();const r=s.regions.find(r=>!['capital','south'].includes(r.id)&&r.owner==='crown'&&!r.governor);if(r)actions.c19Region(r.id);return;}
}
function guide21Start(course='basics') {
  if(!c19Active()||!GUIDE21_COURSES[course])return;
  state.guide21=guide21Fresh('active',course);closeModal();render();guide21Commit();
}
Object.assign(actions,{
  guide21Book,guide21Start,guide21Go,
  guide21Resume:()=>{const g=guide21State();if(!g||!c19Active())return;g.status='active';closeModal();render();guide21Commit();},
  guide21Pause:()=>{const g=guide21State();if(!g)return;g.status='paused';guide21Commit();guide21Draw();},
  guide21Stop:()=>{if(!c19Active())return;const g=guide21State()||(state.guide21=guide21Fresh());g.status='skipped';g.finishedNotice=false;closeModal();render();guide21Commit();},
  guide21SkipStep:()=>{guide21Advance(true);guide21Draw();},
  guide21Ack:()=>{const g=guide21State();if(g?.status!=='active')return;const key=g.course+':'+g.step;if(key==='basics:0'&&state.tab==='home'&&!guide21Modal()||key==='basics:5'&&g.vaultSeen||key==='realm:0'){guide21Advance();if(key==='basics:5')closeModal();render();}},
  guide21Dismiss:()=>{const g=guide21State();if(g){g.finishedNotice=false;guide21Commit();}guide21Draw();},
  guide21NextTurn:()=>actions.c19Next()
});
actions.guide21Continue=()=>{closeModal();guide21Go();};
c19Start=function(){const r=guide21Before.start();state.guide21=guide21Fresh('offered');guide21Commit();return r;};actions.introDone=c19Start;
render=function(...args){const r=guide21Before.render(...args);guide21Schedule();return r;};
openModal=function(...args){const r=guide21Before.open(...args);delete $('modalBody').dataset.guide21Page;guide21Schedule();return r;};
closeModal=function(...args){const welcome=$('modalBody').dataset.guide21Page==='welcome';const r=guide21Before.close(...args);delete $('modalBody').dataset.guide21Page;if(welcome&&guide21State()?.status==='offered'){state.guide21.status='paused';guide21Commit();}guide21Schedule();return r;};actions.close=closeModal;
c19Panel=function(page){const r=guide21Before.panel(page),g=guide21State();if(g?.status==='active'&&page==='records'){g.recordsSeen=true;guide21Commit();}return r;};actions.c19Panel=c19Panel;
v20CommitTalk=function(p,category){const r=guide21Before.care(p,category),g=guide21State();if(r&&category==='care'&&g?.status==='active'){g.careSeen=true;guide21Commit();}return r;};
const guide21Vault=actions.vaultPanel;actions.vaultPanel=async(...args)=>{const r=await guide21Vault(...args),g=guide21State();if(g?.status==='active'){g.vaultSeen=true;guide21Commit();}return r;};
document.addEventListener('click',()=>guide21Schedule());
document.addEventListener('keydown',e=>{if(e.key==='Escape')guide21Schedule();});
const guide21Style=document.createElement('style');guide21Style.id='guide21-style';guide21Style.textContent=GUIDE21_STYLE;document.head.appendChild(guide21Style);
