import {validatePhone} from './phone-event.js';
import {validateRange,prepareRange} from './range-day.js';
import {roomIds} from './camp.js';
import {validateInspection} from './inspection.js';
export const SAVE_KEY = 'duty-officer-prototype-v1';
export const days = [
  {id:'range',name:'打靶日',icon:'◎',tag:'人數、名冊，一個都不能漏',brief:'今天有射擊課程。班長要整理出勤名冊，連長最在意人員與課程準備是否對得起來。',agenda:['05:50 早點名與出勤核對','07:30 課前會議','07:45 開庫取槍','08:30 射擊課程','16:00 歸還與紀錄核對'],present:88,duty:10,clinic:2,dutyLabel:'課程準備勤務',boardNote:'課程出勤名冊已附在點名資料後，須確認各人狀態。',sergeant:'今天打靶，出勤名冊和現場要對得起來。別等準備出發才發現找不到人。',question:'今天打靶。集合人數多少？課程準備勤務的人有沒有掌握？',result:'射擊課程的準備資訊先接起來了，下一步是課前會議與領用協調。'},
  {id:'inspection',name:'連主檢日',icon:'▤',tag:'現場和紀錄，要說同一件事',brief:'今天安排連主檢。整理現場之餘，也要核實各項紀錄，別讓補表格變成另一個工作。',agenda:['05:50 早點名','07:30 主檢準備分工','09:00 連主檢','13:20 缺項補正','17:00 改善紀錄彙整'],present:86,duty:12,clinic:2,dutyLabel:'主檢整理勤務',boardNote:'十二名整理人員均有登記，現場清點與名冊須一致。',sergeant:'今天連主檢，十二個人先去協助整理。人不在隊伍裡，不代表人不見了，資料我都備著。',question:'今天連主檢。整理勤務有幾個人？點名紀錄跟現場一致嗎？',result:'主檢前的人員狀態已交代；後續要把現場與紀錄一起準備好。'},
  {id:'busy',name:'勤務繁重日',icon:'↗',tag:'大家都在出公差，人還夠嗎？',brief:'各處都在要人。今天考驗的是掌握人員、分配負荷，以及能不能及早說清楚衝突。',agenda:['05:50 早點名與勤務核對','06:20 公差分配','09:00 臨時支援','11:40 公差留餐','17:00 人員回報'],present:84,duty:14,clinic:2,dutyLabel:'外出支援勤務',boardNote:'十四名支援人員均已報備，午間須追蹤返回與留餐。',sergeant:'今天公差特別多，已經十四個人先去支援。你掌握全局，我追現場，不然大家都只會一直找你要人。',question:'今天勤務多。支援出去幾個？集合場還有多少人？',result:'勤務人數先掌握了，後面還得協調任務衝突與留餐。'},
  {id:'supervision',name:'督導日',icon:'◇',tag:'今天，每一句「正常」都可能被追問',brief:'督導官今天會到連上。回報要有依據，發現問題先列管，改善之後還要確認。',agenda:['05:50 點名與紀錄核對','07:30 督導前準備','10:00 督導官實施督導','13:20 一般／重大缺失列管','17:00 改善與複查'],present:88,duty:10,clinic:2,dutyLabel:'督導資料準備勤務',boardNote:'督導可能抽查報備依據；三項人數均有對應紀錄。',sergeant:'今天督導會來。你有核對過的就照實講，還沒確認的先列出來，別一句正常就把自己堵死。',question:'今天督導可能抽問。人數、報備狀態和依據，你掌握多少？',result:'督導前的人員資訊已核對，後面才是現場查核與缺失改善。'},
  {id:'meetings',name:'開會日',icon:'☷',tag:'人要去開會，事情也得有人接',brief:'今天會議連著會議。值星官必須把待辦與人員交代清楚，避免每個人都以為別人會處理。',agenda:['05:50 早點名與會議支援核對','07:30 課前會議','09:00 工作協調會','13:30 幹部會議','17:00 決議事項追蹤'],present:86,duty:12,clinic:2,dutyLabel:'會議支援勤務',boardNote:'十二名人員已報備支援會場，點名後須把分工交接清楚。',sergeant:'今天好幾場會，十二個人先去會場支援。進會議室之前，拜託把現場的事情交代清楚。',question:'今天會議多。會場支援有幾個人？你離開時，現場誰接？',result:'會議前的人員與分工先對齊了，後面要追決議，也要顧現場。'}
];
export const dayFor=s=>days.find(d=>d.id===s.dayId)??days[2];
export function drawDay(state,index){if(state.dayId)return state;const next=structuredClone(state);next.dayId=days[Math.max(0,Math.min(days.length-1,Math.floor(index)))].id;return next;}
export const missions = [
  ['先跟值星班長碰個面','走近集合場的陳班長，按 E 交談。','05:40'],
  ['核對早點名的人數','查看點名板，核對在場與報備人員。','05:45'],
  ['到連辦公室向連長回報','走到集合場北側的辦公室入口。','05:50'],
  ['回集合場，跟班長對齊做法','離開辦公室，找陳班長完成交接。','06:00'],
  ['雛形任務完成','可以繼續探索，或重新開始體驗其他選擇。','06:10']
];
export function initialState(){return {version:1,stage:0,dayId:null,inspection:null,rangeDay:null,phoneEvent:null,location:'yard',x:0,z:5,facing:0,trust:50,rapport:50,energy:70,approach:null,report:null,finalChoice:null,verified:false,completed:false,summarySeen:false,started:false,lowQuality:false,history:[]};}
const clamp = n => Math.max(0,Math.min(100,n));
export function decide(state,action){
  const s=structuredClone(state),day=dayFor(s);let note='';
  if(s.stage===0&&['cooperate','command'].includes(action)){s.approach=action;s.rapport+=action==='cooperate'?10:-8;s.energy-=action==='cooperate'?3:1;s.stage=1;note=action==='cooperate'?'你與陳班長約定先對齊資訊，再分工處理。':'你要求班長照表執行，暫時拉開了距離。';}
  else if((s.stage===1||s.stage===2&&!s.verified)&&action==='verify'){s.verified=true;s.stage=2;s.energy-=3;note=`核對${day.name}點名板：全連 100 人，在場 ${day.present} 人、${day.dutyLabel} ${day.duty} 人、就醫 ${day.clinic} 人，數量一致。`;}
  else if(s.stage===1&&action==='skip'){s.stage=2;s.trust-=3;note=`你只看在場 ${day.present} 人，尚未核實其餘 ${day.duty+day.clinic} 人的報備。`;}
  else if(s.stage===2&&['honest','gloss'].includes(action)&&s.location==='office'){s.report=action;s.stage=3;if(action==='honest'){s.trust+=s.verified?12:5;note=s.verified?`你用完整紀錄向連長回報，確認 ${day.duty+day.clinic} 名不在場人員均有報備。`:`你坦承尚有 ${day.duty+day.clinic} 人狀態待核，連長要求你回去補查。`;}else{s.trust-=s.verified?5:15;s.rapport-=3;note='你只說「一切正常」。連長追問細節，要求往後把人數與依據說清楚。';}}
  else if(s.stage===3&&['partner','blame'].includes(action)&&s.location==='yard'){s.finalChoice=action;s.stage=4;s.completed=true;if(action==='partner'){s.rapport+=12;s.energy-=2;s.verified=true;note='你與班長一起確認紀錄，補齊人數狀態，也約定好接下來的分工。';}else{s.rapport-=12;s.energy-=5;note='你把回報壓力推給班長。任務結束了，但彼此的距離更遠了。';}}
  else return state;
  for(const k of ['trust','rapport','energy'])s[k]=clamp(s[k]);
  s.history.push({time:missions[state.stage][2],text:note});return s;
}
export function restoreState(raw){
  try{const s=JSON.parse(raw);if(s.version!==1||!Number.isInteger(s.stage)||s.stage<0||s.stage>4||!roomIds.includes(s.location)||!['trust','rapport','energy'].every(k=>Number.isFinite(s[k])&&s[k]>=0&&s[k]<=100)||!Array.isArray(s.history)||s.history.length>2000||s.history.some(h=>typeof h.text!=='string'||typeof h.time!=='string')||!validateInspection(s.inspection)||!validateRange(s.rangeDay)||!validatePhone(s.phoneEvent)||(s.phoneEvent!=null&&!roomIds.includes(s.phoneEvent.returnTo?.location))||(s.inspection!=null&&s.rangeDay!=null))return null;
    const base=initialState();const result={...base,...s};result.rangeDay=prepareRange(result.rangeDay);if(result.dayId!==null&&!days.some(d=>d.id===result.dayId))return null;for(const k of ['verified','completed','summarySeen','started','lowQuality'])if(typeof result[k]!=='boolean')return null;
    if(!Number.isFinite(s.x)||!Number.isFinite(s.z)||!Number.isFinite(s.facing)){result.x=0;result.z=s.location==='yard'?5:4;result.facing=0;}
    if(result.completed!==(result.stage===4))return null;return result;
  }catch{return null;}
}
export function targetFor(s){if(s.stage===0||s.stage===3)return s.location==='yard'?'sergeant':'yard-door';if(s.stage===1)return s.location==='yard'?'board':'yard-door';if(s.stage===2)return s.location==='office'?'commander':'office-door';return null;}

