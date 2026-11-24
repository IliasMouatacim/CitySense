/** Features visible in the STGI institutional courtyard photographs and recent site imagery.
 * Geographic placement and dimensions are visual estimates, not surveyed data.
 */
// The footway network through the garden and straight through the covered breezeways.
export const STGI_GARDEN_WAY_ID = 1317689139;
export const STGI_GARDEN_WAY_IDS = [1317689139, 1334493531, 1317689142, 496462068] as const;
export const STGI_GARDEN_LAWN_LIFT = .14;

export const CAMPUS_COURTYARD = {
    sourceIds: ['stgi-court', 'stgi-colour'], gardenLawn: [
        [6.804468, 47.495308], [6.804811, 47.495376], [6.804788, 47.495426], [6.804442, 47.495372],
    ], southGardenLawn: [
        [6.804488, 47.495232], [6.804532, 47.495241], [6.804520, 47.495282], [6.804472, 47.495273],
    ], westWingLawns: [
        [[6.804358, 47.495161], [6.804395, 47.495168], [6.804360, 47.495248], [6.804322, 47.495245]],
        [[6.804308, 47.495284], [6.804352, 47.495292], [6.804302, 47.495395], [6.804266, 47.495380]],
    ], gardenPlaza: [
        [6.804538, 47.495295], [6.804805, 47.495348], [6.804811, 47.495387], [6.804548, 47.495336],
    ], fixtures: [
        { kind: 'tree', coordinates: [6.804146, 47.494934], height: 3.2, width: 2.2, depth: 2.2 },
        { kind: 'planter', coordinates: [6.804575, 47.49535], height: .45, width: 4.2, depth: 2.1 },
        { kind: 'bench', coordinates: [6.804038, 47.495327], height: .85, width: 2.2, depth: .5 },
        { kind: 'lamp', coordinates: [6.80381, 47.49507], height: 4.2, width: .18, depth: .18 },
        { kind: 'lamp', coordinates: [6.80411, 47.49518], height: 4.2, width: .18, depth: .18 },
        { kind: 'sign-lamp', coordinates: [6.804485, 47.495318], height: 3.85, width: .18, depth: .18 },
        { kind: 'garden-bed', coordinates: [6.804525, 47.495342], height: .14, width: 1.25, depth: 1.10 },
        { kind: 'garden-bed', coordinates: [6.804582, 47.495368], height: .14, width: 1.25, depth: 1.10 },
        { kind: 'garden-bed', coordinates: [6.804642, 47.495354], height: .14, width: 1.28, depth: 1.12 },
        { kind: 'garden-bed', coordinates: [6.804735, 47.495386], height: .14, width: 1.35, depth: 1.15 },
        { kind: 'tree', coordinates: [6.804660, 47.495377], height: 4.8, width: 2.5, depth: 2.5 },
        { kind: 'bench', coordinates: [6.804706, 47.495378], height: .52, width: 2.35, depth: .50 },
        { kind: 'reading-desk', coordinates: [6.804506, 47.495328], height: .82, width: .58, depth: .44 },
        { kind: 'reading-desk', coordinates: [6.804452, 47.495374], height: .82, width: .58, depth: .44 },
        { kind: 'insect-hotel', coordinates: [6.804682, 47.495352], height: 1.35, width: .78, depth: .38 },
        { kind: 'autumn-bush', coordinates: [6.804474, 47.495336], height: 1.35, width: 1.55, depth: 1.55 },
        { kind: 'yellow-bush', coordinates: [6.804325, 47.495300], height: 1.85, width: 2.10, depth: 2.10 },
        { kind: 'trash-bin', coordinates: [6.804602, 47.495322], height: .78, width: .44, depth: .44 },
    ]
} as const;
