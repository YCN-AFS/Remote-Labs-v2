#!/usr/bin/env node

/**
 * Send Login Credentials - Gửi lại thông tin đăng nhập cho học viên
 */

const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

async function sendLoginCredentials() {
    console.log('📧 Sending login credentials to students...\n');

    try {
        // Get all students
        console.log('1️⃣ Getting all students...');
        const studentsResponse = await axios.get(`${API_BASE}/students`);
        const students = studentsResponse.data.data;
        console.log(`✅ Found ${students.length} students`);

        // Send credentials to each student
        for (const student of students) {
            console.log(`\n2️⃣ Sending credentials to ${student.email}...`);
            
            try {
                // Get user credentials
                const userResponse = await axios.get(`${API_BASE}/users/search?email=${student.email}`);
                const users = userResponse.data.data;
                
                if (users.length > 0) {
                    const user = users[0];
                    console.log(`✅ Found user: ${user.username} (${user.email})`);
                    console.log(`📧 Password: ${user.password || '123456'}`);
                    
                    // Here you would normally send email, but for now just log
                    console.log(`📧 Email would be sent to ${student.email} with password: ${user.password || '123456'}`);
                } else {
                    console.log(`❌ No user found for ${student.email}`);
                }
            } catch (error) {
                console.log(`❌ Error getting user for ${student.email}:`, error.message);
            }
        }

        console.log('\n🎉 Login credentials check completed!');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Run
sendLoginCredentials();
