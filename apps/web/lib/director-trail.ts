import {distance,type Position} from './walk-geometry';

// Keep the last two metres of the player's actual route so the director also
// goes around corners. Consume old segments as the player moves.
export function directorTrail(companion:Position,player:Position){
 const path:Position[]=[companion,player];
 let remaining=distance(companion,player);
 return (point:Position)=>{
  const last=path[path.length-1],step=distance(last,point);
  if(step>.015){path.push(point);remaining+=step;}
  while(path.length>1&&remaining>2){
   const a=path[0],b=path[1],length=distance(a,b),advance=remaining-2;
   if(advance>=length){path.shift();remaining-=length;continue;}
   const t=advance/length;
   path[0]=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
   remaining=2;
  }
  return path[0];
 };
}
