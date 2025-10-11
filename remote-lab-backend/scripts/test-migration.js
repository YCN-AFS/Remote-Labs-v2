#!/usr/bin/env node

import { User } from '../models/User.js';
import { Student } from '../models/Student.js';
import { Payment } from '../models/Payment.js';
import { Computer } from '../models/Computer.js';
import { Schedule } from '../models/Schedule.js';
import { testConnection, closeConnection } from '../config/database.js';

async function testMigration() {
  console.log('🧪 Testing database migration...');
  
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Cannot connect to database');
      process.exit(1);
    }

    // Initialize models
    const userModel = new User();
    const studentModel = new Student();
    const paymentModel = new Payment();
    const computerModel = new Computer();
    const scheduleModel = new Schedule();

    // Test User model
    console.log('👤 Testing User model...');
    const testUser = await userModel.createUser({
      id: 'test-user-1',
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword123',
      role: 'user'
    });
    console.log('✅ User created:', testUser.id);

    // Test Student model
    console.log('🎓 Testing Student model...');
    const testStudent = await studentModel.create({
      id: 'test-student-1',
      email: 'student@example.com',
      full_name: 'Test Student',
      phone: '0123456789',
      course_id: 'course-1'
    });
    console.log('✅ Student created:', testStudent.id);

    // Test Payment model
    console.log('💳 Testing Payment model...');
    const testPayment = await paymentModel.create({
      id: 'test-payment-1',
      order_code: '123456',
      email: 'payment@example.com',
      full_name: 'Test Payment',
      phone: '0987654321',
      course_id: 'course-1',
      amount: 100000,
      status: 'pending'
    });
    console.log('✅ Payment created:', testPayment.id);

    // Test Computer model
    console.log('💻 Testing Computer model...');
    const testComputer = await computerModel.create({
      id: 'test-computer-1',
      name: 'Test Computer',
      ip_address: '192.168.1.100',
      nat_port_winrm: 5985,
      nat_port_rdp: 3389,
      status: 'available',
      description: 'Test computer for migration'
    });
    console.log('✅ Computer created:', testComputer.id);

    // Test Schedule model
    console.log('📅 Testing Schedule model...');
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    
    const testSchedule = await scheduleModel.create({
      id: 'test-schedule-1',
      email: 'schedule@example.com',
      user_name: 'testsch',
      password: 'testpass123',
      start_time: startTime,
      end_time: endTime,
      status: 'pending',
      computer_id: testComputer.id
    });
    console.log('✅ Schedule created:', testSchedule.id);

    // Test queries
    console.log('🔍 Testing queries...');
    
    // Test find operations
    const users = await userModel.findAll();
    console.log(`✅ Found ${users.length} users`);

    const students = await studentModel.findAll();
    console.log(`✅ Found ${students.length} students`);

    const payments = await paymentModel.findAll();
    console.log(`✅ Found ${payments.length} payments`);

    const computers = await computerModel.findAll();
    console.log(`✅ Found ${computers.length} computers`);

    const schedules = await scheduleModel.findAll();
    console.log(`✅ Found ${schedules.length} schedules`);

    // Test specific queries
    const userByEmail = await userModel.findByEmail('test@example.com');
    console.log('✅ User found by email:', userByEmail ? 'Yes' : 'No');

    const paymentByOrderCode = await paymentModel.findByOrderCode('123456');
    console.log('✅ Payment found by order code:', paymentByOrderCode ? 'Yes' : 'No');

    const availableComputers = await computerModel.findAvailable();
    console.log(`✅ Found ${availableComputers.length} available computers`);

    // Test update operations
    console.log('🔄 Testing update operations...');
    
    await userModel.updateById(testUser.id, { role: 'admin' });
    console.log('✅ User updated');

    await computerModel.updateStatus(testComputer.id, 'busy');
    console.log('✅ Computer status updated');

    await scheduleModel.updateStatus(testSchedule.id, 'approved');
    console.log('✅ Schedule status updated');

    // Test delete operations
    console.log('🗑️  Testing delete operations...');
    
    // Delete in correct order (schedules first due to foreign key)
    await scheduleModel.deleteById(testSchedule.id);
    console.log('✅ Schedule deleted');

    await computerModel.deleteById(testComputer.id);
    console.log('✅ Computer deleted');

    await userModel.deleteById(testUser.id);
    console.log('✅ User deleted');

    await studentModel.deleteById(testStudent.id);
    console.log('✅ Student deleted');

    await paymentModel.deleteById(testPayment.id);
    console.log('✅ Payment deleted');

    console.log('🎉 All migration tests passed!');

  } catch (error) {
    console.error('❌ Migration test failed:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testMigration();
}

export default testMigration;
