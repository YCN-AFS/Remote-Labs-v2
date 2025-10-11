#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';
import db, { testConnection, closeConnection } from '../config/database.js';

const execAsync = promisify(exec);

async function createBackup() {
  console.log('💾 Starting database backup...');
  
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Cannot connect to database. Please check your configuration.');
      process.exit(1);
    }

    // Create backup directory
    const backupDir = './backups';
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `remote_labs_backup_${timestamp}.sql`);

    // Get database configuration
    const dbConfig = db.client.config.connection;
    
    // Create pg_dump command
    const pgDumpCmd = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f ${backupFile}`;
    
    // Set PGPASSWORD environment variable
    process.env.PGPASSWORD = dbConfig.password;

    console.log('📦 Creating database dump...');
    await execAsync(pgDumpCmd);
    
    console.log(`✅ Backup created successfully: ${backupFile}`);

    // Create backup metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      database: dbConfig.database,
      host: dbConfig.host,
      port: dbConfig.port,
      file: backupFile,
      size: (await import('fs')).statSync(backupFile).size
    };

    const metadataFile = path.join(backupDir, `backup_metadata_${timestamp}.json`);
    await writeFile(metadataFile, JSON.stringify(metadata, null, 2));
    
    console.log(`📋 Backup metadata saved: ${metadataFile}`);

    // Clean up old backups (keep last 10)
    await cleanupOldBackups(backupDir);

  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

async function cleanupOldBackups(backupDir) {
  try {
    const { readdir, stat, unlink } = await import('fs/promises');
    const files = await readdir(backupDir);
    const backupFiles = files
      .filter(file => file.startsWith('remote_labs_backup_') && file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        time: stat(path.join(backupDir, file)).then(stats => stats.mtime)
      }));

    // Sort by modification time (newest first)
    const sortedFiles = await Promise.all(backupFiles);
    sortedFiles.sort((a, b) => b.time - a.time);

    // Keep only the last 10 backups
    const filesToDelete = sortedFiles.slice(10);
    
    for (const file of filesToDelete) {
      await unlink(file.path);
      console.log(`🗑️  Deleted old backup: ${file.name}`);
    }

  } catch (error) {
    console.error('⚠️  Error cleaning up old backups:', error.message);
  }
}

// Run backup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createBackup();
}

export default createBackup;
