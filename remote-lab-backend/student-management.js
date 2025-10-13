import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

/**
 * Student Management System - Independent of Moodle
 * Quản lý học viên độc lập không cần Moodle
 */

export class StudentManager {
  constructor(StudentModel, UserModel) {
    this.Student = StudentModel;
    this.User = UserModel;
  }

  /**
   * Tạo học viên mới (thay thế cho Moodle)
   */
  async createStudent(studentData) {
    const { email, fullName, phone, courseId } = studentData;
    
    // Kiểm tra email đã tồn tại chưa
    const existingStudent = await this.Student.findByEmail(email);
    if (existingStudent) {
      throw new Error('Email đã được sử dụng');
    }

    // Tạo học viên trong database
    const studentId = nanoid();
    const student = await this.Student.create({
      id: studentId,
      email: email,
      full_name: fullName,
      phone: phone,
      course_id: courseId,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Tạo tài khoản đăng nhập cho học viên
    const userId = nanoid();
    const hashedPassword = await bcrypt.hash('123456', 10); // Mật khẩu mặc định
    
    await this.User.create({
      id: userId,
      username: email.split('@')[0], // Username từ email
      email: email,
      password: hashedPassword,
      role: 'student',
      created_at: new Date(),
      updated_at: new Date()
    });

    return {
      student,
      credentials: {
        username: email.split('@')[0],
        email: email,
        password: '123456' // Mật khẩu mặc định
      }
    };
  }

  /**
   * Tìm học viên theo email
   */
  async findStudentByEmail(email) {
    return await this.Student.findByEmail(email);
  }

  /**
   * Cập nhật thông tin học viên
   */
  async updateStudent(studentId, updateData) {
    return await this.Student.updateById(studentId, {
      ...updateData,
      updated_at: new Date()
    });
  }

  /**
   * Lấy danh sách học viên theo khóa học
   */
  async getStudentsByCourse(courseId) {
    return await this.Student.findByCourse(courseId);
  }

  /**
   * Lấy tất cả học viên
   */
  async getAllStudents() {
    return await this.Student.findAll();
  }

  /**
   * Xóa học viên
   */
  async deleteStudent(studentId) {
    const student = await this.Student.findById(studentId);
    if (!student) {
      throw new Error('Không tìm thấy học viên');
    }

    // Xóa tài khoản user tương ứng
    const user = await this.User.findByEmail(student.email);
    if (user) {
      await this.User.deleteById(user.id);
    }

    // Xóa học viên
    return await this.Student.deleteById(studentId);
  }

  /**
   * Kiểm tra học viên có tồn tại không (thay thế cho Moodle check)
   */
  async validateStudent(email) {
    const student = await this.Student.findByEmail(email);
    return student !== null;
  }

  /**
   * Đăng ký học viên vào khóa học
   */
  async enrollStudent(email, courseId) {
    const student = await this.Student.findByEmail(email);
    if (!student) {
      throw new Error('Học viên không tồn tại');
    }

    return await this.Student.updateById(student.id, {
      course_id: courseId,
      updated_at: new Date()
    });
  }

  /**
   * Lấy thống kê học viên
   */
  async getStudentStats() {
    const allStudents = await this.Student.findAll();
    const studentsByCourse = {};
    
    allStudents.forEach(student => {
      const courseId = student.course_id || 'Chưa đăng ký';
      studentsByCourse[courseId] = (studentsByCourse[courseId] || 0) + 1;
    });

    return {
      total: allStudents.length,
      byCourse: studentsByCourse,
      recent: allStudents
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10)
    };
  }

  /**
   * Tìm kiếm học viên
   */
  async searchStudents(query) {
    const allStudents = await this.Student.findAll();
    const searchTerm = query.toLowerCase();
    
    return allStudents.filter(student => 
      student.email.toLowerCase().includes(searchTerm) ||
      (student.full_name && student.full_name.toLowerCase().includes(searchTerm)) ||
      (student.phone && student.phone.includes(searchTerm))
    );
  }
}
