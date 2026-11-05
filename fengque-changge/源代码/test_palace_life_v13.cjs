const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const script=[...fs.readFileSync(path.join(root,'网页Demo/index.html'),'utf8').matchAll(/<script>\s*([\s\S]*?)<\/script>/g)].map(x=>x[1]).join('\n');
function boot(seedSave){
 if(seedSave===undefined)seedSave=fs.readFileSync(path.join(__dirname,'测试夹具/V13.5.2前朝兼容存档.json'),'utf8');
 const nodes=new Map(),stored=new Map(seedSave?[['fengque-demo-v4',seedSave]]:[]);
 function node(id='node'){if(nodes.has(id))return nodes.get(id);const n={id,innerHTML:'',textContent:'',value:'',style:{},dataset:{},disabled:false,children:[],classList:{add(){},remove(){},toggle(){}},setAttribute(){},getAttribute(){return null},addEventListener(){},remove(){},appendChild(x){this.children.push(x)},append(x){this.children.push(x)},replaceChildren(){},insertAdjacentHTML(w,t){this.innerHTML+=t},scrollIntoView(){},focus(){},click(){},querySelector(){return null},querySelectorAll(){return []},contains(){return false}};nodes.set(id,n);return n;}
 const document={head:node('head'),body:node('body'),documentElement:node('html'),getElementById:node,createElement:t=>node('created-'+nodes.size+'-'+t),createTextNode:t=>({textContent:t}),querySelector:s=>s.includes('data-page=')?node(s):null,querySelectorAll:()=>[],addEventListener(){}};
 const ctx={console,document,localStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)},setTimeout:()=>0,clearTimeout(){},requestAnimationFrame:fn=>fn(),location:{search:'',href:'http://localhost/'},URL,Blob,Intl,Date,Math,Map,Set,JSON,Number,String,Array,Object,RegExp,Error,structuredClone,scrollTo(){},innerWidth:390,addEventListener(){},navigator:{},confirm:()=>false};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(script,ctx,{timeout:20000});return {ctx,run:code=>vm.runInContext(code,ctx,{timeout:20000}),save:()=>stored.get('fengque-demo-v4')};
}
let game=boot(),checks=[];const run=code=>game.run(code);
function test(name,fn){fn();checks.push(name);console.log('PASS '+name);}
function reset(){game=boot();}
function rankThree(){run(`for(const p of PEOPLE)state.relations[p.id].rank=null;for(const id of ['xu','song','lu']){const r=state.relations[id];Object.assign(r,{rank:'侍君',aff:75,love:55,trust:70});Object.assign(r.mind,{jealousy:0,anger:0,hurt:0,disappointment:0,distance:0,security:65,lastContact:mindTick()});}state.ap=15;`);}
test('actual V12 package boots with 100 NPCs and V13 additive migration',()=>{assert.equal(run('PEOPLE.length'),100);assert.equal(run('__palaceLifeAudit.version'),13);assert.equal(run('INTERACTION_CATEGORIES.length'),6);assert.equal(run('KEY'),'fengque-demo-v4');});
test('339 complete authored replies, twelve voices and six bespoke people',()=>{assert.equal(run('Object.keys(PALACE_LIFE_DATA.profiles).length'),12);assert.equal(run('Object.keys(PALACE_LIFE_DATA.bespoke).length'),6);const data=JSON.parse(fs.readFileSync(path.join(__dirname,'palace-life-data.json'),'utf8'));const all=[];for(const p of Object.values(data.profiles))for(const k of ['snack','jealous','invite','gift','voice','giftAfter','echo'])all.push(...p[k]);for(const p of Object.values(data.profiles))all.push(p.atTea);for(const p of Object.values(data.bespoke))for(const [k,v]of Object.entries(p))if(k!=='food')all.push(v);assert.equal(all.length,339);assert.equal(new Set(all).size,339);});
test('a cute scene costs one visit, one turn per reply and remembers a preference',()=>{reset();run(`state.ap=15;visit('lu');session.section='chat';interactionTopic('v13:snack');`);assert.equal(run('state.ap'),14);assert.equal(run('session.left'),2);assert(run(`session.response.includes('栗子')`));assert(run('state.palaceLife.people.lu.disclosed'));run(`const ep=state.palaceLife.episodes.find(e=>e.npc==='lu'&&e.kind==='snack');actions.v13Reply(ep.id+'|share');`);assert.equal(run('session.left'),1);assert.equal(run('state.palaceLife.keepsakes.length'),1);assert(run(`state.relations.lu.mind.memories.some(m=>m.kind==='共同小事')`));});
test('double-clicking a settled answer cannot farm affinity or keepsakes',()=>{const before=run(`JSON.stringify({aff:state.relations.lu.aff,left:session.left,k:state.palaceLife.keepsakes.length})`);run(`actions.v13Reply(state.palaceLife.episodes.find(e=>e.npc==='lu').id+'|share');`);assert.equal(run(`JSON.stringify({aff:state.relations.lu.aff,left:session.left,k:state.palaceLife.keepsakes.length})`),before);});
test('preference-based gift needs disclosure, costs three once, and leaves a real turn',()=>{reset();run(`state.ap=15;visit('lu');`);const money=run('state.money');run(`__palaceLifeAudit.gift(PEOPLE.find(p=>p.id==='lu'));`);assert.equal(run('state.money'),money);run(`session.section='chat';interactionTopic('v13:snack');actions.v13Reply(state.palaceLife.episodes.find(e=>e.npc==='lu').id+'|share');visit('lu');session.section='chat';interactionTopic('v13:gift');`);assert.equal(run('state.money'),money-3);const left=run('session.left');run(`interactionTopic('v13:gift');`);assert.equal(run('session.left'),left);assert.equal(run('state.money'),money-3);});
test('a private audience does not magically become public knowledge',()=>{reset();rankThree();const n=run('state.palaceLife.facts.length');run(`visit('lu');`);assert.equal(run('state.palaceLife.facts.length'),n);assert.equal(run('state.relations.song.mind.jealousy'),0);});
test('a public walk affects a real witness, not a person in another room',()=>{reset();rankThree();run(`const d=state.dailyHistory[todayKey()];d.entries.xu[3].location='garden';d.entries.song[3].location='library';d.entries.lu[3].location='garden';publicFavor('lu','在御花园散步');`);assert(run('state.relations.xu.mind.jealousy>0'));assert.equal(run('state.relations.song.mind.jealousy'),0);assert.equal(run('state.palaceLife.people.xu.seen.at(-1).method'),'witness');assert.equal(run('state.palaceLife.people.song.seen.length'),0);assert(run(`state.palaceLife.episodes.some(e=>e.npc==='xu'&&e.rival==='lu'&&e.fact)`));});
test('rerendering or replaying the same public fact cannot stack jealousy',()=>{const before=run('state.relations.xu.mind.jealousy');run(`publicFavor('lu','在御花园散步');buildDay();buildDay();render();render();`);assert.equal(run('state.relations.xu.mind.jealousy'),before);});
test('public meal knowledge names a legitimate household notice',()=>{reset();rankThree();run(`publicFavor('lu','一起用了晚膳');`);assert.equal(run('state.palaceLife.people.song.seen.at(-1).method'),'ledger');assert(run(`state.palaceLife.episodes.find(e=>e.npc==='song').knowledge.includes('膳单')`));});
test('a jealous reply is contextual, voiced, bounded and followed up',()=>{run(`visit('xu');session.section='chat';const ep=state.palaceLife.episodes.find(e=>e.npc==='xu'&&e.kind==='jealous');__palaceLifeAudit.start(ep);`);assert(run(`session.response.includes('陆景明')`));const before=run('state.relations.xu.mind.jealousy');run(`actions.v13Reply(state.palaceLife.episodes.find(e=>e.npc==='xu'&&e.kind==='jealous').id+'|share');`);assert.equal(run('state.relations.xu.mind.jealousy'),Math.max(0,before-8));assert(run('state.palaceLife.followups.length>0'));run(`state.day+=2;buildDay();`);assert(run(`state.ecology.inbox.some(m=>m.life13&&m.voiceText.includes('前日'))`));});
test('serious hurt is not replaced by forced cute banter',()=>{reset();run(`state.ap=15;visit('xu');session.section='chat';state.relations.xu.mind.anger=80;const ep=__palaceLifeAudit.create(PEOPLE[0],'snack');__palaceLifeAudit.start(ep);`);assert.equal(run('session.left'),3);assert(run(`session.response.includes('还没说完')`));});
test('three-person mediation uses one extra AP and changes an actual relationship edge',()=>{reset();rankThree();run(`publicFavor('lu','一起用了晚膳');visit('xu');session.section='chat';const ep=state.palaceLife.episodes.find(e=>e.npc==='xu'&&e.kind==='jealous');__palaceLifeAudit.start(ep);`);const before=run('state.ap');run(`actions.v13Reply(state.palaceLife.episodes.find(e=>e.npc==='xu'&&e.kind==='jealous').id+'|together');`);assert.equal(run('state.ap'),before-1);assert(run(`session.response.includes('陆景明')`));assert(run(`socialEdgesOf('xu').some(e=>((e.a==='lu'||e.b==='lu')&&e.recent.includes('同席')))`));assert(run(`state.relations.lu.mind.memories.some(m=>m.kind==='同席说开')`));});
test('tomorrow appointment survives an early audience, fulfills only on its date',()=>{reset();rankThree();run(`visit('song');session.section='chat';const ep=__palaceLifeAudit.create(PEOPLE.find(p=>p.id==='song'),'invite');__palaceLifeAudit.start(ep);actions.v13Reply(ep.id+'|tease');`);const tick=run('state.relations.song.mind.appointment.tick');run(`visit('song');`);assert.equal(run('state.relations.song.mind.appointment.tick'),tick);run(`state.day++;buildDay();visit('song');`);assert.equal(run('state.relations.song.mind.appointment'),null);assert(run(`state.palaceLife.episodes.some(e=>e.npc==='song'&&e.fulfilled===mindTick())`));});
test('an honest refusal does not punish affinity or leave a hidden appointment',()=>{reset();rankThree();run(`const ep=__palaceLifeAudit.create(PEOPLE.find(p=>p.id==='song'),'invite');window.refuseId=ep.id;`);const aff=run('state.relations.song.aff');run(`actions.v13Decline(window.refuseId);`);assert.equal(run('state.relations.song.aff'),aff);assert.equal(run('state.relations.song.mind.appointment'),null);assert.equal(run('state.palaceLife.episodes.find(e=>e.id===window.refuseId).phase'),'declined');});
test('unfinished conversations survive save/reload without a second opening reward',()=>{
 reset();run(`state.ap=15;visit('lu');session.section='chat';interactionTopic('v13:snack');save();`);
 const saved=game.save(),aff=run('state.relations.lu.aff');game=boot(saved);
 run(`state.ap=15;visit('lu');session.section='chat';interactionTopic('v13:episode:'+state.palaceLife.episodes.find(e=>e.npc==='lu'&&e.phase==='awaiting').id);`);
 assert.equal(run('state.relations.lu.aff'),aff);assert.equal(run('session.left'),3);assert(run(`session.response.includes('栗子')`));
 run(`actions.v13Reply(state.palaceLife.episodes.find(e=>e.npc==='lu'&&e.phase==='awaiting').id+'|share');visit('lu');session.section='chat';interactionTopic('v13:gift');save();`);
 const giftSave=game.save(),money=run('state.money');game=boot(giftSave);
 run(`state.ap=15;visit('lu');session.section='chat';const giftEp=state.palaceLife.episodes.find(e=>e.npc==='lu'&&e.kind==='gift'&&e.phase==='awaiting');if(!topicsFor('chat',PEOPLE.find(p=>p.id==='lu'),state.relations.lu).some(t=>t[0]==='v13:episode:'+giftEp.id))throw new Error('gift resume missing');interactionTopic('v13:episode:'+giftEp.id);`);
 assert.equal(run('state.money'),money);assert.equal(run('session.left'),3);assert(run(`session.response.includes('栗子')`));
});
test('V12 save migrates without overwriting existing NPC feelings, case or heirs',()=>{const legacy=JSON.parse(game.save());delete legacy.palaceLife;legacy.relations.lu.aff=83;const oldCase=JSON.stringify(legacy.case),oldLife=JSON.stringify(legacy.life||null);game=boot(JSON.stringify(legacy));assert.equal(run('state.relations.lu.aff'),83);assert.equal(run('JSON.stringify(state.case)'),oldCase);assert.equal(run('JSON.stringify(state.life||null)'),oldLife);assert.equal(run('state.palaceLife.version'),13);});
test('daily affinity remains capped across repeated new scenes and gifts',()=>{reset();rankThree();run(`const p=PEOPLE.find(p=>p.id==='lu');state.relations.lu.aff=35;state.relations.lu.dailyCounts={month:state.elapsed,day:state.day,aff:0,love:0,keys:{}};for(let i=0;i<8;i++){state.ap=15;visit('lu');session.section='chat';const ep=__palaceLifeAudit.create(p,'invite',{plan:i});__palaceLifeAudit.start(ep);if(ep.phase==='awaiting')actions.v13Reply(ep.id+'|share');}`);assert(run('state.relations.lu.aff<=45'));});
test('reported listen prompt receives a concrete private answer, not an official result placeholder',()=>{
 reset();run(`state.ap=15;visit('xu');session.section='care';interactionTopic('listen');`);
 assert(run(`state.relations.xu.mind.lastTurn.player.includes('有话便慢慢说')`));assert(!run(`session.response.includes('你说')`));
 assert(run(`session.response.includes('兑水')`));assert.equal(run('session.left'),2);
 assert(!run(`/陈明经过|妥当的结果|对方暂且放下/.test(session.response)`));
});
test('response options are spoken replies and the second guest does not use the goodbye branch',()=>{
 reset();rankThree();run(`publicFavor('lu','一起用了晚膳');visit('xu');session.section='chat';const ep=state.palaceLife.episodes.find(e=>e.npc==='xu'&&e.kind==='jealous');__palaceLifeAudit.start(ep);actions.v13Reply(ep.id+'|together');`);
 assert.equal(run('state.relations.xu.mind.lastTurn.player'),'叫他也来，一起喝杯茶。');
 assert(run(`session.response.includes('给我腾点地方')`));assert(!run(`session.response.includes('我去练弓')`));
});
test('a current personal plan is spoken in first person without reading a daily record aloud',()=>{
 reset();run(`state.relations.xu.mind.turns=[];state.relations.xu.mind.plan={id:'read-plan',kind:'learn',progress:1};`);
 const turn=run(`__courtVoiceAudit.turn(PEOPLE[0],'chat','recent')`);assert.equal(turn.semantic,'plan-talk:read-plan');
 assert(turn.reply.includes('手边'));assert(!/许知衡依|预计|自主计划/.test(turn.reply));
});
test('a V13 pending gift restores its new variant, not a cached rejected line',()=>{
 reset();run(`state.ap=15;visit('lu');session.section='chat';interactionTopic('v13:snack');actions.v13Reply(state.palaceLife.episodes.find(e=>e.npc==='lu').id+'|share');visit('lu');session.section='chat';interactionTopic('v13:gift');save();`);
 const older=JSON.parse(game.save()),gift=older.palaceLife.episodes.find(e=>e.kind==='gift');
 older.palaceLife.dialogueRevision='13';gift.giftVariant=2;gift.openingTurn.reply='给心事留位置';
 game=boot(JSON.stringify(older));run(`state.ap=15;visit('lu');session.section='chat';interactionTopic('v13:episode:'+state.palaceLife.episodes.find(e=>e.kind==='gift').id);`);
 assert(run(`session.response.includes('这回我认得纸袋')`));assert(!run(`session.response.includes('给心事留位置')`));assert.equal(run('session.left'),3);
});
test('listening continues the same concern and cannot switch to another problem after a reply',()=>{
 reset();run(`state.ap=15;visit('xu');session.section='care';interactionTopic('listen');`);
 assert.equal(run('state.relations.xu.mind.privateTalk.branches.length'),2);
 run(`actions.privateReply(state.relations.xu.mind.privateTalk.id+'|0');`);
 assert.equal(run('session.left'),1);assert(run(`session.response.includes('砚池')`));
 const aff=run('state.relations.xu.aff');run(`actions.privateReply(state.relations.xu.mind.privateTalk.id+'|1');interactionTopic('listen');`);
 assert.equal(run('session.left'),1);assert.equal(run('state.relations.xu.aff'),aff);assert(run(`session.response.includes('砚池')`));
});
test('an unfinished private concern resumes after reload with no second opening reward',()=>{
 reset();run(`state.ap=15;visit('xu');session.section='care';interactionTopic('listen');save();`);
 const aff=run('state.relations.xu.aff'),saved=game.save(),id=run('state.relations.xu.mind.privateTalk.id');game=boot(saved);
 run(`state.ap=15;visit('xu');session.section='care';interactionTopic('listen');`);
 assert.equal(run('state.relations.xu.mind.privateTalk.id'),id);assert.equal(run('state.relations.xu.aff'),aff);assert.equal(run('session.left'),3);
 run(`actions.privateReply(state.relations.xu.mind.privateTalk.id+'|1');`);assert.equal(run('session.left'),2);assert(run(`session.response.includes('再写也不迟')`));
});
const report={version:'13.6',testType:'runtime-with-DOM-stub',checks,passed:checks.length,npcCount:run('PEOPLE.length'),completeAuthoredReplies:339,listenContinuations:42,existingWorkbookRows:11520,browserVisualVerification:false};
fs.writeFileSync(path.join(root,'验证报告_v13_6_逻辑.json'),JSON.stringify(report,null,2));console.log('ALL '+checks.length+' V13 CHECKS PASSED');
