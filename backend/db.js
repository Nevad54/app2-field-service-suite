// This file re-exports the active DB adapter.
// This project is configured to use Supabase.
const { createDb } = require('./db/index-supabase');
module.exports = { createDb };
