import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function createProfileStudent() {
    try {
        const email = 'svws21065@gmail.com';
        const password = '83ea529cf8e14';
        const fullName = 'VAN HOI TRAN';
        const [lastName, firstName] = fullName.split(' ').reverse();
        const phone = '123456789054';
        
        console.log('👤 Tạo tài khoản học viên qua Profile Service...');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('Full name:', fullName);
        
        // Tạo tài khoản trong Profile Service
        const profileUrl = process.env.PROFILE_BASE_URL + "/auth/register";
        const profileData = { 
            firstName, 
            lastName, 
            email, 
            phone, 
            password 
        };
        const headers = { "Content-Type": "application/json" };
        
        console.log('🔗 Profile URL:', profileUrl);
        console.log('📝 Profile Data:', JSON.stringify(profileData, null, 2));
        
        try {
            const response = await axios.post(profileUrl, profileData, { headers });
            console.log('✅ Tạo tài khoản profile thành công:', response.data);
        } catch (profileError) {
            if (profileError.response?.data?.message?.includes('already exists')) {
                console.log('ℹ️  Tài khoản profile đã tồn tại');
            } else {
                console.log('❌ Lỗi tạo tài khoản profile:', profileError.response?.data?.message || profileError.message);
            }
        }
        
        // Test đăng nhập vào Profile Service
        console.log('\n🔐 Testing login to Profile Service...');
        try {
            const loginUrl = process.env.PROFILE_BASE_URL + "/auth/login";
            const loginData = { email, password };
            
            const loginResponse = await axios.post(loginUrl, loginData, { headers });
            console.log('✅ Login to Profile Service successful!');
            console.log('Access Token:', loginResponse.data.accessToken ? 'Received' : 'Not received');
        } catch (loginError) {
            console.log('❌ Login failed:', loginError.response?.data?.message || loginError.message);
        }
        
        console.log('\n🎉 Tài khoản học viên đã sẵn sàng!');
        console.log('📧 Email:', email);
        console.log('🔑 Password:', password);
        console.log('🌐 Login URL: http://103.218.122.188:8080/login');
        console.log('📚 Bạn có thể đăng nhập để truy cập khóa học');
        
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    }
    
    process.exit(0);
}

createProfileStudent();




