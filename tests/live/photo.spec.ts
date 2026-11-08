import {test,expect} from '@playwright/test';

test('IGN hybrid has real ground and roof images, supports map mode and walking',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const tiles:string[]=[];page.on('response',r=>{if(r.ok()&&r.url().includes('data.geopf.fr/wmts'))tiles.push(r.url());});
 await page.goto('/');
 const detail=page.getByRole('region',{name:'Détails de la ville'}),mode=page.getByLabel('Style de la ville');
 await expect(mode).toHaveValue('photo');
 await expect.poll(()=>tiles.length).toBeGreaterThan(0);
 await expect.poll(async()=>Number(await detail.getAttribute('data-photo-roofs')),{timeout:45000}).toBeGreaterThan(0);
 await expect(page.locator('.maplibregl-ctrl-attrib')).toContainText('IGN');
 await page.screenshot({path:`test-results/hybrid-aerial-${test.info().project.name}.png`,fullPage:true});
 await mode.selectOption('map');await expect(detail).toHaveAttribute('data-photo-roofs','0');
 await mode.selectOption('photo');
 await expect.poll(async()=>Number(await detail.getAttribute('data-photo-roofs'))).toBeGreaterThan(0);
 await page.getByRole('button',{name:'Marcher dans la ville'}).click();
 await expect(page.locator('.walk-hud')).toHaveAttribute('data-lon',/\d/);
 const hud=page.locator('.walk-hud');
 await mode.selectOption('map');await expect(detail).toHaveAttribute('data-photo-roofs','0');
 await mode.selectOption('photo');
 await expect(page.locator('.maplibregl-canvas')).toBeFocused();
 await page.keyboard.down('w');
 try{await expect.poll(async()=>Number(await hud.getAttribute('data-meters')),{timeout:15000}).toBeGreaterThan(.5);}finally{await page.keyboard.up('w');}
 await expect.poll(async()=>Number(await detail.getAttribute('data-photo-roofs'))).toBeGreaterThan(0);
 await page.screenshot({path:`test-results/hybrid-street-${test.info().project.name}.png`,fullPage:true});
 await page.getByRole('button',{name:'Quitter la marche'}).click();
 await expect(page.locator('.map-error')).toHaveCount(0);expect(errors).toEqual([]);
});

test('imagery failure falls back to the usable map',async({page})=>{
 await page.route('https://data.geopf.fr/wmts?**',route=>route.fulfill({status:503,body:'Unavailable'}));
 await page.goto('/');
 await expect(page.getByText('Photos indisponibles. La carte reste utilisable.')).toBeVisible();
 await expect(page.getByLabel('Style de la ville')).toHaveValue('map');
 await expect(page.getByRole('button',{name:'Marcher dans la ville'})).toBeEnabled();
 await expect(page.locator('.map-error')).toHaveCount(0);
});
