import type {Position} from './walk-geometry';
export const CAMPUS_VISITS:{id:string;name:string;center:Position;start:Position;lookAt:Position;pitch:number}[]=[
 {id:'stgi',name:'UFR STGI · cour et façades',center:[6.80435,47.49523],start:[6.804015,47.495225],lookAt:[6.80430,47.49515],pitch:101},
 // Start on the mapped courtyard footway, facing the observed ribbon facade.
 // The former point snapped north onto this path but looked at a blank end wall.
 {id:'iut-mp',name:'IUT · Mesures physiques',center:[6.80371,47.49510],start:[6.804015,47.495204],lookAt:[6.803674,47.495291],pitch:96},
 {id:'library',name:'Bibliothèque universitaire',center:[6.80372,47.49551],start:[6.803285,47.495425],lookAt:[6.80343,47.49547],pitch:103},
 {id:'utbm',name:'UTBM · façade bois',center:[6.80494,47.49612],start:[6.80476,47.495995],lookAt:[6.80495,47.49618],pitch:104},
];
