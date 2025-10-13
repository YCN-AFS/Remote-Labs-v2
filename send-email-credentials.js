#!/usr/bin/env node

/**
 * Send Email Credentials - Gửi email thông tin đăng nhập
 */

const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

async function sendEmailCredentials() {
    console.log('📧 Sending email credentials...\n');

    try {
        // Get student info
        console.log('1️⃣ Getting student info...');
        const studentsResponse = await axios.get(`${API_BASE}/students`);
        const students = studentsResponse.data.data;
        
        const student = students.find(s => s.email === 'ycn.foxcode@gmail.com');
        if (!student) {
            console.log('❌ Student not found');
            return;
        }
        
        console.log('✅ Student found:', student.full_name);

        // Get user credentials
        console.log('\n2️⃣ Getting user credentials...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'ycn.foxcode@gmail.com',
            password: '123456'
        });
        
        const { user, token } = loginResponse.data.data;
        console.log('✅ User credentials:', {
            email: user.email,
            username: user.username,
            password: '123456'
        });

        // Send email (simulate)
        console.log('\n3️⃣ Email would be sent with:');
        console.log('📧 To:', user.email);
        console.log('📧 Subject: Lab T&A - Thông tin đăng nhập Remote Lab');
        console.log('📧 Website: http://103.218.122.188:8080/login');
        console.log('📧 Email:', user.email);
        console.log('📧 Password: 123456');

        console.log('\n🎉 Email credentials ready!');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Run
sendEmailCredentials();
