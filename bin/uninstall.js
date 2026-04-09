#!/usr/bin/env node
'use strict';
const { execSync } = require('child_process');

console.log('Uninstalling work-faster-work…');
try {
  execSync('npm uninstall -g work-faster-work', { stdio: 'inherit' });
  console.log('Done! work-faster-work has been uninstalled.');
} catch {
  console.error('\nAutomatic uninstall failed. Run manually:\n  npm uninstall -g work-faster-work');
  process.exit(1);
}
