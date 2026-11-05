/* V14: a playable mandate, not a biography pasted over the previous characters. */
function daliangEnsure(){
 if(state.daliang)return state.daliang;
 const fresh=state.canonScenario==='daliang-nine';
 const s=state.daliang={version:'14.0',fresh,started:mindTick(),tasks:[],evidence:[],caseStatus:'sealed',decision:null,privateKnown:false,rift:18,councils:{},nominations:{},events:[],serial:0};
 if(fresh){
  for(const [id,c] of Object.entries(DALIANG_DATA.core)){
   const r=state.relations[id],m=state.frontCourt?.ministers[id];r.loyalty=c.loyalty;r.ambition=c.ambition;
   if(m)Object.assign(m,{influence:c.influence,ambition:c.ambition,principle:id==='jiang'?'clan':id==='xu'?'merit':m.principle});
  }
  Object.assign(state.playerStats,{admin:18,literature:25,military:15});
  state.logs=state.logs.filter(e=>!/景和元年三月，北营报缺粮/.test(e.text));
  log('先帝崩殂，皇嗣凋零。姜叶共迎十九岁的九公主继大梁帝位，改元景和；许阁老旧案未雪，旧婚约已解。','大梁登基');
  let edge=state.socialEdges.find(e=>[e.a,e.b].includes('jiang')&&[e.a,e.b].includes('ye'));
  if(!edge){edge={a:'jiang',b:'ye',affAB:45,affBA:42};state.socialEdges.push(edge);}
  Object.assign(edge,{kind:'姜叶姻亲同盟',origin:'两族数代联姻、共迎九公主；并非姜禹瀛与叶承钧二人婚配。',recent:'拥立时暂成同盟，人事与兵权仍各有所图。'});
 }
 for(const side of ['jiang','ye'])s.nominations[side]=frontOfficials().filter(p=>!Object.values(state.frontCourt.heads).includes(p.id)&&!['xu','jiang','ye','xie'].includes(p.id))
  .sort((a,b)=>mindHash(side+':'+a.id)-mindHash(side+':'+b.id)).filter(p=>side==='jiang'||!s.nominations.jiang.includes(p.id)).slice(0,3).map(p=>p.id);
 return s;
}
function daliangEvent(text,kind='大梁遗局',id=null){const s=daliangEnsure();s.events.push({tick:mindTick(),text,kind,id});s.events=s.events.slice(-80);log(text,kind,id);}
function daliangPower(control,actor=null,influence=0,tension=0){
 if(state.frontCourt?.ruin)ruinChange(control,tension,actor,influence);
 else{state.authority=clamp(state.authority+control);if(actor&&state.frontCourt.ministers[actor])state.frontCourt.ministers[actor].influence=clamp((state.frontCourt.ministers[actor].influence||50)+influence);state.strife.factionTension=clamp(state.strife.factionTension+tension);}
}
function daliangGate(ap=1){return frontCanOrder()&&state.ap>=ap;}
function daliangReturn(target){({case:daliangCase,council:daliangCouncil,panel:daliangPanel}[target]||daliangPanel)();}
function daliangEntry(target){
 const s=daliangEnsure(),cost=target==='case'&&!s.decision&&s.tasks.some(t=>t.id==='crosscheck'&&t.status==='done')?2:1;
 if(frontCanOrder()&&state.ap>=cost)return '';
 const month=state.ap<cost+(frontCanOrder()?0:1)||courtStatus()==='left'&&state.day>=30;
 return '<div class="approval-entry"><p>'+(isAway()?'正在巡游，先结束行程回京。':month?'本月行动不足或已到月末。可正常结算下月，再回到本卷。':'尚未入朝；入朝耗1行动，调查、任命与重审另计。')+'</p><button class="btn primary" data-action="'+(month&&!isAway()?'daliangMonthOffer':'daliangEnter')+'" data-id="'+target+'">'+(isAway()?'回京，继续本卷':month?'安排下月继续本卷':courtStatus()==='left'?'翌日入朝，继续本卷':'入朝，继续本卷 · 1行动')+'</button></div>';
}
function daliangEnter(target){
 if(!['case','council','panel'].includes(target))return;
 if(isAway()){returnTour();daliangReturn(target);return;}
 if(frontCanOrder()){daliangReturn(target);return;}
 if(state.ap<2||courtStatus()==='left'&&state.day>=30){daliangMonthOffer(target);return;}
 if(courtStatus()==='left')actions.nextDay();closeModal();actions.tab('court');daliangReturn(target);
}
function daliangMonthOffer(target){if(!['case','council','panel'].includes(target)||isAway())return;const s=daliangEnsure();s.returnPlan={target,month:state.elapsed,day:state.day};frontOpen('下月继续本卷','正常月结不会暂停旧案回奏、在办差事与俸饷。','<p>本月剩余行动不结转；下月恢复行动，入朝仍耗1点。确认后回到同一份卷册。</p><button class="btn primary" data-action="daliangNextMonth" data-id="'+target+'">确认结算并继续</button><button class="btn ghost" data-action="daliangBack" data-id="'+target+'">先不结算</button>');save();}
function daliangNextMonth(target){const s=daliangEnsure(),p=s.returnPlan;if(!p||p.target!==target||p.month!==state.elapsed||p.day!==state.day||isAway())return;delete s.returnPlan;actions.nextMonth();if(state.elapsed===p.month){s.returnPlan=p;save();return;}daliangReturn(target);save();}
function daliangPanel(){
 const s=daliangEnsure(),f=frontEnsure(),esc=mindEscape;
 frontOpen('大梁 · 九公主遗局','许案、姜叶人事与内廷来话分卷记录；亲近、忠诚和实权不是同一件事。',
  '<div class="card"><h3>十九岁，继大梁帝位</h3><p>'+DALIANG_DATA.intro.map(esc).join('</p><p>')+'</p></div>'+(!s.fresh?'<p class="mini">此为旧档延续：保留原钱粮、好感、子嗣与已发生的册封。若要体验完整的新登基关系，可先导出，再确认重新开局。</p>':'')+
  '<div class="front-metrics"><div>姜氏影响<b>'+f.ministers.jiang.influence+'</b></div><div>叶氏影响<b>'+f.ministers.ye.influence+'</b></div><div>两族嫌隙<b>'+s.rift+'</b></div><div>皇权掌控<b>'+(f.ruin?.control??state.authority)+'</b></div></div><button class="opt" data-action="ruinCouncil"><b>先议钱粮救急</b><small>旧库点交、催解旧税与权臣垫付；可拨银'+f.treasury+'、粮'+f.grain+'。</small></button>'+(!frontCanOrder()?'<p class="mini">请先入朝，再发调查与任官之令。查看卷册不耗行动。</p>':'')+
  '<button class="opt" data-action="daliangCase"><b>许阁老旧案</b><small>封卷、证词与荐授原册；异源互核后才能撤原结重审。</small></button><button class="opt" data-action="daliangCouncil"><b>姜叶荐举 · 刑部主事</b><small>每月一次；实际任命现有人物，影响六部办事与两族势力。</small></button><button class="opt" data-action="daliangIntelligence"><b>谢无咎的消息册</b><small>区分线索、信源与已核证据，不能凭密报直接定罪。</small></button><button class="opt" data-action="daliangPeople"><b>女帝与御前三人</b><small>旧婚约、帝师与世家；本人愿意说过的旧事才记入档案。</small></button>'+s.events.slice(-6).reverse().map(e=>'<div class="record"><p>'+esc(e.text)+'</p></div>').join(''));
}
function daliangCase(){
 const s=daliangEnsure(),esc=mindEscape;
 const status={sealed:'旧卷封存',checking:'异源互核中',reviewing:'另庭重审中',redressed:'原结已撤，许家旧罪名撤销；主使仍待续查',bargained:'以旧案换取让权；未获公开昭雪'}[s.caseStatus]||s.caseStatus;
 frontOpen('许阁老旧案','封卷、证词与荐授原册各自留底；互核前不据传闻定罪。',daliangEntry('case')+'<p><b>'+esc(status)+'</b></p>'+DALIANG_DATA.tasks.map(t=>{
  const o=s.tasks.find(o=>o.id===t.id),ready=!t.requires||t.requires.every(id=>s.tasks.some(o=>o.id===id&&o.status==='done'));
  return '<div class="record"><b>'+t.title+'</b><p class="mini">'+t.source+'</p>'+(o?'<p>'+esc(o.status==='done'?o.result:'已发交；尚需'+Math.max(0,o.due-mindTick())+'日。')+'</p>':'<p class="mini">'+t.ap+'行动 · '+t.days+'日'+(!ready?' · 须先齐备三路材料':'')+'</p><button class="btn ghost" data-action="daliangInvestigate" data-id="'+t.id+'" '+(!ready||!daliangGate(t.ap)?'disabled':'')+'>发交查核</button>')+'</div>';
 }).join('')+'<p class="mini">证据册：'+s.evidence.map(e=>esc(e.source+' · '+(e.verified?'已互核':'待核'))).join('；')+'</p>'+
 (s.tasks.some(t=>t.id==='crosscheck'&&t.status==='done')&&!s.decision?'<button class="opt" data-action="daliangJudge" data-id="review" '+(!daliangGate(2)?'disabled':'')+'><b>撤原结，另庭重审 · 2行动</b><small>三日后回奏；姜叶涉事门生回避，掌控+5、内斗+8，许知衡信任+8。主谋不凭姓氏定罪。</small></button><button class="opt" data-action="daliangJudge" data-id="bargain" '+(!daliangGate(1)?'disabled':'')+'><b>暂不公开，以旧案换姜氏让权 · 1行动</b><small>掌控+3、姜氏影响−8；许知衡信任−8，忠诚不因此归零。旧案不能算昭雪。</small></button>':'')+'<button class="text-btn" data-action="daliangPanel">回看遗局</button>');
}
function daliangInvestigate(id){
 const s=daliangEnsure(),t=DALIANG_DATA.tasks.find(t=>t.id===id);if(!t||s.tasks.some(o=>o.id===id)||!daliangGate(t.ap)||t.requires&&!t.requires.every(k=>s.tasks.some(o=>o.id===k&&o.status==='done')))return;
 state.ap-=t.ap;s.tasks.push({id,created:mindTick(),due:mindTick()+t.days,status:'pending'});if(id==='crosscheck')s.caseStatus='checking';
 daliangEvent('发交“'+t.title+'”，限'+t.days+'日回奏；材料尚未查成。','旧案查核',id==='witness'?'xie':'xu');save();render();daliangCase();
}
function daliangJudge(choice){
 const s=daliangEnsure();if(s.decision||!s.tasks.some(t=>t.id==='crosscheck'&&t.status==='done')||!['review','bargain'].includes(choice)||!daliangGate(choice==='review'?2:1))return;
 state.ap-=choice==='review'?2:1;s.decision=choice;
 if(choice==='review'){s.caseStatus='reviewing';s.reviewDue=mindTick()+3;daliangPower(5,'jiang',-3,8);state.relations.xu.trust=clamp(state.relations.xu.trust+8);daliangEvent('撤原结，命另庭重审。姜叶门下涉案经手回避，尚未以任何一姓定主谋。','旧案御批','xu');}
 else{s.caseStatus='bargained';daliangPower(3,'jiang',-8,2);state.relations.xu.trust=clamp(state.relations.xu.trust-8);daliangEvent('以封卷换取姜氏让出部分签核，旧案未公开昭雪。许知衡仍尽首辅职责，却不认这次交换为平反。','旧案交换','xu');}
 save();render();daliangCase();
}
function daliangIntelligence(){
 const s=daliangEnsure(),esc=mindEscape,rows=s.tasks.filter(t=>['witness','crosscheck'].includes(t.id));
 frontOpen('谢无咎 · 消息与底牌','“奴才递的是线索，不是凭这一页便能拿人的旨意。”','<p>内廷亲见、京城暗线、商路传话各有来处。当前许案的线人说法，须经宫门原簿与证词复录交叉核验。</p>'+rows.map(t=>'<div class="record"><b>'+DALIANG_DATA.tasks.find(x=>x.id===t.id).source+'</b><p>'+esc(t.result||'访查尚在途中。')+'</p><span class="tag">'+(t.id==='crosscheck'&&t.status==='done'?'已互核':t.status==='done'?'待核线索':'未返回')+'</span></div>').join('')+'<p>无人知晓的忠诚旧事仍未定论。救命之恩、命运相连都只是可能，不能以一句猜测自动补成史实。</p><button class="btn ghost" data-action="daliangCase">按三路材料继续查案</button><button class="btn ghost" data-action="storyMeet" data-id="xie">私下见谢无咎 · 1行动</button>');
}
function daliangNominees(){
 const s=daliangEnsure(),f=frontEnsure(),free=frontOfficials().filter(p=>!Object.values(f.heads).includes(p.id));
 return {jiang:free.find(p=>s.nominations.jiang.includes(p.id)),ye:free.find(p=>s.nominations.ye.includes(p.id)),merit:free.slice().sort((a,b)=>frontAbility(b,'admin')-frontAbility(a,'admin')||a.id.localeCompare(b.id))[0]};
}
function daliangCouncil(){
 const s=daliangEnsure(),candidates=daliangNominees(),used=s.councils[state.elapsed];
 frontOpen('姜叶荐举 · 刑部主事','姜氏以门生资历为据，叶氏另有荐人；许知衡主张将人选的实绩列到同一张纸上。',daliangEntry('council')+'<p>当前主事：'+frontEsc(frontName(state.frontCourt.heads.justice))+'。改任只改今后的主事，原在办案件保留原承办责任。</p>'+Object.entries(candidates).map(([side,p])=>'<button class="opt" data-action="daliangAppoint" data-id="'+side+'" '+(!p||used||!daliangGate(1)?'disabled':'')+'><b>'+({jiang:'取姜氏所荐',ye:'取叶氏所荐',merit:'公开按政略实绩择优'}[side])+' · 1行动</b><small>'+(p?frontEsc(p.name)+' · 政略'+frontAbility(p,'admin'):'暂无空闲可任之人')+'；'+(side==='merit'?'两族影响各−3，掌控+3':'所选一族影响+6，另一族−2，嫌隙+6')+'</small></button>').join('')+(used?'<p>本月已议定，由'+frontEsc(frontName(used.actor))+'实任刑部主事，不重复任官刷取效果。</p>':'')+'<p class="mini">荐举关系不是血亲，不改人物原有族谱。同一人若被另部任用，将重新核可用名单。</p><button class="text-btn" data-action="daliangPanel">回看遗局</button>');
}
function daliangAppoint(side){
 const s=daliangEnsure(),p=daliangNominees()[side];if(!p||s.councils[state.elapsed]||!daliangGate(1))return;
 const before=state.frontCourt.heads.justice,ap=state.ap;frontAppoint('justice|'+p.id);
 if(state.frontCourt.heads.justice!==p.id||before===p.id||state.ap!==ap-1)return;
 s.councils[state.elapsed]={side,actor:p.id,tick:mindTick()};
 if(side==='merit'){daliangPower(3,'jiang',-3,4);daliangPower(0,'ye',-3);state.relations.xu.trust=clamp(state.relations.xu.trust+2);}
 else{const other=side==='jiang'?'ye':'jiang';daliangPower(-1,side,6,2);daliangPower(0,other,-2);s.rift=clamp(s.rift+6);}
 const edge=state.socialEdges.find(e=>[e.a,e.b].includes('jiang')&&[e.a,e.b].includes('ye'));
 if(edge&&side!=='merit'){edge.affAB=clamp(edge.affAB-2);edge.affBA=clamp(edge.affBA-2);edge.recent='刑部荐举落在'+(side==='jiang'?'姜氏':'叶氏')+'所荐之人，两族对彼此多了一分不满。';}
 daliangEvent('刑部主事改由'+p.name+'担任，取'+({jiang:'姜氏所荐',ye:'叶氏所荐',merit:'公开实绩考核'}[side])+'；原办案人仍负经手责任。','姜叶人事',p.id);save();render();daliangCouncil();
}
function daliangPeople(){
 frontOpen('九公主与御前三人','私下亲近不会自动换来公事上的服从。','<div class="record"><b>女帝 · 十九岁九公主</b><p>先帝最后在世的皇嗣，未受完整储君教养，由姜叶拥立。她如何从受制于人的新帝逐渐亲政，要由实际调查、用人与国用决定。</p></div>'+Object.entries(DALIANG_DATA.core).map(([id,c])=>'<div class="record"><b>'+c.name+' · '+c.role+'</b><p>'+c.public+'</p><button class="btn ghost" data-action="visit" data-id="'+id+'">见面 · 1行动</button><button class="btn ghost" data-action="storyDossier" data-id="'+id+'">已知旧事</button></div>').join(''));
}
function daliangDay(){
 const s=daliangEnsure();for(const o of s.tasks){if(o.status!=='pending'||o.due>mindTick())continue;const t=DALIANG_DATA.tasks.find(t=>t.id===o.id);o.status='done';o.result=t.result;o.completed=o.due;
  s.evidence.push({id:o.id,source:t.source,text:t.result,verified:o.id==='crosscheck'});
  if(o.id==='crosscheck')for(const e of s.evidence)e.verified=true;
  daliangEvent(t.title+'已回奏：'+t.result,'旧案回奏',o.id==='witness'?'xie':'xu');
 }
 if(s.caseStatus==='reviewing'&&s.reviewDue<=mindTick()){s.caseStatus='redressed';s.redressedAt=s.reviewDue;daliangEvent('另庭复核撤去许家原罪名，许阁老得以昭雪；构陷的幕后主使仍未查明，不据门生关系径行抄族。','旧案重审','xu');}
}
const daliangSocialBefore=socialRows;
socialRows=function(p,c,category,topic){
 if(!DALIANG_DATA.core[p.id]||!['recent','home','interest','listen','comfort'].includes(topic))return daliangSocialBefore(p,c,category,topic);
 const tier=socialTier(p),level=['stranger','familiar','trusted'].indexOf(tier);
 return DALIANG_DATA.dialogue.filter(r=>r.npc===p.id&&r.category===category&&r.topic===topic&&r.minTier<=level).map(r=>({...r,score:100,socialTier:tier}));
};
const daliangFlirtBefore=courtshipRows;
courtshipRows=function(p,c,topic){
 if(!DALIANG_DATA.flirt[p.id])return daliangFlirtBefore(p,c,topic);
 const tier=courtshipTier(p),level=tier==='open'?2:['first','reserved'].includes(tier)?0:1;
 const lines=tier==='reserved'?DALIANG_DATA.flirt[p.id][0].concat(DALIANG_DATA.flirt[p.id][1]):DALIANG_DATA.flirt[p.id][level];
 return lines.map((reply,i)=>({id:'daliang-flirt:'+p.id+':'+topic+':'+tier+':'+i,semantic:'daliang-flirt:'+p.id+':'+tier+':'+i,category:'flirt',topic,reply,stage:p.id==='xu'&&level===0?'他耳际微红，仍垂目守着君臣的分寸。':'',courtshipTier:tier,score:100-i}));
};
const daliangTopicsBefore=topicsFor;
topicsFor=function(category,p,r){return daliangTopicsBefore(category,p,r).filter(t=>!DALIANG_DATA.core[p.id]||!t[0].startsWith('exclusive:')).filter(t=>p.id!=='xu'||!['recruit','promote'].includes(t[0]));};
const daliangApplyBefore=applyInteraction;
applyInteraction=function(p,category,id,line,effects={},options={}){if(p.id==='jiang'&&['care','chat','flirt','activity'].includes(category)&&effects.loyalty>0){effects={...effects};delete effects.loyalty;}return daliangApplyBefore(p,category,id,line,effects,options);};
const daliangMarriageBefore=castMarriageLabel;castMarriageLabel=function(p){if(p.id==='xu'&&!state.relations.xu.rank)return '旧婚约已解 · 首辅任职';return daliangMarriageBefore(p);};
const daliangSleepBefore=sleepReason;sleepReason=function(p,r){if(p?.id==='xu')return '他不以侍寝承宠为关系的凭据，也不愿入后宫。';if(p?.id==='jiang')return '太傅仍持朝职与姜氏立场，未应下内廷安排。';if(p?.id==='xie'&&!daliangEnsure().privateKnown)return '他尚未将隐秘身份亲口说明。';return daliangSleepBefore(p,r);};
const daliangRecruitBefore=openRecruit;
openRecruit=function(p){if(['xu','jiang'].includes(p.id)){if(session)session.recruitConsent=null;openModal('他的回答',p.name,'<div class="scene-text">“'+(p.id==='xu'?'臣不愿入后宫。若陛下愿意，臣想以首辅之身与您并肩；旧约与私心，都不该成为交出印信的条件。':'臣可以陪陛下议事，也愿听私下的话。只是太傅与姜氏的事仍在，不能用一纸册封将它们抹平。')+'”</div><button class="btn ghost" data-action="backSession">继续相处</button>','私下答复');return;}if(p.id==='xie'&&!daliangEnsure().privateKnown){toast('须由他亲口说明隐秘身份，再问本人意愿。');return;}daliangRecruitBefore(p);};
const daliangConfirmBefore=actions.recruitConfirm;
recruitConfirm=function(id){if(['xu','jiang'].includes(id)||id==='xie'&&!daliangEnsure().privateKnown){toast('本人未同意这样的内廷安排。');return;}return daliangConfirmBefore(id);};actions.recruitConfirm=recruitConfirm;
const daliangStoryCommit=commitStoryTurn;
commitStoryTurn=function(p,row){daliangStoryCommit(p,row);if(p.id==='xie'&&row.storyMark==='truth')daliangEnsure().privateKnown=true;};
const daliangQualityBefore=frontQuality;frontQuality=function(actor,dept,uid){const q=daliangQualityBefore(actor,dept,uid),s=state.daliang;if(!s||!Object.keys(s.councils).length)return q;const c=Object.values(s.councils).at(-1);if(dept!=='justice'||actor!==c.actor)return q;const penalty=c.side==='merit'?0:3;return {...q,patronagePenalty:penalty,score:q.score-penalty,passed:q.score-penalty>=62};};
const daliangBuildBefore=buildDay;buildDay=function(){const key=daliangBuildBefore();daliangDay();return key;};
const daliangResetBefore=actions.resetConfirm;actions.resetConfirm=()=>{daliangResetBefore();daliangEnsure();render();save();};
const daliangIntroBefore=intro;intro=function(){if(!state.daliang?.fresh)return daliangIntroBefore();frontOpen('大梁 · 九公主登基','先帝崩殂，皇嗣凋零。十九岁的你，在姜叶两族拥立下继位。','<div class="scene-text">'+DALIANG_DATA.intro.map(mindEscape).join('<br><br>')+'</div><p>新局：国库可拨银0、仓粮0，欠饷96，内帑8。许知衡忠君不入后宫；姜叶掌权却并非同心；谢无咎的密报须核实。</p><p class="mini">每月15行动。先在原大殿筹措钱粮，再从“遗局”查旧案、议荐举。未受储君教养，理政从18起，可沿用读书与学习逐渐长进。</p><button class="btn primary wide" data-action="introDone">临朝 · 接过大梁的御印</button>');};
const daliangHallBefore=hallCourt;hallCourt=function(){return daliangHallBefore().replace(/<button data-action="ruinCouncil">危局[^<]*<\/button>/,'').replace('入朝 · 1行动','入朝·1').replace('<div class="audience-time">','<div class="audience-time"><button data-action="daliangPanel">遗局</button>');};finalCourt=hallCourt;worldCourt=hallCourt;
const daliangBooksBefore=hallBooks;hallBooks=function(){daliangBooksBefore();$('modalBody').insertAdjacentHTML('afterbegin','<button class="opt" data-action="daliangPanel"><b>大梁九公主 · 旧案与朝权</b><small>许案、姜叶荐举与异源核验。</small></button>');};
const daliangNoticesBefore=importantNotices;importantNotices=function(){const rows=daliangNoticesBefore(),s=daliangEnsure();if(s.tasks.some(t=>t.status==='done')&&!s.decision)rows.unshift({id:'daliang-case-return',title:'许案已有回卷，尚待互核与裁定',text:'陛下，刑部旧卷与京中来话已分别归册。是否重核，仍须以原件作据。',action:'daliangCase',unread:true});return rows;};window.__courierAudit.importantNotices=importantNotices;
const daliangFrontOpenBefore=frontOpen;frontOpen=function(title,introText,body){openModal(title,introText,body,'前朝 · 大梁政务');};
const daliangDateBefore=date;date=function(elapsed=state.elapsed){return '大梁 · '+daliangDateBefore(elapsed);};
Object.assign(actions,{daliangPanel,daliangCase,daliangInvestigate,daliangJudge,daliangIntelligence,daliangCouncil,daliangAppoint,daliangPeople,daliangEnter,daliangMonthOffer,daliangNextMonth,daliangBack:daliangReturn});
daliangEnsure();daliangDay();save();
