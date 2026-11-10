const assert=require('node:assert/strict');
const W=require('../world/world-core-v16.js'),T=require('../world/town-core-v34.js'),wd=require('../world/world-data-v16.json'),data=require('../town-v34-data.json');
const w=W.create({seed:64,tick:60,people:[],families:[],marriages:[]},wd);T.ensure(w,data,W,wd);
assert.equal(Object.values(w.people).filter(p=>p.town34).length,12);
const males=Object.values(w.people).filter(p=>p.town34&&p.gender==='男'),females=Object.values(w.people).filter(p=>p.town34&&p.gender==='女');
for(const pair of [males,females]){assert(W.marry(w,pair[0].id,pair[1].id));const c=W.child(w,wd,pair[0].id,pair[1].id);assert(c);assert(c.parents.every(id=>w.people[id].children.includes(c.id)));assert(!W.marry(w,c.id,pair[2].id));assert(!W.child(w,wd,c.id,pair[2].id));}
w.town34.shops.tea.share=true;w.tick+=30;assert.equal(T.advance(w,data,W,wd),2);assert.equal(T.advance(w,data,W,wd),0);
for(let i=0;i<24;i++){w.tick+=30;T.advance(w,data,W,wd);}assert(Object.values(w.town34.bonds).some(b=>b.stage==='成婚'));assert.deepEqual(W.validate(w),[]);
const c=W.child(w,wd,w.dynasty.rulerId,males[2].id,true),before=w.town34.shops.tea;assert(c);w.tick+=18*360;W.chooseHeir(w,c.id);assert(W.succeed(w,c.id).ok);assert.equal(w.town34.shops.tea,before);assert.equal(w.dynasty.generation,2);assert.deepEqual(W.validate(w),[]);
console.log('PASS NPC creation, same-sex parents, minors/kinship guards, monthly dividends, autonomous marriages, and succession persistence');
