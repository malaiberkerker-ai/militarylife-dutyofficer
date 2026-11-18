import {officeDesks,officeSeats,workStation,workPose} from './work-activity.js';
import {vehicles,initialFleet,vehiclePoint,drivingFloor,driveWaypoints} from './fleet.js';
import {createFleetModels,syncFleetModels} from './fleet-world.js';
import {personnelMode,personnelAssignments} from './personnel.js';
import {dayFor} from './engine.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {campusLayout,toCampus,toLocal,campusRegion,onCampusFloor,campusWaypoints,entryPoint,campusLanes} from './unified-map.js';
import {findWalkPath} from './navigation.js';
import {arrivalActor} from './arrival-stage.js';
import * as T from 'three';
import {buildExtraScene,buildFormation} from './camp-world.js';
import {roomById} from './camp.js';

export function makeWorld(container,onFailure,createRenderer=()=>new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'})){
  let renderer;
  try{renderer=createRenderer();}catch{onFailure();return null;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;container.appendChild(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color('#cbd4c5');scene.fog=new T.Fog('#cbd4c5',60,125);
  const camera=new T.OrthographicCamera(-15,15,12,-12,.1,180);camera.position.set(16,21,21);
  scene.add(new T.HemisphereLight(0xfff7df,0x738c79,2.2));
  const sun=new T.DirectionalLight(0xffe4b2,3.4);sun.position.set(-13,25,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-32,right:32,top:32,bottom:-32,near:1,far:80});sun.shadow.normalBias=.05;sun.shadow.bias=-.0001;scene.add(sun);
  let formation=[],personnel=[],personnelKey=null,personnelDirty=true,activityTime=0,driving=null,fleetData=initialFleet(),fleetCommander=null;const fleetGroup=new T.Group();scene.add(fleetGroup);let fleetModels;
  let arrivalKey='',arrivalMesh=null,arrivalTime=0;const arrivalGroup=new T.Group();scene.add(arrivalGroup);
  const campus=new T.Group();scene.add(campus);let group=campus,origin={x:0,z:0},building='yard',blocks=[],targets=[],npcs=[],current='yard',stealth=false,buildKey='';
  const materials=new Map();function mat(c){if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.87}));return materials.get(c);}
  fleetModels=createFleetModels(fleetGroup,c=>mat(c));
  function box(w,h,d,x,y,z,color,cast=true,parent=group){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color));m.position.set(x+(parent===group?origin.x:0),y,z+(parent===group?origin.z:0));m.castShadow=cast;m.receiveShadow=true;parent.add(m);return m;}
  function cylinder(rt,rb,h,x,y,z,color,sides=12,parent=group){const m=new T.Mesh(new T.CylinderGeometry(rt,rb,h,sides),mat(color));m.position.set(x+(parent===group?origin.x:0),y,z+(parent===group?origin.z:0));m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function block(x,z,w,d){blocks.push({x:x+origin.x,z:z+origin.z,w,d});}
  function label(text,x,y,z,width=4,color='#eee9d4',bg='#364735'){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=192;const ctx=canvas.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,1024,192);ctx.strokeStyle='#c4bb8a';ctx.lineWidth=5;ctx.strokeRect(10,10,1004,172);ctx.font='bold 85px "Microsoft JhengHei",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,512,99);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const mesh=new T.Mesh(new T.PlaneGeometry(width,width*192/1024),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));mesh.position.set(x+origin.x,y,z+origin.z);group.add(mesh);return mesh;}
  function tree(x,z,s=1){cylinder(.18*s,.26*s,2.5*s,x,1.25*s,z,'#73654c',7);for(const [yy,r]of [[2.8,1.6],[3.9,1.3],[4.9,.9]]){const m=new T.Mesh(new T.ConeGeometry(r*s,2.4*s,7),mat('#526e44'));m.position.set(x+origin.x,yy*s,z+origin.z);m.castShadow=true;group.add(m);}block(x,z,1,1);}
  function shrub(x,z){box(2,.35,1.2,x,.15,z,'#b7ac8a');box(1.8,.7,1,x,.65,z,'#6b8052');block(x,z,2,1.2);}
  function person(color='#4c6246',sash=false){const p=new T.Group();const legs=[];for(const x of [-.2,.2]){const leg=new T.Group();leg.position.set(x,.92,0);box(.26,.75,.31,0,-.36,0,'#3f5140',true,leg);box(.29,.19,.48,0,-.79,.07,'#303831',true,leg);p.add(leg);legs.push(leg);}box(.78,.85,.43,0,1.27,0,color,true,p);box(.81,.12,.46,0,.93,0,'#303c30',true,p);box(.13,.1,.04,0,.94,.25,'#c7aa6f',true,p);for(const x of [-.52,.52]){box(.23,.67,.31,x,1.3,0,color,true,p);box(.22,.21,.25,x,.9,.02,'#d3ac85',true,p);}box(.49,.5,.44,0,1.98,0,'#d3ac85',true,p);box(.55,.15,.49,0,2.26,0,'#3b5038',true,p);box(.43,.07,.3,0,2.19,.27,'#3b5038',true,p);for(const x of [-.12,.12])box(.05,.05,.025,x,2,.232,'#343b32',false,p);box(.13,.035,.02,0,1.86,.235,'#89634e',false,p);if(sash){const m=box(.18,.94,.04,.08,1.35,.245,'#a84936',false,p);m.rotation.z=-.37;box(.12,.2,.04,.22,1.28,.28,'#e9c88d',false,p);}box(.18,.1,.03,-.19,1.48,.235,'#c8b57c',false,p);p.userData.legs=legs;return p;}
  const player=person('#5a6e48',true);scene.add(player);
  const ring=new T.Mesh(new T.RingGeometry(.58,.64,48),new T.MeshBasicMaterial({color:0xf2d38b,side:T.DoubleSide,transparent:true,opacity:.8}));ring.rotation.x=-Math.PI/2;ring.position.y=.025;player.add(ring);
  function npc(id,name,role,x,z,rotation=0,color='#485e43'){const mesh=person(color);mesh.position.set(x+origin.x,0,z+origin.z);mesh.rotation.y=rotation;group.add(mesh);npcs.push(mesh);targets.push({id,name,role,x:x+origin.x,z:z+origin.z,y:2.65,radius:2.5,mesh,location:building});return mesh;}
  function buildYard(){
    box(30,.2,25,0,-.12,1,'#b5b6a1',false);box(25,.08,17,0,.01,2,'#b3b7aa',false);
    // Parade-ground scoring and lane markings.
    for(let x=-10;x<=10;x+=4){for(let z=-2;z<=7;z+=3)box(2.8,.015,.055,x,.065,z,'#e2e1ca',false);}
    for(const x of [-12,12])box(.07,.02,18,x,.065,2,'#e2dfc5',false);box(24,.02,.07,0,.065,10,'#e2dfc5',false);
    for(let x=-13;x<=13;x+=2.6)box(.035,.015,24,x,.02,1,'#a4ab9e',false);
    label('連集合場 · 100 員',0,3,-8,6);
    // Flag and ceremonial corner.
    cylinder(.95,1.15,.28,-10,.16,-4,'#d6d3bc',12);cylinder(.07,.1,9,-10,4.65,-4,'#d5d7c3',12);const flag=box(2,.95,.05,-9,8.3,-4,'#a2473e');box(.8,.5,.065,-9.58,8.51,-3.97,'#344d66');block(-10,-4,1.6,1.6);
    // Noticeboard.
    for(const x of [3,5])box(.1,1.8,.1,x,.9,-3,'#5b6550');box(3,1.8,.18,4,2,-3,'#465e49');box(3.2,.16,.28,4,2.95,-3,'#a49873');label('早 點 名',4,2.55,-2.89,2.5,'#f0e9d0','#465e49');for(const x of [3.25,4,4.75])box(.55,.8,.025,x,1.85,-2.88,'#e9e4ce',false);block(4,-3,3,.4);targets.push({id:'board',name:'早點名板',role:'核對',x:4,z:-2.1,y:3.4,radius:2});
    // Trees, benches, edge details.
    for(const [x,z,s]of [[-13,-11,.7],[13,-11,.7],[-9,-12,1],[9,-12,1]])tree(x,z,s);
    for(const x of [-8,8])shrub(x,-6.5);
    for(const x of [-13.5,13.5]){box(.7,.15,3,x,.65,5,'#8a8060');for(const z of [4,6])box(.55,.6,.1,x,.3,z,'#535f4a');block(x,5,.9,3.4);}
    npc('sergeant','陳班長','值星班長',-3.5,1,.35);
    formation=buildFormation({group,mat},Array.from({length:80},(_,i)=>({x:origin.x+1.7+(i%8)*1.2,z:origin.z-.5+Math.floor(i/8)*1.15})));

  }
  function desk(x,z,w=3){box(w,.15,1.5,x,1.35,z,'#a39169');for(const xx of [-w/2+.15,w/2-.15])box(.18,1.3,1.25,x+xx,.65,z,'#5a6650');block(x,z,w+.1,1.6);box(.6,.035,.5,x+.5,1.45,z+.2,'#e7e5cc');box(.55,.035,.45,x+.53,1.49,z+.18,'#f5efdb');box(.4,.08,.3,x-.6,1.45,z,'#3b493b');}
  function buildOffice(){
    box(20,.4,17,0,-.3,0,'#8e9a7f');box(18,.18,14,0,-.06,0,'#d1c6a6');for(let x=-9;x<=9;x+=1.5)box(.025,.01,14,x,.04,0,'#b4aa8f',false);for(let z=-7;z<=7;z+=1.5)box(18,.01,.025,0,.04,z,'#b4aa8f',false);
    box(18,4.6,.25,0,2.25,-7,'#dfdfc7');box(.25,4.6,14,-9,2.25,0,'#d2d8bd');box(18,.95,.28,0,.45,-6.82,'#9cae91');box(.3,.95,14,-8.83,.45,0,'#9cae91');box(18,.13,.4,0,4.6,-7,'#f1ead2');box(.4,.13,14,-9,4.6,0,'#f1ead2');
    for(const x of [-5.4,5.4]){box(3,2.2,.12,x,2.9,-6.8,'#8caeab');box(3.2,.12,.25,x,4,-6.64,'#fbf1d7');box(.09,2.2,.16,x,2.9,-6.65,'#e5e8cd');box(3.2,.12,.3,x,1.8,-6.64,'#efead0');}
    label('務 實 ・ 負 責 ・ 合 作',0,3.9,-6.77,5.3,'#566343','#d9ddc3');
    for(const p of officeDesks){desk(p.x,p.z,2);box(.8,.14,.8,p.x,.55,p.z-1.15,'#53684c');box(.8,.7,.12,p.x,.85,p.z-1.55,'#53684c');box(.65,.5,.07,p.x,1.65,p.z+.2,'#364e46');box(.52,.36,.08,p.x,1.65,p.z+.15,'#88a59b');}
    const ops=officeSeats[0],clerk=officeSeats[9];npc('operations','趙業務士','業務承辦',ops.x,ops.z,0,'#5a6e50').userData.activity='desk';npc('clerk','吳文書','行政承辦',clerk.x,clerk.z,0,'#5a6e50').userData.activity='desk';
    label('連辦公室 · 業務作業區',0,3.9,-6.77,6);
    // Sparse, warm pools of indoor light.
    const lamp=new T.PointLight(0xffdda0,15,15,2);lamp.position.set(-2+origin.x,5,origin.z);group.add(lamp);
  }
  function buildParking(){box(44,.18,32,0,-.06,0,'#9b9e8a');for(const v of vehicles){const w=v.kind==='tank'?4:3.4;for(const x of [-w/2,w/2])box(.06,.02,5.7,v.x+x,.06,v.z,'#e1ddbf',false);label(v.id,v.x,.15,v.z+2.9,1.5).rotation.x=-Math.PI/2;}label('車場 · 戰車14／中卡2／吉普3',0,3,-15.5,14);targets.push({id:'fleet-inspector',name:'連長裝備檢查',role:'車場',x:-20,z:11,y:2.8,radius:3});label('裝備檢查／派車',-20,2,11,5);}
  function clear(){while(campus.children.length){const child=campus.children[0];campus.remove(child);child.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material?.map){o.material.map.dispose();o.material.dispose();}});}blocks=[];targets=[];npcs=[];}
  function buildInspection(i){if(!i)return;const p=i.phase;
    if(building==='yard'){
      if(p==='yardCheck')npc('inspector','周督導官','督導官',1,1,.2,'#374c52');
      if(i.conditions.yard){box(2.8,.025,1.8,-7,.065,5,'#c3c7b2',false);label('整理已完成',-7,1.1,4.8,2);}
      else{box(.8,.7,.7,-7,.35,5,'#a38c60');box(.7,.5,.6,-6.4,.25,5.3,'#b49e74');box(.9,.03,.6,-7.6,.1,5.4,'#e4d8b4');label('待整理區',-7,1.5,5,2);block(-7,5,2.4,1.3);}
      targets.push({id:'repair-yard',name:'整理查核點',role:'現場',x:-7,z:6.1,y:2,radius:2.2});
    }else if(building==='office'){
      if(!['prep','yardCheck'].includes(p))npc('inspector','周督導官','督導官',2,0,0,'#374c52');
      box(.7,.05,.5,5,1.48,1.3,i.conditions.log?'#789258':'#c5a064');label(i.conditions.log?'覆核已補齊':'覆核欄待補',5,2.2,1.3,2.3);
      targets.push({id:'repair-log',name:'紀錄覆核點',role:'查證',x:5,z:2.5,y:2.8,radius:1.9});
      box(1.2,1.3,.8,-6,.65,-.2,'#738574');label(i.conditions.safety?'已停用・已列管':'待修卻標可用',-6,2.1,.3,2.8,i.conditions.safety?'#e8edcf':'#fff0d2',i.conditions.safety?'#526b47':'#984b3c');block(-6,-.2,1.4,1);
      targets.push({id:'repair-safety',name:'設備列管點',role:'改善',x:-6,z:1,y:2.8,radius:2});
    }
  }
  function syncArrival(event){const actor=arrivalActor(event);const key='campus:'+(actor?.id??'')+':'+(event?.phase??'')+':'+(event?.drillIndex??0);if(key===arrivalKey)return false;const previous=arrivalMesh;const previousTime=arrivalTime;arrivalKey=key;for(const t of targets.filter(t=>t.id.startsWith('arrival-'))){npcs=npcs.filter(n=>n!==t.mesh);}targets=targets.filter(t=>!t.id.startsWith('arrival-'));while(arrivalGroup.children.length){const child=arrivalGroup.children[0];arrivalGroup.remove(child);child.traverse(o=>{o.geometry?.dispose();});}arrivalMesh=null;arrivalTime=0;if(!actor)return true;
    const mesh=person(actor.color);arrivalGroup.add(mesh);mesh.position.set(campusLayout.yard.x-11,0,campusLayout.yard.z+actor.z);npcs.push(mesh);const target={...actor,y:2.8,radius:2.5,x:-11+campusLayout.yard.x,z:actor.z+campusLayout.yard.z,mesh,ready:false,location:'yard'};targets.push(target);arrivalMesh={mesh,target,actor};if(previous?.actor.id===actor.id){arrivalTime=previousTime;mesh.position.copy(previous.mesh.position);target.x=mesh.position.x;target.z=mesh.position.z;target.ready=previous.target.ready;}
    if(actor.kind==='visitor'){box(.45,.5,.25,.72,.8,0,'#6d533f',true,mesh);box(.57,.16,.52,0,2.26,0,'#88939c',true,mesh);}
    if(actor.kind==='impostor'){box(.48,.55,.08,.5,1.35,.35,'#ae654b',true,mesh);}
    if(actor.kind==='commander')for(const x of [-.5,.5])box(.2,.06,.32,x,1.65,0,'#dcc178',true,mesh);
    if(event.phase==='drill'){const done=event.drillIndex;box(2,.45,1,-8,.23,campusLayout.yard.z+1,'#84966f',true,arrivalGroup);box(2.05,.06,1.05,-8,.48,campusLayout.yard.z+1,done>=1?'#e0ce92':'#a7b392',true,arrivalGroup);cylinder(.5,.35,.3,-8,.16,campusLayout.yard.z+3,done>=2?'#d9cda6':'#7b9699',12,arrivalGroup);for(const x of [-8.3,-7.7])box(.35,.12,.7,x,.07,campusLayout.yard.z+5,done>=3?'#dbc386':'#697580',true,arrivalGroup);}
    return true;
  }
  function animateArrival(dt){if(!arrivalMesh)return;arrivalTime+=dt;const {mesh,target,actor}=arrivalMesh,t=Math.min(1,arrivalTime/1.5);mesh.position.x=campusLayout.yard.x-11+(actor.x+11)*t;target.x=mesh.position.x;target.z=mesh.position.z;target.ready=t>=1;mesh.rotation.y=t<1?Math.PI/2:Math.atan2(player.position.x-mesh.position.x,player.position.z-mesh.position.z);mesh.userData.legs.forEach((l,i)=>l.rotation.x=t<1?Math.sin(arrivalTime*12+i*Math.PI)*.4:0);if(t>=1&&actor.kind==='impostor')mesh.rotation.z=Math.sin(arrivalTime*4)*.035;}
  function canTalk(id){const t=targets.find(t=>t.id===id);return !!t&&t.location===position().location&&t.ready!==false&&Math.hypot(t.x-player.position.x,t.z-player.position.z)<t.radius;}
  let route=[],routeTarget=null;
  const destination=new T.Mesh(new T.RingGeometry(.28,.38,24),new T.MeshBasicMaterial({color:'#edca7d',side:T.DoubleSide}));destination.rotation.x=-Math.PI/2;destination.visible=false;destination.position.y=.08;scene.add(destination);
  function cancelRoute(){route=[];routeTarget=null;destination.visible=false;}
  function walkPath(goal,from=player.position){let start={x:from.x,z:from.z},path=[];for(const point of stealth?[goal]:campusWaypoints(start,goal)){const part=findWalkPath(start,point,canStand,12000);if(!part)return null;path.push(...part);start=point;}return path;}
  function queueGround(point){cancelRoute();const path=driving?findWalkPath(player.position,point,canDrive,12000):walkPath(point);if(!path)return false;route=path;destination.position.set(point.x,.08,point.z);destination.visible=true;return true;}
  function queueTarget(id){const target=targets.find(t=>t.id===id);if(!target)return false;const center=arrivalMesh?.target===target?toCampus('yard',arrivalMesh.actor):target;const angle=Math.atan2(player.position.z-center.z,player.position.x-center.x),radius=target.id.startsWith('vehicle:')?3.4:Math.min(1.5,target.radius*.7);cancelRoute();if(canTalk(id)){routeTarget=id;return true;}
    for(let i=0;i<12;i++){const a=angle+(i%2?1:-1)*Math.ceil(i/2)*Math.PI/6,point={x:center.x+Math.cos(a)*radius,z:center.z+Math.sin(a)*radius};const path=walkPath(point);if(path){route=path;routeTarget=id;destination.position.set(point.x,.08,point.z);destination.visible=true;return true;}}return false;
  }
  function autoStep(dt){if(routeTarget&&!targets.some(t=>t.id===routeTarget)){cancelRoute();return {moved:false};}if(routeTarget&&canTalk(routeTarget)){const interact=routeTarget;cancelRoute();return {moved:false,interact};}while(route.length&&Math.hypot(route[0].x-player.position.x,route[0].z-player.position.z)<.08)route.shift();if(!route.length){destination.visible=false;if(!routeTarget)return {moved:false};return {moved:false};}const next=route[0],x=next.x-player.position.x,z=next.z-player.position.z,d=Math.hypot(x,z),scale=Math.min(1,d/((driving?9:4.4)*Math.max(dt,.0001)));const moved=move((x-z)/Math.SQRT2/d*scale,(x+z)/Math.SQRT2/d*scale,dt);if(!moved&&dt>0)cancelRoute();return {moved};}
  function pick(clientX,clientY){const rect=renderer.domElement.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1),camera);const models=targets.filter(t=>t.mesh);const hits=ray.intersectObjects(models.map(t=>t.mesh),true);if(hits.length){const t=models.find(t=>{let object=hits[0].object;while(object){if(object===t.mesh)return true;object=object.parent;}return false;});if(t)return {id:t.id};}const point=new T.Vector3();if(!ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),point))return null;const t=targets.find(t=>Math.hypot(t.x-point.x,t.z-point.z)<.85);return t?{id:t.id}:{point:{x:point.x,z:point.z}};}
  function buildCampus(inspection){
    clear();personnelDirty=true;origin={x:0,z:0};group=campus;
    box(240,.25,105,10,-.6,25,'#a7b493',false);
    for(const lane of campusLanes){box(226,.16,8,14,-.08,lane,'#b9b9a2',false);label(lane===0?'連部行政區':lane===34?'勤務與補給區':'生活與訓練區',120,2,lane,5);}
    box(8,.16,64,124,-.08,32,'#b9b9a2',false);box(6,.16,34,0,-.08,17,'#c8c4ac',false);
    for(const [id,r] of Object.entries(campusLayout)){
      if(id==='corridor')continue;building=id;origin=r;group=campus;const begin=targets.length;
      if(id==='yard')buildYard();else if(id==='office')buildOffice();else if(id==='parking')buildParking();else buildExtraScene({box,cylinder,block,label,npc,targets,group,mat},id);
      buildInspection(inspection);
      for(const t of targets.slice(begin))if(!t.location){t.x+=r.x;t.z+=r.z;t.location=id;}
      targets=targets.filter(t=>t.location!==id||!t.id.startsWith('go:')&&!['office-door','yard-door'].includes(t.id));
      if(id!=='hide-yard'){targets.push({id:'go:'+id,name:roomById(id).name+'入口',role:'通行',x:r.x,z:r.z+r.d/2+1,y:1.3,radius:1.5,location:'corridor'});origin={x:0,z:0};box(4,.1,Math.max(2,r.lane-r.z-r.d/2+1),r.x,-.02,(r.lane+r.z+r.d/2-1)/2,'#c9c6b0',false);}
      origin=r;
    }
    for(const v of vehicles){const r=fleetData.records.find(r=>r.id===v.id),p=vehiclePoint(r);targets.push({id:'vehicle:'+v.id,name:v.name,role:'上車／查核',x:p.x,z:p.z,y:3.3,radius:4,location:r.location,mesh:fleetModels.get(v.id)});}
    building='corridor';origin={x:0,z:0};group=campus;batchScenery();
  }
  const workTools=[new T.InstancedMesh(new T.BoxGeometry(.05,1.6,.05),mat('#a58b5f'),80),new T.InstancedMesh(new T.BoxGeometry(.65,.14,.18),mat('#788855'),80)];for(const m of workTools){m.castShadow=true;scene.add(m);}
  function syncPersonnel(state){const mode=personnelMode(state);if(mode===personnelKey&&!personnelDirty)return;const animate=personnelKey!==null&&!personnelDirty&&mode!==personnelKey;const old=personnel;personnel=[];const counts=new Map();const assignments=personnelAssignments(state,dayFor(state));for(let i=0;i<80;i++){const muster=toCampus('yard',{x:1.7+i%8*1.2,z:-.5+Math.floor(i/8)*1.15});let goal=muster,station=null;const id=assignments[i].location,used=counts.get(id)??0;counts.set(id,used+1);if(mode==='dispersed'){station=workStation(id,used);if(station){const candidate=toCampus(id,station);if(canStand(candidate.x,candidate.z))goal=candidate;else station=null;}if(!station){const options=[];for(let z=5;z>=-5;z-=1.2)for(let x=-7;x<=7;x+=1.2){const point=toCampus(id,{x,z});if(canStand(point.x,point.z))options.push(point);}goal=options[(used*3)%options.length]??safePosition(id);}}
      const start=old[i]??muster;const route=animate?walkPath(goal,start):null;personnel.push({x:animate&&route?start.x:goal.x,z:animate&&route?start.z:goal.z,route:route??[],goal,activity:mode==='dispersed'?(station?.activity??(['armory','equipment-store','recreation','platoon-room','nco-room','duty-desk'].includes(id)?'check':'sweep')):'stand',yaw:station?.yaw??0,workYaw:station?.yaw??0,external:mode==='dispersed'&&assignments[i].external});}personnelKey=mode;personnelDirty=false;animatePersonnel(0);}
  function animatePersonnel(dt){activityTime+=dt;if(!formation.length||!personnel.length)return;const matrix=new T.Matrix4(),root=new T.Matrix4(),local=new T.Matrix4(),q=new T.Quaternion(),scale=new T.Vector3(1,1,1);for(let i=0;i<personnel.length;i++){const p=personnel[i];let budget=dt*3.8;while(p.route.length&&budget>0){const n=p.route[0],d=Math.hypot(n.x-p.x,n.z-p.z);p.yaw=Math.atan2(n.x-p.x,n.z-p.z);if(d<=budget){p.x=n.x;p.z=n.z;p.route.shift();budget-=d;}else{p.x+=(n.x-p.x)/d*budget;p.z+=(n.z-p.z)/d*budget;budget=0;}}
      if(!p.route.length)p.yaw=p.workYaw;const activity=p.route.length?'walk':p.activity,parts=workPose(activity,activityTime,i);q.setFromAxisAngle(new T.Vector3(0,1,0),p.yaw);root.compose(new T.Vector3(p.x,0,p.z),q,scale);for(let j=0;j<formation.length;j++){const part=parts[j];if(activity==='walk'&&[3,4].includes(j))part.rx=Math.sin(activityTime*9+i+j*Math.PI)*.4;q.setFromEuler(new T.Euler(part.rx,0,part.rz));local.compose(new T.Vector3(part.x,part.y,part.z),q,scale);matrix.multiplyMatrices(root,local);if(p.external&&!p.route.length)matrix.scale(new T.Vector3(0,0,0));formation[j].setMatrixAt(i,matrix);}
      for(let j=0;j<workTools.length;j++){if(!p.route.length&&!p.external&&activity==='sweep'){q.setFromEuler(new T.Euler(0,0,.2+Math.sin(activityTime*3+i)*.25));local.compose(new T.Vector3(.7,j===0?.9:.12,.6),q,scale);matrix.multiplyMatrices(root,local);}else matrix.makeScale(0,0,0);workTools[j].setMatrixAt(i,matrix);}}
    for(const mesh of [...formation,...workTools]){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();}}
  function batchScenery(){const buckets=new Map();for(const mesh of [...campus.children]){if(!mesh.isMesh||mesh.isInstancedMesh||mesh.material.map)continue;mesh.updateMatrix();const geometry=mesh.geometry.clone().applyMatrix4(mesh.matrix);const key=mesh.material;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(geometry);campus.remove(mesh);mesh.geometry.dispose();}for(const [material,parts]of buckets){const geometry=mergeGeometries(parts,false);for(const part of parts)part.dispose();if(geometry){const mesh=new T.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;campus.add(mesh);}}}
  function load(location,x,z,inspection=null,rangeDay=null){cancelRoute();const key=JSON.stringify(inspection);if(key!==buildKey||!campus.children.length){buildKey=key;buildCampus(inspection);arrivalKey='';}current=location;stealth=location==='hide-yard';const point=toCampus(location,{x,z});player.position.set(point.x,0,point.z);if(!canStand(point.x,point.z)){const safe=safePosition(location);player.position.set(safe.x,0,safe.z);}follow.copy(player.position);return position();}
  function position(){const location=stealth?'hide-yard':campusRegion(player.position.x,player.position.z);current=location;return {location,...toLocal(location,player.position)};}
  function canStand(x,z){return !vehicleBlocked(x,z,.45)&&onCampusFloor(x,z,stealth)&&!blocks.some(b=>Math.abs(x-b.x)<b.w/2+.38&&Math.abs(z-b.z)<b.d/2+.38)&&!npcs.some(n=>Math.hypot(x-n.position.x,z-n.position.z)<.65);}
  function vehicleBlocked(x,z,pad){return fleetData.records.some(r=>r.id!==driving&&(()=>{const p=vehiclePoint(r),v=vehicles.find(v=>v.id===r.id),w=v.kind==='tank'?3.3:2.4,d=v.kind==='tank'?5.1:v.kind==='truck'?4.6:3.2;const dx=x-p.x,dz=z-p.z,c=Math.cos(r.yaw),sn=Math.sin(r.yaw);return Math.abs(dx*c-dz*sn)<w/2+pad&&Math.abs(dx*sn+dz*c)<d/2+pad;})());}
  function canDrive(x,z){return drivingFloor(x,z)&&!vehicleBlocked(x,z,1.25);}
  function syncFleet(f){fleetData=f??initialFleet();const inspecting=['checking','repair'].includes(fleetData.inspection);const regular=targets.find(t=>t.id==='commander');if(regular){regular.mesh.visible=!inspecting;regular.ready=!inspecting;}const spot=targets.find(t=>t.id==='fleet-inspector');if(spot){if(!fleetCommander){fleetCommander=person('#455c44');scene.add(fleetCommander);}fleetCommander.visible=inspecting;fleetCommander.position.set(spot.x,0,spot.z);spot.mesh=inspecting?fleetCommander:null;}const was=driving;driving=fleetData.driver;player.visible=!driving;syncFleetModels(fleetModels,fleetData,targets);if(was!==driving)cancelRoute();}
  function driveTo(target){if(!driving)return false;cancelRoute();let from={x:player.position.x,z:player.position.z},points=[];for(const goal of driveWaypoints(driving,from,target)){const part=findWalkPath(from,goal,canDrive,16000);if(!part)return false;points.push(...part);from=goal;}route=points;destination.position.set(from.x,.08,from.z);destination.visible=true;return true;}
  function exitVehicle(){const base={x:player.position.x,z:player.position.z};for(const [dx,dz]of [[3,0],[-3,0],[0,4],[0,-4]]){const p={x:base.x+dx,z:base.z+dz};if(onCampusFloor(p.x,p.z)&&!vehicleBlocked(p.x,p.z,.4)){player.position.set(p.x,0,p.z);return position();}}return null;}
  function safePosition(id=current){const first=toCampus(id,entryPoint(id));if(canStand(first.x,first.z))return first;for(let z=5;z>=-5;z--)for(let x=-7;x<=7;x++){const p=toCampus(id,{x,z});if(canStand(p.x,p.z))return p;}return first;}
  function navigate(location){if(location==='hide-yard'||stealth)return false;const point=location==='corridor'?{x:0,z:0}:safePosition(location);return queueGround(point);}
  function move(dx,dz,dt){const v=new T.Vector2(dx,dz);if(v.length()>1)v.normalize();const speed=driving?9:4.4;const sx=(v.x+v.y)*Math.SQRT1_2*speed*dt,sz=(v.y-v.x)*Math.SQRT1_2*speed*dt;let moved=false;let x=player.position.x,z=player.position.z;if((driving?canDrive:canStand)(x+sx,z)){x+=sx;moved=Math.abs(sx)>.00001;}if((driving?canDrive:canStand)(x,z+sz)){z+=sz;moved=moved||Math.abs(sz)>.00001;}player.position.set(x,0,z);if(moved){player.rotation.y=Math.atan2(sx,sz);const t=performance.now()*.012;player.userData.legs[0].rotation.x=Math.sin(t)*.45;player.userData.legs[1].rotation.x=-Math.sin(t)*.45;player.position.y=Math.abs(Math.sin(t))*.035;}else{player.userData.legs.forEach(l=>l.rotation.x=0);player.position.y=0;}return moved;}
  let follow=new T.Vector3(),offset=new T.Vector3(15,20,20),aspect=1;
  function resize(){const w=container.clientWidth,h=container.clientHeight;aspect=w/h;const height=w<700?25:23;camera.left=-height*aspect/2;camera.right=height*aspect/2;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();renderer.setSize(w,h);}
  function render(dt){if(driving){const model=fleetModels.get(driving);model.position.copy(player.position);model.position.y=0;model.rotation.y=player.rotation.y;}animateArrival(dt);animatePersonnel(dt);for(const t of targets.filter(t=>t.mesh?.userData.activity)){t.mesh.position.y=t.mesh.userData.activity==='desk'?-.42:0;for(const leg of t.mesh.userData.legs)leg.rotation.x=t.mesh.userData.activity==='desk'?-Math.PI/2:0;const arms=t.mesh.children.filter(o=>o.isMesh&&Math.abs(o.position.x)>.5);for(const arm of arms)arm.rotation.x=-.65+Math.sin(activityTime*4)*.08;}follow.lerp(player.position,1-Math.exp(-dt*5));sun.position.copy(follow).add(new T.Vector3(-13,25,8));sun.target.position.copy(follow);sun.target.updateMatrixWorld();camera.position.copy(follow).add(offset);camera.lookAt(follow.x,1.3,follow.z);renderer.render(scene,camera);}
  function project(x,y,z){const v=new T.Vector3(x,y,z).project(camera);return {x:(v.x*.5+.5)*container.clientWidth,y:(-.5*v.y+.5)*container.clientHeight,visible:v.z>-1&&v.z<1&&Math.abs(v.x)<1.1&&Math.abs(v.y)<1.1};}
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();onFailure();});
  resize();window.addEventListener('resize',resize);
  return {load,position,navigate,syncPersonnel,syncFleet,driveTo,exitVehicle,get driving(){return driving;},move,render,project,player,pick,queueGround,queueTarget,autoStep,cancelRoute,canvas:renderer.domElement,syncArrival,canTalk,hunter(h){const t=targets.find(t=>t.id==='veteran');if(t){const p=toCampus('hide-yard',h);t.mesh.position.set(p.x,0,p.z);t.mesh.rotation.y=Math.atan2(h.dx,h.dz);t.x=p.x;t.z=p.z;}},get targets(){return targets;},setQuality(low){renderer.setPixelRatio(Math.min(devicePixelRatio,low?1:1.7));renderer.shadowMap.enabled=!low;resize();},nearest(){return targets.map(t=>({...t,distance:Math.hypot(t.x-player.position.x,t.z-player.position.z)})).filter(t=>t.location===position().location&&t.ready!==false&&t.distance<t.radius).sort((a,b)=>Number(b.id.startsWith('arrival-'))-Number(a.id.startsWith('arrival-'))||a.distance-b.distance)[0]??null;},safe(){const safe=safePosition();player.position.set(safe.x,0,safe.z);},dispose(){renderer.dispose();window.removeEventListener('resize',resize);}};
}

