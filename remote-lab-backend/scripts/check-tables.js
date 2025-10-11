#!/usr/bin/env node

import db, { testConnection, closeConnection } from '../config/database.js';

async function checkTables() {
  console.log('📋 Checking database tables...');
  
  try {
    await testConnection();
    
    // Check if tables exist
    const tables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('📊 Tables in database:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check if payments table exists specifically
    const paymentsExists = await db.schema.hasTable('payments');
    console.log(`\n💳 Payments table exists: ${paymentsExists}`);
    
    if (paymentsExists) {
      const paymentsCount = await db('payments').count('* as count');
      console.log(`📊 Payments count: ${paymentsCount[0].count}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  } finally {
    await closeConnection();
  }
}

checkTables();
