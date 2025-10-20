#!/usr/bin/env node

import axios from 'axios';

const SERVER_URL = 'http://localhost:8000';

async function testCommandSystem() {
  console.log('🧪 Testing Command System...\n');

  try {
    // Test 1: Get admin credentials
    console.log('1. Testing GET /api/admin-credentials...');
    const credentialsResponse = await axios.get(`${SERVER_URL}/api/admin-credentials`);
    console.log('✅ Admin credentials:', credentialsResponse.data);
    console.log('');

    // Test 2: Get all commands (should be empty initially)
    console.log('2. Testing GET /api/commands...');
    const commandsResponse = await axios.get(`${SERVER_URL}/api/commands`);
    console.log('✅ All commands:', commandsResponse.data);
    console.log('');

    // Test 3: Create a test command
    console.log('3. Testing POST /api/commands...');
    const testCommand = {
      computer_id: 'test-computer-123',
      action: 'create_user',
      parameters: {
        username: 'testuser',
        password: 'testpass123'
      }
    };
    
    const createResponse = await axios.post(`${SERVER_URL}/api/commands`, testCommand);
    console.log('✅ Command created:', createResponse.data);
    console.log('');

    // Test 4: Get commands again (should have the new command)
    console.log('4. Testing GET /api/commands after creation...');
    const commandsAfterResponse = await axios.get(`${SERVER_URL}/api/commands`);
    console.log('✅ Commands after creation:', commandsAfterResponse.data);
    console.log('');

    // Test 5: Send command status
    console.log('5. Testing POST /api/commands/status...');
    const statusData = {
      status: 'completed',
      message: 'User created successfully',
      computer: 'test-computer-123',
      commandId: createResponse.data.data.id,
      result: 'User testuser created successfully'
    };
    
    const statusResponse = await axios.post(`${SERVER_URL}/api/commands/status`, statusData);
    console.log('✅ Status sent:', statusResponse.data);
    console.log('');

    console.log('🎉 All tests passed! Command system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run tests
testCommandSystem();
