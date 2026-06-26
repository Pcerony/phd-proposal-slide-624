import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

execFileSync('node', ['scripts/sync_research_design_layout.mjs', '--check'], {
  cwd: root,
  stdio: 'inherit',
});

console.log('PASS research design layout sync audit');
