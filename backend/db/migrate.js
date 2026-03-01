const path = require('path');
const { createDb } = require('./index');

const baseDir = path.join(__dirname, '..');
createDb(baseDir);
console.log('Database migrations applied.');
