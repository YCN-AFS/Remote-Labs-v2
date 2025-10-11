#!/usr/bin/env node

import db, { testConnection, closeConnection } from '../config/database.js';

async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Cannot connect to database. Please check your configuration.');
      process.exit(1);
    }

    // Run migrations
    console.log('📦 Running migrations...');
    await db.migrate.latest();
    console.log('✅ Migrations completed successfully!');

    // List current migrations
    const migrations = await db.migrate.list();
    console.log('📋 Current migrations:', migrations);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export default runMigrations;
