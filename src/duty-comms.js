import {weekTime} from './week-data.js';

export const dutyCallers={commander:'林連長',battalion:'營部作戰士',sergeant:'陳班長'};
const schedule=[['commander','call','rollcall',365],['sergeant','line','drill',430],['battalion','call','course',610],['commander','line','checks',870],['sergeant','call','handover',1240]];
export function newDutyComms(w){return {version:1,revision:0,threads:schedule.map(([from,channel,task,at],i)=>({id:'D'+(w.totalDays+w.day)+'-'+i,from,channel,task,at,status:'pending',attempt:0,deadline:at,entries:[]}))};}
export function migrateDutyWeek(w){if(!w||w.version!==1)return;w.version=2;w.mdm=true;w.securityFailure=null;w.comms=newDutyComms(w);for(const t of w.comms.threads)if(t.at<w.clock){t.status='closed';t.deadline=w.clock;} }
const resolved=t=>['replied','closed'].includes(t.status);
export const dutyUnread=w=>w?.comms?.threads.filter(t=>!['pending','replied','closed','deferred'].includes(t.status))??[];
export function dutyProgress(s,t){const w=s.week,task=w.today.tasks.find(x=>x.id===t.task);let detail=task.done?task.name+'已核對完成，'+weekTime(task.completedAt)+'留有紀錄。':task.name+'還沒核對結案，期限'+weekTime(task.due)+'。';
 if(t.task==='course'&&!task.done){if(s.morning)detail+=' 上午三項完成'+s.morning.tasks.filter(x=>x.status==='done').length+'/3，'+s.morning.tasks.map(x=>x.title+'：'+(x.status==='done'?'已完成':x.worker==='chen'?'陳班長處理中':x.worker==='clerk'?'文書處理中':x.worker==='player'?'我處理中':'未分派')).join('；')+'。';else if(s.rangeDay)detail+=' 打靶進度：'+({meeting:'課前會議',issue:'領槍與團領',depart:'清槍與出發',rangeCheck:'靶場人員裝備核對',firing:'射擊中',casings:'回收核對',return:'返營',surrender:'繳槍核對',logbook:'簿冊核對',done:'完成'})[s.rangeDay.phase]+'，領用'+s.rangeDay.issued+'把，未繳回與簿冊仍按現場追蹤。';else if(s.inspection)detail+=' 督導進度：'+(s.inspection.phase==='done'?'複查完成':'現場查核／改善辦理中')+'，須完成改善與複查才結案。';else if(w.today.courseStarted)detail+=' 已開始辦理，還在等逐項核對。';else detail+=' 主要勤務尚未開始。';}
 if(t.task==='drill')detail+=' 待命班已完成'+w.today.drillSteps.length+'/3項，'+(w.notified?'已通知原勤務交接。':'尚未通知交接。');
 if(t.task==='checks')detail+=' 五查'+w.today.checks.length+'/5項。';
 return {done:task.done,detail,late:w.clock>task.due};}
function chenFriendly(s){return s.rapport>=60&&s.crewMemory.blamed<=s.crewMemory.helped;}
function phrase(s,t,reason){const p=dutyProgress(s,t),n=t.attempt;const name=s.week.today.tasks.find(x=>x.id===t.task).name;
 if(p.done)return t.from==='commander'?'馬的，你會嘛！'+name+'有紀錄就好，後面也給我一次到定位。':t.from==='sergeant'?(chenFriendly(s)?'欸菜排，這件收得漂亮。嘴砲歸嘴砲，有事再叫，我接得住。':'這件有核對就好。下一件交接自己講清楚，別又丟給我。'):'值星官，'+name+'的紀錄收到了，後面有異動再補，不用重送。';
 const why=reason==='read'?'LINE都已讀了，回一句很難？':reason==='unread'?'LINE傳了都不看，你手機放哪去了？':reason==='missed'?'電話不接，你人咧？':reason==='promise'?'你剛說的時間到了，東西呢？':reason==='deferred'?'剛才說要補回報，現在做到哪？':'';
 if(t.from==='commander')return (n>1?'喂！菜排！'+why:'喂！菜排！')+name+'好了沒啊？我的人到哪裡去了？是不會跟我回報喔？'+(n>=3?'教不會你下個禮拜再揹一次，馬的。':'別又丟一句「正常」就想走。');
 if(t.from==='battalion')return '值星官，營部。'+(n>1?why+'上一通叫你補的還沒收到。':'各連都在等，輪到你們連了。')+'完成幾件、還差誰、幾點補，直接講。不要傳一個「處理中」就沒下文。';
 return chenFriendly(s)?'欸菜排，'+(n>1?why:t.task==='drill'?'待命班那邊等你一句話咧。':'夜間交接還差你那份。')+'待辦還卡著咧。要我幫就講人數、時間、原勤務誰接；你講清楚，我幫你喬，別讓我瞎猜。':'菜排，'+(n>1?why:'你那件還沒交代完。')+'我不是坐這裡等你派。人你抽、事情你答應，現在才要我擦？先把交接講清楚再來。';}
function append(w,t,speaker,text){t.entries.push({time:Math.floor(w.clock),speaker,text});t.entries=t.entries.slice(-12);w.comms.revision++;}
function nextTime(t,n){t.deadline=Math.min(1320,n);}
export function tickDutyComms(s,note){const w=s.week;if(!w.comms||w.phase!=='active')return;
 for(const t of w.comms.threads){let guard=0;while(!resolved(t)&&w.clock>=t.deadline&&guard++<5){const due=t.deadline,p=dutyProgress(s,t);if(t.status==='pending'){t.attempt=1;t.status=t.channel==='call'?'ringing':'unread';append(w,t,dutyCallers[t.from],phrase(s,t,'first'));nextTime(t,due+(t.channel==='call'?5:10));note('收到'+dutyCallers[t.from]+'的'+(t.channel==='call'?'來電':'LINE')+'：'+w.today.tasks.find(x=>x.id===t.task).name);}
 else{const previous=t.status;if(p.done){append(w,t,dutyCallers[t.from],phrase(s,t,'done'));t.status='closed';break;}if(['ringing','unread','read','missed'].includes(previous)){w.today.penalties+=2;note(dutyCallers[t.from]+(previous==='read'?'已讀未回':previous==='ringing'?'來電漏接':'催辦未回')+'，再次追問。',-2);}
 t.attempt++;const reason=previous==='read'?'read':previous==='ringing'||previous==='missed'?'missed':previous==='deferred'?(t.promise?'promise':'deferred'):'unread';append(w,t,dutyCallers[t.from],phrase(s,t,reason));t.channel='line';t.status=t.attempt>=3?'closed':'unread';nextTime(t,due+15);if(t.status==='closed')note(dutyCallers[t.from]+'將未回報事項列入交接追蹤。');}
 }} }
export function dutyCommsAction(s,action,{id,mode}={},note){const w=s.week,t=w.comms?.threads.find(x=>x.id===id);if(!t||resolved(t)||t.status==='pending')return false;
 if(action==='read'){if(!['ringing','unread','missed'].includes(t.status))return false;t.status='read';nextTime(t,w.clock+8);w.comms.revision++;return true;}
 if(action==='miss'){if(t.status!=='ringing')return false;t.status='missed';w.comms.revision++;return true;}
 if(action!=='reply'||!['facts','promise','bluff'].includes(mode)||!['read','unread','ringing','missed','deferred'].includes(t.status))return false;
 const p=dutyProgress(s,t);if(t.status==='deferred')return false;
 append(w,t,'你',mode==='facts'?'依現場回報：'+p.detail:mode==='promise'?'給我10分鐘，我再回報一次。':'都正常，已經好了。');
 if(mode==='bluff'&&!p.done){append(w,t,dutyCallers[t.from],t.from==='sergeant'?'菜排，哪裡好了？我人就在這裡。你自己沒核對，別拿我去擋。':'你說好了？紀錄根本還沒齊。不要拿一句正常呼嚨我！');w.today.penalties+=3;s.trust=Math.max(0,s.trust-3);if(t.from==='sergeant'){s.rapport=Math.max(0,s.rapport-3);s.crewMemory.blamed=Math.min(99,s.crewMemory.blamed+1);}note('催辦回覆與現場不符，留查證紀錄。',-3);}
 else if(mode==='facts'){append(w,t,dutyCallers[t.from],p.done?phrase(s,t,'done'):t.from==='sergeant'?(chenFriendly(s)?'好啦，你肯講缺哪裡就好。我先幫你橋交接，名冊你核，別兩個都去做同一件。':'終於肯講了。交接單跟時間先給我，我才排人；別一句幫忙就推過來。'):t.from==='commander'?'還沒好就講還沒好！卡誰、差什麼列出來，等下再回我，別又失蹤。':'好，缺件和承辦收到。完成再補一通，時間到我會再追。');}
 else append(w,t,dutyCallers[t.from],t.from==='commander'?'十分鐘你自己講的。時間到我就找你，別給我人間蒸發。':t.from==='sergeant'?'好，十分鐘。事情要補上，不是電話掛了就算交接。':'十分鐘記下了，回報要附進度，別再丟一句等一下。');
 if(mode==='facts'&&t.from==='sergeant'&&t.task==='drill'&&chenFriendly(s)){w.notified=true;note('陳班長接手待命班原勤務交接，仍需現場吹哨與演練。');}
 t.promise=mode==='promise';t.status=p.done?'replied':'deferred';nextTime(t,w.clock+(t.promise?10:25));note('回覆'+dutyCallers[t.from]+'：'+(mode==='facts'?'據實回報':mode==='promise'?'承諾十分鐘後回報':'聲稱全部正常'));return true;}
export function validDutyComms(w){if(w.version===1)return !w.comms;const c=w.comms;return w.version===2&&w.mdm===true&&(w.securityFailure===null||w.phase==='gameover'&&w.securityFailure==='MDM_UNLOCK')&&c?.version===1&&Number.isInteger(c.revision)&&c.revision>=0&&Array.isArray(c.threads)&&c.threads.length===5&&new Set(c.threads.map(t=>t.id)).size===5&&c.threads.every((t,i)=>t.from===schedule[i][0]&&t.task===schedule[i][2]&&typeof t.id==='string'&&t.id.length<40&&['call','line'].includes(t.channel)&&['pending','ringing','unread','read','missed','deferred','replied','closed'].includes(t.status)&&Number.isInteger(t.attempt)&&t.attempt>=0&&t.attempt<=3&&Number.isFinite(t.at)&&t.at===schedule[i][3]&&Number.isFinite(t.deadline)&&t.deadline>=t.at&&t.deadline<=1320&&(t.promise===undefined||typeof t.promise==='boolean')&&Array.isArray(t.entries)&&t.entries.length<=12&&t.entries.every(e=>Number.isInteger(e.time)&&e.time>=330&&e.time<=1320&&typeof e.speaker==='string'&&typeof e.text==='string'&&e.text.length<1200));}

