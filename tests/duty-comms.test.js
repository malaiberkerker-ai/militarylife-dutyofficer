import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialState,restoreState} from '../src/engine.js';
import {beginWeek,advanceWeek,weekStep,weekContact,adoptWeekChapter} from '../src/week.js';
import {dutyProgress} from '../src/duty-comms.js';
import {beginMorning,morningStep} from '../src/morning.js';
const fresh=()=>beginWeek(initialState(),3);
const thread=(s,from)=>s.week.comms.threads.find(t=>t.from===from);
const action=(s,a,t,p={})=>weekStep(s,'comms-'+a,{id:t.id,...p});
test('未讀催辦不能誤稱已讀不回',()=>{const s=advanceWeek(fresh(),110),t=thread(s,'sergeant');assert.match(t.entries.at(-1).text,/都不看/);assert.doesNotMatch(t.entries.at(-1).text,/已讀/);});
test('連長主動來電，漏接轉LINE，已讀未回追問只扣一次並保存',()=>{
 let s=advanceWeek(fresh(),35),t=thread(s,'commander');assert.equal(t.status,'ringing');assert.match(t.entries[0].text,/菜排/);
 s=action(s,'miss',t);s=advanceWeek(s,5);t=thread(s,'commander');assert.equal(t.channel,'line');assert.match(t.entries.at(-1).text,/電話不接/);assert.equal(s.week.today.penalties,2);
 s=action(s,'read',t);assert.deepEqual(restoreState(JSON.stringify(s)),s);s=advanceWeek(s,8);t=thread(s,'commander');assert.match(t.entries.at(-1).text,/已讀/);assert.equal(t.status,'closed');assert.equal(s.week.today.penalties,4);s=advanceWeek(s,1);assert.equal(s.week.today.penalties,4);
});
test('據實回報看現場進度，十分鐘承諾到點再追；完成工作後改口肯定',()=>{
 let s=advanceWeek(fresh(),35),t=thread(s,'commander');s=action(s,'read',t);s=action(s,'reply',t,{mode:'promise'});assert.equal(thread(s,'commander').status,'deferred');const due=thread(s,'commander').deadline;s=advanceWeek(s,due-s.week.clock);t=thread(s,'commander');assert.match(t.entries.at(-1).text,/時間到了/);
 s=weekStep(s,'whistle',{kind:'muster'});s=weekStep(s,'task',{id:'rollcall',choice:'verified'});t=thread(s,'commander');s=action(s,'reply',t,{mode:'facts'});assert.equal(thread(s,'commander').status,'replied');assert.match(thread(s,'commander').entries.at(-1).text,/你會嘛/);assert.equal(action(s,'reply',thread(s,'commander'),{mode:'facts'}),s);
});
test('陳班長依默契及推責記憶嘴砲補位或酸菜排，回覆不刷分',()=>{
 const run=(rapport,helped,blamed)=>{let s=fresh();s.rapport=rapport;s.crewMemory={helped,blamed};s=advanceWeek(s,100);let t=thread(s,'sergeant');s=action(s,'read',t);s=action(s,'reply',t,{mode:'facts'});return s;};
 const high=run(75,4,0),low=run(30,0,2),grudge=run(75,0,3);assert.match(thread(high,'sergeant').entries.at(-1).text,/幫你橋交接/);assert.equal(high.week.notified,true);assert.equal(low.week.notified,false);assert.match(thread(low,'sergeant').entries.at(-1).text,/終於肯講/);assert.match(thread(grudge,'sergeant').entries.at(-1).text,/終於肯講/);assert.equal(action(high,'reply',thread(high,'sergeant'),{mode:'facts'}),high);
});
test('營部追問取真實分工，空口正常被抓包；回覆和截止時間讀檔一致',()=>{
 let s=fresh();s=beginMorning(s,3);s=morningStep(s,'assign',{task:'stats',worker:'clerk'});s=advanceWeek(s,280);let t=thread(s,'battalion');assert.match(dutyProgress(s,t).detail,/文書處理中/);assert.match(dutyProgress(s,t).detail,/完成0\/3/);s=action(s,'read',t);const before=s.week.today.penalties;s=action(s,'reply',t,{mode:'bluff'});assert.equal(s.week.today.penalties,before+3);assert.match(thread(s,'battalion').entries.at(-1).text,/呼嚨/);assert.deepEqual(restoreState(JSON.stringify(s)),s);
});
test('舊七天存檔遷移為MDM上鎖，不追溯違規或重播早前電話',()=>{
 const old=fresh();old.week.version=1;old.week.clock=700;old.week.mdm=false;delete old.week.comms;delete old.week.securityFailure;const s=restoreState(JSON.stringify(old));assert.equal(s.week.version,2);assert.equal(s.week.mdm,true);assert.equal(s.week.phase,'active');assert.equal(s.week.comms.threads[0].status,'closed');assert.equal(s.week.comms.threads[3].status,'pending');assert.equal(s.week.seed,old.week.seed);assert.equal(s.rapport,old.rapport);
});
test('MDM預設上鎖且勤務通訊可用；任何地點解鎖立即終止，不能繼續或洗白',()=>{
 for(const location of ['yard','armory','equipment-store']){let s=fresh();s.location=location;assert.equal(s.week.mdm,true);assert.notEqual(weekContact(s,{recipient:'sergeant',channel:'line',template:'status'}),s);s=weekStep(s,'mdm',{lock:false});assert.equal(s.week.phase,'gameover');assert.equal(s.week.ending,'security');assert.equal(s.week.reprimands,1);assert.deepEqual(restoreState(JSON.stringify(s)),s);assert.equal(advanceWeek(s,1000),s);assert.equal(weekStep(s,'mdm',{lock:false}),s);assert.equal(weekStep(s,'next-day'),s);assert.equal(weekContact(s,{recipient:'1985',channel:'call'}),s);assert.equal(adoptWeekChapter(s,{...s,trust:100}),s);}
 let s=advanceWeek(fresh(),1000);s=weekStep(s,'next-day');assert.equal(s.week.mdm,true);const bad=structuredClone(s);bad.week.comms.threads[0].channel='external';assert.equal(restoreState(JSON.stringify(bad)),null);
});

