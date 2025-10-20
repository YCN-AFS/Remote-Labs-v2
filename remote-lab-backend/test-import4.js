import { Command } from './models/Command.js';

console.log('Command type:', typeof Command);
console.log('Command constructor:', Command);

try {
  const command = new Command();
  console.log('✅ Command instance created successfully');
} catch (error) {
  console.error('❌ Error creating Command instance:', error.message);
}
