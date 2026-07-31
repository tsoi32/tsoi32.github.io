'use strict';

const fs = require('fs');
const { spawn } = require('child_process');

const WATCH_DIRS = ['src', 'templates', 'media', 'gifs'].filter(d => fs.existsSync(d));

let building = false;
let queued = false;
let timer = null;

function runBuild(reason) {
  if (building) { queued = true; return; }
  building = true;
  console.log(`\n:: rebuild (${reason})`);
  const proc = spawn('node', ['build.js'], { stdio: 'inherit' });
  proc.on('exit', () => {
    building = false;
    if (queued) { queued = false; runBuild('mudanca durante o build anterior'); }
  });
}

function scheduleBuild(reason) {
  clearTimeout(timer);
  timer = setTimeout(() => runBuild(reason), 150);
}

runBuild('inicial');

for (const dir of WATCH_DIRS) {
  fs.watch(dir, { recursive: true }, (_event, filename) => {
    scheduleBuild(filename ? `${dir}/${filename}` : dir);
  });
}

console.log(`:: observando ${WATCH_DIRS.join(', ')} — ctrl+c pra sair`);
