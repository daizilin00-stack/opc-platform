   const { Pool } = require('pg');
   const logger = require('../utils/logger');
   require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
   });

pool.on('error', (err) => {
  logger.error('PostgreSQL pool error:', err);
});

pool.on('connect', () => {
  logger.info('PostgreSQL connected');
});

module.exports = pool;
