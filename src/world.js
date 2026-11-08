import * as T from 'three';
import {buildExtraScene,buildFormation} from './camp-world.js';
import {roomById} from './camp.js';

export function makeWorld(container,onFailure){
  let renderer;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch{onFailure();return null;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;container.appendChild(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color('#cbd4c5');scene.fog=new T.Fog('#cbd4c5',42,85);
  const camera=new T.OrthographicCamera(-15,15,12,-12,.1,110);camera.position.set(16,21,21);
  scene.add(new T.HemisphereLight(0xfff7df,0x738c79,2.2));
  const sun=new T.DirectionalLight(0xffe4b2,3.4);sun.position.set(-13,25,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-32,right:32,top:32,bottom:-32,near:1,far:80});sun.shadow.normalBias=.05;sun.shadow.bias=-.0001;scene.add(sun);
  const group=new T.Group();scene.add(group);let blocks=[],targets=[],npcs=[],current='yard';
  const materials=new Map();function mat(c){if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.87}));return materials.get(c);}
  function box(w,h,d,x,y,z,color,cast=true,parent=group){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;parent.add(m);return m;}
  function cylinder(rt,rb,h,x,y,z,color,sides=12,parent=group){const m=new T.Mesh(new T.CylinderGeometry(rt,rb,h,sides),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function block(x,z,w,d){blocks.push({x,z,w,d});}
  function label(text,x,y,z,width=4,color='#eee9d4',bg='#364735'){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=192;const ctx=canvas.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,1024,192);ctx.strokeStyle='#c4bb8a';ctx.lineWidth=5;ctx.strokeRect(10,10,1004,172);ctx.font='bold 85px "Microsoft JhengHei",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,512,99);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const mesh=new T.Mesh(new T.PlaneGeometry(width,width*192/1024),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));mesh.position.set(x,y,z);group.add(mesh);return mesh;}
  function tree(x,z,s=1){cylinder(.18*s,.26*s,2.5*s,x,1.25*s,z,'#73654c',7);for(const [yy,r]of [[2.8,1.6],[3.9,1.3],[4.9,.9]]){const m=new T.Mesh(new T.ConeGeometry(r*s,2.4*s,7),mat('#526e44'));m.position.set(x,yy*s,z);m.castShadow=true;group.add(m);}block(x,z,1,1);}
  function shrub(x,z){box(2,.35,1.2,x,.15,z,'#b7ac8a');box(1.8,.7,1,x,.65,z,'#6b8052');block(x,z,2,1.2);}
  function person(color='#4c6246',sash=false){const p=new T.Group();const legs=[];for(const x of [-.2,.2]){const leg=new T.Group();leg.position.set(x,.92,0);box(.26,.75,.31,0,-.36,0,'#3f5140',true,leg);box(.29,.19,.48,0,-.79,.07,'#303831',true,leg);p.add(leg);legs.push(leg);}box(.78,.85,.43,0,1.27,0,color,true,p);box(.81,.12,.46,0,.93,0,'#303c30',true,p);box(.13,.1,.04,0,.94,.25,'#c7aa6f',true,p);for(const x of [-.52,.52]){box(.23,.67,.31,x,1.3,0,color,true,p);box(.22,.21,.25,x,.9,.02,'#d3ac85',true,p);}box(.49,.5,.44,0,1.98,0,'#d3ac85',true,p);box(.55,.15,.49,0,2.26,0,'#3b5038',true,p);box(.43,.07,.3,0,2.19,.27,'#3b5038',true,p);for(const x of [-.12,.12])box(.05,.05,.025,x,2,.232,'#343b32',false,p);box(.13,.035,.02,0,1.86,.235,'#89634e',false,p);if(sash){const m=box(.18,.94,.04,.08,1.35,.245,'#a84936',false,p);m.rotation.z=-.37;box(.12,.2,.04,.22,1.28,.28,'#e9c88d',false,p);}box(.18,.1,.03,-.19,1.48,.235,'#c8b57c',false,p);p.userData.legs=legs;return p;}
  const player=person('#5a6e48',true);scene.add(player);
  const ring=new T.Mesh(new T.RingGeometry(.58,.64,48),new T.MeshBasicMaterial({color:0xf2d38b,side:T.DoubleSide,transparent:true,opacity:.8}));ring.rotation.x=-Math.PI/2;ring.position.y=.025;player.add(ring);
  function npc(id,name,role,x,z,rotation=0,color='#485e43'){const mesh=person(color);mesh.position.set(x,0,z);mesh.rotation.y=rotation;group.add(mesh);npcs.push(mesh);targets.push({id,name,role,x,z,y:2.65,radius:2.5,mesh});return mesh;}
  function buildYard(){
    box(100,.4,100,0,-.45,0,'#a7b493',false);box(30,.2,25,0,-.12,1,'#b5b6a1',false);box(25,.08,17,0,.01,2,'#b3b7aa',false);
    // Parade-ground scoring and lane markings.
    for(let x=-10;x<=10;x+=4){for(let z=-2;z<=7;z+=3)box(2.8,.015,.055,x,.065,z,'#e2e1ca',false);}
    for(const x of [-12,12])box(.07,.02,18,x,.065,2,'#e2dfc5',false);box(24,.02,.07,0,.065,10,'#e2dfc5',false);
    for(let x=-13;x<=13;x+=2.6)box(.035,.015,24,x,.02,1,'#a4ab9e',false);
    // Office façade and covered passage.
    box(25,4.9,6,0,2.45,-11,'#d7d4bd');box(25,.65,6,0,.3,-11,'#a0ad94');box(26,.25,7,0,5,-10.8,'#63705d');box(26,.18,.45,0,4.15,-7.5,'#e2dfc9');
    for(const x of [-11,-7,7,11]){box(2.5,1.75,.08,x,2.8,-7.94,'#72908a');box(2.7,.1,.15,x,3.7,-7.85,'#eee7d2');box(.08,1.8,.12,x,2.8,-7.8,'#dbdcc4');box(2.7,.1,.18,x,1.87,-7.82,'#e7e3cf');}
    box(2.3,3.3,.12,0,1.67,-7.94,'#344d42');box(.85,2.2,.13,-.55,1.9,-7.83,'#67867b');box(.85,2.2,.13,.55,1.9,-7.83,'#67867b');box(.05,3.2,.16,0,1.65,-7.75,'#c7c9af');box(.08,.3,.13,.25,1.5,-7.65,'#d9bd78');label('連 辦 公 室',0,4.45,-7.42,4.6);
    for(const x of [-3.5,3.5])box(.18,4,.18,x,2,-7.15,'#bdc4ab');box(8,.17,2.4,0,4.05,-7.1,'#aab397');box(8,.16,2.8,0,.04,-6.9,'#c9c6b0');
    block(-7.5,-10,10,6);block(7.5,-10,10,6);block(0,-10.5,5,5);
    targets.push({id:'office-door',name:'連辦公室',role:'進入',x:0,z:-6.5,y:2.9,radius:2});
    // Flag and ceremonial corner.
    cylinder(.95,1.15,.28,-10,.16,-4,'#d6d3bc',12);cylinder(.07,.1,9,-10,4.65,-4,'#d5d7c3',12);const flag=box(2,.95,.05,-9,8.3,-4,'#a2473e');box(.8,.5,.065,-9.58,8.51,-3.97,'#344d66');block(-10,-4,1.6,1.6);
    // Noticeboard.
    for(const x of [3,5])box(.1,1.8,.1,x,.9,-3,'#5b6550');box(3,1.8,.18,4,2,-3,'#465e49');box(3.2,.16,.28,4,2.95,-3,'#a49873');label('早 點 名',4,2.55,-2.89,2.5,'#f0e9d0','#465e49');for(const x of [3.25,4,4.75])box(.55,.8,.025,x,1.85,-2.88,'#e9e4ce',false);block(4,-3,3,.4);targets.push({id:'board',name:'早點名板',role:'核對',x:4,z:-2.1,y:3.4,radius:2});
    // Trees, benches, edge details.
    for(const [x,z,s]of [[-16,-7,1.15],[-16,2,1],[-16,10,1.25],[16,-5,1.2],[16,4,.95],[16,12,1.15],[-9,-17,1],[9,-17,1]])tree(x,z,s);
    for(const x of [-8,8])shrub(x,-6.5);
    for(const x of [-13.5,13.5]){box(.7,.15,3,x,.65,5,'#8a8060');for(const z of [4,6])box(.55,.6,.1,x,.3,z,'#535f4a');block(x,5,.9,3.4);}
    for(const x of [-14,14])for(let z=-10;z<=12;z+=3){box(.12,1.1,.12,x,.55,z,'#d9d7c2');if(z<12)box(.08,.08,3,x,.8,z+1.5,'#a6ae98');}
    npc('sergeant','陳班長','值星班長',-3.5,1,.35);
    buildFormation({group,mat},Array.from({length:80},(_,i)=>({x:1.7+(i%8)*1.2,z:-.5+Math.floor(i/8)*1.15})));
    // Quiet background barracks silhouettes.
    box(12,5,6,-23,2.3,-15,'#bdc4ae');box(13,.35,7,-23,5,-15,'#65765d');box(15,5.7,7,23,2.5,-17,'#c2c8b2');box(16,.35,8,23,5.5,-17,'#718366');
  }
  function desk(x,z,w=3){box(w,.15,1.5,x,1.35,z,'#a39169');for(const xx of [-w/2+.15,w/2-.15])box(.18,1.3,1.25,x+xx,.65,z,'#5a6650');block(x,z,w+.1,1.6);box(.6,.035,.5,x+.5,1.45,z+.2,'#e7e5cc');box(.55,.035,.45,x+.53,1.49,z+.18,'#f5efdb');box(.4,.08,.3,x-.6,1.45,z,'#3b493b');}
  function buildOffice(){
    scene.background.set('#b7c5b1');scene.fog=new T.Fog('#b7c5b1',40,80);box(20,.4,17,0,-.3,0,'#8e9a7f');box(18,.18,14,0,-.06,0,'#d1c6a6');for(let x=-9;x<=9;x+=1.5)box(.025,.01,14,x,.04,0,'#b4aa8f',false);for(let z=-7;z<=7;z+=1.5)box(18,.01,.025,0,.04,z,'#b4aa8f',false);
    box(18,4.6,.25,0,2.25,-7,'#dfdfc7');box(.25,4.6,14,-9,2.25,0,'#d2d8bd');box(18,.95,.28,0,.45,-6.82,'#9cae91');box(.3,.95,14,-8.83,.45,0,'#9cae91');box(18,.13,.4,0,4.6,-7,'#f1ead2');box(.4,.13,14,-9,4.6,0,'#f1ead2');
    for(const x of [-5.4,5.4]){box(3,2.2,.12,x,2.9,-6.8,'#8caeab');box(3.2,.12,.25,x,4,-6.64,'#fbf1d7');box(.09,2.2,.16,x,2.9,-6.65,'#e5e8cd');box(3.2,.12,.3,x,1.8,-6.64,'#efead0');}
    label('務 實 ・ 負 責 ・ 合 作',0,3.9,-6.77,5.3,'#566343','#d9ddc3');
    desk(-2,-1.7,4.4);const chair=box(1,1,.25,-2,1.25,-3.3,'#3d5144');box(1.1,.16,1,-2,.75,-3,'#3d5144');
    npc('commander','林連長','連長',-2,-3,0,'#455c44');targets[targets.length-1].radius=3.2;
    for(const x of [3.5,5.8]){box(1.8,2.8,.9,x,1.4,-6.1,'#85967c');for(const y of [.9,1.8,2.65]){box(1.65,.04,.95,x,y,-6.04,'#66785f');box(.28,.09,.08,x,y-.3,-5.59,'#c1c4a4');}block(x,-6.1,1.8,1);}
    desk(5,1,3.4);npc('clerk','吳文書','行政承辦',5,-.4,0,'#5a6e50');targets[targets.length-1].radius=2.7;
    for(const x of [-4,-2,0]){box(.85,.13,.85,x,.6,2,'#7c875f');box(.85,.8,.13,x,1,2.35,'#74835e');for(const xx of [-.3,.3])box(.07,.6,.07,x+xx,.3,2,'#535f4a');block(x,2,1,1);}
    box(1.6,.85,.9,-7,.45,-5.8,'#9a8c69');cylinder(.35,.3,.65,-7,.75,-5.8,'#b3c0a2');const bottle=new T.Mesh(new T.SphereGeometry(.34,10,8),mat('#a4b9ad'));bottle.position.set(-7,1.3,-5.8);group.add(bottle);block(-7,-5.8,1.7,1.1);
    cylinder(.45,.32,.65,-7,.35,4,'#9a8d6b');for(let j=0;j<5;j++){const leaf=new T.Mesh(new T.ConeGeometry(.4,1.4,5),mat('#667e4e'));leaf.position.set(-7+Math.cos(j*1.26)*.25,1.1,4+Math.sin(j*1.26)*.25);leaf.rotation.z=Math.cos(j)*.3;group.add(leaf);}block(-7,4,1.2,1.2);
    label('連 辦 公 室',-8.8,3,1,3.5).rotation.y=Math.PI/2;
    box(3,.025,1.5,0,.055,5.8,'#7f8a68',false);targets.push({id:'yard-door',name:'返回集合場',role:'離開',x:0,z:5.6,y:1.2,radius:2});
    // Sparse, warm pools of indoor light.
    const lamp=new T.PointLight(0xffdda0,15,15,2);lamp.position.set(-2,5,0);group.add(lamp);
  }
  function clear(){while(group.children.length){const child=group.children[0];group.remove(child);child.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material?.map){o.material.map.dispose();o.material.dispose();}});}blocks=[];targets=[];npcs=[];}
  function buildInspection(i){if(!i)return;const p=i.phase;
    if(current==='yard'){
      if(p==='yardCheck')npc('inspector','周督導官','督導官',1,1,.2,'#374c52');
      if(i.conditions.yard){box(2.8,.025,1.8,-7,.065,5,'#c3c7b2',false);label('整理已完成',-7,1.1,4.8,2);}
      else{box(.8,.7,.7,-7,.35,5,'#a38c60');box(.7,.5,.6,-6.4,.25,5.3,'#b49e74');box(.9,.03,.6,-7.6,.1,5.4,'#e4d8b4');label('待整理區',-7,1.5,5,2);block(-7,5,2.4,1.3);}
      targets.push({id:'repair-yard',name:'整理查核點',role:'現場',x:-7,z:6.1,y:2,radius:2.2});
    }else if(current==='office'){
      if(!['prep','yardCheck'].includes(p))npc('inspector','周督導官','督導官',2,0,0,'#374c52');
      box(.7,.05,.5,5,1.48,1.3,i.conditions.log?'#789258':'#c5a064');label(i.conditions.log?'覆核已補齊':'覆核欄待補',5,2.2,1.3,2.3);
      targets.push({id:'repair-log',name:'紀錄覆核點',role:'查證',x:5,z:2.5,y:2.8,radius:1.9});
      box(1.2,1.3,.8,-6,.65,-.2,'#738574');label(i.conditions.safety?'已停用・已列管':'待修卻標可用',-6,2.1,.3,2.8,i.conditions.safety?'#e8edcf':'#fff0d2',i.conditions.safety?'#526b47':'#984b3c');block(-6,-.2,1.4,1);
      targets.push({id:'repair-safety',name:'設備列管點',role:'改善',x:-6,z:1,y:2.8,radius:2});
    }
  }
  function load(location,x,z,inspection=null,rangeDay=null){clear();current=location;scene.background.set(location==='yard'?'#cbd4c5':'#b7c5b1');if(location==='yard')buildYard();else if(location==='office')buildOffice();buildExtraScene({box,cylinder,block,label,npc,targets,group,mat},location);buildInspection(inspection);player.position.set(x,0,z);if(!canStand(x,z)){const safe=safePosition();player.position.set(safe.x,0,safe.z);}follow.copy(player.position);return {x:player.position.x,z:player.position.z};}
  function canStand(x,z){const large=['barracks','dining'].includes(current);const bound=current==='hide-yard'?{xmin:-9.5,xmax:9.5,zmin:-7.5,zmax:7.5}:current==='yard'?{xmin:-12.5,xmax:12.5,zmin:-6.9,zmax:11}:current==='corridor'?{xmin:-18,xmax:18,zmin:-5,zmax:5}:current==='range'?{xmin:-17,xmax:17,zmin:-8,zmax:9}:large?{xmin:-14.4,xmax:14.4,zmin:-10.4,zmax:10.4}:{xmin:-8,xmax:8,zmin:-6.1,zmax:6};if(x<bound.xmin||x>bound.xmax||z<bound.zmin||z>bound.zmax)return false;return !blocks.some(b=>Math.abs(x-b.x)<b.w/2+.38&&Math.abs(z-b.z)<b.d/2+.38)&&!npcs.some(n=>Math.hypot(x-n.position.x,z-n.position.z)<.65);}
  function safePosition(){const first=current==='dining'?{x:3,z:9}:current==='hide-yard'?{x:-5,z:3.5}:{x:0,z:current==='yard'?5:4.5};if(canStand(first.x,first.z))return first;for(let z=5;z>=-5;z-=1)for(let x=-7;x<=7;x+=1)if(canStand(x,z))return {x,z};return first;}
  function move(dx,dz,dt){const v=new T.Vector2(dx,dz);if(v.length()>1)v.normalize();const speed=4.4;const sx=(v.x+v.y)*Math.SQRT1_2*speed*dt,sz=(v.y-v.x)*Math.SQRT1_2*speed*dt;let moved=false;let x=player.position.x,z=player.position.z;if(canStand(x+sx,z)){x+=sx;moved=Math.abs(sx)>.00001;}if(canStand(x,z+sz)){z+=sz;moved=moved||Math.abs(sz)>.00001;}player.position.set(x,0,z);if(moved){player.rotation.y=Math.atan2(sx,sz);const t=performance.now()*.012;player.userData.legs[0].rotation.x=Math.sin(t)*.45;player.userData.legs[1].rotation.x=-Math.sin(t)*.45;player.position.y=Math.abs(Math.sin(t))*.035;}else{player.userData.legs.forEach(l=>l.rotation.x=0);player.position.y=0;}return moved;}
  let follow=new T.Vector3(),offset=new T.Vector3(15,20,20),aspect=1;
  function resize(){const w=container.clientWidth,h=container.clientHeight;aspect=w/h;const height=w<700?25:23;camera.left=-height*aspect/2;camera.right=height*aspect/2;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();renderer.setSize(w,h);}
  function render(dt){follow.lerp(player.position,1-Math.exp(-dt*5));camera.position.copy(follow).add(offset);camera.lookAt(follow.x,1.3,follow.z);renderer.render(scene,camera);}
  function project(x,y,z){const v=new T.Vector3(x,y,z).project(camera);return {x:(v.x*.5+.5)*container.clientWidth,y:(-.5*v.y+.5)*container.clientHeight,visible:v.z>-1&&v.z<1&&Math.abs(v.x)<1.1&&Math.abs(v.y)<1.1};}
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();onFailure();});
  resize();window.addEventListener('resize',resize);
  return {load,move,render,project,player,hunter(h){const t=targets.find(t=>t.id==='veteran');if(t){t.mesh.position.set(h.x,0,h.z);t.mesh.rotation.y=Math.atan2(h.dx,h.dz);t.x=h.x;t.z=h.z;}},get targets(){return targets;},setQuality(low){renderer.setPixelRatio(Math.min(devicePixelRatio,low?1:1.7));renderer.shadowMap.enabled=!low;resize();},nearest(){return targets.map(t=>({...t,distance:Math.hypot(t.x-player.position.x,t.z-player.position.z)})).filter(t=>t.distance<t.radius).sort((a,b)=>a.distance-b.distance)[0]??null;},safe(){const safe=safePosition();player.position.set(safe.x,0,safe.z);},dispose(){renderer.dispose();window.removeEventListener('resize',resize);}};
}
