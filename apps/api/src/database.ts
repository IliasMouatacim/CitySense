import {Pool,PoolConfig} from 'pg';
import {config} from 'dotenv';
import {resolve} from 'node:path';
config({path:resolve(__dirname,'../../../.env'),quiet:true});
export function createPool(overrides:PoolConfig={}){return new Pool({connectionString:process.env.DATABASE_URL,host:process.env.PGHOST||'127.0.0.1',port:Number(process.env.PGPORT||5432),database:process.env.PGDATABASE||'citysense',user:process.env.PGUSER||'citysense',password:process.env.POSTGRES_PASSWORD,connectionTimeoutMillis:3000,query_timeout:5000,max:5,...overrides});}
// Explicit migration command; never run migrations during request handling.
export async function migrate(pool:Pool){
 const client=await pool.connect();
 try {
  await client.query('BEGIN');
  const current=await client.query('SELECT current_schema() AS name');
  const schema='"'+String(current.rows[0].name).replaceAll('"','""')+'"';
  await client.query("SELECT pg_advisory_xact_lock(25388, 1)");
  await client.query(`CREATE TABLE IF NOT EXISTS ${schema}.schema_migrations(version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
  const applied=await client.query(`SELECT version FROM ${schema}.schema_migrations WHERE version=1`);
  if(!applied.rowCount){
   await client.query(`CREATE TABLE places (
    id text PRIMARY KEY, name text NOT NULL, category text NOT NULL,
    location geography(Point,4326) NOT NULL,
    source text NOT NULL DEFAULT 'pilot-directory',
    accessibility text NOT NULL DEFAULT 'unknown' CHECK(accessibility IN ('unknown','verified-accessible','verified-barrier')),
    updated_at timestamptz NOT NULL DEFAULT now()
   ); CREATE INDEX places_location_idx ON places USING gist(location);`);
   const seeds=[['gare','Gare de Montbéliard','Transport',6.8011,47.5105],['chateau','Château des ducs de Wurtemberg','Patrimoine',6.8006,47.5092],['pres-la-rose','Parc du Près-la-Rose','Nature',6.8049,47.5057],['saint-martin','Temple Saint-Martin','Patrimoine',6.7976,47.5104]];
   for(const [id,name,category,lon,lat] of seeds)await client.query('INSERT INTO places(id,name,category,location) VALUES($1,$2,$3,ST_SetSRID(ST_MakePoint($4,$5),4326)::geography)',[id,name,category,lon,lat]);
   await client.query('INSERT INTO schema_migrations(version) VALUES(1)');
  }
  await client.query('COMMIT');
 }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
}
export type PlaceFilter={q?:string;category?:string;lon?:number;lat?:number;radius?:number};
export class PlacesStore {
 constructor(readonly pool:Pool){}
 async ready(){await this.pool.query('SELECT id FROM places LIMIT 1');}
 async find(filter:PlaceFilter={}){
  const {q='',category=null,lon=null,lat=null,radius=1000}=filter;
  const result=await this.pool.query(`SELECT id,name,category,source,accessibility,
   json_build_array(ST_X(location::geometry),ST_Y(location::geometry)) AS coordinates,
   CASE WHEN $3::double precision IS NOT NULL THEN round(ST_Distance(location,ST_SetSRID(ST_MakePoint($3,$4),4326)::geography)) END AS "distanceMeters"
   FROM places WHERE strpos(lower(name),lower($1))>0 AND ($2::text IS NULL OR category=$2)
   AND ($3::double precision IS NULL OR ST_DWithin(location,ST_SetSRID(ST_MakePoint($3,$4),4326)::geography,$5))
   ORDER BY "distanceMeters" NULLS LAST, name LIMIT 50`,[q,category,lon,lat,radius]);
  return result.rows;
 }
 async onApplicationShutdown(){await this.pool.end();}
}
