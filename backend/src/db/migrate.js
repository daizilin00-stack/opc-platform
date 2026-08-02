const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = require('./pool');
const logger = require('../utils/logger');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Run init.sql first (whole file as one query)
    const initSqlPath = path.join(__dirname, 'init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf-8');
    await client.query(initSql);
    logger.info('✅ init.sql migration completed');

    // Run all migration files in order (whole file as one query)
    const migrationFiles = fs.readdirSync(__dirname)
      .filter(f => f.endsWith('-migration.sql') || f.match(/-migration-\d{4}-\d{2}-\d{2}\.sql$/))
      .sort();
    
    for (const file of migrationFiles) {
      const filePath = path.join(__dirname, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      await client.query(sql);
      logger.info(`✅ ${file} migration completed`);
    }

    await client.query('COMMIT');
    logger.info('✅ All database migrations completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('❌ Database migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  migrate();
}

module.exports = migrate;
