/* Restore the established hall composition; government commands keep their V13.5 rules. */
const HALL_BOOKS=[['affairs','御前议事','重大奏报、核验材料与廷议。'],['depts','六部差事','选择地方施政，查看在办与回奏。'],['officials','百官考课','比较任用、月度考课与女帝研习。'],['finance','钱粮岁计','国库、仓粮、税令与实收实付。'],['local','地方政务','八地民情、水患、储粮与吏弊。'],['history','回奏簿','查原旨、验收、臣子反应与钱粮流水。']];
function hallBook(id){
 const item=HALL_BOOKS.find(b=>b[0]===id);if(!item)return;
 frontEnsure().tab=id;frontOpen(item[1],item[2],frontPanelBody(id));save();
}
function hallBooks(){frontOpen('通政 · 政务簿册','各部簿册已备，可随时翻阅。','<div class="opts">'+HALL_BOOKS.map(([id,name,desc])=>'<button class="opt" data-action="frontTab" data-id="'+id+'"><b>'+name+'</b><small>'+desc+'</small></button>').join('')+'</div><button class="text-btn" data-action="frontSources">查看参考与规则</button>');}
function hallCourt(){
 ensureCourtScene();const f=frontEnsure(),open=frontCanOrder();
 const last=state.logs.filter(x=>['御批','御前回奏','六部施政','六部回奏','任官','考课','岁计'].includes(x.type)).slice(-1)[0];
 const label={'奏':'御前议事','吏':'吏部','户':'户部','礼':'礼部','兵':'兵部','刑':'刑部','工':'工部','军':'军务','通':'政务簿册'};
 return `<section class="audience restored-court" aria-label="奉天殿上朝"><div class="hall-art">${hallSvg()}</div><header class="audience-status"><b>${date()} · ${state.day}日 清晨</b><span>国库银 ${f.treasury}　仓粮 ${f.grain}</span><span>民心 ${state.people}　军心 ${state.army}</span></header><div class="audience-time">${!open?'<button data-action="tab" data-id="court">入朝 · 1行动</button>':''}<button data-action="nextDay">翌日</button></div><div class="audience-label">奉天殿<span>点击衙门办理政务</span></div><aside class="audience-menu" aria-label="御前事务">${[['events','御前呈报'],['foreign','外交'],['trade','贸易'],['family','皇室'],['heir','立储'],['ritual','祭祀'],['exam','开科考试'],['leave','退朝']].map(([id,n])=>`<button data-action="courtSide" data-id="${id}">${n}</button>`).join('')}</aside><nav class="audience-depts" aria-label="前朝衙门">${['奏','吏','户','礼','兵','刑','工','军','通'].map(k=>`<button data-action="courtDept" data-id="${k}" title="${label[k]}" aria-label="${label[k]}">${k}</button>`).join('')}</nav><div class="audience-caption">${frontEsc(last?.text||'百官在殿内等候。陛下，今日先办哪件事？')}</div></section>`;
}
finalCourt=hallCourt;worldCourt=hallCourt;
actions.frontTab=hallBook;
const hallBeforeDept=actions.courtDept;
actions.courtDept=id=>{if(id==='通'){hallBooks();return;}if(id==='军'){frontDeptPanel('war');return;}hallBeforeDept(id);};
const hallStyle=document.createElement('style');hallStyle.textContent=`
.toast{pointer-events:none}
.restored-court .audience-status{max-width:calc(100% - 180px)}
.restored-court .audience-time{position:absolute;top:116px;left:12px;display:flex;gap:6px;flex-wrap:wrap;max-width:calc(100% - 180px)}
.restored-court .audience-time button{color:#fff1ca;background:linear-gradient(135deg,#a4553e,#803c35 55%,#5b2b29);border:1px solid #bc9862;padding:7px 11px;font-family:inherit;cursor:pointer}
.restored-court .audience-caption{max-height:38px;overflow:hidden;text-overflow:ellipsis}
@media(max-width:600px){.restored-court .audience-status{max-width:calc(100% - 123px)}.restored-court .audience-time{top:88px;left:7px;max-width:calc(100% - 123px)}.restored-court .audience-time button{font-size:11px;padding:6px 9px}.restored-court .audience-caption{max-height:44px}}
`;document.head.appendChild(hallStyle);
