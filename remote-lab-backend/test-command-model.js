import Command from './models/Command.js';
import dotenv from 'dotenv';

dotenv.config();

async function testCommandModel() {
  let commandModel;
  try {
    console.log('🔄 Testing Command model...');
    
    commandModel = new Command();
    
    // Test getAllPendingCommands
    const commands = await commandModel.getAllPendingCommands();
    console.log('✅ getAllPendingCommands successful, count:', commands.length);
    
    if (commands.length > 0) {
      console.log('First command:', commands[0]);
    }
    
  } catch (error) {
    console.error('❌ Command model test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (commandModel) {
      await commandModel.db.destroy();
    }
  }
}

testCommandModel();
