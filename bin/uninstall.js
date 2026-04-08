#!/usr/bin/env node
'use strict';
const { execSync } = require('child_process');

console.log('Uninstalling badclaude…');
try {
  execSync('npm uninstall -g badclaude', { stdio: 'inherit' });
  console.log('Done! badclaude has been uninstalled.');
} catch {
  console.error('\nAutomatic uninstall failed. Run manually:\n  npm uninstall -g badclaude');
  process.exit(1);
}
