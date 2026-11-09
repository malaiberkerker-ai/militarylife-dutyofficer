import {test} from 'node:test';import assert from 'node:assert/strict';import {findWalkPath} from '../src/navigation.js';
const sample=(path,start,walkable)=>{let a=start;for(const b of path){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.1));for(let i=1;i<=n;i++)assert.equal(walkable(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n),true);a=b;}};
test('滑鼠路徑可繞牆，途中不穿過障礙',()=>{const walkable=(x,z)=>Math.abs(x)<=6&&Math.abs(z)<=4&&!(x>1&&x<3&&Math.abs(z)<1.5),start={x:0,z:0},goal={x:5,z:0},path=findWalkPath(start,goal,walkable);assert.ok(path&&path.length>1);sample(path,start,walkable);assert.deepEqual(path.at(-1),goal);});
test('路徑拒絕無法抵達、非有限目標與封閉角落，不無限搜尋',()=>{const walkable=(x,z)=>Math.abs(x)<4&&Math.abs(z)<4&&Math.abs(x-1)>.3;assert.equal(findWalkPath({x:0,z:0},{x:3,z:0},walkable),null);assert.equal(findWalkPath({x:0,z:0},{x:NaN,z:0},()=>true),null);assert.equal(findWalkPath({x:0,z:0},{x:5,z:0},walkable),null);});
test('空地可直達並精準停在目標，不改動輸入',()=>{const start={x:.13,z:.1},goal={x:3.2,z:1.3};assert.deepEqual(findWalkPath(start,goal,()=>true),[goal]);assert.deepEqual(start,{x:.13,z:.1});});

