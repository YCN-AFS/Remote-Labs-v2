import db from '../config/database.js';
import { nanoid } from 'nanoid';

export class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = db;
  }

  // Generate unique ID
  generateId() {
    return nanoid();
  }

  // Create a new record
  async create(data) {
    try {
      const [record] = await this.db(this.tableName)
        .insert({
          ...data,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');
      return record;
    } catch (error) {
      console.error(`Error creating record in ${this.tableName}:`, error);
      throw error;
    }
  }

  // Find all records
  async findAll(conditions = {}) {
    try {
      return await this.db(this.tableName)
        .where(conditions)
        .orderBy('created_at', 'desc');
    } catch (error) {
      console.error(`Error finding records in ${this.tableName}:`, error);
      throw error;
    }
  }

  // Find one record by ID
  async findById(id) {
    try {
      const [record] = await this.db(this.tableName)
        .where('id', id)
        .limit(1);
      return record;
    } catch (error) {
      console.error(`Error finding record by ID in ${this.tableName}:`, error);
      throw error;
    }
  }

  // Find one record by conditions
  async findOne(conditions) {
    try {
      const [record] = await this.db(this.tableName)
        .where(conditions)
        .limit(1);
      return record;
    } catch (error) {
      console.error(`Error finding record in ${this.tableName}:`, error);
      throw error;
    }
  }

  // Update record by ID
  async updateById(id, data) {
    try {
      const [record] = await this.db(this.tableName)
        .where('id', id)
        .update({
          ...data,
          updated_at: new Date()
        })
        .returning('*');
      return record;
    } catch (error) {
      console.error(`Error updating record in ${this.tableName}:`, error);
      throw error;
    }
  }

  // Update records by conditions
  async update(conditions, data) {
    try {
      return await this.db(this.tableName)
        .where(conditions)
        .update({
          ...data,
          updated_at: new Date()
        });
    } catch (error) {
      console.error(`Error updating records in ${this.tableName}:`, error);
      throw error;
    }
  }

  // Delete record by ID
  async deleteById(id) {
    try {
      return await this.db(this.tableName)
        .where('id', id)
        .del();
    } catch (error) {
      console.error(`Error deleting record in ${this.tableName}:`, error);
      throw error;
    }
  }

  // Delete records by conditions
  async delete(conditions) {
    try {
      return await this.db(this.tableName)
        .where(conditions)
        .del();
    } catch (error) {
      console.error(`Error deleting records in ${this.tableName}:`, error);
      throw error;
    }
  }

  // Count records
  async count(conditions = {}) {
    try {
      const result = await this.db(this.tableName)
        .where(conditions)
        .count('* as count')
        .first();
      return parseInt(result.count);
    } catch (error) {
      console.error(`Error counting records in ${this.tableName}:`, error);
      throw error;
    }
  }

  // Get all data (for compatibility with LowDB)
  get data() {
    return this.findAll();
  }

  // Write data (for compatibility with LowDB)
  async write() {
    // This method is kept for compatibility but doesn't do anything
    // as PostgreSQL handles persistence automatically
    return Promise.resolve();
  }
}
