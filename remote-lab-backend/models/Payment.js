import { BaseModel } from './BaseModel.js';

export class Payment extends BaseModel {
  constructor() {
    super('payments');
  }

  // Find payment by order code
  async findByOrderCode(orderCode) {
    return await this.findOne({ order_code: orderCode });
  }

  // Find payments by email
  async findByEmail(email) {
    return await this.findAll({ email });
  }

  // Update payment status
  async updateStatus(orderCode, status, payosResponse = null) {
    const updateData = { status };
    if (payosResponse) {
      updateData.payos_response = payosResponse;
    }
    
    return await this.update({ order_code: orderCode }, updateData);
  }

  // Get payments by status
  async findByStatus(status) {
    return await this.findAll({ status });
  }

  // Get payment statistics
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
      console.error('Error getting payment statistics:', error);
      throw error;
    }
  }
}
