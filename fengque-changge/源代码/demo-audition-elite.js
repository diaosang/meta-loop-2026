/* All first audiences share imperial awe; only the way of showing it differs. */
function eliteDossier(p){
 const pr=castProfile(p.id)||{},known=p.eliteEntry||{},g=AUDITION_ELITE_DATA.criteria;
 const background=known.background||pr.background||p.desc||'',clan=pr.clan||p.faction||'籍贯待核';
 const beauty=Number(p.skills?.charm||0),key=pr.specialtyKey||p.specialtyKey||'literature';
 const ability=Number(p.skills?.[key]||0),level=Number(pr.specialtyLevel||p.specialtyLevel||0);
 const pedigree=known.kind==='门第'||clan!=='中立'&&/世家嫡支|世族|名门|簪缨|太傅|尚书|侍郎|侯府|公府|三代|书香门第/.test(background);
 const reasons=[];if(pedigree)reasons.push('门第入选');if(beauty>=g.minBeauty)reasons.push('仪容入选');if(ability>=g.minTalent||level>=g.minSkillLevel)reasons.push('才学入选');
 return {version:'13.2',clan,background,beauty,ability,level,specialty:pr.specialty||p.specialty||'艺业待核',reasons,qualified:reasons.length>0,
  appearance:known.appearance||(beauty>=90?'眉目秀绝，仪容经礼官初选入册。':beauty>=80?'眉眼清隽，衣冠整饬。':'仪容端正，举止合礼。')};
}
function eliteEligible(p){
 const r=state.relations[p.id],g=AUDITION_ELITE_DATA.criteria;
 return !!r&&!p.official&&p.id!=='xie'&&p.gender!=='宦官'&&p.romance&&!r.rank&&!castSpouse(p.id)?.alive&&castAge(p)>=g.minAge&&castAge(p)<=g.maxAge&&eliteDossier(p).qualified;
}
makeCastCandidate=function(slot){
 ensureCastState();const id='aud-'+state.elapsed+'-'+slot,existing=PEOPLE.find(p=>p.id===id);if(existing)return existing;
 const t=AUDITION_ELITE_DATA.candidates[slot%AUDITION_ELITE_DATA.candidates.length],h=castHash(id);
 const surname=t.clan.slice(-2,-1),given=state.elapsed===2?t.given:[t.given,'行简','明疏','怀清','砚白','令仪','知微','闻笙'][h%8];
 let name=surname+given;if(PEOPLE.some(p=>p.name===name))name=surname+given+'之';
 const currentAge=18+h%8,offset=Math.max(0,Math.floor((state.elapsed-2)/12)),age=currentAge-offset;
 const type=['温柔体贴','清冷克制','明朗直率','骄矜自尊','敏感多思','圆融世故','严正守礼','野心进取','疏朗洒脱','务实重利','寡言重诺','戒备善谋'][h%12];
 const skills={admin:64+h%16,literature:65+h%15,military:43+h%20,charm:t.charm};skills[t.key]=t.ability;
 const p={id,name,age,gender:'男',role:'礼部荐选 · '+t.skill,type,group:'audition',location:'quarters',schedule:['quarters','garden','library'],
  tone:'应选人物',color:['#9c7c83','#7b958a','#b18c6c','#7f89a2'][slot%4],initial:26+h%7,trust:34+h%9,romance:true,
  desc:t.background+' '+t.appearance,open:'他在阶下伏首行礼，听见传问，才敢应声。',official:false,talent:true,faction:t.clan,
  skills,loyalty:44+h%12,specialty:t.skill,specialtyKey:t.key,specialtyLevel:t.level,specialtyRank:CAST_DATA.skillRanks[t.level-1],
  skillLevels:{admin:6,literature:6,military:4,charm:7,[t.key]:t.level},eliteEntry:{...t,entryAge:currentAge,entryMonth:state.elapsed}};
 PEOPLE.push(p);state.relations[id]={aff:p.initial,trust:p.trust,love:0,rank:null,officer:false,
  notes:[{month:state.elapsed,text:'礼部初选：'+p.name+'，'+currentAge+'岁，'+t.kind+'入册。'}],counts:{},gain:0,loyalty:p.loyalty,politics:skills.admin,force:skills.military,skills:clone(skills),mind:null};
 state.cast.generated.push(id);state.cast.generatedProfiles[id]={...p,clan:t.clan,household:'家-'+id,parents:[],grandparent:null,
  habit:'候诏时将袖口理了又理，怕御前礼数有失。',inner:'来前所习的礼节已记熟，真到殿前，仍怕一个字答错。',
  daily:'在候场处温习'+t.skill+'，等候传问。',bio:t.background,background:t.background,lockedAutonomy:false};
 return p;
};
castCandidatePool=function(){
 ensureCastState();let pool=PEOPLE.filter(eliteEligible).sort((a,b)=>castHash(state.elapsed+':elite:'+a.id)-castHash(state.elapsed+':elite:'+b.id)).slice(0,8);
 for(let i=0;pool.length<8&&i<32;i++){const p=makeCastCandidate(i);if(eliteEligible(p)&&!pool.some(q=>q.id===p.id))pool.push(p);}
 ensureMinds();ensureInteractionStats();return pool.slice(0,8).map(p=>p.id);
};
const beforeElitePanel=auditionPanel;
auditionPanel=function(){
 const a=state.audition;
 if(a?.status==='offered'&&a.pool?.length){
  const removed=a.pool.filter(id=>!eliteEligible(PEOPLE.find(p=>p.id===id)||{}));
  if(removed.length){a.pool=a.pool.filter(id=>!removed.includes(id));a.selected=(a.selected||[]).filter(id=>!removed.includes(id));}
  if(a.pool.length<8){for(const id of castCandidatePool()){if(!a.pool.includes(id))a.pool.push(id);if(a.pool.length>=8)break;}}
 }
 beforeElitePanel();
 const a2=state.audition;if(a2?.status!=='offered')return;
 // A dossier is persistent for the currently selected cohort.
 a2.dossiers=a2.dossiers||{};for(const id of a2.pool){const p=PEOPLE.find(x=>x.id===id);if(p&&!a2.dossiers[id])a2.dossiers[id]=eliteDossier(p);}
 const b=$('modalBody');if(b&&!b.querySelector('.elite-intro'))b.insertAdjacentHTML('afterbegin','<p class="mini elite-intro">礼部已核门第、仪容与艺业。候选诸人依次入殿，未经传问，不敢抬头。</p>');save();
};
actions.audition=auditionPanel;
