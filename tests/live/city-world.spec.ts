import {test,expect} from '@playwright/test';
test('walking keeps its camera above IGN terrain rather than clamping to sea level',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('.map')).toHaveAttribute('data-ready','true');
 await expect.poll(async()=>Number(await page.locator('.architecture-panel').getAttribute('data-model-meshes')),{timeout:45000}).toBeGreaterThan(0);
 expect(Number(await page.locator('.architecture-panel').getAttribute('data-model-meshes'))).toBeLessThan(150);
 await page.getByRole('button',{name:'Marcher dans la ville'}).click();
 const hud=page.locator('.walk-hud');await expect(hud).toHaveAttribute('data-lon',/\d/);
 await expect.poll(async()=>Number(await hud.getAttribute('data-ground-elevation'))).toBeGreaterThan(1);
 await expect.poll(async()=>{
  const g=Number(await hud.getAttribute('data-ground-elevation')),target=Number(await hud.getAttribute('data-camera-target')),pitch=Number(await hud.getAttribute('data-look-pitch'));
  return Math.abs(target-(Number(await hud.getAttribute('data-eye-elevation'))-30*Math.cos(pitch*Math.PI/180)));
 }).toBeLessThan(.03);
 await page.keyboard.down('w');try{await expect.poll(async()=>Number(await hud.getAttribute('data-meters')),{timeout:15000}).toBeGreaterThan(.3);}finally{await page.keyboard.up('w');}
 await page.screenshot({path:`test-results/ign-grounded-${test.info().project.name}.png`,fullPage:true});
 await page.getByRole('button',{name:'Quitter la marche'}).click();await expect(hud).toHaveCount(0);expect(errors).toEqual([]);
});
