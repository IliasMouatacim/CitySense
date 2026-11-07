import {createApp} from './app';
import {createPool,migrate} from './database';

async function start() {
  const pool=createPool();
  try {
    await migrate(pool);
    const app=await createApp(pool);
    await app.listen(Number(process.env.PORT||4000),'0.0.0.0');
  } catch(error) {
    await pool.end();
    const code=typeof error==='object'&&error!==null&&'code' in error?String(error.code):'STARTUP_ERROR';
    console.error(`API startup failed (${code}). Check database access and migrations.`);
    process.exitCode=1;
  }
}
void start();
