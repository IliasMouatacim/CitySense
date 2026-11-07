import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {calculateOrsRoute} from '../src/ors';
test('free hosted routing adapter preserves geometry, totals and French instructions',async()=>{
 const server=createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;const payload=JSON.parse(body);assert.equal(req.url,'/v2/directions/foot-walking/geojson');assert.equal(payload.language,'fr');assert.deepEqual(payload.coordinates[0],[6.8011,47.5105]);res.setHeader('Content-Type','application/json');res.end(JSON.stringify({features:[{geometry:{type:'LineString',coordinates:[[6.8011,47.5105],[6.8049,47.5057]]},properties:{summary:{distance:820.1,duration:620.2},segments:[{steps:[{instruction:'Continuez vers le parc.',distance:820.1,duration:620.2}]}]}}]}));});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
 try{const address=server.address() as {port:number};const route=await calculateOrsRoute('6.8011,47.5105','6.8049,47.5057','pedestrian',{endpoint:`http://127.0.0.1:${address.port}`,key:'test-only-placeholder'});assert.equal(route.distanceMeters,820);assert.equal(route.durationSeconds,620);assert.equal(route.instructions[0].text,'Continuez vers le parc.');assert.equal(route.geometry.coordinates.length,2);assert.equal(route.accessibility,'unknown');assert.match(route.attribution,/HeiGIT/);}finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
});
test('missing free routing key and exhausted quota produce service errors',async()=>{
 await assert.rejects(calculateOrsRoute('6.8011,47.5105','6.8049,47.5057','pedestrian',{endpoint:'http://127.0.0.1:1',key:undefined}),e=>(e as {status:number}).status===503);
 const server=createServer((req,res)=>{res.writeHead(429);res.end('{}');});await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
 try{const address=server.address() as {port:number};await assert.rejects(calculateOrsRoute('6.8011,47.5105','6.8049,47.5057','bicycle',{endpoint:`http://127.0.0.1:${address.port}`,key:'test-only-placeholder'}),e=>(e as {status:number}).status===503);}finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
});
