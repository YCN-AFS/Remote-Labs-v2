import { BaseModel } from './BaseModel.js';

class Command extends BaseModel {
  constructor() {
    super('commands');
  }

  // Create a new command
  async createCommand(data) {
    const commandData = {
      id: this.generateId(),
      computer_id: data.computer_id,
      action: data.action,
      parameters: data.parameters || {},
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };

    return await this.create(commandData);
  }

  // Get pending commands for a specific computer
  async getPendingCommands(computerId) {
    return await this.db('commands')
      .where('computer_id', computerId)
      .where('status', 'pending')
      .orderBy('created_at', 'asc');
  }

  // Get all pending commands (for general polling)
  async getAllPendingCommands() {
    return await this.db('commands')
      .where('status', 'pending')
      .orderBy('created_at', 'asc');
  }

  // Update command status
  async updateStatus(commandId, status, result = null, error = null) {
    const updateData = {
      status,
      updated_at: new Date()
    };

    if (result !== null) {
      updateData.result = result;
    }

    if (error !== null) {
      updateData.error = error;
    }

    if (status === 'executing') {
      updateData.executed_at = new Date();
    } else if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date();
    }

    return await this.updateById(commandId, updateData);
  }

  // Mark command as executed
  async markAsExecuted(commandId) {
    return await this.updateStatus(commandId, 'executing');
  }

  // Mark command as completed
  async markAsCompleted(commandId, result = null) {
    return await this.updateStatus(commandId, 'completed', result);
  }

  // Mark command as failed
  async markAsFailed(commandId, error) {
    return await this.updateStatus(commandId, 'failed', null, error);
  }

  // Get commands by computer and status
  async getCommandsByComputerAndStatus(computerId, status) {
    return await this.db(this.tableName)
      .where('computer_id', computerId)
      .where('status', status)
      .orderBy('created_at', 'asc');
  }

  // Clean up old completed commands (older than 7 days)
  async cleanupOldCommands() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return await this.db(this.tableName)
      .whereIn('status', ['completed', 'failed'])
      .where('completed_at', '<', sevenDaysAgo)
      .del();
  }
}

export { Command };
