import axios from "axios";
import moodle from "~/utils/moodle";

export const useProfileStore = defineStore('profile', {
	state: () => ({
		user: null,
	}),
	actions: {
		async getProfile() {
			let email = useCookie("email").value;
			let users = await moodle.callApi("core_user_get_users_by_field", {
				field: "email",
				values: [email],
			});

			this.user = users[0];
			return users[0];
		},

		async login(email, password) {
			// login profile service
			let response = await axios({
				url: "https://api-auth.s4h.edu.vn/auth/login",
				method: "post",
				headers: { "Content-Type": "application/json" },
				data: {
					email: email,
					password: password,
				},
			});

			let accessToken = response.data.accessToken;
			useCookie("token-profile").value = accessToken;

			// login moodle service
			let token = await moodle.loginWithToken(accessToken);
			useCookie("token").value = token;
			useCookie("email").value = email;
		}
	},
})

