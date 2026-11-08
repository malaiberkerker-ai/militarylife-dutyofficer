export const arrivalActors={
 visitor:{id:'arrival-visitor',name:'洽公訪客',role:'來意待確認',x:-6,z:1,color:'#527f9b',kind:'visitor'},
 impostor:{id:'arrival-impostor',name:'自稱長官的來人',role:'身分待查',x:-6,z:4,color:'#82685d',kind:'impostor'},
 commander:{id:'arrival-commander',name:'許新連長',role:'正式到任',x:-6,z:-2,color:'#344f40',kind:'commander'}
};
export function arrivalActor(e){return e?.phase==='visitor'?arrivalActors.visitor:['impostor','drill'].includes(e?.phase)?arrivalActors.impostor:e?.phase==='final'?arrivalActors.commander:null;}
export function arrivalProximity(s,id){const a=arrivalActor(s.arrivalEvent);return !!a&&s.location==='yard'&&a.id===id&&Math.hypot(s.x-a.x,s.z-a.z)<2.5;}

