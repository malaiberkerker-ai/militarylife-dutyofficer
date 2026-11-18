export const weekTypes={busy:'勤務繁重日',inspection:'連主檢日',supervision:'督導日',range:'打靶日',meetings:'開會日'};
export function weekPlan(seed){let n=(seed>>>0)||1;const random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n;};const rest=['inspection','supervision','range','meetings'];for(let i=rest.length-1;i>0;i--){const j=random()%(i+1);[rest[i],rest[j]]=[rest[j],rest[i]];}return ['busy',...rest,Object.keys(weekTypes)[random()%5],Object.keys(weekTypes)[random()%5]];}
export const dailyJobs=[
 {id:'rollcall',name:'早點名與人員核對',start:330,due:375,location:'yard',target:'board',points:10},
 {id:'dispatch',name:'勤務分工與交接',start:375,due:450,location:'yard',target:'sergeant',points:10},
 {id:'drill',name:'待命班演練與回報',start:420,due:510,location:'yard',target:'sergeant',points:10},
 {id:'course',name:'當日主要勤務',start:450,due:990,location:'office',target:'clerk',points:25},
 {id:'lunch',name:'留餐與人員異動核對',start:690,due:780,location:'kitchen',target:'cook',points:10},
 {id:'checks',name:'下午五查與紀錄',start:780,due:1020,location:'duty-desk',target:'guard',points:15},
 {id:'evening',name:'晚點名與歸營核對',start:1020,due:1110,location:'yard',target:'board',points:10},
 {id:'handover',name:'夜間簿冊與值星交接',start:1230,due:1320,location:'duty-desk',target:'guard',points:10}
];
export const surpriseTypes=[
 {id:'support',title:'營部又來要三個人',text:'三名弟兄原本正在伙房與整理勤務。直接抽走會留下空缺。',good:'先核對原勤務，找班長補位後支援',bad:'不管原勤務，直接把人抽走',reward:2,penalty:5,critical:false},
 {id:'meal',title:'留餐臨時多了兩份',text:'支援班回營時間延後，伙房收到的名單少了兩個人。',good:'更新人員動態並通知伙房留餐',bad:'先說正常，等他們回來自己找飯',reward:2,penalty:4,critical:false},
 {id:'false-record',title:'連長要求先寫已完成',text:'現場還有兩區沒清完，卻被催著把紀錄填成完成。這份現場紀錄可以作為反映依據。',good:'保留現場紀錄，據實回報並協調期限',bad:'先填已完成，晚點再補',reward:3,penalty:10,critical:false},
 {id:'equipment',title:'待修設備卻掛著可用',text:'標示和待修紀錄互相矛盾。值星官需要先列管並確認交接。',good:'確認停用、通知承辦並留下列管證據',bad:'先照常用，督導來了再說',reward:3,penalty:8,critical:true},
 {id:'rush',title:'連長電話追進度',text:'「菜排！我的人呢？資料呢？你不要又三件都跟我說馬上好！」',good:'依紀錄回報進度、優先與負責人',bad:'三件都答應馬上好，先掛電話',reward:2,penalty:4,critical:false}
];
export const fiveChecks=['人員動態','勤務交接','裝備列管','通訊管制','簿冊核對'];
export const phoneTemplates={status:'回報你現在的位置與勤務進度。',muster:'請回連集合場集合，先完成手上交接。',support:'請先交接原勤務，再到集合場支援。','redistribute':'請陳班長調人支援（預設3人至雜物間）。','chase-docs':'催文書核對資料（預設今日名冊）。','meal-notice':'通知伙房留餐（預設100份）。'};
export const weekTime=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(Math.floor(n%60)).padStart(2,'0');

