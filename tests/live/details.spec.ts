import {test,expect} from '@playwright/test';

test('detailed facades and real shop names remain usable in aerial and walking views',async({page})=>{
 test.setTimeout(150000); // Multiple full-page WebGL captures on software-GPU cloud runners.
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 const detail=page.getByRole('region',{name:'Détails de la ville'});
 await expect(detail).toBeVisible();
 await expect.poll(async()=>Number(await detail.getAttribute('data-buildings'))).toBeGreaterThan(10);
 await expect.poll(async()=>Number(await detail.getAttribute('data-windows'))).toBeGreaterThan(100);
 await expect.poll(async()=>Number(await detail.getAttribute('data-signs'))).toBeGreaterThan(0);
 if(test.info().project.name==='mobile'){
  const a=await detail.boundingBox(),b=await page.locator('.maplibregl-ctrl-group').boundingBox();
  expect(a&&b).toBeTruthy();expect(a!.y+a!.height<=b!.y||a!.x+a!.width<=b!.x||b!.x+b!.width<=a!.x).toBe(true);
 }
 await page.getByRole('button',{name:'Noms et commerces'}).click();
 const businesses=page.locator('.city-businesses li');
 await expect.poll(()=>businesses.count()).toBeGreaterThan(3);
 const name=await businesses.first().locator('strong').textContent();
 await page.getByRole('textbox',{name:'Filtrer les commerces visibles'}).fill(name!);
 await expect(businesses.first()).toContainText(name!);
 await page.getByRole('textbox',{name:'Filtrer les commerces visibles'}).fill('zz-nonexistent-business-zz');
 await expect(page.getByText('Aucun lieu ne correspond.')).toBeVisible();
 await page.getByRole('textbox',{name:'Filtrer les commerces visibles'}).fill('');
 await page.getByRole('button',{name:'Noms et commerces'}).click();
 await page.screenshot({path:`test-results/detailed-aerial-${test.info().project.name}.png`,fullPage:true});
 await page.getByRole('button',{name:'Façades détaillées'}).click();
 await expect(detail).toHaveAttribute('data-enabled','false');
 await expect(detail).toHaveAttribute('data-buildings','0');
 await page.getByRole('button',{name:'Noms et commerces'}).click();
 await expect.poll(()=>businesses.count()).toBeGreaterThan(3);
 await page.getByRole('button',{name:'Noms et commerces'}).click();
 await page.getByRole('button',{name:'Façades simples'}).click();
 await expect.poll(async()=>Number(await detail.getAttribute('data-windows'))).toBeGreaterThan(100);
 await page.getByRole('button',{name:'Marcher dans la ville'}).click();
 const hud=page.getByRole('region',{name:'Exploration à pied',exact:true});
 await expect(hud).toHaveAttribute('data-lon',/\d/);
 await expect.poll(async()=>Number(await detail.getAttribute('data-signs'))).toBeGreaterThan(0);
 await page.getByRole('button',{name:'Noms et commerces'}).click();
 const heading=await hud.getAttribute('data-heading');
 // The reference viewpoint may already face the nearest business.
 await businesses.last().getByRole('button').click();
 await expect(page.getByRole('button',{name:'Noms et commerces'})).toHaveAttribute('aria-expanded','false');
 await expect.poll(()=>hud.getAttribute('data-heading')).not.toBe(heading);
 await page.waitForTimeout(1800); // Let new nearby tile meshes settle before the visual capture.
 await page.screenshot({path:`test-results/detailed-street-${test.info().project.name}.png`,fullPage:true});
 await page.getByRole('button',{name:'Quitter la marche'}).click();
 await expect(hud).toHaveCount(0);
 await page.getByRole('button',{name:'Vue 3D',exact:true}).click();
 await expect(detail).toHaveAttribute('data-enabled','false');
 await expect(page.getByRole('button',{name:'Façades détaillées'})).toBeDisabled();
 await expect(page.locator('.map-error')).toHaveCount(0);
 expect(errors).toEqual([]);
});
