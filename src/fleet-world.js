import * as T from 'three';
import {vehicles,vehiclePoint} from './fleet.js';
export function buildVehicle(v,mat){const model=new T.Group(),w=v.kind==='tank'?2.8:2.1,d=v.kind==='tank'?4.6:v.kind==='truck'?4.4:3;
 const box=(a,b,c,x,y,z,color)=>{const m=new T.Mesh(new T.BoxGeometry(a,b,c),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;model.add(m);return m;};
 box(w,.8,d,0,.85,0,'#536647');if(v.kind==='tank'){for(const x of [-1.45,1.45]){box(.55,.8,4.9,x,.6,0,'#343e31');for(let z=-1.8;z<=1.8;z+=.6)box(.59,.45,.45,x,.6,z,'#68745b');}box(2,.7,2.3,0,1.55,-.2,'#647653');box(.22,.22,3.5,0,1.65,2.3,'#48593c');}
 else{for(const x of [-1.1,1.1])for(const z of [-(d/2-.65),d/2-.65]){const wheel=new T.Mesh(new T.CylinderGeometry(.48,.48,.3,12),mat('#303a31'));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.48,z);model.add(wheel);}box(1.9,1.1,1.4,0,1.65,d/2-.8,'#738467');box(1.6,.5,.04,0,1.85,d/2-.06,'#82a49b');if(v.kind==='truck'){box(2,1.2,2.7,0,1.8,-.9,'#79846a');box(2.15,.15,2.8,0,2.45,-.9,'#616e51');}else box(1.9,.15,1.5,0,2.3,.2,'#647359');}
 box(.6,.14,.04,0,.65,d/2+.03,'#ded7af');model.userData.vehicleId=v.id;return model;}
export function createFleetModels(parent,mat){const models=new Map();for(const v of vehicles){const m=buildVehicle(v,mat);parent.add(m);models.set(v.id,m);}return models;}
export function syncFleetModels(models,fleet,targets){for(const r of fleet.records){const m=models.get(r.id),p=vehiclePoint(r);m.position.set(p.x,0,p.z);m.rotation.y=r.yaw;const t=targets.find(t=>t.id==='vehicle:'+r.id);if(t){Object.assign(t,{x:p.x,z:p.z,location:r.location,mesh:m});}}}

