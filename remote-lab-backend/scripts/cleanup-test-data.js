#!/usr/bin/env node

import db, { testConnection, closeConnection } from '../config/database.js';

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Cannot connect to database');
      process.exit(1);
    }

    // Delete all test data in correct order
    console.log('🗑️  Deleting schedules...');
    await db('schedules').del();
    
    console.log('🗑️  Deleting computers...');
    await db('computers').del();
    
    console.log('🗑️  Deleting payments...');
    await db('payments').del();
    
    console.log('🗑️  Deleting students...');
    await db('students').del();
    
    console.log('🗑️  Deleting users...');
    await db('users').del();

    console.log('✅ Test data cleaned up successfully!');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

// Run cleanup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupTestData();
}

export default cleanupTestData;
