import {test,expect} from '@playwright/test';
import {CAMPUS_VISITS} from '../../apps/web/lib/campus-visits';

test('all campus stops can be visited without leaving grounded walking mode',async({page})=>{
 test.setTimeout(600000);await page.emulateMedia({reducedMotion:'reduce'});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&/THREE|GL_INVALID|shader error|framebuffer/i.test(m.text()))errors.push(m.text());});
 await page.goto('/');await expect(page.locator('.map')).toHaveAttribute('data-ready','true');
 await page.getByRole('button',{name:'Campus universitaire',exact:true}).click();
 await page.getByRole('button',{name:'Marcher dans la ville',exact:true}).click();
 const hud=page.locator('.walk-hud'),details=page.locator('.architecture-panel');
 for(const visit of CAMPUS_VISITS){
  const toggle=page.getByRole('button',{name:'Options et lieux',exact:true});
  if(await toggle.isVisible())await toggle.click();
  await page.getByLabel('Secteur du campus',{exact:true}).selectOption(visit.id);
  await expect(page.locator('.walk-error')).toHaveCount(0);
  await expect(hud).toHaveAttribute('data-look-pitch','90');
  await expect.poll(async()=>Math.hypot((Number(await hud.getAttribute('data-lon'))-visit.start[0])*75400,(Number(await hud.getAttribute('data-lat'))-visit.start[1])*111319),{timeout:45000}).toBeLessThan(8);
  await expect.poll(async()=>Number(await hud.getAttribute('data-eye-elevation'))-Number(await hud.getAttribute('data-ground-elevation'))).toBeCloseTo(1.65,2);
  await expect.poll(async()=>Number(await details.getAttribute('data-campus-facades'))).toBeGreaterThanOrEqual(27);
  await expect(details).toHaveAttribute('data-photo-ground','0');
  await expect(page.getByRole('button',{name:'Courir',exact:true})).toHaveAttribute('aria-pressed','false');
  await page.screenshot({path:`test-results/campus-tour-${visit.id}-${test.info().project.name}.png`,fullPage:true});
  // Set sprint before switching: each new stop must clear the previous controls.
  await page.getByRole('button',{name:'Courir',exact:true}).click();
 }
 await page.getByRole('button',{name:'Revenir au point de départ'}).click();
 await expect(hud).toHaveAttribute('data-look-pitch','90');
 await page.getByRole('button',{name:'Quitter la marche',exact:true}).click();
 await expect(hud).toHaveCount(0);
 expect(errors).toEqual([]);
});
