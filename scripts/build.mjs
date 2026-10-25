import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
await fs.mkdir(root+'dist',{recursive:true});
await fs.copyFile(root+'index.html',root+'dist/index.html');
await fs.cp(root+'src',root+'dist/src',{recursive:true});
console.log('Build selesai: dist/ (HTML, CSS, JavaScript; tanpa dependency build).');
