type Point=[number,number,number];
export type FurnitureDrawing={
 box:(x:number,y:number,z:number,width:number,depth:number,height:number,color:string,wood?:boolean)=>void;
 tube:(a:Point,b:Point,radius:number,color:string)=>void;
};

/** Estimated hardware at existing mapped locations; no additional OSM objects. */
export function drawCampusBench(width:number,{box,tube}:FurnitureDrawing){
 for(let slat=0;slat<5;slat++){
  const y=-.2+slat*.1;box(0,y,.44,width,.075,.055,'#ffffff',true);
  for(const x of [-width*.34,width*.34])box(x,y,.496,.016,.016,.003,'#727c76');
 }
 for(const x of [-width*.34,width*.34]){
  box(x,0,.02,.11,.44,.035,'#485852');box(x,0,.055,.055,.37,.385,'#57675f');
  tube([x,.205,.38],[x,.205,.83],.019,'#66746d');
  tube([x,-.17,.48],[x,-.17,.65],.019,'#66746d');
  tube([x,-.17,.65],[x,.205,.65],.019,'#66746d');
 }
 for(let row=0;row<3;row++)box(0,.205,.59+row*.09,width,.05,.065,'#ffffff',true);
}

export function drawCampusCycleStand(x:number,{box,tube}:FurnitureDrawing){
 for(const y of [-.28,.28]){
  box(x,y,.015,.15,.14,.025,'#6b7772');
  for(const dx of [-.045,.045])box(x+dx,y,.041,.013,.013,.01,'#a5aaa1');
  tube([x,y,.04],[x,y,.54],.022,'#91a09b');
 }
 for(let i=0;i<10;i++){
  const point=(angle:number):Point=>[x,Math.cos(angle)*.28,.54+Math.sin(angle)*.28];
  tube(point(i*Math.PI/10),point((i+1)*Math.PI/10),.022,'#91a09b');
 }
}
