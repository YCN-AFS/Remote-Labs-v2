#!/usr/bin/env node

import { testConnection, closeConnection } from '../config/database.js';

async function testDbConnection() {
  console.log('🔌 Testing database connection...');
  
  try {
    const connected = await testConnection();
    if (connected) {
      console.log('✅ Database connection successful');
    } else {
      console.log('❌ Database connection failed');
    }
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    await closeConnection();
  }
}

testDbConnection();
