import { BaseModel } from './BaseModel.js';
import bcrypt from 'bcrypt';

export class User extends BaseModel {
  constructor() {
    super('users');
  }

  // Create user with hashed password
  async createUser(userData) {
    const { password, ...otherData } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return await this.create({
      ...otherData,
      password: hashedPassword
    });
  }

  // Find user by email
  async findByEmail(email) {
    return await this.findOne({ email });
  }

  // Find user by username
  async findByUsername(username) {
    return await this.findOne({ username });
  }

  // Verify password
  async verifyPassword(email, password) {
    const user = await this.findByEmail(email);
    if (!user) return false;
    
    return await bcrypt.compare(password, user.password);
  }

  // Update user password
  async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return await this.updateById(id, { password: hashedPassword });
  }

  // Get user without password
  async findByIdSafe(id) {
    const user = await this.findById(id);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }
}
