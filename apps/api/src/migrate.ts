import {createPool,migrate} from './database';
const pool=createPool();
migrate(pool).then(()=>console.log('Database migrations applied.')).catch(()=>{console.error('Migration failed. Check database availability and configuration.');process.exitCode=1;}).finally(()=>pool.end());
