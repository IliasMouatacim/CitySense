import {test,expect} from '@playwright/test';
test('route geometry is redrawn above the IGN terrain and cleared with its destination',async({page})=>{
 await page.route('**/api/places',route=>route.fulfill({json:{places:[{id:'gare',name:'Gare de Montbéliard',category:'Transport',coordinates:[6.8011,47.5105]},{id:'parc',name:'Parc du Près-la-Rose',category:'Nature',coordinates:[6.8049,47.5057]}]}}));
 await page.route('**/api/places?**',route=>route.fulfill({json:{places:[]}}));
 await page.route('**/api/routes?**',route=>route.fulfill({json:{engine:'controlled-fixture',distanceMeters:820,durationSeconds:620,geometry:{type:'LineString',coordinates:[[6.8011,47.5105],[6.8049,47.5057]]},instructions:[{text:'Test route',distanceMeters:820}]}}));
 await page.goto('/');await expect(page.locator('.map')).toHaveAttribute('data-ready','true');await page.getByRole('button',{name:/Parc du Près-la-Rose/}).click();await page.getByLabel('Lieu de départ').selectOption('gare');
 await expect(page.locator('.routing')).toContainText('820 m');
 await page.getByRole('button',{name:'Zoom in',exact:true}).click();await page.getByRole('button',{name:'Zoom in',exact:true}).click();
 await expect.poll(async()=>Number(await page.locator('.architecture-panel').getAttribute('data-route-segments'))).toBeGreaterThan(10);
 await page.getByRole('button',{name:'Fermer les détails'}).click();await expect(page.locator('.architecture-panel')).toHaveAttribute('data-route-segments','0');
});
