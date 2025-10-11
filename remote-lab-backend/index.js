import dotenv from "dotenv";

import { existsSync, mkdirSync } from "fs";
import { JSONFile } from "lowdb/node";
import { Low } from "lowdb";

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

(async () => {
	dotenv.config();

	let db = await initDatabase();
	let payOS = initPayOS();
	let app = initServer();
	let jobs = {};

	initMiddlewares(app);
	initRoutes({ app, db, jobs, payOS });
	initErrorHandler(app);
	startServer(app);
})();

async function initDatabase() {
	let directory = new URL('./data', import.meta.url).pathname;
	if (!existsSync(directory)) mkdirSync(directory);

	let User = await initLowDb('user');
	let Student = await initLowDb('student');
	let Schedule = await initLowDb('schedule');
	let Payment = await initLowDb('payment');
	let Computer = await initLowDb('computer');

	return { User, Student, Schedule, Payment, Computer };
}

function initPayOS() {
	return new PayOS(
		process.env.PAYOS_CLIENT_ID,
		process.env.PAYOS_API_KEY,
		process.env.PAYOS_CHECKSUM_KEY
	);
}

async function initLowDb(dbName, defaultData = []) {
	let filePath = `./data/${dbName}.json`;
	filePath = new URL(filePath, import.meta.url);
	filePath = filePath.pathname;

	let adapter = new JSONFile(filePath);
	let db = new Low(adapter, defaultData);

	await db.read();
	return db;
}

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
	app.use(cors());
}

function initRoutes({ app, db, jobs, payOS }) {
	let { User, Schedule, Payment, Computer } = db;
	let sseClients = [];

	app.get("/", (_req, res) => res.send("Hello World"));
	app.get("/sse", (req, res) => initSSE({ req, res, sseClients }));
	app.post("/api/auth/login", (req, res) => login({ req, res, User }));

	app.post("/api/payment", (req, res) => createPayment({ req, res, Payment, payOS }));
	app.get("/api/payment/complete", (req, res) => createStudent({ req, res, Payment, payOS }));
	app.get("/api/payment/cancel", (_req, res) => res.redirect("/"));
	app.get("/api/payment/:orderCode", (req, res) => getPaymentStatus({ req, res, Payment, payOS }));

	app.post("/api/course/enrol", (req, res) => enrolCourse({ req, res, Payment }));

	app.get("/api/schedule/:email", (req, res) => findApprovedSchedule({ req, res, Schedule }));
	app.post("/api/schedule", (req, res) => registerSchedule({ req, res, sseClients, Schedule, Computer }));

	app.use(authJWT);

	app.get("/api/payment", (req, res) => res.status(200).json({ status: "success", data: Payment.data }));

	app.get("/api/schedule", (req, res) => res.status(200).json({ status: "success", data: Schedule.data }));
	app.post("/api/schedule/:id/approve", (req, res) => approveSchedule({ req, res, sseClients, jobs, Schedule, Computer }));
	app.get("/api/schedule/:id/cancel", (req, res) => cancelSchedule({ req, res, jobs, Schedule }));

	app.get("/api/computer", (req, res) => res.status(200).json({ status: "success", data: Computer.data }));
	app.post("/api/computer", (req, res) => createComputer({ req, res, Computer }));
	app.put("/api/computer/:id", (req, res) => updateComputer({ req, res, Computer }));
	app.delete("/api/computer/:id", (req, res) => deleteComputer({ req, res, Computer }));
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

	if (token == null) return res.sendStatus(401); // No token, unauthorized

	jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
		if (err) return res.sendStatus(403); // Invalid token, forbidden
		req.user = user;
		next();
	});
};

async function login({ req, res, User }) {
	const { email, password } = req.body;

	// Validate input
	if (!email || !password) throw Error("Thiếu email hoặc mật khẩu");

	// Find the user by email
	const user = await User.data.find(u => u.email == email);
	if (!user) throw Error("Email hoặc mật khẩu không đúng");

	// Compare passwords
	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) throw Error("Email hoặc mật khẩu không đúng");

	// Create JWT token
	let payload = { email: user.email, role: user.role };
	let secret = process.env.JWT_SECRET;
	const token = jwt.sign(payload, secret, { expiresIn: "1d" });

	// Respond with user data
	let { password: _password, ...userData } = user;
	res.status(200).json({
		status: "success",
		data: { user: userData, token }
	});
}

async function createPayment({ req, res, Payment,  payOS }) {
	let { firstName, lastName, email, phone, courseId } = req.body;
	let amount = 100000; // 100,000 VND

	// if payment info existed, response error
	let payment = Payment.data.find(p => p.email == email || p.phone == phone);
	if (payment) throw Error("Email hoặc số điện thoại đã tồn tại");

	// create payment data
	let newPayment = {
		id: nanoid(),
		firstName: firstName,
		lastName: lastName,
		email: email,
		phone: phone,
		amount: amount,
		courseId: courseId,
		orderCode: Number(String(Date.now()).slice(-6)),
		password: randomPassword(),
	};
	Payment.data.push(newPayment);
	await Payment.write();

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
	let { id, firstName, lastName, email, phone, courseId, amount, orderCode } = newPayment;
	let domain = process.env.DOMAIN;
	let body = {
		orderCode: orderCode,
		amount: Number(amount),
		items: [{
			name: `Khoá học ${id}`,
			quantity: 1,
			price: amount
		}],
		buyerName: `${lastName} ${firstName}`,
		buyerPhone: phone,
		buyerEmail: email,
		description: `${firstName} mua khóa học ${courseId}`,
		returnUrl: `${domain}/api/payment/complete/`,
		cancelUrl: `${domain}/api/payment/cancel/`,
	};
	return await payOS.createPaymentLink(body);
}

async function createStudent({ req, res, Payment, payOS }) {
	// check payment status
	let orderCode = req.query.orderCode;
	let { payment } = await checkPayment({ orderCode, Payment, payOS });

	// create profile account
	let { firstName, lastName, email, phone, password } = payment;
	await createAccountProfile({ firstName, lastName, email, phone, password });

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
	let payment = Payment.data.find(p => p.orderCode == orderCode);
	if (!payment) throw Error("Không tìm thấy thông tin thanh toán");

	// if payment not success, throw error
	let purchase = await payOS.getPaymentLinkInformation(orderCode);
	if (purchase.status != "PAID") throw Error("Chưa thanh toán thành công, vui lòng kiểm tra lại");

	// update payment status
	payment.status = purchase.status;
	await Payment.write();

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
	body += `<li>Website: https://demo.tr1nh.net</li>`;
	body += `<li>Email: ${email}</li>`;
	body += `<li>Mật khẩu: ${password}</li></ul>`;
	body += '<li>Hướng dẫn sử dụng: <a href="https://docs.google.com/document/d/1mAJNXhLiGgnrbIyIosKXXRJfx8rC80YXKwChR8a8nh4/edit?usp=sharing">https://docs.google.com/document/d/1mAJNXhLiGgnrbIyIosKXXRJfx8rC80YXKwChR8a8nh4/edit?usp=sharing</a></li>';

	await sendMail({
		receiver: email,
		title: "Remote Lab - Thông tin đăng nhập",
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
	let url = process.env.MAIL_API;
	let data = { receiver, title, body };
	let response = await axios.post(url, data);
	return response.data;
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

async function enrolCourse({ req, res, Payment }) {
	// check payment existed
	let email = req.body.email;
	let payment = Payment.data.find(p => p.email == email);
	if (!payment) throw Error("Không tìm thấy thông tin thanh toán");
	if (payment.status != "PAID") throw Error("Chưa thanh toán thành công");

	// find student in LMS
	let students = await callMoodleService("core_user_get_users_by_field", {
		field: "email",
		values: [email]
	});
	if (students.length == 0) throw Error("Người dùng không tồn tại");
	let student = students[0];

	// enroll course for student
	const STUDENT_ROLE = 5;
	await callMoodleService("enrol_manual_enrol_users", {
		"enrolments[0][roleid]": STUDENT_ROLE,
		"enrolments[0][userid]": student.id,
		"enrolments[0][courseid]": payment.courseId
	});

	return res.status(200).json({
		status: "success",
		message: "Đã thêm học viên vào khóa học"
	});
}

async function registerSchedule({ req, res, sseClients, Schedule, Computer }) {
	let { email, startTime, endTime } = req.body;

	// check student existed in LMS
	let students = await callMoodleService("core_user_get_users_by_field", {
		field: "email",
		values: [email]
	});
	if (students.length == 0) throw Error("Người dùng không tồn tại");

	// if starttime < now + 1h, response error
	let now = new Date();
	now.setMinutes(now.getMinutes() + 1);
	if (startTime < now) throw Error("Thời gian thực hành ít nhất phải sau 1 phút từ hiện tại");

	// check schedule is full
	let schedules = Schedule.data.filter(s => 
		(startTime >= s.startTime && startTime <= s.endTime) ||
		(endTime >= s.startTime && endTime <= s.endTime) ||
		(startTime <= s.startTime && endTime >= s.endTime) ||
		(startTime >= s.startTime && endTime <= s.endTime)
	);
	if (schedules.length >= Computer.data.length) throw Error("Lịch đăng ký đã đầy");

	// save schedule with status
	let newSchedule = {
		id: nanoid(),
		email: email,
		userName: email.replace(/[^a-zA-Z0-9]/g, "").slice(0, 5),
		startTime: startTime,
		endTime: endTime,
		status: "pending"
	};
	Schedule.data.push(newSchedule);
	await Schedule.write();

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
	let startTime = new Date(schedule.startTime).toLocaleString();
	let endTime = new Date(schedule.endTime).toLocaleString();

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

	// if schedule not existed, response error
	let schedule = Schedule.data.find(s => s.id == id);
	if (!schedule) throw Error("Không tìm thấy lịch đăng ký");

	// check computer existed
	let computer = Computer.data.find(c => c.id == computerId);
	if (!computer) throw Error("Máy tính không tồn tại");
	if (computer.status != "available") throw Error("Máy tính không sẵn sàng");
	schedule.computerId = computerId;

	// random new RDP PORT for computer
	let min = 3000;
	let max = 3999;
	let newRdpPORT = usedRdpPORT[0];

	while (usedRdpPORT.includes(newRdpPORT)) {
		newRdpPORT = parseInt(Math.random() * (max - min) + min);
	}

	usedRdpPORT.push(newRdpPORT);
	computer.natPortRdp = newRdpPORT;
	await Computer.write();
	console.log("-> changed RDP PORT to: ", newRdpPORT);

	// generate password for login into remote session
	schedule.password = randomPassword();
	schedule.natPortRdp = newRdpPORT;
	await Schedule.write();

	// create a crontab to create remote session before startTime 1 min
	createSchedule(jobs, schedule, Computer);

	// send email to student and admin
	await sendMailScheduledJob(schedule);

	// update schedule status
	schedule.status = "approved";
	await Schedule.write();

	broadcastSSE(sseClients, { type: "approved-schedule", email: schedule.email });

	return res.status(200).json({
		status: "success",
		message: "Đã xác nhận lịch thực hành"
	});
}

function createSchedule(jobs, newSchedule, Computer) {
	let { startTime, endTime } = newSchedule;

	// schedule to create remote session
	jobs[startTime] = schedule.scheduleJob(startTime, async function (data) {
		try {
			let { newSchedule, Computer } = data;

			let { startTime, userName, password, computerId } = newSchedule;
			console.log(`Create remote session for ${userName}`);

			let computer = Computer.data.find(c => c.id == computerId);
			let options = { port: computer.natPortWinRm };

			await pwsh(`net user /add ${userName} ${password}`, options);
			await pwsh(`net localgroup 'Remote Desktop Users' ${userName} /add`, options);
			await pwsh(`ssh -o StrictHostKeyChecking=no -p 8030 remote@tr1nh.net -N -R ${computer.natPortRdp}:localhost:3389`, options);

			computer.status = "busy";
			await Computer.write();

			delete jobs[startTime];
			console.log('Created schedule OK');
		}
		catch (error) {
			console.log(error);
		}
	}.bind(null, { newSchedule, Computer }));

	// schedule to remind student before 1 mins to end session
	let remindTime = new Date(endTime);
	remindTime.setMinutes(remindTime.getMinutes() - 1);
	let computer = Computer.data.find(c => c.id == newSchedule.computerId);
	let temp = { ...newSchedule, remindTime, computer: computer };

	jobs[remindTime] = schedule.scheduleJob(remindTime, async function (data) {
		try {
			let { userName, remindTime, computer } = data;
			let options = { port: computer.natPortWinRm };
			await pwsh(`msg ${userName} 'Thời gian thực hành sắp kết thúc'`, options);
			delete jobs[remindTime];
		} catch (error) {
			console.log(error);
		}
	}.bind(null, temp));

	// schedule to auto remove user account
	jobs[endTime] = schedule.scheduleJob(endTime, async function (data) {
		try {
			let { endTime, userName, computer } = data;
			let options = { port: computer.natPortWinRm };
			await pwsh(`net user /del ${userName}`, options);
			await pwsh(`shutdown -t 0 -r -f`, options);

			computer.status = "available";
			await Computer.write();

			console.log(`Deleted user ${userName} and restart PC`);
			delete jobs[endTime];
		} catch (error) {
			console.log(error);
		}
	}.bind(null, temp ));
}

async function sendMailScheduledJob(schedule) {
	let body = "<p>Thông tin đăng nhập vào Remote Desktop:</p><ul>";
	body += `<li>Địa chỉ Remote Desktop: tr1nh.net:${schedule.natPortRdp}</li>`;
	body += `<li>Thời gian bắt đầu: ${new Date(schedule.startTime).toLocaleString('en-GB')}</li>`;
	body += `<li>Thời gian kết thúc: ${new Date(schedule.endTime).toLocaleString('en-GB')}</li>`;
	body += `<li>Username: ${schedule.userName}</li>`;
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

async function pwsh(cmd, { port = 5985 }) {
	let credentialPath = process.env.CREDENTIAL_PATH;
	let computerName = process.env.COMPUTER_NAME;
	let command = "./pwsh.ps1 ";
	command += `-ComputerName ${computerName} `;
	command += `-Port ${port} `;
	command += `-CredentialPath ${credentialPath} `;
	command += `-Command "${cmd}"`;

	return new Promise((resolve, reject) => exec(command, (error, stdout, stderr) => {
		if (stdout) resolve (stdout);
		else reject(stderr);
	}));
}

async function findApprovedSchedule({ req, res, Schedule }) {
	let email = req.params.email;
	let schedules = Schedule.data.filter(s => s.email == email && s.status == "approved");
	schedules = JSON.parse(JSON.stringify(schedules));
	return res.status(200).json({
		status: "success",
		data: schedules
	});
}

async function cancelSchedule({ req, res, jobs, Schedule }) {
	let id = req.params.id;

	// if schedule not existed, response error
	let schedule = Schedule.data.find(s => s.id == id);
	if (!schedule) throw Error("Không tìm thấy lịch đăng ký");

	// remove job
	let job = jobs[schedule.startTime];
	if (job) job.cancel();
	delete jobs[schedule.startTime];

	// update schedule status
	schedule.status = "canceled";
	await Schedule.write();

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

async function createComputer({ req, res, Computer }) {
	let { name, description, natPortRdp, natPortWinRm } = req.body;
	let newComputer = {
		id: nanoid(),
		name: name,
		description: description,
		natPortRdp: natPortRdp,
		natPortWinRm: natPortWinRm,
		createdAt: new Date(),
		status: "available"
	};
	Computer.data.push(newComputer);
	await Computer.write();

	return res.status(200).json({
		status: "success",
		message: "Đã thêm máy tính vào hệ thống",
		data: newComputer
	});
}

async function updateComputer({ req, res, Computer }) {
	let id = req.params.id;
	let { name, description, natPortRdp, natPortWinRm } = req.body;

	let computer = Computer.data.find(c => c.id == id);
	if (!computer) throw Error("Không tìm thấy máy tính");

	computer.name = name;
	computer.description = description;
	computer.natPortRdp = natPortRdp;
	computer.natPortWinRm = natPortWinRm;
	await Computer.write();

	return res.status(200).json({
		status: "success",
		message: "Đã cập nhật thông tin máy tính",
		data: computer
	});
}

async function deleteComputer({ req, res, Computer }) {
	let id = req.params.id;
	let index = Computer.data.findIndex(c => c.id == id);

	if (index == -1) throw Error("Không tìm thấy máy tính");
	Computer.data.splice(index, 1);
	await Computer.write();

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
