const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),helper=fs.readFileSync(path.join(__dirname,'test_palace_life_v13.cjs'),'utf8').split('let game=boot(),checks=[];')[0];
const boot=new Function('require','__dirname',helper+';return boot;')(require,__dirname);
let game=boot(),checks=[];const run=s=>game.run(s),reset=()=>game=boot();
function check(name,fn){fn();checks.push(name);console.log('PASS '+name);}
function tier(id){return run(`socialTier(PEOPLE.find(p=>p.id==='${id}'))`);}
function talkDay(id='xu'){
 run(`state.ap=15;visit('${id}');session.section='chat';interactionTopic('recent');interactionTopic('interest');session.section='care';interactionTopic('listen');`);
 run(`if(state.relations['${id}'].mind.privateTalk?.phase==='awaiting'){state.ap=15;visit('${id}');session.section='care';actions.privateReply(state.relations['${id}'].mind.privateTalk.id+'|0');}`);
}
check('270 complete responses cover three stages, twelve voices and six biographies',()=>{
 assert.equal(run('SOCIAL_TALK_DATA.rows.length'),270);assert.equal(run('Object.keys(SOCIAL_TALK_DATA.followups).length'),54);
 assert.equal(run('Object.values(SOCIAL_TALK_DATA.followups).flat().length'),108);
 assert(run(`SOCIAL_TALK_DATA.rows.every(r=>r.reply.length>4)`));
});
check('first private care remains reserved even when familiar from official biography',()=>{
 run(`state.ap=15;visit('xu');session.section='care';interactionTopic('listen');`);
 assert.equal(run('state.relations.xu.mind.lastTurn.socialTier'),'stranger');assert(run(`session.response.includes('兑水')`));
 assert(!run(`session.response.includes('昨夜没睡好')||session.response.includes('你说')`));
});
check('first care has two answers tied to that exact ink concern',()=>{
 assert.equal(run('state.relations.xu.mind.privateTalk.branches.length'),2);
 run(`actions.privateReply(state.relations.xu.mind.privateTalk.id+'|0');`);assert(run(`session.response.includes('砚池')`));
 assert.equal(run('session.left'),1);assert.equal(run('state.relations.xu.mind.social.count'),1);
});
check('review and second half do not farm familiarity or affinity',()=>{
 const before=run(`JSON.stringify({s:state.relations.xu.mind.social,aff:state.relations.xu.aff,left:session.left})`);
 run(`interactionTopic('listen');interactionTopic('listen');renderSession();render();`);
 assert.equal(run(`JSON.stringify({s:state.relations.xu.mind.social,aff:state.relations.xu.aff,left:session.left})`),before);
});
check('high affection and rank do not fabricate acquaintance or a familiar greeting',()=>{
 reset();run(`Object.assign(state.relations.song,{aff:99,trust:99,love:99,rank:'侍君'});state.ap=15;visit('song');`);
 assert.equal(tier('song'),'stranger');assert(!run(`session.message.includes('空出案边')`));
});
check('all 100 NPCs have a biography/skill grounded interest instead of a random hobby',()=>{
 const failures=run(`(()=>{const bad=[];for(const p of PEOPLE){const r=state.relations[p.id];r.mind.turns=[];Object.assign(r.mind,{anger:0,distance:0,hurt:0,disappointment:0,security:60,jealousy:0});const c=__courtVoiceAudit.context(p),rows=socialRows(p,c,'chat','interest');if(!rows.length||!rows.some(r=>r.reply.includes(c.specialty)||r.npc===p.id))bad.push(p.id);}return bad})()`);
 assert.deepEqual(Array.from(failures),[]);
});
check('stranger cannot turn plans for companionship into an immediate intimate invitation',()=>{
 reset();run(`state.relations.xu.mind.plan={id:'test-seek',kind:'seekcare'};`);
 const row=run(`__courtVoiceAudit.turn(PEOPLE[0],'chat','recent')`);assert.notEqual(row.semantic,'plan-talk:test-seek');
});
check('three successful topics on one day are insufficient for familiarity',()=>{
 reset();talkDay();assert.equal(run('state.relations.xu.mind.social.count'),3);assert.equal(tier('xu'),'stranger');
 const count=run('state.relations.xu.mind.social.count');run(`state.ap=15;visit('xu');session.section='chat';interactionTopic('home');`);
 assert.equal(run('state.relations.xu.mind.social.count'),count);
 run(`session.section='care';actions.privateReply(state.relations.xu.mind.privateTalk.id+'|0');`);
});
check('two days of real contact unlock familiar everyday dialogue',()=>{
 run(`state.day++;buildDay();state.ap=15;visit('xu');session.section='chat';interactionTopic('recent');`);
 assert.equal(tier('xu'),'familiar');
 run(`session.section='care';interactionTopic('listen');`);
 assert.equal(run('state.relations.xu.mind.lastTurn.socialTier'),'familiar');assert(run(`session.response.includes('族中来问')`));assert.equal(run('state.relations.xu.mind.lastTurn.storyMark'),'scar');
});
check('familiar follow-up responds to the actual Xu family pressure after asking his origin',()=>{
 run(`actions.privateReply(state.relations.xu.mind.privateTalk.id+'|0');`);assert(run(`session.response.includes('能办与不能办')`));
});
check('four days and repeated conversations unlock a concrete private concern',()=>{
 run(`Object.assign(state.relations.xu,{aff:75,trust:70});`);
 for(let i=0;i<3;i++){run(`state.day++;buildDay();`);talkDay();}
 assert.equal(tier('xu'),'trusted');
 run(`state.day++;buildDay();state.ap=15;visit('xu');session.section='care';interactionTopic('listen');`);
 assert.equal(run('state.relations.xu.mind.lastTurn.socialTier'),'trusted');assert(run(`session.response.includes('又先问起折子')||session.response.includes('话已到了嘴边')`),run(`JSON.stringify({response:session.response,last:state.relations.xu.mind.lastTurn,thread:state.relations.xu.mind.privateTalk})`));
});
check('familiarity is per NPC and nonromantic characters can also grow familiar',()=>{
 assert.equal(tier('song'),'stranger');
 run(`Object.assign(state.relations.jiang,{aff:75,trust:70});`);
 for(let i=0;i<4;i++){run(`state.day++;buildDay();`);talkDay('jiang');}
 assert.equal(tier('jiang'),'trusted');assert.equal(tier('song'),'stranger');
});
check('previewing, rendering and skipping time grant no social progress',()=>{
 reset();const before=run(`JSON.stringify(socialState(PEOPLE[0]))`);
 run(`__courtVoiceAudit.turn(PEOPLE[0],'care','listen');render();render();state.day++;buildDay();`);
 assert.equal(run(`JSON.stringify(socialState(PEOPLE[0]))`),before);
});
check('daily trust gain stays bounded and repeated topics do not add more progress',()=>{
 reset();const trust=run('state.relations.xu.trust');talkDay();
 assert.equal(run('state.relations.xu.trust'),trust+2);
 run(`state.ap=15;visit('xu');session.section='chat';interactionTopic('recent');interactionTopic('recent');`);
 assert.equal(run('state.relations.xu.trust'),trust+2);assert.equal(run('state.relations.xu.mind.social.count'),3);
});
check('pending care is restored on entering the category after revisiting',()=>{
 reset();run(`state.ap=15;visit('xu');session.section='care';interactionTopic('listen');save();`);
 const saved=game.save();game=boot(saved);run(`state.ap=15;visit('xu');actions.interactionCategory('care');`);
 assert(run(`session.response.includes('兑水')`));assert(!run(`session.response.includes('见过陛下')`));assert.equal(run('session.left'),3);
});
check('completed care also restores its own final response without another charge',()=>{
 run(`actions.privateReply(state.relations.xu.mind.privateTalk.id+'|0');state.ap=15;visit('xu');actions.interactionCategory('care');`);
 assert(run(`session.response.includes('砚池')`));assert.equal(run('session.left'),3);
});
check('zero remaining turns still allows a free replay and cannot buy another reply',()=>{
 run(`session.left=0;interactionTopic('listen');`);assert(run(`session.response.includes('砚池')`));assert.equal(run('session.left'),0);
 run(`session.section=null;actions.interactionCategory('care');`);assert.equal(run('session.section'),'care');assert.equal(run('session.left'),0);
});
check('care replay expires correctly, rather than carrying an old concern forever',()=>{
 run(`state.day+=4;buildDay();state.ap=15;visit('xu');actions.interactionCategory('care');`);
 assert(!run(`session.response.includes('砚池')`));assert(!run(`topicsFor('care',PEOPLE[0],state.relations.xu).find(x=>x[0]==='listen')[1].includes('回看')`));
});
check('serious anger continues to receive its actual grievance instead of cosy new chat',()=>{
 reset();run(`state.relations.xu.mind.anger=80;state.ap=15;visit('xu');session.section='care';interactionTopic('listen');`);
 assert(!run(`state.relations.xu.mind.lastTurn.socialTier`));assert(run(`session.response.includes('原委')||session.response.includes('想通')`));
});
check('a new grievance pauses a pending cosy conversation and blocks its old reply',()=>{
 reset();run(`state.ap=15;visit('xu');session.section='care';interactionTopic('listen');window.oldPrivateId=state.relations.xu.mind.privateTalk.id;state.relations.xu.mind.anger=80;`);
 const left=run('session.left');run(`actions.privateReply(window.oldPrivateId+'|0');`);assert.equal(run('session.left'),left);
 run(`interactionTopic('listen');`);assert(!run(`session.response.includes('兑水')`));assert(run(`session.response.includes('原委')||session.response.includes('想通')`));
});
check('summary deduplicates repeated facts and labels three actual people',()=>{
 reset();run(`state.agency.moments=[{key:todayKey(),npc:'xu',text:'整理用物。'},{key:todayKey(),npc:'song',text:'整理用物。'},{key:todayKey(),npc:'lu',text:'收好护腕。'},{key:todayKey(),npc:'ye',text:'核过账册。'}];`);
 const text=run('agencySummary()');assert.equal((text.match(/整理用物/g)||[]).length,1);
 assert(text.includes('宋玉衡')&&text.includes('陆景明')&&text.includes('叶承钧'));
});
check('learning actions name the actual specialty instead of repeating generic practice',()=>{
 const song=run(`mindPlanText(PEOPLE.find(p=>p.id==='song'),{kind:'learn'})`),lu=run(`mindPlanText(PEOPLE.find(p=>p.id==='lu'),{kind:'learn'})`);
 assert(song.includes('琴谱'));assert(lu.includes('护腕'));assert.notEqual(song,lu);
});
check('new progress survives reload and old save state remains intact',()=>{
 reset();talkDay();run('save();');const saved=JSON.parse(game.save()),aff=saved.relations.xu.aff;
 game=boot(JSON.stringify(saved));assert.equal(run('state.relations.xu.mind.social.count'),3);assert.equal(run('state.relations.xu.aff'),aff);
 assert.equal(run('PEOPLE.length'),100);assert.equal(run('KEY'),'fengque-demo-v4');
});
check('old successful transcript migrates, but uncommitted previews do not',()=>{
 const saved=JSON.parse(game.save());delete saved.relations.xu.mind.social;
 saved.relations.xu.mind.turns.push({id:'fake-preview',topic:'home',tick:1,reply:'这个预览并未真正说过',context:{}});
 game=boot(JSON.stringify(saved));assert.equal(run('socialState(PEOPLE[0]).count'),3);
});
const report={version:'13.6',passed:checks.length,checks,authoredDailyResponses:270,pairedFollowups:108};
fs.writeFileSync(path.join(root,'验证报告_v13_6_亲疏日常.json'),JSON.stringify(report,null,2));console.log('ALL '+checks.length+' SOCIAL CHECKS PASSED');
