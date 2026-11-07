import 'reflect-metadata';
import {fetch as proxyFetch,EnvHttpProxyAgent} from 'undici';
import {calculateRoute} from './routing';
import {calculateOrsRoute} from './ors';
const proxyDispatcher=new EnvHttpProxyAgent();
import { Controller, Get, Module, Query, Inject, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import {Pool} from 'pg';
import {createPool, PlacesStore, PlaceFilter} from './database';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
@Controller()
class AppController {
 constructor(@Inject(PlacesStore) private readonly store:PlacesStore){}
 private async directoryResult(filter:PlaceFilter={}){
  try {return {places:await this.store.find(filter),source:'PostGIS pilot directory; coordinates approximate',accessibility:'unknown'};}
  catch {throw new ServiceUnavailableException('Place directory unavailable. Please try again later.');}
 }
 @Get('health') async health() {
  try {await this.store.ready();return {status:'ok',city:'Montbéliard',routing:'check-route-endpoint',database:'connected'};}
  catch {throw new ServiceUnavailableException('Database is unavailable or migrations are missing');}
 }
 @Get('places') async directory(@Query('lon') lon?:string,@Query('lat') lat?:string,@Query('radius') radius?:string,@Query('category') category?:string){
  if(category&&!['Nature','Transport','Patrimoine'].includes(category))throw new BadRequestException('Unknown category');
  const filter:PlaceFilter={category};
  if(lon!==undefined||lat!==undefined||radius!==undefined){
   const x=Number(lon),y=Number(lat),r=radius===undefined?1000:Number(radius);
   if(!lon?.trim()||!lat?.trim()||![x,y,r].every(Number.isFinite)||x<6.6||x>7||y<47.3||y>47.7||r<1||r>10000)throw new BadRequestException('Provide lon/lat in the Montbéliard pilot region and radius 1–10000 meters');
   Object.assign(filter,{lon:x,lat:y,radius:r});
  }
  return this.directoryResult(filter);
 }
 @Get('routes') route(@Query('from') from?:string,@Query('to') to?:string,@Query('mode') mode='pedestrian'){return process.env.ROUTING_PROVIDER==='ors'?calculateOrsRoute(from,to,mode):calculateRoute(from,to,mode);}
 @Get('search') async search(@Query('q') raw?: string, @Query('source') source?: string) {
  if (typeof raw !== 'string' || raw.trim().length < 2 || raw.length > 120) throw new BadRequestException('q must contain 2–120 characters');
  if (source && !['local','address'].includes(source)) throw new BadRequestException('source must be local or address');
  const q=raw.trim();
  if (source !== 'address') return this.directoryResult({q});
  try {
   const url=new URL('https://data.geopf.fr/geocodage/search');
   url.search=new URLSearchParams({q,limit:'6',lat:'47.51',lon:'6.80',citycode:'25388'}).toString();
   const response=await proxyFetch(url,{dispatcher:proxyDispatcher,signal:AbortSignal.timeout(6000)});
   if(!response.ok) throw new Error('Geocoding service unavailable');
   const data=await response.json() as {features?: {properties:{id?:string,label:string};geometry:{coordinates:number[]}}[]};
   return {places:(data.features||[]).map((f,i)=>({id:f.properties.id||String(i),name:f.properties.label,category:'Adresse',coordinates:f.geometry.coordinates})),source:'IGN Géoplateforme'};
  } catch { throw new ServiceUnavailableException('Address search unavailable. The pilot directory remains available.'); }
 }
}
export async function createApp(pool:Pool=createPool()) {
 @Module({controllers:[AppController],providers:[{provide:PlacesStore,useValue:new PlacesStore(pool)}]})
 class AppModule {}
 const app=await NestFactory.create(AppModule,{logger:false});
 app.enableShutdownHooks();
 const doc=SwaggerModule.createDocument(app,new DocumentBuilder().setTitle('CitySense API').setVersion('0.1.0').build());
 SwaggerModule.setup('docs',app,doc);
 return app;
}
