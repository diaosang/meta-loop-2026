/* Spatial presentation only. Walking never advances a campaign turn or spends AP. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FengqueCityWalk=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const bounds={minX:-23,maxX:23,minZ:-15,maxZ:15};
 const buildings=[
  {id:'hall',name:'奉天殿',x:0,z:-10,w:8,d:5,h:3.4,door:[0,-6],color:'#a66458',roof:'#647d75',action:'court'},
  {id:'office',name:'内阁',x:-15,z:-10,w:6,d:4,h:2.5,door:[-15,-6],color:'#d1bd9e',roof:'#728a83',action:'people'},
  {id:'study',name:'御书房',x:15,z:-10,w:6,d:4,h:2.6,door:[15,-6],color:'#cbb79a',roof:'#627d79',action:'people'},
  {id:'outer',name:'外苑',x:-16,z:9,w:5,d:4,h:2.1,door:[-16,5],color:'#e1cdb0',roof:'#7c8c78',action:'selection'},
  {id:'music',name:'乐署',x:15,z:10,w:5,d:4,h:2.1,door:[15,6],color:'#d4bbaa',roof:'#887a82',action:'people'},
  {id:'gate',name:'宫门',x:0,z:14,w:5,d:2,h:2,door:[0,11],color:'#b5856d',roof:'#677a72',action:'map'}
 ];
 const pond={x:11,z:0,w:7,d:5};
 const stops={hall:{x:0,z:-6,name:'奉天殿',doing:'在殿前候见'},office:{x:-15,z:-6,name:'内阁',doing:'在廊下阅卷'},study:{x:15,z:-6,name:'御书房',doing:'在书房外候见'},outer:{x:-16,z:5,name:'外苑',doing:'在外苑歇息'},music:{x:15,z:6,name:'乐署',doing:'在乐署试弦'},garden:{x:-7,z:4,name:'花园',doing:'在园中赏花'},pond:{x:6,z:0,name:'水榭',doing:'在水边稍歇'},gate:{x:0,z:11,name:'宫门',doing:'在宫门等候'},court:{x:0,z:0,name:'御道',doing:'在御道旁停步'}};
 const trees=[[-8,-12],[8,-12],[-21,-12],[21,-12],[-10,1],[-13,3],[-5,8],[-8,10],[7,10],[20,1],[-21,10],[20,12]];
 const benches=[[-7,5],[6,4],[-12,6]];
 const obstacles=buildings.map(b=>({x:b.x,z:b.z,w:b.w+1.2,d:b.d+1.2,id:b.id})).concat([{...pond,w:pond.w+.6,d:pond.d+.6,id:'pond'}],trees.map(([x,z])=>({x,z,w:.8,d:.8,id:'tree'})),benches.map(([x,z])=>({x,z,w:2.4,d:1.05,id:'bench'})));
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 function walkable(x,z){return Number.isFinite(x)&&Number.isFinite(z)&&x>=bounds.minX&&x<=bounds.maxX&&z>=bounds.minZ&&z<=bounds.maxZ&&!obstacles.some(b=>Math.abs(x-b.x)<b.w/2&&Math.abs(z-b.z)<b.d/2);}
 function nearest(x,z){x=Number.isFinite(x)?clamp(Math.round(x),bounds.minX,bounds.maxX):0;z=Number.isFinite(z)?clamp(Math.round(z),bounds.minZ,bounds.maxZ):8;if(walkable(x,z))return {x,z};for(let r=1;r<=12;r++){const pool=[];for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++)if(Math.max(Math.abs(dx),Math.abs(dz))===r&&walkable(x+dx,z+dz))pool.push({x:x+dx,z:z+dz});if(pool.length)return pool.sort((a,b)=>(a.x-x)**2+(a.z-z)**2-(b.x-x)**2-(b.z-z)**2)[0];}return {x:0,z:8};}
 function plan(from,to){const a=nearest(from.x,from.z),b=nearest(to.x,to.z),key=p=>p.x+','+p.z,goal=key(b),open=[a],cost=new Map([[key(a),0]]),came=new Map(),seen=new Set();
  while(open.length){open.sort((u,v)=>(cost.get(key(u))+Math.abs(u.x-b.x)+Math.abs(u.z-b.z))-(cost.get(key(v))+Math.abs(v.x-b.x)+Math.abs(v.z-b.z)));const q=open.shift(),k=key(q);if(seen.has(k))continue;if(k===goal){const result=[b];let c=k;while(c!==key(a)){const p=came.get(c);if(!p)return [];result.unshift(p);c=key(p);}return result;}
   seen.add(k);for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const p={x:q.x+dx,z:q.z+dz},pk=key(p);if(!walkable(p.x,p.z)||seen.has(pk))continue;const road=Math.abs(p.x)<=1||Math.abs(Math.abs(p.z)-5)<=1||Math.abs(Math.abs(p.x)-21)<=1||Math.abs(p.x+8)<=1&&Math.abs(p.z)<=5;const n=cost.get(k)+(road?1:1.8);if(n<(cost.get(pk)??Infinity)){cost.set(pk,n);came.set(pk,q);open.push(p);}}
  }return [];
 }
 function step(actor,dt,speed){let distance=dt*speed,moved=0;while(distance>0&&actor.path.length){const p=actor.path[0],dx=p.x-actor.x,dz=p.z-actor.z,len=Math.hypot(dx,dz);if(len<.001){actor.path.shift();continue;}const take=Math.min(distance,len),nx=actor.x+dx/len*take,nz=actor.z+dz/len*take;if(!walkable(nx,nz)){actor.path=[];break;}actor.x=nx;actor.z=nz;actor.heading=Math.atan2(dx,dz);distance-=take;moved+=take;if(take>=len-.00001)actor.path.shift();}return moved;}
 function sanitize(raw){const p=raw&&typeof raw==='object'?raw:{};if(walkable(p.x,p.z))return {x:p.x,z:p.z};const pos=nearest(p.x,p.z);return {x:pos.x,z:pos.z};}
 return {bounds,buildings,pond,stops,obstacles,walkable,nearest,plan,step,sanitize};
});
