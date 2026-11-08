import * as T from 'three';
import {rooms,roomById,shooters} from './camp.js';
import {hideCovers} from './phone-event.js';

export function buildFormation({group,mat},positions){const parts=[[[.75,.8,.42],[0,1.25,0],'#536a47'],[[.5,.48,.45],[0,1.95,0],'#d0ab83'],[[.56,.16,.52],[0,2.25,0],'#394f37'],[[.22,.72,.3],[-.23,.48,0],'#3d503e'],[[.22,.72,.3],[.23,.48,0],'#3d503e'],[[.2,.65,.32],[-.5,1.25,0],'#536a47'],[[.2,.65,.32],[.5,1.25,0],'#536a47']];const matrix=new T.Matrix4();for(const [size,offset,color]of parts){const mesh=new T.InstancedMesh(new T.BoxGeometry(...size),mat(color),positions.length);positions.forEach((p,i)=>{matrix.makeTranslation(p.x+offset[0],offset[1],p.z+offset[2]);mesh.setMatrixAt(i,matrix);});mesh.castShadow=true;mesh.receiveShadow=true;mesh.instanceMatrix.needsUpdate=true;group.add(mesh);}}
export function buildExtraScene(api,id){const {box,cylinder,block,label,npc,targets}=api,r=roomById(id);
  if(id==='hide-yard'){box(24,.3,20,0,-.2,0,'#9aab83');box(20,.08,16,0,-.02,0,'#bdc4a6');for(const c of hideCovers){box(c.w,2.2,c.d,c.x,1.1,c.z,'#718461');box(c.w+.1,.15,c.d+.1,c.x,2.25,c.z,'#a1ad83');block(c.x,c.z,c.w,c.d);}for(const x of [-10,10])box(.15,1.2,16,x,.6,0,'#6d8063');for(const z of [-8,8])box(20,1.2,.15,0,.6,z,'#6d8063');const veteran=npc('veteran','老班長','正在找你',-8,-5,Math.PI/2,'#835e40');const shape=new T.Shape();shape.moveTo(0,0);for(let n=0;n<=30;n++){const a=-Math.PI/3+n*Math.PI/45;shape.lineTo(Math.sin(a)*6.5,Math.cos(a)*6.5);}shape.lineTo(0,0);const cone=new T.Mesh(new T.ShapeGeometry(shape),new T.MeshBasicMaterial({color:0xc95943,transparent:true,opacity:.18,side:T.DoubleSide,depthWrite:false}));cone.rotation.x=Math.PI/2;cone.position.y=.04;veteran.add(cone);return;}
  if(id==='yard'){label('連隊 100 員',-4,3,-7.4,3.2);targets.push({id:'go:corridor',name:'營舍走廊',role:'前往',x:-10,z:0,y:2,radius:2});label('營舍走廊 →',-11,2.5,0,3).rotation.y=Math.PI/2;targets.push({id:'go:range',name:'前往靶場',role:'前往',x:10,z:-4,y:2,radius:2});label('訓練靶場 →',10,2.5,-4,2.8);return;}
  if(id==='office'){targets.push({id:'go:corridor',name:'營舍走廊',role:'前往',x:7,z:5.3,y:1.5,radius:1.8});return;}
  if(id==='corridor'){
    box(38,.2,13,0,-.1,0,'#c6c7b0');box(38,4.6,.25,0,2.3,-6,'#dde0c9');box(38,.9,.25,0,.45,6,'#a7b79a');for(let x=-18;x<=18;x+=3)box(.05,.015,12,x,.02,0,'#a4ae96',false);
    rooms.filter(r=>!['yard','office','corridor','range','hide-yard'].includes(r.id)).forEach((room,index)=>{const x=-16+(index%7)*5.2,z=index<7?-5.75:5.75;box(2.4,3.3,.2,x,1.65,z,'#5e7661');label(room.name,x,3.9,z+(z<0?.2:-.2),3.5);targets.push({id:`go:${room.id}`,name:room.name,role:'進入',x,z:z<0?-4.2:4.2,y:3,radius:1.9});});targets.push({id:'go:yard',name:'返回集合場',role:'前往',x:18,z:0,y:2,radius:2});label('← 集合場',16,3,-5.5,3);return;
  }
  if(id==='range'){
    box(50,.25,42,0,-.2,-6,'#adb493');box(35,.12,18,0,-.02,2,'#c6b999');box(36,2,1,0,1,-17,'#918b66');for(let n=0;n<6;n++){const x=-12+n*4.8;box(.13,2.5,.13,x,1.25,-12,'#7d795b');const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='#e8e3c9';ctx.fillRect(0,0,256,256);for(let k=5;k>=1;k--){ctx.beginPath();ctx.arc(128,128,k*21,0,Math.PI*2);ctx.fillStyle=k<3?'#333b30':'#e8e3c9';ctx.fill();ctx.strokeStyle='#5b634a';ctx.stroke();}const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const mesh=new T.Mesh(new T.PlaneGeometry(2.2,2.2),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));mesh.position.set(x,2.1,-11.9);api.group.add(mesh);box(2,.75,.65,x,.38,-1,'#87916f');}
    npc('range-officer','周管制官','靶場管制',-6,4,.2,'#637d7b');label('課程報到・依管制進行',0,3,-2,7);targets.push({id:'target-game',name:'打靶操作台',role:'操作',x:0,z:1,y:2.5,radius:2.7});targets.push({id:'go:yard',name:'返營集合場',role:'返回',x:0,z:8,y:1.5,radius:2});return;
  }
  const large=['barracks','dining'].includes(id),w=large?30:18,d=large?22:14;
  box(w+.5,.3,d+.5,0,-.2,0,'#8b9b7d');box(w,.15,d,0,-.03,0,'#d4cbb0');box(w,4.5,.2,0,2.2,-d/2,'#dce0c8');box(.2,4.5,d,-w/2,2.2,0,'#ccd6bb');box(w,.85,.25,0,.4,-d/2+.1,'#9eb08e');for(let x=-w/2;x<w/2;x+=2)box(.02,.01,d,x,.06,0,'#b7b39b',false);label(r.name,0,3.6,-d/2+.15,5.6);
  function desk(x,z){box(3,1.25,1.4,x,.625,z,'#a4946f');box(.7,.04,.5,x+.5,1.29,z+.2,'#eee9d4');box(.9,.12,.8,x,.65,z-1.3,'#617453');box(.9,.9,.1,x,1.1,z-1.6,'#617453');block(x,z,3.2,1.5);}
  function bunk(x,z,double=true){box(1.25,.2,2.5,x,.5,z,'#596c52');box(1.15,.15,2.3,x,.67,z,'#bdc9ac');box(.9,.15,.4,x,.84,z-.8,'#ebe7cd');if(double){box(1.25,.18,2.5,x,2.1,z,'#596c52');box(1.15,.15,2.3,x,2.28,z,'#bdc9ac');box(.9,.15,.4,x,2.44,z-.8,'#ebe7cd');}for(const xx of [-.55,.55])for(const zz of [-1.1,1.1])box(.08,double?2.6:.65,.08,x+xx,double?1.3:.33,z+zz,'#68775b');block(x,z,1.4,2.7);}
  switch(r.type){
    case 'executive':case 'counsel':case 'officers':desk(-2,-2);for(let n=0;n<(r.type==='officers'?4:2);n++){box(1.3,2.5,.65,3+n*1.4,1.25,-5.7,'#89997c');}box(3,.6,1.1,-2,.3,2,'#89977b');break;
    case 'nco':for(let row=0;row<2;row++)for(let n=0;n<3;n++)bunk(-6+n*4,-3+row*5,true);label('12 位班長床位',0,2.9,-5.9,5);break;
    case 'barracks':for(let row=0;row<4;row++)for(let n=0;n<10;n++)bunk(-13.5+n*3,-8.5+row*5,true);label('四排・80 位士兵床位',0,3.6,-10.8,7);break;
    case 'washroom':for(let n=0;n<5;n++){const x=-6+n*3;box(2.4,2,.15,x,1,-3,'#abbda1');block(x,-4.6,2.4,1.2);block(x,2,1.5,.8);box(2.4,.65,1.2,x,.35,-4.6,'#e5e7d4');cylinder(.28,.32,.45,x,.7,-4.3,'#f0eedf');box(1.5,.9,.8,x,.45,2,'#e6e7d4');cylinder(.3,.35,.1,x,.95,2,'#95afa2');}break;
    case 'common':box(5,2,.2,0,2,-5.9,'#52655b');for(let n=0;n<3;n++){box(4,.7,1.2,-4+n*4,.45,1,'#84916e');block(-4+n*4,1,4,1.3);}label('課表與連隊公告',0,3.4,-5.7,5);break;
    case 'armory':for(let n=0;n<8;n++){box(1.6,2.8,.7,-7+n*2,1.4,-5.6,'#667c67');label(`R${String(n*10+1).padStart(3,'0')}–${String((n+1)*10).padStart(3,'0')}`,-7+n*2,2.1,-5.2,1.7);}desk(-2,-1.5);label('領用與返營點收',0,3.7,-4.8,6);break;
    case 'store':for(let n=0;n<6;n++){const x=-6+(n%3)*5,z=-4+Math.floor(n/3)*5;box(2.8,1.5,1.6,x,.75,z,'#7b8f73');box(2.9,.1,1.7,x,1.55,z,'#aab89a');block(x,z,3,1.8);}break;
    case 'utility':for(let n=0;n<4;n++){box(2,2.7,.9,-6+n*4,1.35,-5.3,'#a29973');for(let j=0;j<3;j++)box(1.5,.5,.7,-6+n*4,.4+j*.8,-4.8,'#b6a27a');}break;
    case 'kitchen':box(13,1.1,1.8,0,.55,-4.7,'#b1bcab');block(0,-4.7,13,1.8);for(let n=0;n<5;n++){cylinder(.55,.5,.45,-5+n*2.5,1.4,-4.7,'#7e9085');cylinder(.6,.6,.08,-5+n*2.5,1.66,-4.7,'#a8b6a8');}desk(-3,1);break;
    case 'dining':for(let row=0;row<5;row++)for(let col=0;col<5;col++){const x=-12+col*6,z=-8+row*4;box(3,.14,1.4,x,1.05,z,'#a69b76');box(.4,1,1,x,.5,z,'#6e805e');for(const sign of [-1,1]){box(3,.14,.5,x,.55,z+sign*1.2,'#7d8e68');block(x,z,3.2,1.7);}}label('25 桌 × 4 人 = 100 席',0,3.7,-10.8,8);break;
    case 'duty':desk(0,-2);box(2,2.6,.3,5,1.3,-5.8,'#6e8163');label('外出・返營登記',0,3.5,-5.8,5);break;
  }
  if(r.npc)npc(r.npc,r.person,r.role,r.type==='barracks'?-1:r.type==='nco'?0:-2,r.type==='barracks'?8:r.type==='nco'?4:-3.2,0,r.type==='counsel'?'#687d66':'#52694c');
  targets.push({id:`info:${id}`,name:r.name+'紀錄',role:'查看',x:3,z:3,y:2,radius:2});label('區域紀錄',3,1.8,3,2.5);targets.push({id:'go:corridor',name:'返回營舍走廊',role:'返回',x:0,z:d/2-1,y:1.4,radius:2});
}
