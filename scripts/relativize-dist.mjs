import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const distIndex = resolve('dist/index.html');
let html = readFileSync(distIndex, 'utf8');

// Replace absolute asset URLs with relative ones for file:// usage
html = html.replaceAll('src="/assets/', 'src="assets/');
html = html.replaceAll('href="/assets/', 'href="assets/');

writeFileSync(distIndex, html);
console.log('Relativized asset URLs in dist/index.html');

