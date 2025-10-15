#!/usr/bin/env node

import { Computer } from '../models/Computer.js';
import db from '../config/database.js';

const computer = new Computer();

const sampleComputers = [
  {
    id: 'pc-001',
    name: 'PC Thực hành 01',
    description: 'Máy tính thực hành lập trình C++',
    ip_address: '192.168.1.101',
    nat_port_winrm: 5985,
    nat_port_rdp: 3389,
    status: 'available'
  },
  {
    id: 'pc-002', 
    name: 'PC Thực hành 02',
    description: 'Máy tính thực hành lập trình Java',
    ip_address: '192.168.1.102',
    nat_port_winrm: 5986,
    nat_port_rdp: 3390,
    status: 'available'
  },
  {
    id: 'pc-003',
    name: 'PC Thực hành 03', 
    description: 'Máy tính thực hành lập trình Python',
    ip_address: '192.168.1.103',
    nat_port_winrm: 5987,
    nat_port_rdp: 3391,
    status: 'busy'
  },
  {
    id: 'pc-004',
    name: 'PC Thực hành 04',
    description: 'Máy tính thực hành cơ sở dữ liệu',
    ip_address: '192.168.1.104', 
    nat_port_winrm: 5988,
    nat_port_rdp: 3392,
    status: 'available'
  },
  {
    id: 'pc-005',
    name: 'PC Thực hành 05',
    description: 'Máy tính thực hành mạng máy tính',
    ip_address: '192.168.1.105',
    nat_port_winrm: 5989,
    nat_port_rdp: 3393,
    status: 'maintenance'
  }
];

async function addSampleComputers() {
  try {
    console.log('🔄 Adding sample computers...');
    
    for (const pc of sampleComputers) {
      try {
        await computer.create(pc);
        console.log(`✅ Added: ${pc.name} (${pc.id})`);
      } catch (error) {
        if (error.message.includes('duplicate key')) {
          console.log(`⚠️  Already exists: ${pc.name} (${pc.id})`);
        } else {
          console.error(`❌ Error adding ${pc.name}:`, error.message);
        }
      }
    }
    
    console.log('\n📊 Computer Statistics:');
    const stats = await computer.getStatistics();
    console.log(stats);
    
    console.log('\n🎉 Sample computers added successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

addSampleComputers();
