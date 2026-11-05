/* A report opened outside an audience must offer a real route to its decree. */
function frontReviewable(a){return !!a&&['presented','overdue','needs-work'].includes(a.status);}
function frontChoiceBlockReason(c){
 if(isAway())return '正在巡游：先结束巡游回京，再安排批阅。';
 if(courtStatus()==='left')return '今日已退朝：可从上方“翌日入朝复阅”继续。';
 if(courtStatus()!=='open')return '尚未入朝：可从上方“入朝批阅”继续。';
 if(state.ap<1)return '行动不足：御批需要1行动。';
 const f=frontEnsure();if(f.treasury<c.money)return '国库银不足：需'+c.money+'，现有'+f.treasury+'。';
 if(f.grain<c.grain)return '仓粮不足：需'+c.grain+'，现有'+f.grain+'。';
 return '';
}
function frontApprovalEntry(a){
 if(!frontReviewable(a))return '';
 const id=frontEsc(a.uid);let text='',button='',action='frontPrepareReview';
 if(isAway()){text='正在地方巡游，这份奏折可先阅报。结束行程回京后，可继续安排批阅。';button='结束巡游回京，继续阅报';}
 else if(frontCanOrder()){
  if(state.ap<1){text='本月行动已用尽。可先阅材料，安排下月入朝后再批。';button='安排下月入朝复阅';action='frontPlanReview';}
 }else if(state.ap<2){text='入朝需要1行动，御批另需1行动；本月余'+state.ap+'行动。可安排下月入朝后复阅。';button='安排下月入朝复阅';action='frontPlanReview';}
 else if(courtStatus()==='left'&&state.day>=30){text='今日已退朝，且已到月末。可结算本月后，在新月入朝复阅这份奏折。';button='安排下月入朝复阅';action='frontPlanReview';}
 else if(courtStatus()==='left'){text='今日已退朝。可推进到翌日并入朝，随后继续批阅这份奏折；入朝耗1行动，御批另计。';button='翌日入朝复阅 · 入朝1行动';}
 else{text='这份奏折从宫门或记事中打开，尚未入朝。入朝后会回到本折，御批另需1行动。';button='入朝批阅 · 1行动';}
 return (text?'<div class="approval-entry"><p>'+text+'</p><button class="btn primary" data-action="'+action+'" data-id="'+id+'">'+button+'</button></div>':'');
}
function frontPrepareReview(id){
 const f=frontEnsure(),a=f.affairs.find(a=>a.uid===id);if(!frontReviewable(a))return;
 if(isAway()){returnTour();frontAffair(id);return;}
 if(frontCanOrder()){frontAffair(id);return;}
 if(state.ap<2||courtStatus()==='left'&&state.day>=30){frontPlanReview(id);return;}
 if(courtStatus()==='left')actions.nextDay();
 if(isAway())return;
 closeModal();actions.tab('court');
 if(frontCanOrder())frontAffair(id);
}
function frontPlanReview(id){
 const f=frontEnsure(),a=f.affairs.find(a=>a.uid===id);if(!frontReviewable(a))return;
 if(isAway()){frontAffair(id);return;}
 f.reviewPlan={id,month:state.elapsed,day:state.day,status:'offered'};
 frontOpen('下月入朝复阅','这份奏折会保留，结算后继续查看同一份奏折。','<p>将正常结算本月，剩余行动不结转；新月恢复15行动，首次入朝用1行动，御批另计。</p><p>在办事项与奏事期限照常推进；若本折越过原定御批期限，会按原规则记逾期影响，不会因安排复阅而暂停。</p><button class="btn primary wide" data-action="frontNextMonthReview" data-id="'+frontEsc(id)+'">结算下月并入朝复阅</button><button class="btn ghost wide" data-action="frontAffair" data-id="'+frontEsc(id)+'">先回到这份奏折</button>');save();
}
function frontNextMonthReview(id){
 const f=frontEnsure(),a=f.affairs.find(a=>a.uid===id),plan=f.reviewPlan;
 if(!frontReviewable(a)||!plan||plan.id!==id||plan.status!=='offered'||plan.month!==state.elapsed||plan.day!==state.day||isAway())return;
 const before=state.elapsed;plan.status='used';actions.nextMonth();
 if(state.elapsed===before){plan.status='offered';save();return;}
 delete f.reviewPlan;frontAffair(id);
}
Object.assign(actions,{frontPrepareReview,frontPlanReview,frontNextMonthReview});
// Older saves may have marked a blocked report as read. Keep unresolved work visible.
for(const a of frontEnsure().affairs)if(frontReviewable(a))delete courierState().seen['front:'+a.uid+':'+a.status];
const approvalStyle=document.createElement('style');approvalStyle.textContent='.approval-entry{margin:15px 0;padding:14px;border:1px solid #d9b38a;border-radius:12px;background:#fcf2df}.approval-entry p{font-size:13px;line-height:1.9;margin:0 0 10px}.approval-block-reason{color:#92543e!important}.approval-entry .btn{white-space:normal;line-height:1.6}';document.head.appendChild(approvalStyle);
