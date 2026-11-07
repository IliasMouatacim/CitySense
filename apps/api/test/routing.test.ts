import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {calculateRoute,coordinate,decodeShape} from '../src/routing';
function encode(points:number[][]){let a=0,b=0,s='';for(const [lon,lat]of points){for(const n of [Math.round(lat*1e6)-a,Math.round(lon*1e6)-b]){let v=n<0?~(n<<1):n<<1;while(v>=32){s+=String.fromCharCode((32|(v&31))+63);v>>>=5;}s+=String.fromCharCode(v+63);}a=Math.round(lat*1e6);b=Math.round(lon*1e6);}return s;}
test('Valhalla adapter protocol, polyline6 geometry, totals and instructions (controlled engine)',async()=>{
 const points=[[6.8011,47.5105],[6.802,47.5101],[6.8049,47.5057]];
 assert.deepEqual(decodeShape(encode(points)),points);
 const server=createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;const payload=JSON.parse(body);assert.equal(payload.costing,'pedestrian');assert.equal(payload.locations[0].lon,6.8011);res.setHeader('Content-Type','application/json');res.end(JSON.stringify({trip:{status:0,summary:{length:0.82,time:620},legs:[{shape:encode(points),maneuvers:[{instruction:'Continuez tout droit.',length:0.82,time:620}]}]}}));});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
 try{const addr=server.address() as {port:number};const result=await calculateRoute('6.8011,47.5105','6.8049,47.5057','pedestrian',`http://127.0.0.1:${addr.port}`);assert.equal(result.distanceMeters,820);assert.equal(result.durationSeconds,620);assert.deepEqual(result.geometry.coordinates,points);assert.equal(result.accessibility,'unknown');assert.equal(result.instructions[0].text,'Continuez tout droit.');}
 finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
});
test('routing rejects bad input, malformed shapes and missing engines',async()=>{
 for(const raw of ['47.51,6.8','NaN,47.51','6.8,','6.8,47.51,1',undefined])assert.throws(()=>coordinate(raw));
 assert.throws(()=>decodeShape('_'));
 await assert.rejects(calculateRoute('6.8,47.51','6.81,47.52','car'),e=>(e as {status:number}).status===400);
 await assert.rejects(calculateRoute('6.8,47.51','6.81,47.52','bicycle','http://127.0.0.1:1'),e=>(e as {status:number}).status===503);
});
