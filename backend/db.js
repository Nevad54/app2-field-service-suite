// This file re-exports from db/index.js (SQLite version)
// The MongoDB version is available in db-mongodb.js
const { createDb } = require('./db');
module.exports = { createDb };
