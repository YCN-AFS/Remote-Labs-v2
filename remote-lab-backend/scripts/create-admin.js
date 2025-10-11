#!/usr/bin/env node

import { User } from '../models/User.js';
import { testConnection, closeConnection } from '../config/database.js';

async function createAdminUser() {
  console.log('👤 Creating admin user...');
  
  try {
    await testConnection();
    const userModel = new User();
    
    try {
      const admin = await userModel.createUser({
        id: 'admin-1',
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('✅ Admin user created:', admin.email);
    } catch (error) {
      if (error.code === '23505') {
        console.log('ℹ️  Admin user already exists');
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

createAdminUser();
