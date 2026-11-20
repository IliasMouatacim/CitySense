/** Features visible in the STGI institutional courtyard photographs.
 * Geographic placement and dimensions are visual estimates, not surveyed data.
 */
// Only the west leg runs alongside the garden. The same OSM way continues
// through the junction towards the outer path.
export const STGI_GARDEN_WAY_ID=1317689139;
export const STGI_GARDEN_LAWN_LIFT=.14;

export const CAMPUS_COURTYARD={sourceIds:['stgi-court','stgi-colour'],gardenLawn:[
 [6.804548,47.495336],[6.804811,47.495387],[6.804788,47.495426],[6.804538,47.495378],
],fixtures:[
 {kind:'tree',coordinates:[6.804146,47.494934],height:3.2,width:2.2,depth:2.2},
 {kind:'planter',coordinates:[6.804575,47.49535],height:.45,width:4.2,depth:2.1},
 {kind:'bench',coordinates:[6.804038,47.495327],height:.85,width:2.2,depth:.5},
 {kind:'lamp',coordinates:[6.80381,47.49507],height:4.2,width:.18,depth:.18},
 {kind:'lamp',coordinates:[6.80411,47.49518],height:4.2,width:.18,depth:.18},
 {kind:'garden-bed',coordinates:[6.804757,47.495386],height:.19,width:1.65,depth:1.18},
 {kind:'garden-bed',coordinates:[6.804618,47.495365],height:.17,width:1.45,depth:1.05},
 {kind:'tree',coordinates:[6.804660,47.495377],height:4.8,width:2.5,depth:2.5},
 {kind:'bench',coordinates:[6.804706,47.495378],height:.75,width:2.35,depth:.48},
]} as const;
