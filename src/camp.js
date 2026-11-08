export const rooms = [
  {id:'yard',name:'連集合場',type:'yard',group:'戶外',purpose:'早晚點名、任務分工、出發與返營清查。'},
  {id:'office',name:'連辦公室',type:'office',group:'行政',purpose:'人員動態、行政簿冊及督導紀錄核對。'},
  {id:'commander-room',name:'連長室',type:'executive',group:'幹部',npc:'commander',person:'林連長',role:'連長',purpose:'課前會議、任務回報與行程確認。'},
  {id:'csm-room',name:'士督長室',type:'executive',group:'幹部',npc:'csm',person:'許士督長',role:'士督長',purpose:'勤務協調、裝備管理與幹部提醒。'},
  {id:'counselor-room',name:'輔導長室',type:'counsel',group:'幹部',npc:'counselor',person:'蔡輔導長',role:'輔導長',purpose:'人員關懷、反映問題及休息安排。'},
  {id:'platoon-room',name:'排長室',type:'officers',group:'生活',npc:'platoon-leader',person:'張排長',role:'一排排長',purpose:'四個排的任務銜接、課表及名冊確認。'},
  {id:'nco-room',name:'班長小寢',type:'nco',group:'生活',npc:'nco',person:'李班長',role:'二班班長',purpose:'班長休息與班級分工。'},
  {id:'barracks',name:'士兵寢室',type:'barracks',group:'生活',npc:'soldier',person:'王上兵',role:'一排弟兄',purpose:'80 位士兵的床位、置物與休息區。'},
  {id:'toilet',name:'廁所',type:'washroom',group:'生活',purpose:'洗手台、隔間及清潔狀態檢查。'},
  {id:'recreation',name:'中山室',type:'common',group:'生活',npc:'duty-nco',person:'吳班長',role:'課程協調',purpose:'連隊集會、課表公告與休閒。'},
  {id:'armory',name:'軍械室',type:'armory',group:'補給',npc:'armorer',person:'何軍械士',role:'軍械管理',purpose:'依領用清單辦理開庫取槍、返營點收與交接。'},
  {id:'equipment-store',name:'高價軍品庫房',type:'store',group:'補給',npc:'supply',person:'郭補給士',role:'補給管理',purpose:'虛構裝備領用、箱件與帳卡核對。'},
  {id:'utility',name:'雜物間',type:'utility',group:'補給',purpose:'清潔用具、紙箱與一般物品整理。'},
  {id:'kitchen',name:'伙房',type:'kitchen',group:'餐飲',npc:'cook',person:'鄭伙房班長',role:'伙房',purpose:'出勤留餐、備餐與餐點回報。'},
  {id:'dining',name:'餐廳',type:'dining',group:'餐飲',purpose:'100 人座位配置與用餐集合。'},
  {id:'duty-desk',name:'安官桌',type:'duty',group:'行政',npc:'guard',person:'劉安全士官',role:'安全士官',purpose:'人員動態、外出與返營登記。'},
  {id:'corridor',name:'營舍走廊',type:'corridor',group:'通道',purpose:'各室入口與營區導覽。'},
  {id:'range',name:'訓練靶場',type:'range',group:'戶外',npc:'range-officer',person:'周管制官',role:'靶場管制',purpose:'人員與課程確認、抽象打靶小遊戲及物品清點。'}
  ,{id:'hide-yard',name:'營舍外圍',type:'stealth',group:'插曲',purpose:'躲避老班長的小遊戲區。'}
];
export const roomById = id=>rooms.find(r=>r.id===id)??rooms[0];
export const roomIds=rooms.map(r=>r.id);
export const COMPANY_SIZE=100;
const surnames=['陳','林','黃','張','李','王','吳','劉','蔡','楊','許','鄭','謝','洪','郭','何','蘇','周','葉','趙'];
const given=['承安','柏宇','冠廷','家宏','子維','俊翔','宗翰','育誠','明哲','博文','志遠','宇軒','維恩','宥辰','書豪','品皓','信宏','文傑','庭佑','奕廷'];
export const company=[
  {id:'C001',name:'林連長',role:'連長',platoon:0,squad:0,home:'commander-room'},
  {id:'C002',name:'許士督長',role:'士督長',platoon:0,squad:0,home:'csm-room'},
  {id:'C003',name:'蔡輔導長',role:'輔導長',platoon:0,squad:0,home:'counselor-room'},
  {id:'C004',name:'你（值星官）',role:'值星官',platoon:0,squad:0,home:'yard'},
  ...Array.from({length:96},(_,n)=>{const p=Math.floor(n/24)+1,k=n%24,id=`C${String(n+5).padStart(3,'0')}`;return {id,name:n===1?'陳班長':`${surnames[n%20]}${given[(Math.floor(n/20)*3+n)%20]}`,role:k===0?'排長':k<=3?'班長':'士兵',platoon:p,squad:k===0?0:k<=3?k:Math.min(3,Math.floor((k-4)/7)+1),home:k===0?'platoon-room':k<=3?'nco-room':'barracks'};})
];
export const shooters=company.filter(p=>p.role==='士兵');
export function attendance(day){return company.map((person,index)=>({...person,status:index<day.present?'在營（已點到）':index<day.present+day.duty?'報備勤務':'報備就醫'}));}
export function fallbackTargets(s){const r=roomById(s.location);let list=[];const target=(id,name)=>({id,name});
  if(r.id==='hide-yard')return [];
  if(r.id==='yard')list=[target('sergeant','與陳班長交談'),target('board','查看早點名板'),target('office-door','前往連辦公室'),target('go:corridor','前往營舍走廊'),target('go:range','前往靶場')];
  else if(r.id==='office')list=[target('commander','向林連長回報'),target('clerk','與吳文書交談'),target('yard-door','回到集合場'),target('go:corridor','前往營舍走廊')];
  else if(r.id==='corridor')list=rooms.filter(x=>!['corridor','hide-yard'].includes(x.id)).map(x=>target('go:'+x.id,'前往'+x.name));
  else if(r.id==='range')list=[target('range-officer','與周管制官交談'),target('target-game','打靶操作台'),target('go:yard','返營集合場')];
  else{if(r.npc)list.push(target(r.npc,'與'+r.person+'交談'));list.push(target('info:'+r.id,'查看'+r.name+'紀錄'),target('go:corridor','返回營舍走廊'));}
  if(s.inspection){if(r.id==='yard'){list.push(target('repair-yard','檢查整理區'));if(s.inspection.phase==='yardCheck')list.push(target('inspector','與周督導官交談'));}else if(r.id==='office')list.push(target('inspector','與周督導官交談'),target('repair-log','核對紀錄'),target('repair-safety','設備列管改善'));}return list;
}
