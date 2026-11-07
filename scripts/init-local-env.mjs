import {randomBytes} from 'node:crypto';
import {writeFileSync,existsSync} from 'node:fs';
if(!existsSync('.env'))writeFileSync('.env',`POSTGRES_PASSWORD=${randomBytes(32).toString('hex')}\n`,{flag:'wx',mode:0o600});
