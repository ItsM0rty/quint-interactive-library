const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../src/styles.css');
const dest = path.join(__dirname, '../dist/styles.css');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('✓ Copied styles.css to dist/');
} else {
  console.warn('⚠ styles.css not found in src/');
}

