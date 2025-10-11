<template>
	<div class="p-6 w-full min-h-screen flex justify-center items-center bg-gray-100 text-gray-700">
		<form class="rounded border p-6 max-w-md w-full flex flex-col gap-3 bg-white" @submit.prevent="signIn">
			<h2 class="mb-3 text-2xl font-bold">Đăng nhập</h2>

			<div class="flex flex-col gap-1.5">
				<label for="">Email</label>
				<input type="text" class="rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-primary" required v-model="email">
			</div>
			<div class="flex flex-col gap-1.5">
				<label for="">Mật khẩu</label>
				<input type="password" class="rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-primary" required v-model="password">
			</div>

			<button class="mt-3 rounded px-4 py-2 flex justify-center items-center bg-primary text-white font-bold hover:saturate-50 focus:saturate-50">
				<IconSpinner v-if="isLoading" class="size-6 animate-spin" />
				<span v-if="isLoading" class="font-normal">Đang xử lý...</span>
				<span v-else>Đăng nhập</span>
			</button>
		</form>
	</div>
</template>

<script setup>
	import axios from 'axios';
	import swal from 'sweetalert2';
	import { API_BASE_URL } from "~/config/api.js";

	useHead({ title: 'Đăng nhập' });
	definePageMeta({ title: 'Đăng nhập' });

	const isLoading = ref(false);
	const email = ref('');
	const password = ref('');

	async function signIn() {
		if (isLoading.value) return;
		isLoading.value = true;

		try {
			const url = `${API_BASE_URL}/api/auth/login`;
			const response = await axios.post(url, { email: email.value, password: password.value });
			const { user, token } = response.data.data;

			useCookie('access_token').value = token;
			useCookie('user').value = JSON.stringify(user);

			useRouter().push('/dashboard/schedule');
		}
		catch (error) {
			swal.fire('Lỗi', error.response.data.message || error, 'error');
		}
		finally {
			isLoading.value = false;
		}
	}
</script>
