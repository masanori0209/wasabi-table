import { spawn } from 'node:child_process';
import { watch } from 'node:fs';

const children = [];

function run(command, args, label) {
  const proc = spawn(command, args, { stdio: 'inherit', shell: true });
  children.push(proc);
  proc.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[dev] ${label} exited with code ${code}`);
    }
  });
  return proc;
}

run('npx', ['tsc', '--watch'], 'tsc');

let wasmRunning = false;
let wasmQueued = false;

function runWasmBuild() {
  if (wasmRunning) {
    wasmQueued = true;
    return;
  }
  wasmRunning = true;
  console.log('[dev] building wasm...');
  const proc = spawn('npm', ['run', 'build:wasm'], { stdio: 'inherit', shell: true });
  proc.on('close', () => {
    wasmRunning = false;
    if (wasmQueued) {
      wasmQueued = false;
      runWasmBuild();
    }
  });
}

watch('src', { recursive: true }, (_event, filename) => {
  if (filename?.endsWith('.rs')) {
    runWasmBuild();
  }
});

watch('Cargo.toml', () => runWasmBuild());

function shutdown() {
  for (const child of children) {
    child.kill();
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
