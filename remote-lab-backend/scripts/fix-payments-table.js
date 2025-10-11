#!/usr/bin/env node

import db, { testConnection, closeConnection } from '../config/database.js';

async function fixPaymentsTable() {
  console.log('🔧 Fixing payments table...');
  
  try {
    await testConnection();
    
    // Set search_path to public schema
    console.log('📍 Setting search_path to public...');
    await db.raw('SET search_path TO public');
    
    // Drop table if exists
    console.log('🗑️  Dropping existing payments table...');
    await db.raw('DROP TABLE IF EXISTS payments CASCADE');
    
    // Create table using raw SQL
    console.log('📋 Creating payments table with raw SQL...');
    await db.raw(`
      CREATE TABLE payments (
        id VARCHAR(255) PRIMARY KEY,
        order_code VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        phone VARCHAR(255),
        course_id VARCHAR(255),
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(255) DEFAULT 'pending',
        password VARCHAR(255),
        payment_method VARCHAR(255),
        payos_response JSON,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Payments table created successfully');
    
    // Test insert
    console.log('🧪 Testing insert...');
    await db.raw(`
      INSERT INTO payments (id, order_code, email, full_name, phone, course_id, amount, status, password)
      VALUES ('test-1', '123456', 'test@example.com', 'Test User', '0123456789', 'course-1', 5000, 'pending', 'testpass')
    `);
    console.log('✅ Test insert successful');
    
    // Test select
    const result = await db.raw('SELECT * FROM payments');
    console.log(`✅ Test select successful - found ${result.rows.length} records`);
    
    // Clean up test data
    await db.raw('DELETE FROM payments WHERE id = ?', ['test-1']);
    console.log('🧹 Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Error fixing payments table:', error.message);
  } finally {
    await closeConnection();
  }
}

fixPaymentsTable();
