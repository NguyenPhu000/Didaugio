/**
 * CJS helper to load sepay-pg-node SDK.
 * Direct require of dist/index.js to avoid resolution issues.
 */
const {
  SePayPgClient,
} = require("D:/didaugio/server/node_modules/sepay-pg-node/dist/index.js");

module.exports = { SePayPgClient };
