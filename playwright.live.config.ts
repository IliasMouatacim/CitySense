import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/live',workers:1,timeout:90000,expect:{timeout:20000},
 use:{baseURL:process.env.LIVE_BASE_URL||'https://city-sense-ten.vercel.app',screenshot:'only-on-failure',trace:'retain-on-failure',launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--enable-unsafe-swiftshader']}},
 projects:[{name:'desktop',use:{viewport:{width:1440,height:1000}}},{name:'mobile',use:{viewport:{width:390,height:844}}}]
});
