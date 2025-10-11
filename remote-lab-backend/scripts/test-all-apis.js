#!/usr/bin/env node

import axios from 'axios';

const BASE_URL = 'http://localhost:8000';
let authToken = '';

async function testAllAPIs() {
  console.log('🧪 Testing all APIs...');
  
  try {
    // Test 1: Health check
    console.log('\n1️⃣ Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/`);
    console.log(`✅ Health check: ${healthResponse.data}`);
    
    // Test 2: Login
    console.log('\n2️⃣ Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    authToken = loginResponse.data.data.token;
    console.log(`✅ Login successful: ${loginResponse.data.data.user.email}`);
    
    // Test 3: Create payment
    console.log('\n3️⃣ Testing create payment...');
    const paymentResponse = await axios.post(`${BASE_URL}/api/payment`, {
      firstName: 'API',
      lastName: 'Test',
      email: 'apitest@example.com',
      phone: '0999888777',
      courseId: 'course-api-test'
    });
    console.log(`✅ Payment created: ${paymentResponse.data.data.orderCode} - ${paymentResponse.data.data.amount} VND`);
    
    // Test 4: Get payments
    console.log('\n4️⃣ Testing get payments...');
    const paymentsResponse = await axios.get(`${BASE_URL}/api/payment`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Payments retrieved: ${paymentsResponse.data.data.length} records`);
    
    // Test 5: Get computers
    console.log('\n5️⃣ Testing get computers...');
    const computersResponse = await axios.get(`${BASE_URL}/api/computer`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Computers retrieved: ${computersResponse.data.data.length} records`);
    
    // Test 6: Create computer
    console.log('\n6️⃣ Testing create computer...');
    const createComputerResponse = await axios.post(`${BASE_URL}/api/computer`, {
      name: 'API Test Computer',
      description: 'Computer created via API test',
      natPortRdp: 3390,
      natPortWinRm: 5986
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Computer created: ${createComputerResponse.data.data.id}`);
    
    // Test 7: Get schedules
    console.log('\n7️⃣ Testing get schedules...');
    const schedulesResponse = await axios.get(`${BASE_URL}/api/schedule/apitest@example.com`);
    console.log(`✅ Schedules retrieved: ${schedulesResponse.data.data.length} records`);
    
    // Test 8: Get all schedules (admin)
    console.log('\n8️⃣ Testing get all schedules...');
    const allSchedulesResponse = await axios.get(`${BASE_URL}/api/schedule`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ All schedules retrieved: ${allSchedulesResponse.data.data.length} records`);
    
    console.log('\n🎉 All API tests passed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Health check: ✅`);
    console.log(`- Authentication: ✅`);
    console.log(`- Payment creation: ✅`);
    console.log(`- Payment retrieval: ✅`);
    console.log(`- Computer management: ✅`);
    console.log(`- Schedule management: ✅`);
    console.log(`- Database integration: ✅`);
    
  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testAllAPIs();
