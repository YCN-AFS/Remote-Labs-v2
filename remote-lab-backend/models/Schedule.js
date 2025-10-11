import { BaseModel } from './BaseModel.js';

export class Schedule extends BaseModel {
  constructor() {
    super('schedules');
  }

  // Find schedules by email
  async findByEmail(email) {
    return await this.findAll({ email });
  }

  // Find approved schedules by email
  async findApprovedByEmail(email) {
    return await this.findAll({ 
      email, 
      status: 'approved' 
    });
  }

  // Find schedules by status
  async findByStatus(status) {
    return await this.findAll({ status });
  }

  // Find pending schedules
  async findPending() {
    return await this.findByStatus('pending');
  }

  // Find approved schedules
  async findApproved() {
    return await this.findByStatus('approved');
  }

  // Find schedules by computer
  async findByComputer(computerId) {
    return await this.findAll({ computer_id: computerId });
  }

  // Find schedules in time range
  async findInTimeRange(startTime, endTime) {
    try {
      return await this.db(this.tableName)
        .where(function() {
          this.where('start_time', '>=', startTime)
              .andWhere('start_time', '<=', endTime);
        })
        .orWhere(function() {
          this.where('end_time', '>=', startTime)
              .andWhere('end_time', '<=', endTime);
        })
        .orWhere(function() {
          this.where('start_time', '<=', startTime)
              .andWhere('end_time', '>=', endTime);
        });
    } catch (error) {
      console.error('Error finding schedules in time range:', error);
      throw error;
    }
  }

  // Check if time slot is available
  async isTimeSlotAvailable(startTime, endTime, excludeId = null) {
    try {
      let query = this.db(this.tableName)
        .where('status', 'approved')
        .where(function() {
          this.where('start_time', '>=', startTime)
              .andWhere('start_time', '<', endTime);
        })
        .orWhere(function() {
          this.where('end_time', '>', startTime)
              .andWhere('end_time', '<=', endTime);
        })
        .orWhere(function() {
          this.where('start_time', '<=', startTime)
              .andWhere('end_time', '>=', endTime);
        });

      if (excludeId) {
        query = query.where('id', '!=', excludeId);
      }

      const conflicts = await query;
      return conflicts.length === 0;
    } catch (error) {
      console.error('Error checking time slot availability:', error);
      throw error;
    }
  }

  // Update schedule status
  async updateStatus(id, status) {
    return await this.updateById(id, { status });
  }

  // Approve schedule
  async approve(id, computerId, password) {
    return await this.updateById(id, {
      status: 'approved',
      computer_id: computerId,
      password: password
    });
  }

  // Cancel schedule
  async cancel(id) {
    return await this.updateById(id, { status: 'cancelled' });
  }

  // Get schedule statistics
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
      console.error('Error getting schedule statistics:', error);
      throw error;
    }
  }
}
