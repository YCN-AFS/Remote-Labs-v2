#!/usr/bin/env node

/**
 * Test JWT Token - Kiểm tra JWT token hoạt động
 */

const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

async function testJWT() {
    console.log('🔐 Testing JWT Token...\n');

    // Step 1: Login to get token
    console.log('1️⃣ Login to get token...');
    let token = null;
    try {
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@example.com',
            password: 'admin123'
        });
        token = loginResponse.data.data.token;
        console.log('✅ Login successful, token:', token.substring(0, 20) + '...');
    } catch (error) {
        console.log('❌ Login failed:', error.response?.data?.message || error.message);
        return;
    }

    // Step 2: Test protected endpoint with token
    console.log('\n2️⃣ Testing protected endpoint with token...');
    try {
        const response = await axios.get(`${API_BASE}/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('✅ Protected endpoint accessible with token');
        console.log('   Response:', response.data);
    } catch (error) {
        console.log('❌ Protected endpoint failed:', error.response?.data?.message || error.message);
    }

    // Step 3: Test protected endpoint without token
    console.log('\n3️⃣ Testing protected endpoint without token...');
    try {
        await axios.get(`${API_BASE}/users`);
        console.log('❌ Protected endpoint should have failed!');
    } catch (error) {
        console.log('✅ Protected endpoint correctly rejected:', error.response?.data?.message);
    }

    // Step 4: Test protected endpoint with invalid token
    console.log('\n4️⃣ Testing protected endpoint with invalid token...');
    try {
        await axios.get(`${API_BASE}/users`, {
            headers: {
                'Authorization': 'Bearer invalid-token-123'
            }
        });
        console.log('❌ Invalid token should have failed!');
    } catch (error) {
        console.log('✅ Invalid token correctly rejected:', error.response?.data?.message);
    }

    console.log('\n🎉 JWT Token tests completed!');
}

// Run tests
testJWT();

