import axios from "axios";

var moodle = {
	baseURL: "https://lms-remote-lab.s4h.edu.vn",

	login: async function (username, password) {
		var response = await axios({
			url: "/login/token.php",
			method: "post",
			baseURL: this.baseURL,
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			params: { service: "moodle_mobile_app" },
			data: {
				username: username,
				password: password,
			},
		});

		var data = response.data;
		if (data.hasOwnProperty("error")) throw new Error(data.error);
		useCookie("token").value = data.token;
		useCookie("username").value = username;

		return data.token;
	},

	loginWithToken: async function (token) {
		var response = await axios({
			url: "/login/token_jwt.php",
			method: "post",
			baseURL: this.baseURL,
			params: { accessToken: token },
		});

		var data = response.data;
		if (data.hasOwnProperty("error")) throw new Error(data.error);

		return data.token;
	},

	callApi: async function (wsfunction, params, customToken) {
		let token = useCookie("token").value;
		if (customToken) token = customToken;
		if (!token) throw new Error("Token not found");

		var response = await axios({
			url: "/webservice/rest/server.php",
			method: "post",
			baseURL: this.baseURL,
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			params: {
				wstoken: token,
				wsfunction: wsfunction,
				moodlewsrestformat: "json",
				...params,
			},
		});

		var data = response.data;
		if (data.hasOwnProperty("error")) throw new Error(data.error);
		if (data.hasOwnProperty("exception")) throw new Error(data.message);

		return response.data;
	},
};

export default moodle;
