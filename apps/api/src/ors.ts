import {BadRequestException,ServiceUnavailableException,UnprocessableEntityException} from '@nestjs/common';
import {fetch,EnvHttpProxyAgent} from 'undici';
import {coordinate} from './routing';
const dispatcher=new EnvHttpProxyAgent();
export async function calculateOrsRoute(from:unknown,to:unknown,mode:unknown,options={endpoint:'https://api.openrouteservice.org',key:process.env.ORS_API_KEY}) {
 const origin=coordinate(from),destination=coordinate(to);
 const profile=mode==='pedestrian'?'foot-walking':mode==='bicycle'?'cycling-regular':null;
 if(!profile)throw new BadRequestException('mode must be pedestrian or bicycle');
 if(origin[0]===destination[0]&&origin[1]===destination[1])throw new BadRequestException('Choose two different locations');
 if(!options.key)throw new ServiceUnavailableException('Configure a free OpenRouteService API key to enable routing');
 try {
  const response=await fetch(`${options.endpoint}/v2/directions/${profile}/geojson`,{method:'POST',dispatcher,headers:{Authorization:options.key,'Content-Type':'application/json'},body:JSON.stringify({coordinates:[origin,destination],language:'fr',instructions:true}),signal:AbortSignal.timeout(15000)});
  if(response.status===404)throw new UnprocessableEntityException('No route found for these locations');
  if(!response.ok)throw Error('Routing unavailable');
  const result=await response.json() as {features?:{geometry:{type:string;coordinates:number[][]};properties:{summary:{distance:number;duration:number};segments:{steps:{instruction:string;distance:number;duration:number}[]}[]}}[]};
  const feature=result.features?.[0],summary=feature?.properties?.summary,geometry=feature?.geometry;
  if(!feature||!summary||!Number.isFinite(summary.distance)||!Number.isFinite(summary.duration)||summary.distance<=0||summary.duration<=0||geometry?.type!=='LineString'||!Array.isArray(geometry.coordinates)||geometry.coordinates.length<2||geometry.coordinates.some(p=>p.length<2||!p.every(Number.isFinite)||p[0]<6.5||p[0]>7.1||p[1]<47.2||p[1]>47.8))throw Error('Invalid route');
  return {engine:'OpenRouteService',mode,distanceMeters:Math.round(summary.distance),durationSeconds:Math.round(summary.duration),geometry:{type:'LineString' as const,coordinates:geometry.coordinates},instructions:feature.properties.segments.flatMap(s=>s.steps.map(step=>({text:step.instruction,distanceMeters:Math.round(step.distance),durationSeconds:Math.round(step.duration)}))),accessibility:'unknown',attribution:'© openrouteservice.org by HeiGIT | © OpenStreetMap contributors (ODbL)'};
 }catch(error){if(error instanceof UnprocessableEntityException)throw error;throw new ServiceUnavailableException('Routing unavailable or free service quota reached. Please try again later.');}
}
