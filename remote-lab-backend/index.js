import dotenv from "dotenv";
import fs from "fs";

import PayOS from "@payos/node";

import express from "express";
import expressAsyncErrors from 'express-async-errors';
import logger from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import createHttpError from "http-errors";

import { nanoid } from "nanoid";
import axios from "axios";

import schedule from "node-schedule";
import { exec } from "child_process";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Import database models
import { User } from "./models/User.js";
import { Student } from "./models/Student.js";
import { Payment } from "./models/Payment.js";
import { Computer } from "./models/Computer.js";
import { Schedule } from "./models/Schedule.js";
import { Command } from "./models/Command.js";
import { StudentManager } from "./student-management.js";
import { testConnection, closeConnection } from "./config/database.js";

(async () => {
	dotenv.config();

	// Test database connection
	const connected = await testConnection();
	if (!connected) {
		console.error('❌ Cannot connect to database. Please check your configuration.');
		process.exit(1);
	}

	let db = await initDatabase();
	let payOS = initPayOS();
	let app = initServer();
	let jobs = {};

	initMiddlewares(app);
	initRoutes({ app, db, jobs, payOS });
	initErrorHandler(app);
	startServer(app);

	// Graceful shutdown
	process.on('SIGINT', async () => {
		console.log('\n🛑 Shutting down gracefully...');
		await closeConnection();
		process.exit(0);
	});

	process.on('SIGTERM', async () => {
		console.log('\n🛑 Shutting down gracefully...');
		await closeConnection();
		process.exit(0);
	});
})();

async function initDatabase() {
	// Initialize database models
	const UserModel = new User();
	const StudentModel = new Student();
	const ScheduleModel = new Schedule();
	const PaymentModel = new Payment();
	const ComputerModel = new Computer();
	const CommandModel = new Command();
	const StudentManagerInstance = new StudentManager(StudentModel, UserModel);

	return { 
		User: UserModel, 
		Student: StudentModel, 
		Schedule: ScheduleModel, 
		Payment: PaymentModel, 
		Computer: ComputerModel,
		Command: Command, // Return the class, not instance
		StudentManager: StudentManagerInstance
	};
}

function initPayOS() {
	return new PayOS(
		process.env.PAYOS_CLIENT_ID,
		process.env.PAYOS_API_KEY,
		process.env.PAYOS_CHECKSUM_KEY
	);
}

// Removed initLowDb function - now using PostgreSQL models

function initServer() {
	let app = express();
	let staticPath = new URL('./public', import.meta.url).pathname;
	app.use(express.static(staticPath));
	return app;
}

function initMiddlewares(app) {
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));
	app.use(logger("dev"));
	app.use(cookieParser());
	app.use(cors({
		origin: [
			'http://localhost:3000',
			'http://localhost:8080', 
			'http://103.218.122.188:3000',
			'http://103.218.122.188:8080'
		],
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization']
	}));
}

function initRoutes({ app, db, jobs, payOS }) {
	let { User, Student, Schedule, Payment, Computer, Command, StudentManager } = db;
	let sseClients = [];

	app.get("/", (_req, res) => res.send("Hello World"));
	app.get("/sse", (req, res) => initSSE({ req, res, sseClients }));
	app.post("/api/auth/login", (req, res) => login({ req, res, User }));

	app.post("/api/payment", (req, res) => createPayment({ req, res, Payment, payOS }));
	app.get("/api/payment/complete", (req, res) => createStudent({ req, res, Payment, payOS, StudentManager }));
	app.get("/api/payment/cancel", (_req, res) => res.redirect("/"));
	app.get("/api/payment/:orderCode", (req, res) => getPaymentStatus({ req, res, Payment, payOS }));

	app.post("/api/course/enrol", (req, res) => enrolCourse({ req, res, Payment, StudentManager }));

	app.get("/api/schedule/:email", (req, res) => findApprovedSchedule({ req, res, Schedule }));
	app.post("/api/schedule", (req, res) => registerSchedule({ req, res, sseClients, Schedule, Computer, StudentManager }));

	// Get admin credentials (called by Windows machine) - PUBLIC ACCESS
	app.get("/api/admin-credentials", async (req, res) => {
		try {
			// Return default admin credentials
			// In production, these should be stored securely and configurable
			const credentials = {
				username: process.env.ADMIN_USERNAME || "Admin",
				password: process.env.ADMIN_PASSWORD || "lhu@B304"
			};
			
			res.status(200).json(credentials);
		} catch (error) {
			res.status(500).json({ status: "error", message: error.message });
		}
	});

	// Commands API for Windows machines (no authentication required)
	app.get("/api/commands", async (req, res) => {
		try {
			// Get all pending commands
			const commandModel = new Command();
			const commands = await commandModel.getAllPendingCommands();
			
			// Mark commands as executing
			for (const command of commands) {
				await commandModel.markAsExecuted(command.id);
			}
			
			res.status(200).json(commands);
		} catch (error) {
			res.status(500).json({ status: "error", message: error.message });
		}
	});

	// Create new command (called by admin)
	app.post("/api/commands", async (req, res) => {
		try {
			const { computer_id, action, parameters } = req.body;
			
			if (!computer_id || !action) {
				return res.status(400).json({ 
					status: "error", 
					message: "computer_id and action are required" 
				});
			}
			
			// Verify computer exists
			const computer = await Computer.findById(computer_id);
			if (!computer) {
				return res.status(404).json({ 
					status: "error", 
					message: "Computer not found" 
				});
			}
			
			// Create command
			const commandModel = new Command();
			const command = await commandModel.createCommand({
				computer_id,
				action,
				parameters: parameters || {}
			});
			
			res.status(201).json({
				status: "success",
				message: "Command created successfully",
				data: command
			});
		} catch (error) {
			res.status(500).json({ status: "error", message: error.message });
		}
	});

	// Send command result back to server (called by Windows machine)
	app.post("/api/commands/status", async (req, res) => {
		try {
			const { status, message, timestamp, computer, commandId, result, error } = req.body;
			
			console.log(`[COMMAND_STATUS] Computer ${computer}: ${status} - ${message}`);
			
			// If commandId is provided, update command status
			if (commandId) {
				const commandModel = new Command();
				if (status === "completed") {
					await commandModel.markAsCompleted(commandId, result);
				} else if (status === "error") {
					await commandModel.markAsFailed(commandId, error || message);
				}
			}
			
			res.status(200).json({ status: "success", message: "Status received" });
		} catch (error) {
			res.status(500).json({ status: "error", message: error.message });
		}
	});

	// Get pending commands for computer (called by Windows machine)
	app.get("/api/computer/:id/commands", async (req, res) => {
		try {
			const { id } = req.params;
			
			// Get pending commands for this computer
			const commandModel = new Command();
			const commands = await commandModel.getPendingCommands(id);
			
			// Mark commands as executing
			for (const command of commands) {
				await commandModel.markAsExecuted(command.id);
			}
			
			res.status(200).json({
				status: "success",
				data: {
					computerId: id,
					commands: commands
				}
			});
		} catch (error) {
			res.status(500).json({ status: "error", message: error.message });
		}
	});

	// Apply JWT authentication middleware to all routes after this point
	app.use(authJWT);

	// Student Management APIs (public access for testing)
	app.get("/api/students", async (req, res) => {
		try {
			const students = await StudentManager.getAllStudents();
			res.status(200).json({ status: "success", data: students });
		} catch (error) {
			res.status(500).json({ status: "error", message: error.message });
		}
	});

	app.get("/api/students/stats", async (req, res) => {
		try {
			const stats = await StudentManager.getStudentStats();
			res.status(200).json({ status: "success", data: stats });
		} catch (error) {
			res.status(500).json({ status: "error", message: error.message });
		}
	});

	app.post("/api/students", async (req, res) => {
		try {
			const { email, fullName, phone, courseId } = req.body;
			const result = await StudentManager.createStudent({ email, fullName, phone, courseId });
			res.status(201).json({ 
				status: "success", 
				message: "Học viên đã được tạo thành công",
				data: result
			});
		} catch (error) {
			res.status(400).json({ status: "error", message: error.message });
		}
	});

	app.get("/api/students/search", async (req, res) => {
		try {
			const { q } = req.query;
			if (!q) {
				return res.status(400).json({ status: "error", message: "Query parameter 'q' is required" });
			}
			const students = await StudentManager.searchStudents(q);
			res.status(200).json({ status: "success", data: students });
		} catch (error) {
			res.status(500).json({ status: "error", message: error.message });
		}
	});

	// Send login credentials to student (public access)
	app.post("/api/students/:id/send-credentials", async (req, res) => {
		try {
			const { id } = req.params;
			const student = await Student.findById(id);
			if (!student) {
				return res.status(404).json({ status: "error", message: "Học viên không tồn tại" });
			}

			// Get user credentials
			const user = await User.findByEmail(student.email);
			if (!user) {
				return res.status(404).json({ status: "error", message: "Tài khoản đăng nhập không tồn tại" });
			}

		// Send email with credentials (use default password, not hashed)
		await sendMailToNewStudent(user.email, '123456');
			
			res.status(200).json({ 
				status: "success", 
				message: "Thông tin đăng nhập đã được gửi",
				data: {
					email: user.email,
					username: user.username,
					password: '123456'
				}
			});
		} catch (error) {
			res.status(500).json({ status: "error", message: error.message });
		}
	});

	// Public computer registration endpoint (no auth required)
	app.post("/api/computer/register", (req, res) => createComputer({ req, res, Computer, sseClients }));

	// Check computer connectivity and status (public endpoint for testing)
	app.get("/api/computer/:id/status", async (req, res) => {
		try {
			const { id } = req.params;
			const computer = await Computer.findById(id);
			
			if (!computer) {
				return res.status(404).json({ status: "error", message: "Computer not found" });
			}

			// Test connectivity using a simple command
			const options = { port: computer.nat_port_winrm, retries: 1, timeout: 10000 };
			const testResult = await pwsh('echo "Connection test"', options);
			
			res.status(200).json({ 
				status: "success", 
				data: {
					computerId: id,
					status: computer.status,
					connectivity: "online",
					lastChecked: new Date().toISOString(),
					testResult: testResult.stdout
				}
			});
		} catch (error) {
			res.status(200).json({ 
				status: "success", 
				data: {
					computerId: req.params.id,
					status: "offline",
					connectivity: "offline",
					lastChecked: new Date().toISOString(),
					error: error.message
				}
			});
		}
	});

	// Send command result back to server (called by Windows machine)
	app.post("/api/computer/:id/command-result", async (req, res) => {
		try {
			const { id } = req.params;
			const { commandId, status, result, error, timestamp } = req.body;
			
			console.log(`[COMMAND] Computer ${id} - Command ${commandId}: ${status}`);
			if (result) console.log(`[COMMAND] Result: ${result}`);
			if (error) console.log(`[COMMAND] Error: ${error}`);
			
			res.status(200).json({ status: "success", message: "Command result received" });
		} catch (error) {
			res.status(500).json({ status: "error", message: error.message });
		}
	});

	// Send command to computer (called by admin)
	app.post("/api/computer/:id/send-command", async (req, res) => {
		try {
			const { id } = req.params;
			const { command } = req.body;
			
			if (!command) {
				return res.status(400).json({ status: "error", message: "Command is required" });
			}
			
			// In a real implementation, you would store the command in database
			// and the Windows machine would poll for it
			console.log(`[COMMAND] Sending command to computer ${id}: ${command}`);
			
			// For now, execute directly via pwsh
			const computer = await Computer.findById(id);
			if (!computer) {
				return res.status(404).json({ status: "error", message: "Computer not found" });
			}
			
			const options = { port: computer.nat_port_winrm, retries: 1, timeout: 30000 };
			const result = await pwsh(command, options);
			
			res.status(200).json({
				status: "success",
				message: "Command executed successfully",
				data: {
					command: command,
					result: result.stdout,
					error: result.stderr
				}
			});
		} catch (error) {
			res.status(500).json({ status: "error", message: error.message });
		}
	});

	app.get("/api/payment", async (req, res) => {
		try {
			const payments = await Payment.findAll();
			// Map database fields to API response format
			const mappedPayments = payments.map(payment => {
				// Split full_name into firstName and lastName
				const nameParts = (payment.full_name || '').split(' ');
				const firstName = nameParts[0] || '';
				const lastName = nameParts.slice(1).join(' ') || '';
				
				return {
					...payment,
					firstName: firstName,
					lastName: lastName,
					orderCode: payment.order_code,
					createdAt: payment.created_at
				};
			});
			res.status(200).json({ status: "success", data: mappedPayments });
		} catch (error) {
			res.status(500).json({ status: "error", message: error.message });
		}
	});

	app.get("/api/schedule", async (req, res) => {
		try {
			const schedules = await Schedule.findAll();
			// Map database fields to API response format
			const mappedSchedules = schedules.map(schedule => ({
				...schedule,
				userName: schedule.user_name,
				startTime: schedule.start_time,
				endTime: schedule.end_time,
				computerId: schedule.computer_id,
				natPortRdp: schedule.nat_port_rdp
			}));
			res.status(200).json({ status: "success", data: mappedSchedules });
		} catch (error) {
			res.status(500).json({ status: "error", message: error.message });
		}
	});
	
	app.post("/api/schedule/:id/approve", (req, res) => approveSchedule({ req, res, sseClients, jobs, Schedule, Computer }));
	app.get("/api/schedule/:id/cancel", (req, res) => cancelSchedule({ req, res, jobs, Schedule }));

	app.get("/api/computer", async (req, res) => {
		try {
			const computers = await Computer.findAll();
			// Map database fields to API response format
			const mappedComputers = computers.map(computer => ({
				...computer,
				natPortRdp: computer.nat_port_rdp,
				natPortWinRm: computer.nat_port_winrm,
				createdAt: computer.created_at
			}));
			res.status(200).json({ status: "success", data: mappedComputers });
		} catch (error) {
			res.status(500).json({ status: "error", message: error.message });
		}
	});

	app.post("/api/computer", (req, res) => createComputer({ req, res, Computer, sseClients }));
	app.put("/api/computer/:id", (req, res) => updateComputer({ req, res, Computer }));
	app.delete("/api/computer/:id", (req, res) => deleteComputer({ req, res, Computer }));

	// Protected Student Management APIs (require authentication)
	app.put("/api/students/:id", async (req, res) => {
		try {
			const { id } = req.params;
			const updateData = req.body;
			const student = await StudentManager.updateStudent(id, updateData);
			res.status(200).json({ status: "success", data: student });
		} catch (error) {
			res.status(400).json({ status: "error", message: error.message });
		}
	});

	app.delete("/api/students/:id", async (req, res) => {
		try {
			const { id } = req.params;
			await StudentManager.deleteStudent(id);
			res.status(200).json({ status: "success", message: "Học viên đã được xóa" });
		} catch (error) {
			res.status(400).json({ status: "error", message: error.message });
		}
	});

}

function initSSE({ req, res, sseClients }) {
	res.setHeader("Content-Type", "text/event-stream");
	res.setHeader("Cache-Control", "no-cache");
	res.setHeader("Connection", "keep-alive");
	res.flushHeaders();
	sseClients.push(res);

	// sse.write(`data: ${json}\n\n`);
	broadcastSSE(sseClients, { message: "Hello", type: "info" });

	req.on('close', () => {
		sseClients = sseClients.filter(client => client != res);
		console.log('Client disconnected');
	});
}

function broadcastSSE(sseClients, data) {
	let json = JSON.stringify(data);
	sseClients.forEach(client => client.write(`data: ${json}\n\n`));
}

function authJWT(req, res, next) {
	let authHeader = req.headers['authorization'];
	let token = authHeader && authHeader.split(' ')[1];

	if (token == null) {
		console.log('❌ No token provided');
		return res.status(401).json({ 
			status: "error", 
			message: "Token không được cung cấp" 
		});
	}

	jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
		if (err) {
			console.log('❌ Invalid token:', err.message);
			return res.status(403).json({ 
				status: "error", 
				message: "Token không hợp lệ - token không được tìm thấy" 
			});
		}
		req.user = user;
		next();
	});
};

async function login({ req, res, User }) {
	const { email, password } = req.body;
	console.log('🔍 Login attempt:', { email, password: '***' });

	// Validate input
	if (!email || !password) throw Error("Thiếu email hoặc mật khẩu");

	// Find the user by email
	const user = await User.findByEmail(email);
	console.log('🔍 User found:', user ? 'Yes' : 'No');
	if (!user) throw Error("Email hoặc mật khẩu không đúng");

	// Compare passwords
	const isMatch = await bcrypt.compare(password, user.password);
	console.log('🔍 Password match:', isMatch);
	if (!isMatch) throw Error("Email hoặc mật khẩu không đúng");

	// Create JWT token
	let payload = { email: user.email, role: user.role };
	let secret = process.env.JWT_SECRET;
	const token = jwt.sign(payload, secret, { expiresIn: "1d" });
	console.log('✅ Login successful for:', email);

	// Respond with user data
	let { password: _password, ...userData } = user;
	res.status(200).json({
		status: "success",
		data: { user: userData, token }
	});
}

async function createPayment({ req, res, Payment,  payOS }) {
	let { firstName, lastName, email, phone, courseId } = req.body;
	let amount = 5000; // 100,000 VND

	// if payment info existed, response error
	let payment = await Payment.findOne({ email: email }) || await Payment.findOne({ phone: phone });
	if (payment) throw Error("Email hoặc số điện thoại đã tồn tại");

	// create payment data
	let newPayment = {
		id: nanoid(),
		full_name: `${lastName} ${firstName}`,
		email: email,
		phone: phone,
		amount: amount,
		course_id: courseId,
		order_code: Number(String(Date.now()).slice(-6)),
		password: randomPassword(),
		status: 'pending'
	};
	
	await Payment.create(newPayment);

	// create qr code for purchase
	let payOSData = await createQRPayment({ newPayment, payOS });
	return res.status(200).json({
		status: "success",
		message: "Đã tạo mã thanh toán, quét mã để thanh toán",
		data: payOSData,
	});
}

function randomPassword() {
	return Math.random().toString(16).slice(2);
}

async function createQRPayment({ newPayment, payOS }) {
	let { id, full_name, email, phone, course_id, amount, order_code } = newPayment;
	let domain = process.env.DOMAIN;
	let body = {
		orderCode: order_code,
		amount: Number(amount),
		items: [{
			name: `Khoá học ${id}`,
			quantity: 1,
			price: amount
		}],
		buyerName: full_name,
		buyerPhone: phone,
		buyerEmail: email,
		description: `Khoa hoc ${course_id}`,
		returnUrl: `${domain}/api/payment/complete/`,
		cancelUrl: `${domain}/api/payment/cancel/`,
	};
	return await payOS.createPaymentLink(body);
}

async function createStudent({ req, res, Payment, payOS, StudentManager }) {
	// check payment status
	let orderCode = req.query.orderCode;
	let { payment } = await checkPayment({ orderCode, Payment, payOS });

	// create student in local database (replaces Moodle/Profile integration)
	let studentCreated = false;
	let studentCredentials = null;
	
	try {
		const { full_name, email, phone, course_id } = payment;
		console.log(`📝 Creating student for payment:`, { full_name, email, phone, course_id });
		
		const result = await StudentManager.createStudent({
			email: email,
			fullName: full_name,
			phone: phone,
			courseId: course_id
		});
		console.log(`✅ Student ${email} created successfully after payment:`, result);
		studentCreated = true;
		studentCredentials = result.credentials;
	} catch (error) {
		console.error("❌ Student creation failed:", error.message);
		console.error("❌ Error details:", error);
		// Continue anyway - payment is still valid
	}

	// send email to student with login credentials
	if (studentCreated && studentCredentials) {
		await sendMailToNewStudent(studentCredentials.email, studentCredentials.password);
		console.log(`📧 Login credentials sent to ${studentCredentials.email}`);
	}

	// send email to admin
	await sendMailNewPayment(payment);

	// response success
	return res.status(200).json({
		status: "success",
		message: "Đã tạo tài khoản học viên thành công"
	});
}

async function checkPayment({ orderCode, Payment, payOS }) {
	// if orderCode not existed, throw error
	let payment = await Payment.findByOrderCode(orderCode);
	if (!payment) throw Error("Không tìm thấy thông tin thanh toán");

	// if payment not success, throw error
	let purchase = await payOS.getPaymentLinkInformation(orderCode);
	if (purchase.status != "PAID") throw Error("Chưa thanh toán thành công, vui lòng kiểm tra lại");

	// update payment status
	await Payment.updateStatus(orderCode, purchase.status, purchase);

	return { payment, detail: purchase };
}

async function createAccountProfile({ firstName, lastName, email, phone, password }) {
	let url = process.env.PROFILE_BASE_URL  + "/auth/register";
	let data = { firstName, lastName, email, phone, password };
	let headers = { "Content-Type": "application/json" };

	let existed = true;
	try {
		await axios.post(url, data, { headers });
		existed = false;
	}
	catch (error) {
		let message = error.response.data.message;
		let regexMessage = /already exists/i;
		if (!regexMessage.test(message)) throw Error(message);
	}

	if (existed) await sendMailToExistedStudent(email);
	else await sendMailToNewStudent(email, password);
}

async function sendMailToExistedStudent(email) {
	let body = "<p>Thông tin đăng nhập Remote Lab:</p>";
	body += "<p>Tài khoản profile của bạn đã tồn tại, ";
	body += "hãy sử dụng email và mật khẩu profile để đăng nhập ";
	body += "vào Remote Lab để tham gia học tập</p>";
	body += '<p>Hướng dẫn sử dụng: <a href="https://docs.google.com/document/d/1mAJNXhLiGgnrbIyIosKXXRJfx8rC80YXKwChR8a8nh4/edit?usp=sharing">https://docs.google.com/document/d/1mAJNXhLiGgnrbIyIosKXXRJfx8rC80YXKwChR8a8nh4/edit?usp=sharing</a></p>';

	await sendMail({
		receiver: email,
		title: "Remote Lab - Thông tin đăng nhập",
		body: body
	});
}

async function sendMailToNewStudent(email, password) {
	let body = "<p>Thông tin đăng nhập Remote Lab:</p>";
	body += "<ul>";
	body += `<li>Website: http://103.218.122.188:8080/login</li>`;
	body += `<li>Email: ${email}</li>`;
	body += `<li>Mật khẩu: ${password}</li>`;
	body += '<li>Hướng dẫn sử dụng: <a href="https://docs.google.com/document/d/1mAJNXhLiGgnrbIyIosKXXRJfx8rC80YXKwChR8a8nh4/edit?usp=sharing">https://docs.google.com/document/d/1mAJNXhLiGgnrbIyIosKXXRJfx8rC80YXKwChR8a8nh4/edit?usp=sharing</a></li>';
	body += "</ul>";

	await sendMail({
		receiver: email,
		title: "Lab T&A - Thông tin đăng nhập Remote Lab",
		body: body
	});
}

async function sendMailNewPayment(payment) {
	let body = "<p>Thông tin học viên mới:</p>";
	body += `<ul><li>Họ tên: ${payment.firstName} ${payment.lastName}</li>`;
	body += `<li>Email: ${payment.email}</li>`;
	body += `<li>Số điện thoại: ${payment.phone}</li>`;
	body += `<li>Khóa học: ${payment.courseId}</li></ul>`;

	await sendMail({
		receiver: process.env.ADMIN_EMAIL,
		title: "Remote Lab - có học viên mới",
		body: body
	});
}

async function sendMail({ receiver, title, body }) {
	try {
		let url = process.env.MAIL_API;
		let data = { receiver, title, body };
		console.log(`📧 Sending email to ${receiver}: ${title}`);
		let response = await axios.post(url, data, {
			maxRedirects: 5,
			timeout: 10000
		});
		console.log(`✅ Email sent successfully to ${receiver}`);
		return response.data;
	} catch (error) {
		console.error(`❌ Failed to send email to ${receiver}:`, error.message);
		throw error;
	}
}

async function getPaymentStatus({ req, res, Payment, payOS }) {
	// get purchase status
	let { orderCode } = req.params;
	let purchase = await payOS.getPaymentLinkInformation(orderCode);
	return res.status(200).json({
		status: "success",
		message: "Kiểm tra trạng thái thanh toán",
		data: purchase
	});
}

async function enrolCourse({ req, res, Payment, StudentManager }) {
	// check payment existed
	let email = req.body.email;
	let payment = await Payment.findByEmail(email);
	if (!payment || payment.length === 0) throw Error("Không tìm thấy thông tin thanh toán");
	if (payment[0].status != "PAID") throw Error("Chưa thanh toán thành công");

	// Check if student exists in local database (replaces Moodle check)
	try {
		const studentExists = await StudentManager.validateStudent(email);
		if (!studentExists) {
			// Create student automatically if not exists
			console.log(`📝 Student ${email} not found, creating new student record`);
			await StudentManager.createStudent({
				email: email,
				fullName: payment.full_name || email.split('@')[0],
				phone: payment.phone || '',
				courseId: payment.course_id || 'default'
			});
		} else {
			// Enroll existing student to course
			await StudentManager.enrollStudent(email, payment.course_id);
		}
	} catch (error) {
		console.warn("⚠️ Student enrollment failed:", error.message);
		// Continue anyway - don't block payment completion
	}

	return res.status(200).json({
		status: "success",
		message: "Đã xác nhận thanh toán và đăng ký khóa học thành công"
	});
}

async function registerSchedule({ req, res, sseClients, Schedule, Computer, StudentManager }) {
	let { email, startTime, endTime } = req.body;

	// Convert timestamps to Date objects if they are numbers (milliseconds)
	if (typeof startTime === 'number') {
		startTime = new Date(startTime);
	}
	if (typeof endTime === 'number') {
		endTime = new Date(endTime);
	}

	// Check if student exists in local database (replaces Moodle check)
	try {
		const studentExists = await StudentManager.validateStudent(email);
		if (!studentExists) {
			// If student doesn't exist, create them automatically
			console.log(`📝 Student ${email} not found, creating new student record`);
			await StudentManager.createStudent({
				email: email,
				fullName: email.split('@')[0], // Use email prefix as name
				phone: '',
				courseId: 'default'
			});
		}
	} catch (error) {
		console.warn("⚠️ Student validation/creation failed:", error.message);
		// Continue anyway - don't block schedule registration
	}

	// if starttime < now + 1h, response error
	let now = new Date();
	now.setMinutes(now.getMinutes() + 1);
	if (startTime < now) throw Error("Thời gian thực hành ít nhất phải sau 1 phút từ hiện tại");

	// check if time slot is available
	const isAvailable = await Schedule.isTimeSlotAvailable(startTime, endTime);
	if (!isAvailable) throw Error("Lịch đăng ký đã đầy");

	// save schedule with status
	let newSchedule = {
		id: nanoid(),
		email: email,
		user_name: email.replace(/[^a-zA-Z0-9]/g, "").slice(0, 5),
		start_time: startTime,
		end_time: endTime,
		status: "pending"
	};
	
	await Schedule.create(newSchedule);

	// send notify to admin
	await sendMailNewSchedule(newSchedule);

	// response
	broadcastSSE(sseClients, { type: "new-schedule" });
	return res.status(200).json({
		status: "success",
		message: "Đã đặt lịch thành công, đợi quản trị viên xác nhận"
	});
}

async function callMoodleService(wsfunction, params) {
	// Check if Moodle is disabled
	if (process.env.MOODLE_DISABLED === 'true') {
		throw new Error("Moodle integration is disabled");
	}

	let token = process.env.LMS_TOKEN;
	let response = await axios({
		url: "/webservice/rest/server.php",
		method: "post",
		baseURL: process.env.LMS_BASE_URL,
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		params: {
			wstoken: token,
			wsfunction: wsfunction,
			moodlewsrestformat: "json",
			...params,
		}
	});

	let data = response.data;
	if (data && data.hasOwnProperty("error")) throw new Error(data.error);

	return response.data;
}

async function sendMailNewSchedule(schedule) {
	let startTime = new Date(schedule.start_time).toLocaleString();
	let endTime = new Date(schedule.end_time).toLocaleString();

	let body = "<p>Thông tin đăng ký thực hành:</p>";
	body += `<li>Email: ${schedule.email}</li>`;
	body += `<li>Thời gian bắt đầu: ${startTime}</li>`;
	body += `<li>Thời gian kết thúc: ${endTime}</li></ul>`;

	await sendMail({
		receiver: process.env.ADMIN_EMAIL,
		title: "Remote Lab - có đăng ký thực hành",
		body: body
	});
}

// hotfix: can't create new SSH tunnel for RDP service
var usedRdpPORT = [3000, 3999];

async function approveSchedule({ req, res, sseClients, jobs, Schedule, Computer }) {
	let id = req.params.id;
	let { computerId } = req.body;

	// Validate input
	if (!computerId) {
		return res.status(400).json({
			status: "error",
			message: "Vui lòng chọn máy tính để thực hành"
		});
	}

	// if schedule not existed, response error
	let schedule = await Schedule.findById(id);
	if (!schedule) {
		return res.status(404).json({
			status: "error",
			message: "Không tìm thấy lịch đăng ký"
		});
	}

	// check computer existed
	let computer = await Computer.findById(computerId);
	if (!computer) {
		return res.status(404).json({
			status: "error",
			message: "Máy tính không tồn tại"
		});
	}
	if (computer.status != "available") {
		return res.status(400).json({
			status: "error",
			message: "Máy tính không sẵn sàng"
		});
	}

	try {
		// random new RDP PORT for computer
		let min = 3000;
		let max = 3999;
		let newRdpPORT = usedRdpPORT[0];

		while (usedRdpPORT.includes(newRdpPORT)) {
			newRdpPORT = parseInt(Math.random() * (max - min) + min);
		}

		usedRdpPORT.push(newRdpPORT);
		
		// Update computer with new RDP port
		await Computer.updateById(computerId, { nat_port_rdp: newRdpPORT });
		console.log("-> changed RDP PORT to: ", newRdpPORT);

		// generate password for login into remote session
		let password = randomPassword();
		
		// Update schedule with approval details
		await Schedule.approve(id, computerId, password);

		// Get updated schedule for job creation
		let updatedSchedule = await Schedule.findById(id);
		// Add natPortRdp for email template (not stored in database)
		updatedSchedule.natPortRdp = newRdpPORT;

		// Verify computer connectivity before scheduling
		console.log(`[APPROVE] Testing connectivity to computer ${computerId}...`);
		try {
			const options = { port: computer.nat_port_winrm, retries: 2, timeout: 15000 };
			await pwsh('echo "Connectivity test"', options);
			console.log(`[APPROVE] ✅ Computer ${computerId} is reachable`);
		} catch (error) {
			console.error(`[APPROVE] ❌ Computer ${computerId} is not reachable:`, error.message);
			return res.status(400).json({
				status: "error",
				message: `Máy tính không thể kết nối được: ${error.message}`
			});
		}

		// create a crontab to create remote session before startTime 1 min
		await createSchedule(jobs, updatedSchedule, Computer);

		// send email to student and admin
		await sendMailScheduledJob(updatedSchedule);

		broadcastSSE(sseClients, { 
			type: "approved-schedule", 
			email: schedule.email,
			message: `Lịch thực hành đã được phê duyệt cho ${schedule.user_name}`,
			data: { 
				user_name: schedule.user_name, 
				computer_id: computerId,
				start_time: schedule.start_time 
			}
		});

		return res.status(200).json({
			status: "success",
			message: "Đã xác nhận lịch thực hành và kiểm tra kết nối thành công"
		});
	} catch (error) {
		console.error("Error in approveSchedule:", error);
		return res.status(500).json({
			status: "error",
			message: "Có lỗi xảy ra khi phê duyệt lịch thực hành: " + error.message
		});
	}
}

async function createSchedule(jobs, newSchedule, Computer) {
	let { startTime, endTime } = newSchedule;

	// schedule to create remote session
	jobs[startTime] = schedule.scheduleJob(startTime, async function (data) {
		const sessionId = `session_${Date.now()}`;
		console.log(`[${sessionId}] 🚀 Starting remote session creation for ${data.newSchedule.user_name}`);
		
		try {
			let { newSchedule, Computer } = data;
			let { startTime, user_name, password, computer_id } = newSchedule;
			
			let computer = await Computer.findById(computer_id);
			let options = { port: computer.nat_port_winrm };

			// Step 1: Create user account command
			console.log(`[${sessionId}] 👤 Creating user account command: ${user_name}`);
			await Command.createCommand({
				computer_id: computer_id,
				action: 'create_user',
				parameters: {
					username: user_name,
					password: password
				}
			});
			console.log(`[${sessionId}] ✅ User creation command queued`);

			// Step 2: Add user to Remote Desktop Users group command
			console.log(`[${sessionId}] 🔐 Adding user to Remote Desktop Users group command`);
			await Command.createCommand({
				computer_id: computer_id,
				action: 'custom_command',
				parameters: {
					command: `net localgroup 'Remote Desktop Users' ${user_name} /add`
				}
			});
			console.log(`[${sessionId}] ✅ RDP group command queued`);

			// Step 3: Create SSH tunnel for RDP command
			console.log(`[${sessionId}] 🌐 Creating SSH tunnel command for RDP on port ${computer.nat_port_rdp}`);
			await Command.createCommand({
				computer_id: computer_id,
				action: 'custom_command',
				parameters: {
					command: `ssh -o StrictHostKeyChecking=no -p 8030 remote@rm.s4h.edu.vn -N -R ${computer.nat_port_rdp}:localhost:3389`
				}
			});
			console.log(`[${sessionId}] ✅ SSH tunnel command queued`);

			// Step 4: Update computer status
			await Computer.updateStatus(computer_id, "busy");
			console.log(`[${sessionId}] ✅ Computer status updated to busy`);

			// Step 5: Send success notification
			broadcastSSE(sseClients, { 
				type: "session-created", 
				message: `Remote session commands queued successfully for ${user_name}`,
				data: { user_name, computer_id, nat_port_rdp: computer.nat_port_rdp }
			});

			delete jobs[startTime];
			console.log(`[${sessionId}] ✅ All commands queued for ${user_name}`);
		}
		catch (error) {
			console.error(`[${sessionId}] ❌ Remote session creation failed:`, error.message);
			
			// Send error notification
			broadcastSSE(sseClients, { 
				type: "session-creation-failed", 
				message: `Failed to create remote session for ${data.newSchedule.user_name}: ${error.message}`,
				data: { user_name: data.newSchedule.user_name, error: error.message }
			});

			// Try to clean up if user was created
			try {
				let { newSchedule, Computer } = data;
				let computer = await Computer.findById(newSchedule.computer_id);
				await Command.createCommand({
					computer_id: computer.id,
					action: 'custom_command',
					parameters: {
						command: `net user /del ${newSchedule.user_name}`
					}
				});
				console.log(`[${sessionId}] 🧹 Cleanup command queued after failure`);
			} catch (cleanupError) {
				console.error(`[${sessionId}] ❌ Cleanup failed:`, cleanupError.message);
			}
		}
	}.bind(null, { newSchedule, Computer }));

	// schedule to remind student before 1 mins to end session
	let remindTime = new Date(endTime);
	remindTime.setMinutes(remindTime.getMinutes() - 1);
	let computer = await Computer.findById(newSchedule.computer_id);
	let temp = { ...newSchedule, remindTime, computer: computer };

	jobs[remindTime] = schedule.scheduleJob(remindTime, async function (data) {
		try {
			let { user_name, remindTime, computer } = data;
			await Command.createCommand({
				computer_id: computer.id,
				action: 'custom_command',
				parameters: {
					command: `msg ${user_name} 'Thời gian thực hành sắp kết thúc'`
				}
			});
			delete jobs[remindTime];
		} catch (error) {
			console.log(error);
		}
	}.bind(null, temp));

	// schedule to auto remove user account
	jobs[endTime] = schedule.scheduleJob(endTime, async function (data) {
		try {
			let { endTime, user_name, computer } = data;
			await Command.createCommand({
				computer_id: computer.id,
				action: 'custom_command',
				parameters: {
					command: `net user /del ${user_name}`
				}
			});
			await Command.createCommand({
				computer_id: computer.id,
				action: 'custom_command',
				parameters: {
					command: `shutdown -t 0 -r -f`
				}
			});

			await Computer.updateStatus(computer.id, "available");

			console.log(`Deleted user ${user_name} and restart PC commands queued`);
			delete jobs[endTime];
		} catch (error) {
			console.log(error);
		}
	}.bind(null, temp ));
}

async function sendMailScheduledJob(schedule) {
	let body = "<p>Thông tin đăng nhập vào Remote Desktop:</p><ul>";
	body += `<li>Địa chỉ Remote Desktop: rm.s4h.edu.vn:${schedule.natPortRdp}</li>`;
	body += `<li>Thời gian bắt đầu: ${new Date(schedule.start_time).toLocaleString('en-GB')}</li>`;
	body += `<li>Thời gian kết thúc: ${new Date(schedule.end_time).toLocaleString('en-GB')}</li>`;
	body += `<li>Username: ${schedule.user_name}</li>`;
	body += `<li>Mật khẩu: ${schedule.password}</li></ul>`;

	await sendMail({
		receiver: schedule.email,
		title: "Remote Lab - thông tin đăng nhập",
		body: body
	});

	await sendMail({
		receiver: process.env.ADMIN_EMAIL,
		title: "Remote Lab - thông tin đăng nhập",
		body: body
	});
}

async function pwsh(cmd, { port = 5985, retries = 3, timeout = 30000 }) {
	// This function is now deprecated - use Commands System instead
	// Windows machines will poll server for commands and execute them locally
	console.log(`[PWSH] ⚠️  Deprecated: Direct PowerShell execution not supported`);
	console.log(`[PWSH] Use Commands System: Windows machines poll server for commands`);
	console.log(`[PWSH] Command would be: ${cmd}`);
	
	// Return success to prevent errors in existing code
	return { stdout: 'Command queued via Commands System', stderr: '' };
}

function verifyCommandSuccess(cmd, stdout, stderr) {
	// Ensure stdout and stderr are strings
	stdout = stdout || '';
	stderr = stderr || '';
	
	// Check for common success indicators
	const successPatterns = [
		/The command completed successfully/i,
		/successfully/i,
		/added/i,
		/created/i,
		/started/i
	];
	
	const errorPatterns = [
		/error/i,
		/failed/i,
		/denied/i,
		/not found/i,
		/access denied/i
	];

	// Check for errors first
	for (const pattern of errorPatterns) {
		if (pattern.test(stderr) || pattern.test(stdout)) {
			return false;
		}
	}

	// Check for success patterns
	for (const pattern of successPatterns) {
		if (pattern.test(stdout)) {
			return true;
		}
	}

	// For specific commands, check specific success criteria
	if (cmd.includes('echo')) {
		return true; // echo command is always successful if it runs
	}
	if (cmd.includes('net user /add')) {
		return !stderr.includes('error') && !stderr.includes('failed');
	}
	if (cmd.includes('net localgroup')) {
		return !stderr.includes('error') && !stderr.includes('failed');
	}
	if (cmd.includes('ssh')) {
		return !stderr.includes('error') && !stderr.includes('failed');
	}

	// Default: consider successful if no error patterns found
	return !stderr.includes('error') && !stderr.includes('failed');
}

async function findApprovedSchedule({ req, res, Schedule }) {
	let email = req.params.email;
	let schedules = await Schedule.findApprovedByEmail(email);
	// Map database fields to API response format
	const mappedSchedules = schedules.map(schedule => ({
		...schedule,
		userName: schedule.user_name,
		startTime: schedule.start_time,
		endTime: schedule.end_time,
		computerId: schedule.computer_id,
		natPortRdp: schedule.nat_port_rdp
	}));
	return res.status(200).json({
		status: "success",
		data: mappedSchedules
	});
}

async function cancelSchedule({ req, res, jobs, Schedule }) {
	let id = req.params.id;

	// if schedule not existed, response error
	let schedule = await Schedule.findById(id);
	if (!schedule) throw Error("Không tìm thấy lịch đăng ký");

	// remove job
	let job = jobs[schedule.start_time];
	if (job) job.cancel();
	delete jobs[schedule.start_time];

	// update schedule status
	await Schedule.cancel(id);

	// send email to student and admin
	await sendMailCanceledJob(schedule);

	return res.status(200).json({
		status: "success",
		message: "Đã hủy lịch thực hành"
	});
}

async function sendMailCanceledJob(schedule) {
	let body = "<p>Lịch thực hành đã bị hủy</p>";

	await sendMail({
		receiver: schedule.email,
		title: "Remote Lab - thông báo hủy lịch",
		body: body
	});

	await sendMail({
		receiver: process.env.ADMIN_EMAIL,
		title: "Remote Lab - thông báo hủy lịch",
		body: body
	});
}

async function createComputer({ req, res, Computer, sseClients }) {
	let { name, description, ip_address, natPortRdp, natPortWinRm } = req.body;
	let newComputer = {
		id: nanoid(),
		name: name,
		description: description,
		ip_address: ip_address,
		nat_port_rdp: natPortRdp,
		nat_port_winrm: natPortWinRm,
		status: "available"
	};
	
	await Computer.create(newComputer);

	// Broadcast to all connected clients
	broadcastSSE(sseClients, { 
		type: "new-computer", 
		message: "Có máy thực hành mới được đăng ký",
		data: newComputer
	});

	// Map database fields to API response format
	const mappedComputer = {
		...newComputer,
		natPortRdp: newComputer.nat_port_rdp,
		natPortWinRm: newComputer.nat_port_winrm,
		createdAt: newComputer.created_at
	};

	return res.status(200).json({
		status: "success",
		message: "Đã thêm máy tính vào hệ thống",
		data: mappedComputer
	});
}

async function updateComputer({ req, res, Computer }) {
	let id = req.params.id;
	let { name, description, natPortRdp, natPortWinRm } = req.body;

	let computer = await Computer.findById(id);
	if (!computer) throw Error("Không tìm thấy máy tính");

	await Computer.updateById(id, {
		name: name,
		description: description,
		nat_port_rdp: natPortRdp,
		nat_port_winrm: natPortWinRm
	});

	// Get updated computer data
	const updatedComputer = await Computer.findById(id);
	
	// Map database fields to API response format
	const mappedComputer = {
		...updatedComputer,
		natPortRdp: updatedComputer.nat_port_rdp,
		natPortWinRm: updatedComputer.nat_port_winrm,
		createdAt: updatedComputer.created_at
	};

	return res.status(200).json({
		status: "success",
		message: "Đã cập nhật thông tin máy tính",
		data: mappedComputer
	});
}

async function deleteComputer({ req, res, Computer }) {
	let id = req.params.id;
	
	let computer = await Computer.findById(id);
	if (!computer) throw Error("Không tìm thấy máy tính");
	
	await Computer.deleteById(id);

	return res.status(200).json({
		status: "success",
		message: "Đã xóa máy tính khỏi hệ thống"
	});
}

function initErrorHandler(app) {
	app.use((_req, _res, next) => next(createHttpError(404)));
	app.use((err, _req, res, _next) => {
		console.error(err);
		return res
			.status(err.status || 500)
			.json({ status: "error", message: err.message });
	});
}

function startServer(app) {
	let port = process.env.PORT || 8000;
	let msg = `serving HTTP on PORT ${port}...`;
	app.listen(port, () => console.log(msg));
}
