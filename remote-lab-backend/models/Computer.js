import { BaseModel } from './BaseModel.js';

export class Computer extends BaseModel {
  constructor() {
    super('computers');
  }

  // Find available computers
  async findAvailable() {
    return await this.findAll({ status: 'available' });
  }

  // Find busy computers
  async findBusy() {
    return await this.findAll({ status: 'busy' });
  }

  // Update computer status
  async updateStatus(id, status) {
    return await this.updateById(id, { status });
  }

  // Get computer by port
  async findByPort(port) {
    return await this.findOne({ nat_port_winrm: port });
  }

  // Get computer by RDP port
  async findByRdpPort(port) {
    return await this.findOne({ nat_port_rdp: port });
  }

  // Get computer statistics
  async getStatistics() {
    try {
      const stats = await this.db(this.tableName)
        .select('status')
        .count('* as count')
        .groupBy('status');
      
      return stats.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {});
    } catch (error) {
      console.error('Error getting computer statistics:', error);
      throw error;
    }
  }
}
