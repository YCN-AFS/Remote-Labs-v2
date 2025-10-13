#!/usr/bin/env node

/**
 * Test Login - Kiểm tra đăng nhập cho cả Admin và Student
 */

const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

async function testLogin() {
    console.log('🔐 Testing Login for both Admin and Student...\n');

    // Test Admin Login
    console.log('1️⃣ Testing Admin Login...');
    try {
        const adminResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@example.com',
            password: 'admin123'
        });
        console.log('✅ Admin Login Success:');
        console.log('   - Email:', adminResponse.data.data.user.email);
        console.log('   - Role:', adminResponse.data.data.user.role);
        console.log('   - Token:', adminResponse.data.data.token.substring(0, 20) + '...');
    } catch (error) {
        console.log('❌ Admin Login Failed:', error.response?.data?.message || error.message);
    }

    console.log('\n2️⃣ Testing Student Login...');
    try {
        const studentResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'ycn.foxcode@gmail.com',
            password: '123456'
        });
        console.log('✅ Student Login Success:');
        console.log('   - Email:', studentResponse.data.data.user.email);
        console.log('   - Role:', studentResponse.data.data.user.role);
        console.log('   - Token:', studentResponse.data.data.token.substring(0, 20) + '...');
    } catch (error) {
        console.log('❌ Student Login Failed:', error.response?.data?.message || error.message);
    }

    console.log('\n3️⃣ Testing Invalid Login...');
    try {
        await axios.post(`${API_BASE}/auth/login`, {
            email: 'invalid@example.com',
            password: 'wrongpassword'
        });
        console.log('❌ Invalid Login should have failed!');
    } catch (error) {
        console.log('✅ Invalid Login correctly rejected:', error.response?.data?.message);
    }

    console.log('\n🎉 Login tests completed!');
}

// Run tests
testLogin();

