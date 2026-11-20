import test from 'node:test';
import assert from 'node:assert/strict';
import {directorTrail} from '../../apps/web/lib/director-trail';
import {offset,distance,type Position} from '../../apps/web/lib/walk-geometry';

test('the director follows the walked route around a corner and waits when the player stops',()=>{
 const start:Position=[6.804,47.495],corner=offset(start,0,4);
 const follow=directorTrail(offset(start,-2,0),start);
 follow(corner);
 const player=offset(corner,1,0),companion=follow(player);
 assert.ok(distance(companion,offset(corner,0,-1))<.001);
 assert.deepEqual(follow(player),companion);
 assert.ok(distance(follow(offset(corner,4,0)),offset(corner,2,0))<.001);
});
