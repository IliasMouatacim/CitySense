export const WALK_EYE_HEIGHT=1.65;
export const WALK_SPEED=2.8;
export const RUN_SPEED=5.5;
// Small distance-driven footfalls, disabled when reduced motion is requested.
export function walkBob(meters:number){return Math.sin(meters/1.4*Math.PI*2)*.022;}
