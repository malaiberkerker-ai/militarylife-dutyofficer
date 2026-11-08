// Fictional management scenario; grades are game rules, not official standards.
export const issueTypes = [
  {id:'yard',name:'集合場整理未完成',severity:'general',location:'yard',target:'repair-yard',evidence:'指定整理點仍留有紙箱與雜物，完成欄卻已打勾。',fix:'重新整理指定區域，核對完成紀錄',proof:'現場清空、完成欄已依實況更新',owner:'一班整理組'},
  {id:'log',name:'值星紀錄缺少覆核',severity:'general',location:'office',target:'repair-log',evidence:'人員報備資料在附件中，但今日紀錄的覆核欄空白。',fix:'對照當日附件補齊覆核',proof:'人數、附件與覆核欄一致',owner:'行政承辦'},
  {id:'safety',name:'已知設備異常未列管',severity:'major',location:'office',target:'repair-safety',evidence:'待修設備已註記異常，現場仍掛「可使用」，也沒有列管紀錄。',fix:'確認停用與報修狀態，補齊列管及交接',proof:'停用標示、報修單與交接紀錄相符',owner:'設備承辦'}
];
export const gradeName = grade=>grade==='major'?'重大缺失':'一般缺失';
export const statusName = status=>({listed:'列管',working:'改善中',pending:'待複查',closed:'已結案'})[status]??status;
export function newInspection(){return {version:1,phase:'prep',prep:[],conditions:{yard:false,log:false,safety:false},findings:[],response:null,plan:null,attempts:0,lastRecheck:null,revision:0,minute:540};}
const phases=['prep','yardCheck','officeCheck','response','assign','repair','recheck','done'];
export function validateInspection(value){
  if(value==null)return true;
  if(value.version!==1||!phases.includes(value.phase)||!Array.isArray(value.prep)||value.prep.length>2||new Set(value.prep).size!==value.prep.length||value.prep.some(id=>!issueTypes.some(i=>i.id===id))||!value.conditions||!issueTypes.every(i=>typeof value.conditions[i.id]==='boolean')||!Array.isArray(value.findings)||value.findings.length>3||new Set(value.findings.map(f=>f.id)).size!==value.findings.length||!Number.isInteger(value.revision)||value.revision<0||!Number.isInteger(value.attempts)||value.attempts<0||value.attempts>100)return false;
  return (value.minute===undefined||Number.isInteger(value.minute)&&value.minute>=540&&value.minute<10000)&&value.findings.every(f=>{const type=issueTypes.find(i=>i.id===f.id);return type&&f.severity===type.severity&&['listed','working','pending','closed'].includes(f.status)&&typeof f.evidence==='string'&&typeof f.penaltyApplied==='boolean'&&typeof f.proof==='string'&&(f.owner===null||typeof f.owner==='string')&&typeof f.checked==='boolean';})&&(['done','recheck'].includes(value.phase)?value.findings.every(f=>f.status==='pending'||f.status==='closed'):true)&&(value.phase!=='done'||value.findings.every(f=>f.status==='closed'));
}
export function beginInspection(state){if(state.inspection)return state;const s=structuredClone(state);s.inspection=newInspection();s.dayId='supervision';return s;}
export function inspectionMission(s){const i=s.inspection;if(!i)return null;const route=id=>s.location==='yard'?id:'yard-door',office=id=>s.location==='office'?id:'office-door';
  const data={
    prep:['督導前，先排準備順序','找陳班長安排最多兩項準備。','09:00',route('sergeant'),1],
    yardCheck:['督導官抵達集合場','走近周督導官，陪同現場查核。','10:00',route('inspector'),2],
    officeCheck:['帶督導官到連辦公室','到辦公室找周督導官，核對紀錄與設備狀態。','10:15',office('inspector'),3],
    response:['回應督導官指出的缺失','在辦公室與督導官說明處置方式。','10:25',office('inspector'),4],
    assign:['找班長分工改善','返回集合場找陳班長，安排負責人與改善方式。','10:35',route('sergeant'),5],
    repair:['到現場完成改善','依缺失單前往指定位置，完成查證與改善。','11:00',null,6],
    recheck:['請督導官複查','到辦公室找周督導官，提出改善證據。','11:30',office('inspector'),7],
    done:['督導缺失已完成複查','查看督導回顧，或繼續探索營區。','11:40',null,8]
  }[i.phase];const result=[...data];if(i.phase==='repair'){const open=i.findings.filter(f=>f.status!=='pending'&&f.status!=='closed');const f=open.find(f=>f.severity==='major')??open[0];if(f){const type=issueTypes.find(t=>t.id===f.id);result[3]=s.location===type.location?type.target:type.location==='office'?'office-door':'yard-door';result[1]=`${type.name}：${type.fix}。`;}}const [h,m]=result[2].split(':').map(Number),minute=Math.max(h*60+m,i.minute??540);result[2]=`${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;return result;
}
export function inspectionStep(state,action,payload={},expectedRevision=state.inspection?.revision){
  if(!state.inspection||expectedRevision!==state.inspection.revision)return state;
  const s=structuredClone(state),i=s.inspection;let note='',time=inspectionMission(state)[2];
  const discover=location=>{for(const type of issueTypes.filter(t=>t.location===location)){if(i.conditions[type.id])continue;if(i.findings.some(f=>f.id===type.id))continue;i.findings.push({id:type.id,severity:type.severity,status:'listed',evidence:type.evidence,proof:'',owner:null,penaltyApplied:true,checked:false});s.trust-=type.severity==='major'?15:5;}};
  if(action==='prepare'&&i.phase==='prep'&&s.location==='yard'){
    if(!Array.isArray(payload.ids)||payload.ids.length>2||new Set(payload.ids).size!==payload.ids.length||payload.ids.some(id=>!issueTypes.some(t=>t.id===id)))return state;
    i.prep=[...payload.ids];for(const id of i.prep)i.conditions[id]=true;s.energy-=i.prep.length*3;i.phase='yardCheck';note=`督導前準備：${i.prep.length?i.prep.map(id=>issueTypes.find(t=>t.id===id).fix).join('、'):'未安排額外準備'}。尚未完成的項目保留現場狀態供查核。`;
  }else if(action==='check-yard'&&i.phase==='yardCheck'&&s.location==='yard'){discover('yard');i.phase='officeCheck';note=i.conditions.yard?'督導官現場確認集合場已整理，該項無缺失。':'督導官在集合場點出一般缺失：整理未完成，完成紀錄與現場不符。';}
  else if(action==='check-office'&&i.phase==='officeCheck'&&s.location==='office'){discover('office');i.phase=i.findings.length?'response':'done';note=`督導官核對辦公室資料與設備，共列 ${i.findings.length} 項缺失（一般 ${i.findings.filter(f=>f.severity==='general').length}、重大 ${i.findings.filter(f=>f.severity==='major').length}）。`;}
  else if(action==='respond'&&i.phase==='response'&&s.location==='office'&&['own','evidence','dismiss'].includes(payload.mode)){i.response=payload.mode;i.phase='assign';if(payload.mode==='own'){s.trust+=3;note='你承認現場與紀錄不一致，提出先列管、再分工改善及申請複查。';}else if(payload.mode==='evidence'){s.trust+=1;note='你提出附件請督導官核對；附件不能取代覆核或現場改善，缺失維持原分級。';}else{s.trust-=6;note='你以「只是小事」回應，督導官要求依證據改善；原缺失維持，不重複列管。';}}
  else if(action==='assign'&&i.phase==='assign'&&s.location==='yard'&&['cooperate','push'].includes(payload.mode)){i.plan=payload.mode;i.phase='repair';s.rapport+=payload.mode==='cooperate'?8:-8;s.energy-=payload.mode==='cooperate'?2:5;for(const f of i.findings){f.status='working';const type=issueTypes.find(t=>t.id===f.id);f.owner=payload.mode==='cooperate'?`你＋陳班長協調${type.owner}`:'值星官自行追蹤';}note=payload.mode==='cooperate'?'班長協調整理組、行政與設備承辦；你到現場核實並記錄改善證據。':'班長依你要求保留原勤務；你須自行追蹤三處改善。分工不等於自動完工。';}
  else if(action==='repair'&&i.phase==='repair'){
    const f=i.findings.find(f=>f.id===payload.id),type=issueTypes.find(t=>t.id===payload.id);if(!f||!type||s.location!==type.location||!['working','listed'].includes(f.status)||!['complete','cosmetic'].includes(payload.mode))return state;
    if(payload.mode==='complete'){i.conditions[f.id]=true;f.proof=type.proof;s.energy-=i.plan==='cooperate'?2:4;note=`完成改善：${type.name}。證據：${type.proof}。待督導官複查，尚未結案。`;}
    else{f.proof='僅填寫完成，現場與必要附件尚未更正';s.energy-=1;note=`${type.name}只更新了表面紀錄；現場證據未改變，複查仍可能不合格。`;}
    f.status='pending';f.checked=false;if(i.findings.every(f=>f.status==='pending'||f.status==='closed'))i.phase='recheck';
  }else if(action==='recheck'&&['repair','recheck'].includes(i.phase)&&s.location==='office'){
    if(i.attempts>=100)return state;i.attempts++;const closed=[],failed=[],unfinished=[];
    for(const f of i.findings){if(f.status==='closed')continue;if(f.status!=='pending'){unfinished.push(f.id);continue;}f.checked=true;if(i.conditions[f.id]&&f.proof===issueTypes.find(t=>t.id===f.id).proof){f.status='closed';closed.push(f.id);}else{f.status='working';failed.push(f.id);}}
    i.lastRecheck={closed,failed,unfinished};i.phase=i.findings.every(f=>f.status==='closed')?'done':'repair';if(i.phase==='done')s.trust+=6;
    note=`第 ${i.attempts} 次複查：${closed.length} 項通過、${failed.length} 項退回、${unfinished.length} 項尚未完成。${i.phase==='done'?'全部缺失結案。':'未通過項目保留列管，依證據補正後可再申請；不重複扣查獲分數。'}`;
  }else return state;
  const [h,m]=time.split(':').map(Number);i.minute=Math.max(i.minute??540,h*60+m)+5;
  for(const key of ['trust','rapport','energy'])s[key]=Math.max(0,Math.min(100,s[key]));i.revision++;s.history.push({time,text:note});return s;
}
