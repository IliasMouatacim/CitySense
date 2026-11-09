import {test,expect} from '@playwright/test';

test('photo-based building faces load with provenance and remain visible while walking',async({page})=>{
 test.setTimeout(150000); // Three software-GPU visual captures and a drag to the second building.
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');const details=page.locator('.architecture-panel');
 await expect(page.getByRole('button',{name:'Façades Panoramax',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(details).toHaveAttribute('data-reference-buildings','3');
 await expect(details).toHaveAttribute('data-facade-photo-faces','3',{timeout:45000});
 await expect(details).toContainText('Panoramax © Lejun');await expect(details).toContainText('CC-BY-SA-4.0');
 await page.getByText('3 bâtiments · Panoramax',{exact:true}).click();await expect(details).toContainText('autres bâtiments stylisés');
 await page.getByText('3 bâtiments · Panoramax',{exact:true}).click();
 await page.screenshot({path:`test-results/panoramax-aerial-${test.info().project.name}.png`,fullPage:true});
 const fov=await page.locator('.map').getAttribute('data-fov');
 await page.getByRole('button',{name:'Marcher dans la ville',exact:true}).click();
 await expect(page.locator('.walk-hud')).toHaveAttribute('data-lon',/\d/);
 await expect(page.locator('.walk-hud')).toHaveAttribute('data-fov','72');
 await expect(details).toHaveAttribute('data-facade-photo-faces','3');
 await page.screenshot({path:`test-results/panoramax-facades-${test.info().project.name}.png`,fullPage:true});
 const hud=page.locator('.walk-hud'),heading=Number(await hud.getAttribute('data-heading'));
 const canvas=await page.locator('.maplibregl-canvas').boundingBox(),y=canvas!.height*.55;
 // Drag gives a fixed viewing angle independently of the software GPU's frame rate.
 // Held rotation controls are exercised separately by walking.spec.ts.
 for(let i=0;i<4;i++){
  await page.mouse.move(canvas!.width/2+130,y);await page.mouse.down();
  await page.mouse.move(canvas!.width/2-130,y-25,{steps:4});await page.mouse.up();
 }
 await expect.poll(async()=>Math.abs(((Number(await hud.getAttribute('data-heading'))-heading+540)%360)-180)).toBeGreaterThan(130);
 await page.screenshot({path:`test-results/panoramax-grey-block-${test.info().project.name}.png`,fullPage:true});
 await page.getByRole('button',{name:'Quitter la marche',exact:true}).click();await expect(page.locator('.map')).toHaveAttribute('data-fov',fov!);expect(errors).toEqual([]);
});
test('real Panoramax street imagery opens from the documented intersection',async({page})=>{
 const images:string[]=[];
 page.on('response',response=>{if(response.ok()&&response.url().startsWith('https://panoramax.openstreetmap.fr/')&&response.headers()['content-type']?.includes('image'))images.push(response.url());});
 await page.goto('/');await expect(page.locator('.map')).toHaveAttribute('data-ready','true');
 await page.getByRole('button',{name:'Marcher dans la ville',exact:true}).click();await expect(page.locator('.walk-hud')).toHaveAttribute('data-lon',/\d/);
 await page.getByRole('button',{name:'Photos des rues',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Photos réelles des rues'});
 await expect(dialog).toContainText('Lejun');await expect(dialog).toContainText('CC-BY-SA-4.0');
 await expect.poll(()=>images.length,{timeout:30000}).toBeGreaterThan(0);
 await expect(dialog.locator('canvas')).toBeVisible();
 await page.screenshot({path:`test-results/panoramax-real-photo-${test.info().project.name}.png`,fullPage:true});
 await page.getByRole('button',{name:'Reprendre la marche'}).click();await expect(page.locator('.walk-hud')).toBeVisible();
});
test('unavailable facade photographs retain playable simplified buildings',async({page})=>{
 await page.route('**/city/facades/*.jpg',route=>route.fulfill({status:503,body:'Unavailable'}));
 await page.goto('/');await expect(page.getByText('Textures de façade indisponibles ; volumes simplifiés affichés.')).toBeVisible();
 await expect(page.locator('.architecture-panel')).toHaveAttribute('data-facade-photo-faces','0');
 await page.getByRole('button',{name:'Marcher dans la ville',exact:true}).click();await expect(page.locator('.walk-hud')).toHaveAttribute('data-lon',/\d/);
});
