import db from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function testDatabase() {
  try {
    console.log('🔄 Testing database connection...');
    
    // Test basic connection
    await db.raw('SELECT 1');
    console.log('✅ Database connected successfully');
    
    // Test commands table
    const commands = await db('commands').select('*');
    console.log('✅ Commands table accessible, count:', commands.length);
    
    // Test pending commands
    const pendingCommands = await db('commands')
      .where('status', 'pending')
      .orderBy('created_at', 'asc');
    console.log('✅ Pending commands query successful, count:', pendingCommands.length);
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await db.destroy();
  }
}

testDatabase();
