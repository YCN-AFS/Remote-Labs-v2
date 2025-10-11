#!/usr/bin/env node

import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { JSONFile } from 'lowdb/node';
import { Low } from 'lowdb';
import { User } from '../models/User.js';
import { Student } from '../models/Student.js';
import { Payment } from '../models/Payment.js';
import { Computer } from '../models/Computer.js';
import { Schedule } from '../models/Schedule.js';
import { testConnection, closeConnection } from '../config/database.js';

async function migrateData() {
  console.log('🔄 Starting data migration from LowDB to PostgreSQL...');
  
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Cannot connect to database. Please check your configuration.');
      process.exit(1);
    }

    // Initialize models
    const userModel = new User();
    const studentModel = new Student();
    const paymentModel = new Payment();
    const computerModel = new Computer();
    const scheduleModel = new Schedule();

    // Check if LowDB files exist
    const dataDir = './data';
    const files = ['user.json', 'student.json', 'payment.json', 'computer.json', 'schedule.json'];
    
    for (const file of files) {
      const filePath = `${dataDir}/${file}`;
      if (!existsSync(filePath)) {
        console.log(`⚠️  File ${file} not found, skipping...`);
        continue;
      }

      console.log(`📁 Migrating ${file}...`);
      
      try {
        // Read LowDB file
        const adapter = new JSONFile(filePath);
        const db = new Low(adapter, []);
        await db.read();
        
        const data = db.data || [];
        console.log(`   Found ${data.length} records`);

        // Migrate based on file type
        switch (file) {
          case 'user.json':
            await migrateUsers(userModel, data);
            break;
          case 'student.json':
            await migrateStudents(studentModel, data);
            break;
          case 'payment.json':
            await migratePayments(paymentModel, data);
            break;
          case 'computer.json':
            await migrateComputers(computerModel, data);
            break;
          case 'schedule.json':
            await migrateSchedules(scheduleModel, data);
            break;
        }
        
        console.log(`✅ Successfully migrated ${file}`);
      } catch (error) {
        console.error(`❌ Error migrating ${file}:`, error.message);
      }
    }

    console.log('🎉 Data migration completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

async function migrateUsers(userModel, users) {
  for (const user of users) {
    try {
      await userModel.create(user);
    } catch (error) {
      console.error(`   Error migrating user ${user.id}:`, error.message);
    }
  }
}

async function migrateStudents(studentModel, students) {
  for (const student of students) {
    try {
      await studentModel.create(student);
    } catch (error) {
      console.error(`   Error migrating student ${student.id}:`, error.message);
    }
  }
}

async function migratePayments(paymentModel, payments) {
  for (const payment of payments) {
    try {
      await paymentModel.create(payment);
    } catch (error) {
      console.error(`   Error migrating payment ${payment.id}:`, error.message);
    }
  }
}

async function migrateComputers(computerModel, computers) {
  for (const computer of computers) {
    try {
      await computerModel.create(computer);
    } catch (error) {
      console.error(`   Error migrating computer ${computer.id}:`, error.message);
    }
  }
}

async function migrateSchedules(scheduleModel, schedules) {
  for (const schedule of schedules) {
    try {
      // Convert date strings to Date objects
      const scheduleData = {
        ...schedule,
        start_time: new Date(schedule.startTime),
        end_time: new Date(schedule.endTime)
      };
      
      await scheduleModel.create(scheduleData);
    } catch (error) {
      console.error(`   Error migrating schedule ${schedule.id}:`, error.message);
    }
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData();
}

export default migrateData;
