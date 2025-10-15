#!/usr/bin/env node

import { Computer } from '../models/Computer.js';
import db from '../config/database.js';

const computer = new Computer();

// Real computer configurations - Update these with actual IPs
const realComputers = [
  {
    id: 'pc-lab-01',
    name: 'PC Lab 01 - Windows 10',
    description: 'Máy tính thực hành Windows 10 - Lập trình C++/Java',
    ip_address: '192.168.1.101', // Update with real IP
    nat_port_winrm: 5985,
    nat_port_rdp: 3389,
    status: 'available'
  },
  {
    id: 'pc-lab-02', 
    name: 'PC Lab 02 - Windows 11',
    description: 'Máy tính thực hành Windows 11 - Lập trình Python/Web',
    ip_address: '192.168.1.102', // Update with real IP
    nat_port_winrm: 5986,
    nat_port_rdp: 3390,
    status: 'available'
  },
  {
    id: 'pc-lab-03',
    name: 'PC Lab 03 - Windows Server',
    description: 'Máy tính thực hành Windows Server - Cơ sở dữ liệu',
    ip_address: '192.168.1.103', // Update with real IP
    nat_port_winrm: 5987,
    nat_port_rdp: 3391,
    status: 'available'
  },
  {
    id: 'pc-lab-04',
    name: 'PC Lab 04 - Development',
    description: 'Máy tính thực hành Development - Full Stack',
    ip_address: '192.168.1.104', // Update with real IP
    nat_port_winrm: 5988,
    nat_port_rdp: 3392,
    status: 'available'
  },
  {
    id: 'pc-lab-05',
    name: 'PC Lab 05 - Network Lab',
    description: 'Máy tính thực hành Network - Mạng máy tính',
    ip_address: '192.168.1.105', // Update with real IP
    nat_port_winrm: 5989,
    nat_port_rdp: 3393,
    status: 'maintenance'
  }
];

async function updateRealComputers() {
  try {
    console.log('🔄 Updating with real computer configurations...');
    
    // Clear existing test data (handle foreign key constraints)
    console.log('🧹 Clearing existing test data...');
    
    // First clear schedules that reference computers
    await db('schedules').whereNotNull('computer_id').del();
    
    // Then clear computers
    await db('computers').del();
    
    for (const pc of realComputers) {
      try {
        await computer.create(pc);
        console.log(`✅ Added: ${pc.name} (${pc.id}) - ${pc.ip_address}`);
      } catch (error) {
        console.error(`❌ Error adding ${pc.name}:`, error.message);
      }
    }
    
    console.log('\n📊 Computer Statistics:');
    const stats = await computer.getStatistics();
    console.log(stats);
    
    console.log('\n🎉 Real computers configured successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update IP addresses in this script with real lab computer IPs');
    console.log('2. Ensure lab computers are running and accessible');
    console.log('3. Test connections from the web interface');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

updateRealComputers();
