import {BadRequestException,ServiceUnavailableException,UnprocessableEntityException} from '@nestjs/common';
export function coordinate(raw:unknown):[number,number]{
 if(typeof raw!=='string'||!/^[-\d.]+,[-\d.]+$/.test(raw))throw new BadRequestException('Use longitude,latitude coordinates');
 const [lon,lat]=raw.split(',').map(Number);
 if(!Number.isFinite(lon)||!Number.isFinite(lat)||lon<6.6||lon>7||lat<47.3||lat>47.7)throw new BadRequestException('Coordinates must be in the Montbéliard pilot region');
 return [lon,lat];
}
export function decodeShape(shape:string):number[][]{
 let index=0,lat=0,lon=0;const points:number[][]=[];
 function read(){let result=0,shift=0,b:number;do{if(index>=shape.length||shift>30)throw Error('Invalid shape');b=shape.charCodeAt(index++)-63;if(b<0||b>63)throw Error('Invalid shape');result|=(b&31)<<shift;shift+=5;}while(b>=32);return result&1?~(result>>>1):result>>>1;}
 while(index<shape.length){lat+=read();lon+=read();points.push([lon/1e6,lat/1e6]);}
 return points;
}
type Trip={status:number;summary:{length:number;time:number};legs:{shape:string;maneuvers:{instruction:string;length:number;time:number}[]}[]};
export async function calculateRoute(from:unknown,to:unknown,mode:unknown,endpoint=process.env.VALHALLA_URL||'http://127.0.0.1:8002'){
 const origin=coordinate(from),destination=coordinate(to);
 if(!['pedestrian','bicycle'].includes(String(mode)))throw new BadRequestException('mode must be pedestrian or bicycle');
 if(origin[0]===destination[0]&&origin[1]===destination[1])throw new BadRequestException('Choose two different locations');
 try{
  const response=await fetch(`${endpoint}/route`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({locations:[origin,destination].map(([lon,lat])=>({lon,lat})),costing:mode,units:'kilometers',language:'fr-FR'}),signal:AbortSignal.timeout(15000)});
  if(response.status===400){const error=await response.json() as {error_code?:number};if([171,172,442,443].includes(error.error_code||0))throw new UnprocessableEntityException('No route found for these locations');}
  if(!response.ok)throw Error('Routing unavailable');
  const {trip}=await response.json() as {trip:Trip};
  if(trip?.status!==0||!trip.legs?.length||!Number.isFinite(trip.summary?.length)||!Number.isFinite(trip.summary?.time))throw Error('Invalid route');
  const coordinates=trip.legs.flatMap(leg=>decodeShape(leg.shape));
  if(coordinates.length<2||coordinates.some(([x,y])=>x<6.5||x>7.1||y<47.2||y>47.8))throw Error('Invalid route geometry');
  return {engine:'Valhalla',mode,distanceMeters:Math.round(trip.summary.length*1000),durationSeconds:Math.round(trip.summary.time),geometry:{type:'LineString' as const,coordinates},instructions:trip.legs.flatMap(l=>l.maneuvers.map(m=>({text:m.instruction,distanceMeters:Math.round(m.length*1000),durationSeconds:Math.round(m.time)}))),accessibility:'unknown',attribution:'© OpenStreetMap contributors (ODbL)'};
 }catch(error){if(error instanceof UnprocessableEntityException)throw error;throw new ServiceUnavailableException('Routing unavailable. Ensure the regional Valhalla graph is ready.');}
}
