#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runMigration() {
  try {
    console.log('🔄 Running database migration...');
    
    // Run the migration
    const { stdout, stderr } = await execAsync('npx knex migrate:latest');
    
    if (stdout) {
      console.log('Migration output:', stdout);
    }
    
    if (stderr) {
      console.error('Migration errors:', stderr);
    }
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();



