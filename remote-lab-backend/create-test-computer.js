import db from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function createTestComputer() {
  try {
    console.log('🔄 Creating test computer...');
    
    // Check if computer already exists
    const existing = await db('computers').where('id', 'test-computer-123').first();
    if (existing) {
      console.log('✅ Test computer already exists');
      return;
    }
    
    // Create test computer
    await db('computers').insert({
      id: 'test-computer-123',
      name: 'test-computer-123',
      description: 'Test Computer for Commands',
      ip_address: '192.168.1.100',
      nat_port_rdp: 3389,
      nat_port_winrm: 5985,
      status: 'available',
      created_at: new Date(),
      updated_at: new Date()
    });
    
    console.log('✅ Test computer created successfully');
  } catch (error) {
    console.error('❌ Error creating test computer:', error.message);
  } finally {
    await db.destroy();
  }
}

createTestComputer();
