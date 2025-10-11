#!/usr/bin/env node

import db, { testConnection, closeConnection } from '../config/database.js';

async function checkPaymentsTable() {
  console.log('💳 Checking payments table details...');
  
  try {
    await testConnection();
    
    // Check table structure
    const columns = await db.raw(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'payments' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Payments table columns:');
    columns.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Try to query the table
    try {
      const payments = await db('payments').select('*').limit(5);
      console.log(`\n📊 Payments data (${payments.length} records):`);
      payments.forEach(payment => {
        console.log(`  - ${payment.id}: ${payment.email} - ${payment.amount}`);
      });
    } catch (error) {
      console.log(`\n❌ Error querying payments table: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking payments table:', error.message);
  } finally {
    await closeConnection();
  }
}

checkPaymentsTable();
