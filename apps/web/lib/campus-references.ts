import manifest from '../public/city/campus-facades.json';
import { matchesFacadeEdge } from './facade-references';
export type CampusFace = { a: number[]; b: number[]; kind: 'ribbon' | 'frame' | 'libraryGlass' | 'libraryStone' | 'timber' | 'concrete'; floors?: number; painted?: boolean; courtyardFeature?: 'stgi-entry' | 'mp-entry' | 'library-bay'; label?: string; accent?: boolean; layout?: 'amphi-front' | 'garden-b' | 'garden-b-return' | 'garden-c' | 'garden-c-connector' | 'stgi-east-wing' | 'stgi-bridge' | 'stgi-bridge-west' | 'stgi-white-tower' | 'stgi-stair-flat-left' | 'stgi-stair-flat-right' | 'stgi-stair-curve' | 'stgi-stair-slit' | 'library-east-striped' | 'library-east-white' | 'stgi-north-openings' | 'stgi-return' | 'stgi-west' | 'stgi-court' | 'stgi-colour' | 'stgi-ribbon' | 'crous-mosaic' | 'crous-front' | 'crous-corner' | 'crous-glass' | 'crous-east'; accentBay?: number[]; solidBays?: number[][]; stairBay?: number[]; glazingBands?: number[][]; openings?: { at: number; width: number; bottom: number; top: number; accent?: string }[]; entrances?: { at: number; width: number; sourceNode: number }[] };
export type CampusProfile = { buildingId: string; label: string; wallColor: string; sourceIds: string[]; faces: CampusFace[]; notes: string };
export const campusReferences = manifest as unknown as { version: number; reviewedAt: string; method: string; sourceImagesRedistributed: boolean; sources: { id: string; institution: string; url: string; published: string; captureDate: string | null; author?: string; license?: string }[]; buildings: CampusProfile[] };
export const campusProfile = (id: unknown) => campusReferences.buildings.find(b => b.buildingId === id);
export function campusFace(profile: CampusProfile, a: number[], b: number[]) { return profile.faces.find(face => matchesFacadeEdge(face, a, b)); }

    // Register the user-photographed garden elevations across Allée Lou Blazer:
    // Bâtiment C/B connector, the glazed breezeway bridge, white classroom wings,
    // white projecting vertical shaft, and both curved board-marked concrete stair towers.
    const gardenFaces: Record<string, CampusFace[]>= {
        BATIMENT0000000223563707: [
            { a: [6.8046698, 47.4954062], b: [6.8045233, 47.495384], kind: 'ribbon', layout: 'garden-c-connector' },
        ],
        BATIMENT0000000223563366: [
            { a: [6.8043558, 47.4951605], b: [6.8043194, 47.4952473], kind: 'ribbon', layout: 'stgi-east-wing' },
            { a: [6.8044189, 47.4950197], b: [6.8043803, 47.495112], kind: 'ribbon', layout: 'stgi-east-wing' },
            { a: [6.8044239, 47.4951646], b: [6.8043511, 47.4951508], kind: 'concrete', layout: 'stgi-stair-flat-left' },
            { a: [6.8043689, 47.4951205], b: [6.8044417, 47.4951343], kind: 'concrete', layout: 'stgi-stair-curve' },
            { a: [6.8044417, 47.4951343], b: [6.8044513, 47.4951385], kind: 'concrete', layout: 'stgi-stair-curve' },
            { a: [6.8044513, 47.4951385], b: [6.8044572, 47.4951464], kind: 'concrete', layout: 'stgi-stair-slit' },
            { a: [6.8044572, 47.4951464], b: [6.8044564, 47.4951546], kind: 'concrete', layout: 'stgi-stair-curve' },
            { a: [6.8044564, 47.4951546], b: [6.804449, 47.4951629], kind: 'concrete', layout: 'stgi-stair-curve' },
            { a: [6.804449, 47.4951629], b: [6.8044386, 47.4951659], kind: 'concrete', layout: 'stgi-stair-curve' },
            { a: [6.8044386, 47.4951659], b: [6.8044239, 47.4951646], kind: 'concrete', layout: 'stgi-stair-curve' },
        ],
        BATIMENT0000000223563367: [
            { a: [6.8043194, 47.4952473], b: [6.8043058, 47.4952802], kind: 'ribbon', layout: 'stgi-bridge' },
            { a: [6.8041602, 47.4952525], b: [6.8041725, 47.4952197], kind: 'ribbon', layout: 'stgi-bridge-west' },
        ],
        BATIMENT0000000223563368: [
            { a: [6.8042899, 47.4953177], b: [6.8043058, 47.4952802], kind: 'ribbon', layout: 'stgi-east-wing' },
            { a: [6.804329, 47.4953254], b: [6.8042899, 47.4953177], kind: 'concrete', layout: 'stgi-white-tower' },
            { a: [6.804321, 47.4953437], b: [6.804329, 47.4953254], kind: 'concrete', layout: 'stgi-white-tower' },
            { a: [6.8042805, 47.495336], b: [6.804321, 47.4953437], kind: 'concrete', layout: 'stgi-white-tower' },
            { a: [6.8042624, 47.4953808], b: [6.8042805, 47.495336], kind: 'ribbon', layout: 'stgi-east-wing' },
            { a: [6.8043313, 47.4953956], b: [6.8042624, 47.4953808], kind: 'concrete', layout: 'stgi-stair-flat-right' },
            { a: [6.8042421, 47.4954121], b: [6.8043202, 47.4954267], kind: 'concrete', layout: 'stgi-stair-curve' },
            { a: [6.8043202, 47.4954267], b: [6.8043335, 47.4954271], kind: 'concrete', layout: 'stgi-stair-curve' },
            { a: [6.8043335, 47.4954271], b: [6.8043451, 47.4954213], kind: 'concrete', layout: 'stgi-stair-curve' },
            { a: [6.8043451, 47.4954213], b: [6.8043498, 47.4954122], kind: 'concrete', layout: 'stgi-stair-curve' },
            { a: [6.8043498, 47.4954122], b: [6.8043464, 47.4954024], kind: 'concrete', layout: 'stgi-stair-slit' },
            { a: [6.8043464, 47.4954024], b: [6.8043313, 47.4953956], kind: 'concrete', layout: 'stgi-stair-curve' },
            { a: [6.804208, 47.4955123], b: [6.8042467, 47.4954218], kind: 'ribbon', layout: 'stgi-east-wing' },
        ],
        BATIMENT0000000223563364: [
            { a: [6.8041975, 47.4955523], b: [6.8040789, 47.4955301], kind: 'concrete', layout: 'library-east-striped' },
            { a: [6.804167, 47.4956281], b: [6.8041975, 47.4955523], kind: 'concrete', layout: 'library-east-white' },
        ],
    };
    export function gardenConnectorFace(id: unknown, a: number[], b: number[]){
if (typeof id !== 'string') return;
return gardenFaces[id]?.find(face => matchesFacadeEdge(face, a, b));
}
