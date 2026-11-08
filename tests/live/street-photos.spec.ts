import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
test('controlled Panoramax response pauses walking, shows credit, and returns focus',async({page})=>{
 await page.route('https://api.panoramax.xyz/api/search?**',route=>route.fulfill({json:{type:'FeatureCollection',features:[{type:'Feature',id:'fixture-photo',geometry:{type:'Point',coordinates:[6.7982,47.5102]},properties:{datetime:'2025-06-01T12:00:00Z',license:'CC-BY-SA-4.0',photographer:'Test photographer'},assets:{hd:{href:'https://fixture.panoramax.test/street.jpg',type:'image/jpeg',roles:['visual']}}}]}}));
 await page.route('https://fixture.panoramax.test/street.jpg',route=>route.fulfill({contentType:'image/jpeg',body:readFileSync('apps/web/public/materials/plaster.jpg')}));
 await page.goto('/');await expect(page.locator('.map')).toHaveAttribute('data-ready','true');await page.getByRole('button',{name:'Marcher dans la ville'}).click();
 const hud=page.locator('.walk-hud');await expect(hud).toHaveAttribute('data-lon',/\d/);
 await page.getByRole('button',{name:'Photos des rues'}).click();const dialog=page.getByRole('dialog',{name:'Photos réelles des rues'});await expect(dialog).toBeVisible();
 await expect(dialog.locator('img')).toBeVisible();await expect(dialog).toContainText('Test photographer');await expect(dialog).toContainText('CC-BY-SA-4.0');
 const before=Number(await hud.getAttribute('data-meters'));await page.keyboard.down('w');await page.waitForTimeout(450);await page.keyboard.up('w');expect(Number(await hud.getAttribute('data-meters'))).toBeCloseTo(before,2);
 await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(hud).toBeVisible();await expect(page.locator('.maplibregl-canvas')).toBeFocused();
 await page.keyboard.down('w');try{await expect.poll(async()=>Number(await hud.getAttribute('data-meters'))).toBeGreaterThan(before+.3);}finally{await page.keyboard.up('w');}
});
test('controlled empty photo coverage and outage remain recoverable',async({page})=>{
 await page.route('https://api.panoramax.xyz/api/search?**',route=>route.fulfill({json:{type:'FeatureCollection',features:[]}}));
 await page.goto('/');await expect(page.locator('.map')).toHaveAttribute('data-ready','true');await page.getByRole('button',{name:'Marcher dans la ville'}).click();await expect(page.locator('.walk-hud')).toHaveAttribute('data-lon',/\d/);await page.getByRole('button',{name:'Photos des rues'}).click();
 await expect(page.getByText('Aucune photo publiée dans ce rayon.',{exact:false})).toBeVisible();
 await page.route('https://api.panoramax.xyz/api/search?**',route=>route.fulfill({status:503,body:'Unavailable'}));await page.getByRole('button',{name:'Réessayer',exact:true}).click();await expect(page.getByText('Photos indisponibles.',{exact:false})).toBeVisible();await page.getByRole('button',{name:'Reprendre la marche'}).click();await expect(page.locator('.walk-hud')).toBeVisible();
});
