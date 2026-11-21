/*
 * Bundle the 3D bag (js/src/bag3d.src.js + the parts of three.js it uses) into one minified
 * classic script, js/bag3d.js. The output is kept in the folder, so the site itself needs no
 * build step. Run after editing the source:
 *
 *   node tools/build-3d.mjs        (needs `npm install` once)
 */
import { build } from 'esbuild';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(ROOT, 'js/bag3d.js');
await build({
  entryPoints: [path.join(ROOT, 'js/src/bag3d.src.js')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  outfile: out,
  legalComments: 'eof',
  banner: { js: '/* Racimo 3D bag, bundled from js/src/bag3d.src.js by tools/build-3d.mjs. Includes three.js (MIT). */' },
});
console.log(`  ✓ js/bag3d.js  ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
