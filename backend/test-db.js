const db = require('./db');
console.log('Exported keys:', Object.keys(db));
console.log('createDb type:', typeof db.createDb);
if (typeof db.createDb === 'function') {
  console.log('SUCCESS: createDb is a function');
} else {
  console.log('FAIL: createDb is not a function');
}
