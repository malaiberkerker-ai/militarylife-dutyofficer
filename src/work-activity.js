export const officeDesks=Array.from({length:10},(_,i)=>({x:-6+i%5*3,z:i<5?-3:2}));
export const officeSeats=officeDesks.map(p=>({x:p.x,z:p.z-1.35,yaw:0}));
export function workStation(location,index){
 if(location==='office'){const seats=officeSeats.filter((_,i)=>![0,9].includes(i));return {...seats[index%seats.length],activity:'desk'};}
 if(location==='kitchen'){const rear=[-5.6,-4,-.8,.8,2.4,4,5.6];return index<7?{x:rear[index],z:-3.1,yaw:Math.PI,activity:'cook'}:{x:5.4,z:-1.5+(index-7)%5*1.5,yaw:Math.PI/2,activity:'cook'};}
 if(location==='dining')return {x:-9+index%4*6,z:-6+Math.floor(index/4)*4,yaw:0,activity:'sweep'};
 if(['utility','toilet'].includes(location))return {x:-6+index%5*3,z:1+Math.floor(index/5)*2,yaw:0,activity:'sweep'};
 return null;
}
// Shared by the instanced soldiers and named clerks: seven body parts, local transforms.
export function workPose(activity,time,index=0){const beat=Math.sin(time*4+index*.8),parts=[[0,1.25,0],[0,1.95,0],[0,2.25,0],[-.23,.48,0],[.23,.48,0],[-.5,1.25,0],[.5,1.25,0]].map(([x,y,z])=>({x,y,z,rx:0,rz:0}));
 if(activity==='desk'){for(const p of parts)p.y-=.42;for(const j of [3,4])Object.assign(parts[j],{y:.32,z:.28,rx:Math.PI/2});for(const j of [5,6])Object.assign(parts[j],{y:1,z:.3,rx:-.85+beat*.09});parts[1].rx=.08;parts[2].rx=.08;}
 if(activity==='cook'){parts[5].rx=-.65+beat*.12;parts[6].rx=-.9+Math.sin(time*3+index)*.25;parts[6].z=.2;parts[1].rz=beat*.025;}
 if(activity==='check'){parts[5].rx=-.9;parts[6].rx=-.8+beat*.1;parts[1].rx=.12+beat*.03;}
 if(activity==='sweep'){for(const j of [5,6]){parts[j].rx=-.65;parts[j].rz=.15+beat*.25;}parts[0].rz=beat*.045;}
 return parts;
}
export function assemblyStatus(s){if(s.rangeDay&&['depart','return'].includes(s.rangeDay.phase))return {muster:true,label:s.rangeDay.phase==='depart'?'出發集合：弟兄返回集合場':'返營清點：弟兄返回集合場'};const m=s.morning;if(m&&(m.phase==='followup'||m.phase==='active'&&m.clock>=600))return {muster:true,label:'10:00 工作檢討集合，暫停各區作業'};if(m?.mode==='formal'&&(m.phase==='done'||m.clock>=660))return {muster:true,label:'11:00 午前交接集合'};return {muster:false,label:m?.phase==='aftercare'?'各區續辦中 · 下次集合 11:00':m?.phase==='active'?'各區作業中 · 下次集合 10:00':'早點名後依勤務作業；出發或清點時再集合'};}

