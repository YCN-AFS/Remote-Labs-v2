#!/usr/bin/env node

import db, { testConnection, closeConnection } from '../config/database.js';

async function recreatePaymentsTable() {
  console.log('🔄 Recreating payments table...');
  
  try {
    await testConnection();
    
    // Drop table if exists
    console.log('🗑️  Dropping existing payments table...');
    await db.raw('DROP TABLE IF EXISTS payments CASCADE');
    
    // Create table again
    console.log('📋 Creating payments table...');
    await db.schema.createTable('payments', (table) => {
      table.string('id').primary();
      table.string('order_code').notNullable().unique();
      table.string('email').notNullable();
      table.string('full_name');
      table.string('phone');
      table.string('course_id');
      table.decimal('amount', 10, 2).notNullable();
      table.string('status').defaultTo('pending');
      table.string('password');
      table.string('payment_method');
      table.json('payos_response');
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
    
    console.log('✅ Payments table created successfully');
    
    // Test insert
    console.log('🧪 Testing insert...');
    const testPayment = {
      id: 'test-1',
      order_code: '123456',
      email: 'test@example.com',
      full_name: 'Test User',
      phone: '0123456789',
      course_id: 'course-1',
      amount: 5000,
      status: 'pending',
      password: 'testpass'
    };
    
    await db('payments').insert(testPayment);
    console.log('✅ Test insert successful');
    
    // Test select
    const payments = await db('payments').select('*');
    console.log(`✅ Test select successful - found ${payments.length} records`);
    
  } catch (error) {
    console.error('❌ Error recreating payments table:', error.message);
  } finally {
    await closeConnection();
  }
}

recreatePaymentsTable();
