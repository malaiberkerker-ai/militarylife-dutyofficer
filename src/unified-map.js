// Room-local coordinates remain the save format; only rendering uses campus coordinates.
export const campusLayout={
 'commander-room':{x:-60,z:-13,w:18,d:14,lane:0},
 'csm-room':{x:-36,z:-13,w:18,d:14,lane:0},
 office:{x:-12,z:-13,w:18,d:14,lane:0},
 'counselor-room':{x:12,z:-13,w:18,d:14,lane:0},
 'platoon-room':{x:36,z:-13,w:18,d:14,lane:0},
 'nco-room':{x:60,z:-13,w:18,d:14,lane:0},
 recreation:{x:84,z:-13,w:18,d:14,lane:0},
 yard:{x:0,z:21,w:28,d:26,lane:42},
 utility:{x:-84,z:29,w:18,d:14,lane:42},
 armory:{x:-60,z:29,w:18,d:14,lane:42},
 'equipment-store':{x:-36,z:29,w:18,d:14,lane:42},
 kitchen:{x:36,z:29,w:18,d:14,lane:42},
 toilet:{x:60,z:29,w:18,d:14,lane:42},
 'duty-desk':{x:84,z:29,w:18,d:14,lane:42},
 dining:{x:-50,z:71,w:30,d:22,lane:84},
 barracks:{x:0,z:71,w:30,d:22,lane:84},
 range:{x:65,z:71,w:36,d:20,lane:84},
 'hide-yard':{x:-86,z:71,w:20,d:16,lane:84},
 corridor:{x:0,z:0,w:0,d:0,lane:0}
};
export const toCampus=(id,p)=>({x:p.x+(campusLayout[id]?.x??0),z:p.z+(campusLayout[id]?.z??0)});
export const toLocal=(id,p)=>({x:p.x-(campusLayout[id]?.x??0),z:p.z-(campusLayout[id]?.z??0)});
export const entryPoint=id=>({x:0,z:id==='yard'?10:id==='dining'?9:id==='range'?8:id==='hide-yard'?3.5:id==='barracks'?9:4.5});
export function campusRegion(x,z){for(const [id,r]of Object.entries(campusLayout))if(id!=='corridor'&&Math.abs(x-r.x)<r.w/2-.35&&Math.abs(z-r.z)<r.d/2-.35)return id;return 'corridor';}
export function onCampusFloor(x,z,stealth=false){
 if(stealth){const p=toLocal('hide-yard',{x,z});return p.x>=-9.5&&p.x<=9.5&&p.z>=-7.5&&p.z<=7.5;}
 if([0,42,84].some(lane=>Math.abs(z-lane)<=4&&x>=-98&&x<=104)||Math.abs(x-100)<=4&&z>=0&&z<=84||Math.abs(x)<=3&&z>=0&&z<=42)return true;
 for(const [id,r]of Object.entries(campusLayout)){if(['corridor','hide-yard'].includes(id))continue;
  if(Math.abs(x-r.x)<=r.w/2-.45&&Math.abs(z-r.z)<=r.d/2-.45)return true;
  if(Math.abs(x-r.x)<=2&&z>=r.z+r.d/2-1&&z<=r.lane)return true;
 }return false;
}
function lanePoint(p,id){if(id==='corridor'){const lanes=[0,42,84];if(p.x>96)return {x:100,z:[...lanes].sort((a,b)=>Math.abs(p.z-a)-Math.abs(p.z-b))[0]};return {x:p.x,z:lanes.sort((a,b)=>Math.abs(p.z-a)-Math.abs(p.z-b))[0]};}const r=campusLayout[id];return {x:r.x,z:r.lane};}
function exitPoints(id){if(id==='corridor')return [];const r=campusLayout[id];return [{x:r.x,z:r.z+r.d/2+1},{x:r.x,z:r.lane}];}
// Break long trips into short searches around furniture and straight walkway segments.
export function campusWaypoints(start,goal){const from=campusRegion(start.x,start.z),to=campusRegion(goal.x,goal.z);if(from===to)return [goal];const a=lanePoint(start,from),b=lanePoint(goal,to);if(from==='yard'&&b.z===0)a.z=0;if(to==='yard'&&a.z===0)b.z=0;const exits=(id,lane)=>id==='yard'&&lane===0?[{x:0,z:7},{x:0,z:0}]:exitPoints(id);const points=exits(from,a.z);if(from==='corridor')points.push(a);
 if(a.z!==b.z){const junction=a.z<=42&&b.z<=42?0:100;points.push({x:junction,z:a.z},{x:junction,z:b.z});}
 points.push(b,...exits(to,b.z).reverse(),goal);return points.filter((p,i,all)=>!i||Math.hypot(p.x-all[i-1].x,p.z-all[i-1].z)>.01);
}

