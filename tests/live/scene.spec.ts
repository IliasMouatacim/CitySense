import {test,expect} from '@playwright/test';
test('3D lighting, height scale, viewpoints and orbit controls',async({page})=>{
 test.setTimeout(210000); // Multi-view WebGL capture/cleanup is slow on software-GPU cloud runners.
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');const map=page.locator('.map');
 await expect(map).toHaveAttribute('data-ready','true');
 await expect.poll(async()=>Number(await map.getAttribute('data-pitch'))).toBeGreaterThan(55);
 await page.getByRole('button',{name:'Jour',exact:true}).click();
 await expect(map).toHaveAttribute('data-scene','day');
 await page.getByRole('button',{name:'Nuit',exact:true}).click();
 await expect(map).toHaveAttribute('data-scene','night');
 await page.screenshot({path:`test-results/scene-night-${test.info().project.name}.png`,fullPage:true});
 await page.getByRole('button',{name:'Doré',exact:true}).click();
 if(test.info().project.name==='mobile'){
  const zoom=await page.locator('.maplibregl-ctrl-group').boundingBox(),tray=await page.locator('.city-views').boundingBox();
  expect(zoom).not.toBeNull();expect(tray).not.toBeNull();
  expect(zoom!.y+zoom!.height<=tray!.y||zoom!.x+zoom!.width<=tray!.x).toBe(true);
 }
 const scale=page.getByRole('slider',{name:'Échelle visuelle des bâtiments'});await scale.focus();
 for(let i=0;i<5;i++)await page.keyboard.press('ArrowRight');
 await expect(scale).toHaveValue('1.5');
 await expect(page.getByText('Exagération visuelle · mesures inchangées')).toBeVisible();
 await page.getByRole('button',{name:'Le Château',exact:true}).click();
 await expect.poll(async()=>Number(await map.getAttribute('data-pitch'))).toBe(67);
 await page.screenshot({path:`test-results/scene-golden-${test.info().project.name}.png`,fullPage:true});
 await page.getByRole('button',{name:'Vue 3D',exact:true}).click();
 await expect.poll(async()=>Number(await map.getAttribute('data-pitch'))).toBe(0);
 await expect(scale).toBeDisabled();
 await page.getByRole('button',{name:'Vue 2D',exact:true}).click();
 await expect.poll(async()=>Number(await map.getAttribute('data-pitch'))).toBe(62);
 await page.getByRole('button',{name:'Agrandir la carte',exact:true}).click();
 await expect(page.locator('.panel')).toBeHidden();
 await expect.poll(()=>map.evaluate(e=>e.clientHeight===innerHeight&&e.clientWidth===innerWidth)).toBe(true);
 await page.keyboard.press('Escape');await expect(page.locator('.panel')).toBeVisible();
 const bearingBefore=await map.getAttribute('data-bearing');
 await page.getByRole('button',{name:'Visite orbitale',exact:true}).click();
 await expect.poll(()=>map.getAttribute('data-bearing')).not.toBe(bearingBefore);
 await expect(page.getByRole('button',{name:'Arrêter la visite',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Arrêter la visite',exact:true}).click();
 await expect(page.getByRole('button',{name:'Visite orbitale',exact:true})).toHaveAttribute('aria-pressed','false');
 await expect(page.locator('.map-error')).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});
test('reduced motion disables the orbit tour',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 await expect(page.getByText('Animations réduites activées')).toBeVisible();
 await expect(page.getByRole('button',{name:'Visite orbitale',exact:true})).toBeDisabled();
});
