export const morningTasks=[
 {id:'report',title:'連長的集合前資料',location:'office',duration:25,due:575,workers:['player','clerk'],priority:'行政'},
 {id:'stats',title:'營部臨時統計',location:'office',duration:20,due:565,workers:['player','clerk'],priority:'行政'},
 {id:'attendance',title:'集合與勤務衝突清查',location:'yard',duration:20,due:570,workers:['player','chen'],priority:'人員優先'}
];
export const morningWorkers={player:'值星官（你）',clerk:'吳文書',chen:'陳班長'};
export const morningChoices={
 promise:{label:'三件都答應，先不回報衝突',minutes:0,effects:{trust:2},note:'你答應全部準時，營部提醒：承諾會留在追問紀錄。'},
 clarify:{label:'向連長說明衝突，申請資料延後',minutes:5,effects:{trust:-1},note:'連長同意資料改為10:00前交，先掌握人員。短期信任−1，但期限正式調整。'},
 cooperate:{label:'與班長協調原勤務，請他接清查',minutes:5,effects:{rapport:3},note:'班長安排原勤務交接，願意接人員清查；仍須在待辦板正式分派。'},
 respect:{label:'先花時間協助交接，再請班長支援',minutes:10,effects:{rapport:4},note:'你先幫班長釐清原勤務，他願意補位。'},
 facts:{label:'依完成與延後紀錄回報，留下待辦',minutes:0,effects:{trust:2},note:'營部接受據實交接；未完成事項保留，沒有被寫成全部正常。'},
 blame:{label:'都是班長沒處理好',minutes:0,effects:{trust:-2,rapport:-6,morale:-2},note:'營部要求核對分工紀錄，班長記住了這次推責。'}
};

