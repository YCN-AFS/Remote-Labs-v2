#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function fixBackend() {
    try {
        console.log('🔄 Fixing backend...');
        
        // Kill existing processes
        console.log('🧹 Killing existing processes...');
        try {
            await execAsync('pkill -f "node index.js"');
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.log('No existing processes to kill');
        }
        
        // Check if port 8000 is free
        try {
            const { stdout } = await execAsync('lsof -ti:8000');
            if (stdout.trim()) {
                console.log('⚠️  Port 8000 still in use, force killing...');
                await execAsync('lsof -ti:8000 | xargs kill -9');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.log('Port 8000 is free');
        }
        
        // Start backend
        console.log('🚀 Starting backend...');
        const child = exec('cd /home/foxcode/Remote-Labs-v2/remote-lab-backend && node index.js');
        
        child.stdout.on('data', (data) => {
            console.log(data.toString());
        });
        
        child.stderr.on('data', (data) => {
            console.error(data.toString());
        });
        
        // Wait a bit and test
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('✅ Backend should be running now!');
        console.log('🌐 Test: http://103.218.122.188:8000/');
        console.log('🌐 Computer status: http://103.218.122.188:8080/dashboard/computer');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

fixBackend();
