const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const helper=fs.readFileSync(path.join(__dirname,'test_palace_life_v13.cjs'),'utf8').split('let game=boot(),checks=[];')[0];
const boot=new Function('require','__dirname',helper+';return boot;')(require,__dirname);
let game=boot(),checks=[];const run=code=>game.run(code);function reset(){game=boot();}
function check(name,fn){fn();checks.push(name);console.log('PASS '+name);}
function visitXu(){run(`state.ap=15;visit('xu');session.section='flirt';`);}
check('first flirt blushes, preserves court etiquette and displays only NPC words',()=>{
 visitXu();run(`interactionTopic('compliment');`);assert.equal(run('state.relations.xu.mind.lastTurn.courtshipTier'),'first');
 assert(run(`session.response.includes('耳根')&&session.response.includes('不敢当')`));assert(!run(`session.response.includes('你说')||session.response.includes('您看便看')`));
 assert.equal(run('session.left'),2);assert.equal(run('state.relations.xu.mind.courtship.count'),1);
});
check('successful responses pass through two reserved answers and one familiar remonstrance',()=>{
 run(`interactionTopic('compliment');`);assert.equal(run('state.relations.xu.mind.lastTurn.courtshipTier'),'reserved');
 run(`interactionTopic('compliment');`);assert.equal(run('state.relations.xu.mind.lastTurn.courtshipTier'),'reserved');
 visitXu();run(`interactionTopic('compliment');`);assert.equal(run('state.relations.xu.mind.lastTurn.courtshipTier'),'admonish');
 assert(run(`session.response.includes('当真')`));assert.equal(run('state.relations.xu.mind.courtship.count'),4);
});
check('high stats and repeated renders cannot bypass distinct-day pacing',()=>{
 run(`Object.assign(state.relations.xu,{aff:95,trust:95,love:95});`);assert.equal(run(`courtshipTier(PEOPLE.find(p=>p.id==='xu'))`),'reserved');
 const count=run('state.relations.xu.mind.courtship.count'),left=run('session.left');
 run(`render();renderSession();buildDay();interactionTopic('compliment');`);assert.equal(run('state.relations.xu.mind.courtship.count'),count);assert.equal(run('session.left'),left);
});
check('only established contact across three days unlocks several sincere Xu answers',()=>{
 run(`state.day++;buildDay();state.ap=15;visit('xu');session.section='flirt';interactionTopic('miss');state.day++;buildDay();state.ap=15;visit('xu');session.section='flirt';interactionTopic('confess');`);
 assert.equal(run(`courtshipTier(PEOPLE.find(p=>p.id==='xu'))`),'open');
 run(`interactionTopic('compliment');`);assert.equal(run('state.relations.xu.mind.lastTurn.courtshipTier'),'open');assert(run(`session.response.includes('更衣时')`));
 const before=run('state.relations.xu.mind.lastTurn.reply');run(`interactionTopic('compliment');`);assert.notEqual(run('state.relations.xu.mind.lastTurn.reply'),before);
});
check('a fresh high-affinity save still begins with an actual first response',()=>{
 reset();run(`Object.assign(state.relations.xu,{aff:99,trust:99,love:99});`);visitXu();run(`interactionTopic('confess');`);
 assert.equal(run('state.relations.xu.mind.lastTurn.courtshipTier'),'first');assert(run(`session.response.includes('不敢妄领')`));
});
check('reload preserves phase, feelings and the record of successful contact days',()=>{
 run(`save();`);const saved=game.save(),count=run('state.relations.xu.mind.courtship.count'),aff=run('state.relations.xu.aff');game=boot(saved);
 assert.equal(run('state.relations.xu.mind.courtship.count'),count);assert.equal(run('state.relations.xu.aff'),aff);assert.equal(run('state.relations.xu.mind.courtship.days.length'),1);
});
check('all twelve personalities have restrained first responses and later disclosures',()=>{
 const data=JSON.parse(fs.readFileSync(path.join(__dirname,'courtship-data.json'),'utf8'));
 assert.equal(new Set(data.rows.filter(r=>r.personality).map(r=>r.personality)).size,12);
 for(const personality of new Set(data.rows.filter(r=>r.personality).map(r=>r.personality)))for(const topic of ['compliment','miss','confess']){
  for(const tier of ['first','reserved','admonish','open'])assert(data.rows.some(r=>r.personality===personality&&r.topic===topic&&r.tier===tier));
 }
 assert.equal(data.rows.filter(r=>r.npc==='xu'&&r.tier==='open').length,15);
});
check('the normal selection pool has eight adults with a concrete exceptional qualification',()=>{
 reset();run(`window.pool=castCandidatePool();`);assert.equal(run('window.pool.length'),8);
 assert(run(`window.pool.every(id=>{const p=PEOPLE.find(p=>p.id===id),d=eliteDossier(p);return eliteEligible(p)&&castAge(p)>=18&&castAge(p)<=25&&d.reasons.length>0&&d.appearance.length>0&&d.background.length>0;})`));
 assert.equal(run('new Set(window.pool.map(id=>PEOPLE.find(p=>p.id===id).name)).size'),8);
});
check('a later-generation newly generated candidate ages from birth correctly',()=>{
 reset();run(`state.elapsed=482;const fresh=makeCastCandidate(20);window.future=fresh.id;ensureMinds();ensureInteractionStats();`);
 assert(run(`(()=>{const p=PEOPLE.find(p=>p.id===window.future);return p.age<0&&castAge(p)>=18&&castAge(p)<=25&&eliteEligible(p)})()`));
 run(`state.elapsed+=12;`);assert(run(`castAge(PEOPLE.find(p=>p.id===window.future))>=19`));
});
check('even a favoured candidate is nervous in the first audience, with no player transcript',()=>{
 reset();run(`const ids=castCandidatePool();state.audition={status:'offered',pool:ids,interviews:{},selected:[],performances:{},answers:{}};window.auditionIds=ids;`);
 const ids=JSON.parse(run('JSON.stringify(window.auditionIds)'));
 for(const id of ids){run(`Object.assign(state.relations[${JSON.stringify(id)}],{aff:95,love:70});actions.auditionInterview(${JSON.stringify(id)});`);
  const html=run(`document.getElementById('modalBody').innerHTML`);assert(!/你说|初见：向往/.test(html));assert(html.includes('初次面圣'));
  assert.equal(run(`state.relations[${JSON.stringify(id)}].candidateVoice.first`),'敬畏');
  assert(run(`document.getElementById('modalBody').innerHTML.includes(AUDITION_ELITE_DATA.fear[PEOPLE.find(p=>p.id===${JSON.stringify(id)}).type])`));
 }
});
check('three answers retain respectful consent and repeated questions do not repeat effects',()=>{
 const id=run('window.auditionIds[0]');for(const n of [0,1,2])run(`actions.auditionAsk(${JSON.stringify(id+'|'+n)});`);
 assert.equal(run(`state.audition.interviews[${JSON.stringify(id)}].length`),3);assert.equal(run(`state.audition.consent[${JSON.stringify(id)}]`),true);
 assert(run(`state.audition.answers[${JSON.stringify(id)}].reply.includes('草民')`));
 const turns=run(`state.relations[${JSON.stringify(id)}].mind.turns.length`);run(`actions.auditionAsk(${JSON.stringify(id+'|2')});`);assert.equal(run(`state.relations[${JSON.stringify(id)}].mind.turns.length`),turns);
});
check('unwilling candidates ask withdrawal respectfully and still cannot be selected',()=>{
 const id=run('window.auditionIds[1]');run(`state.relations[${JSON.stringify(id)}].mind.anger=80;actions.auditionAsk(${JSON.stringify(id+'|2')});actions.auditionSelect(${JSON.stringify(id)});`);
 assert.equal(run(`state.audition.consent[${JSON.stringify(id)}]`),false);assert(!run(`state.audition.selected.includes(${JSON.stringify(id)})`));assert(run(`state.audition.answers[${JSON.stringify(id)}].reply.includes('恳请陛下准予撤牌')`));
});
check('successful interaction builds trust once per game day instead of requiring an unreachable fixed value',()=>{
 reset();visitXu();const trust=run('state.relations.xu.trust');run(`interactionTopic('compliment');`);assert.equal(run('state.relations.xu.trust'),trust+2);
 run(`interactionTopic('miss');renderSession();render();`);assert.equal(run('state.relations.xu.trust'),trust+2);
 run(`state.day++;buildDay();state.ap=15;visit('xu');session.section='flirt';interactionTopic('confess');`);assert.equal(run('state.relations.xu.trust'),trust+4);
});
check('cached old selection answers are restyled without spending or repeating an interview',()=>{
 reset();run(`state.audition={status:'offered',pool:['song'],interviews:{song:[0]},selected:[],performances:{},answers:{song:{id:'old',topic:'0',reply:'旧版嬉笑台词'}},voiceVersion:11};`);
 const turns=run('state.relations.song.mind.turns.length'),money=run('state.money');run(`actions.auditionInterview('song');`);
 assert(!run(`document.getElementById('modalBody').innerHTML.includes('旧版嬉笑台词')`));assert.equal(run('state.relations.song.mind.turns.length'),turns);assert.equal(run('state.money'),money);assert.equal(run('state.audition.interviews.song.length'),1);
});
fs.writeFileSync(path.join(root,'验证报告_v13_6_人设与选秀.json'),JSON.stringify({version:'13.6',checks,passed:checks.length},null,2));console.log('ALL '+checks.length+' COURTSHIP / AUDITION CHECKS PASSED');
