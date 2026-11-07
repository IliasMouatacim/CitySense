import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Pool} from 'pg';
import {randomUUID} from 'node:crypto';
import request from 'supertest';
import {createApp} from '../src/app';
import {createPool,migrate} from '../src/database';
test('PostGIS migrations, persisted search, spatial filters, validation and OpenAPI',async()=>{
 const admin=createPool();const schema='test_'+randomUUID().replaceAll('-','');
 await admin.query(`CREATE SCHEMA ${schema}`);
 const pool=createPool({options:`-c search_path=${schema},public`});
 const app=await createApp(pool);
 try {
  await migrate(pool);await migrate(pool);await app.init();
  const agent=request(app.getHttpServer());
  const health=await agent.get('/health').expect(200);assert.equal(health.body.database,'connected');
  const places=await agent.get('/search?q=gare').expect(200);assert.equal(places.body.places[0].id,'gare');
  assert.deepEqual(places.body.places[0].coordinates,[6.8011,47.5105]);
  const near=await agent.get('/places?lon=6.8011&lat=47.5105&radius=20').expect(200);
  assert.deepEqual(near.body.places.map((p:{id:string})=>p.id),['gare']);assert.equal(near.body.places[0].distanceMeters,0);
  const nature=await agent.get('/places?category=Nature').expect(200);assert.equal(nature.body.places[0].id,'pres-la-rose');assert.equal(nature.body.places.length,1);
  for(const path of ['/search?q=x','/search?q=gare&source=invalid','/places?lon=47.51&lat=6.80','/places?lat=47.51','/places?radius=100','/places?lon=6.8&lat=47.51&radius=NaN','/places?lon=6.8&lat=47.51&radius=10001','/places?category=invalid'])await agent.get(path).expect(400);
  assert.equal((await agent.get('/search?q=unfindable').expect(200)).body.places.length,0);
  assert.equal((await agent.get('/search?q=%25').expect(400)).status,400);
  // SQL wildcard characters are literal text, not an unrestricted match.
  assert.equal((await agent.get('/search?q=%25%25').expect(200)).body.places.length,0);
  await pool.query("UPDATE places SET name='Gare persistante' WHERE id='gare'");
  await migrate(pool);
  assert.equal((await agent.get('/search?q=persistante').expect(200)).body.places[0].id,'gare');
  const independent=createPool({options:`-c search_path=${schema},public`});
  try {assert.equal((await independent.query("SELECT name FROM places WHERE id='gare'")).rows[0].name,'Gare persistante');}finally{await independent.end();}
  const doc=await agent.get('/docs-json').expect(200);assert.ok(doc.body.paths['/search']);
 }finally{await app.close();await admin.query(`DROP SCHEMA ${schema} CASCADE`);await admin.end();}
});
test('database outage produces 503 instead of an empty successful response',async()=>{
 const pool=new Pool({host:'127.0.0.1',port:1,connectionTimeoutMillis:500});const app=await createApp(pool);await app.init();
 try{await request(app.getHttpServer()).get('/health').expect(503);await request(app.getHttpServer()).get('/places').expect(503);}finally{await app.close();}
});
