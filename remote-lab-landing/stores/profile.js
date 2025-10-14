import axios from "axios";
import { API_BASE_URL } from "~/config/api.js";

// Create axios instance with interceptor
const apiClient = axios.create({
	baseURL: API_BASE_URL
});

// Add request interceptor to include token
apiClient.interceptors.request.use((config) => {
	const token = useCookie("access_token").value;
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

export const useProfileStore = defineStore('profile', {
	state: () => ({
		user: null,
	}),
	actions: {
		async getProfile() {
			// Get user data from cookie instead of Moodle API
			let user = useCookie("user").value;
			if (user) {
				this.user = user;
				return user;
			}
			return null;
		},

		async login(email, password) {
			// login local API service
			let response = await axios({
				url: `${API_BASE_URL}/api/auth/login`,
				method: "post",
				headers: { "Content-Type": "application/json" },
				data: {
					email: email,
					password: password,
				},
			});

			let { user, token } = response.data.data;
			useCookie("access_token").value = token;
			useCookie("email").value = email;
			useCookie("user").value = user;
			
			// Return token for navigation
			return token;
		},

		// Method to get API client with token
		getApiClient() {
			return apiClient;
		}
	},
})

