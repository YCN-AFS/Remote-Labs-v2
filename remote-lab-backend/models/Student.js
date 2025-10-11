import { BaseModel } from './BaseModel.js';

export class Student extends BaseModel {
  constructor() {
    super('students');
  }

  // Find student by email
  async findByEmail(email) {
    return await this.findOne({ email });
  }

  // Create or update student
  async createOrUpdate(studentData) {
    const existingStudent = await this.findByEmail(studentData.email);
    
    if (existingStudent) {
      return await this.updateById(existingStudent.id, studentData);
    } else {
      return await this.create(studentData);
    }
  }

  // Get students by course
  async findByCourse(courseId) {
    return await this.findAll({ course_id: courseId });
  }
}
