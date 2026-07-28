'use strict';

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const datasetPath = path.join(PROJECT_ROOT, 'dataset-s3.json');
const seedPath = path.join(PROJECT_ROOT, 'backend', 'seed-markers.js');

// Read migrated dataset
const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));

// Read seed source
let source = fs.readFileSync(seedPath, 'utf-8');

// Find all imagePath assignments in the seed file and replace them in order.
// Match pattern: imagePath: "..." or imagePath: null
let index = 0;
source = source.replace(/imagePath:\s*("(?:[^"\\]|\\.)*"|null)/g, (match) => {
  const record = dataset[index];
  index++;

  if (!record) return match; // safety

  if (record.imagePath === null) {
    return 'imagePath: null';
  }

  // Escape any special chars in the URL for the string literal
  const escaped = record.imagePath.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `imagePath: "${escaped}"`;
});

fs.writeFileSync(seedPath, source, 'utf-8');
console.log(`Updated ${index} imagePath entries in seed-markers.js`);
