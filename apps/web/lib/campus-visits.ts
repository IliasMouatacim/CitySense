import type {Position} from './walk-geometry';
export const CAMPUS_VISITS:{id:string;name:string;center:Position;start:Position;lookAt:Position;pitch:number}[]=[
 {id:'crous',name:'CROUS · restaurant universitaire',center:[6.80367,47.49605],start:[6.80368147,47.49570043],lookAt:[6.8035465,47.4959318],pitch:90},
 {id:'crous-platform',name:'CROUS · abri et parvis',center:[6.80393,47.49585],start:[6.8040111,47.4957667],lookAt:[6.803899,47.495852],pitch:90},
 {id:'campus-bus',name:'Arrêt de bus · Campus',center:[6.80405,47.49577],start:[6.80406076,47.49577669],lookAt:[6.8041185,47.4957244],pitch:90},
 {id:'crous-east',name:'CROUS · aile est et verrière',center:[6.80400,47.49610],start:[6.80414611,47.49595398],lookAt:[6.8039975,47.49613385],pitch:90},
 {id:'stgi',name:'UFR STGI · façade ouest',center:[6.80435,47.49523],start:[6.804015,47.495225],lookAt:[6.80430,47.49515],pitch:90},
 {id:'stgi-entry',name:'UFR STGI · entrée de la cour',center:[6.80410,47.49539],start:[6.80387,47.49532],lookAt:[6.804103,47.495386],pitch:90},
 {id:'library-court',name:'Bibliothèque · côté cour',center:[6.803866,47.495489],start:[6.80389,47.49528],lookAt:[6.803866,47.495490],pitch:90},
 {id:'stgi-garden-c',name:'UFR STGI · bâtiment C, côté jardin',center:[6.80465,47.49532],start:[6.804911,47.495400],lookAt:[6.80470,47.495328],pitch:90},
 {id:'stgi-garden-b',name:'UFR STGI · bâtiment B, côté jardin',center:[6.80471,47.49543],start:[6.804892,47.495422],lookAt:[6.80470,47.495428],pitch:90},
 {id:'stgi-court',name:'UFR STGI · galerie de la cour',center:[6.80445,47.49525],start:[6.80436406,47.49527313],lookAt:[6.80461,47.49515],pitch:90},
 {id:'stgi-colour',name:'UFR STGI · façade turquoise',center:[6.80486,47.49525],start:[6.80500018,47.49528259],lookAt:[6.804838,47.495239],pitch:90},
 // Start on the mapped courtyard footway, facing the observed ribbon facade.
 // The former point snapped north onto this path but looked at a blank end wall.
 {id:'iut-mp',name:'IUT · Mesures physiques',center:[6.80371,47.49510],start:[6.804015,47.495204],lookAt:[6.803674,47.495291],pitch:90},
 {id:'amphi',name:'Amphithéâtre François Vion-Delphin · parvis',center:[6.80409,47.49491],start:[6.803966,47.49516],lookAt:[6.804098,47.494915],pitch:90},
 {id:'library',name:'Bibliothèque universitaire',center:[6.80372,47.49551],start:[6.803285,47.495425],lookAt:[6.80343,47.49547],pitch:90},
 // Register the start on the mapped pedestrian approach. The former point
 // was ~9.5 m off the path and silently snapped away from its stated position.
 {id:'utbm',name:'UTBM · façade bois',center:[6.80494,47.49612],start:[6.8047928043,47.4959126726],lookAt:[6.80495,47.49618],pitch:90},
];
