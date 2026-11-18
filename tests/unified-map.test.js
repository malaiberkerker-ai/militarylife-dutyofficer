import {test} from 'node:test';import assert from 'node:assert/strict';
import {rooms} from '../src/camp.js';import {campusLayout,toCampus,toLocal,campusRegion,onCampusFloor,campusWaypoints,entryPoint} from '../src/unified-map.js';
import {findWalkPath} from '../src/navigation.js';import {initialState,decide,restoreState} from '../src/engine.js';
test('每間房都有唯一地圖位置，舊房間相對座標可往返且存檔不變',()=>{for(const room of rooms){assert.ok(campusLayout[room.id],room.id);const local=entryPoint(room.id),global=toCampus(room.id,local);assert.deepEqual(toLocal(room.id,global),local);if(room.id!=='corridor')assert.equal(campusRegion(global.x,global.z),room.id);assert.equal(restoreState(JSON.stringify({...initialState(),location:room.id,...local})).location,room.id);}});
test('全營區非插曲房間兩兩可經走廊抵達，路徑不跨越草地或牆邊',()=>{const list=rooms.filter(r=>!['corridor','hide-yard'].includes(r.id));for(const a of list)for(const b of list){let start=toCampus(a.id,entryPoint(a.id));const goal=toCampus(b.id,entryPoint(b.id));for(const end of campusWaypoints(start,goal)){const path=findWalkPath(start,end,onCampusFloor,12000);assert.ok(path,a.id+' → '+b.id);for(const p of path)assert.equal(onCampusFloor(p.x,p.z),true);start=end;}}});
test('連長只能在連長室接受早點名回報；業務辦公室不能替代',()=>{let s=decide(initialState(),'cooperate');s=decide(s,'verify');s.location='office';assert.equal(decide(s,'honest'),s);s.location='commander-room';assert.equal(decide(s,'honest').stage,3);});
test('躲避區維持本地掩體邊界，正常走動不能闖入躲避場',()=>{const p=toCampus('hide-yard',{x:-5,z:3.5});assert.equal(onCampusFloor(p.x,p.z),false);assert.equal(onCampusFloor(p.x,p.z,true),true);assert.equal(onCampusFloor(0,0,true),false);});

test('外側連通走道中途可重新規劃，維持合法地板路徑',()=>{for(const start of [{x:124,z:20},{x:124,z:52},{x:0,z:5}])for(const id of ['office','yard','barracks']){let p=start;for(const end of campusWaypoints(start,toCampus(id,entryPoint(id)))){assert.ok(findWalkPath(p,end,onCampusFloor,12000));p=end;}}});

